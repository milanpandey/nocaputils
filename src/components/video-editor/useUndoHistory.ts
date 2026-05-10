import { useCallback, useRef, useState } from "react";
import type { Clip, Selection } from "./TimelinePanel";

/* ---- Undoable editor state ---- */
type FilterPreset = "none" | "grayscale" | "sepia" | "vintage";
type CropPreset = "free" | "16:9" | "1:1" | "9:16";
type CropMode = "letterbox" | "crop";

export type UndoableState = {
  videoClips: Clip[];
  audioClips: Clip[];
  selection: Selection;
  cropPreset: CropPreset;
  cropMode: CropMode;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  filterPreset: FilterPreset;
  textOverlay: string;
  textSize: number;
  textY: number;
  playbackRate: number;
  volume: number;
  muted: boolean;
};

const MAX_HISTORY = 20;

/**
 * Deep-clone an UndoableState snapshot.
 * All values are plain primitives / small arrays of plain objects, so
 * structuredClone is ideal here (fast, no prototype issues).
 */
function cloneState(s: UndoableState): UndoableState {
  return structuredClone(s);
}

/**
 * Lightweight undo/redo hook.
 *
 * - `pushState(s)` — records a snapshot after a discrete edit.
 * - `undo()` / `redo()` — navigate history.
 * - `canUndo` / `canRedo` — for disabling UI buttons.
 *
 * Max depth: 20 steps. Oldest entries are silently dropped.
 */
export function useUndoHistory() {
  // History stack (past states, not including current).
  const pastRef = useRef<UndoableState[]>([]);
  // Future stack (for redo after undo).
  const futureRef = useRef<UndoableState[]>([]);
  // We track lengths in state so the component re-renders when they change.
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  /**
   * Push the *current* state onto the undo stack before making changes.
   * Call this with the state **before** the edit (the state you'd want to
   * return to on undo).
   */
  const pushState = useCallback(
    (state: UndoableState) => {
      pastRef.current.push(cloneState(state));
      // Trim to max depth
      if (pastRef.current.length > MAX_HISTORY) {
        pastRef.current = pastRef.current.slice(-MAX_HISTORY);
      }
      // Any new edit clears the redo stack
      futureRef.current = [];
      syncFlags();
    },
    [syncFlags],
  );

  /**
   * Undo: pop the last past-state and return it.
   * The caller must pass in the *current* state so we can push it onto future.
   */
  const undo = useCallback(
    (currentState: UndoableState): UndoableState | null => {
      if (pastRef.current.length === 0) return null;
      // Current goes to future stack
      futureRef.current.push(cloneState(currentState));
      // Pop the previous state
      const prev = pastRef.current.pop()!;
      syncFlags();
      return prev;
    },
    [syncFlags],
  );

  /**
   * Redo: pop the last future-state and return it.
   * The caller must pass in the *current* state so we can push it onto past.
   */
  const redo = useCallback(
    (currentState: UndoableState): UndoableState | null => {
      if (futureRef.current.length === 0) return null;
      // Current goes to past stack
      pastRef.current.push(cloneState(currentState));
      // Pop the next state
      const next = futureRef.current.pop()!;
      syncFlags();
      return next;
    },
    [syncFlags],
  );

  /** Clear all history (e.g. when loading a new video). */
  const clearHistory = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    syncFlags();
  }, [syncFlags]);

  return { pushState, undo, redo, canUndo, canRedo, clearHistory } as const;
}
