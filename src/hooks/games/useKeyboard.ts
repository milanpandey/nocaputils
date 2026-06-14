"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseKeyboardOptions {
  enabled: boolean;
  onKeyPress: (key: string) => void;
  debounceMs?: number;
}

export function useKeyboard({ enabled, onKeyPress, debounceMs = 150 }: UseKeyboardOptions) {
  const [lastPressedKey, setLastPressedKey] = useState<string | null>(null);
  const lastTimeRef = useRef(0);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const key = e.key;

      // Only accept single alphanumeric characters
      if (key.length !== 1 || !/[a-zA-Z0-9]/.test(key)) return;

      // Prevent default browser behavior (e.g., scrolling, search)
      e.preventDefault();

      // Debounce
      const now = Date.now();
      if (now - lastTimeRef.current < debounceMs) return;
      lastTimeRef.current = now;

      const normalized = key.toUpperCase();
      setLastPressedKey(normalized);

      // Clear the visual feedback after 300ms
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => setLastPressedKey(null), 300);

      onKeyPress(normalized);
    },
    [enabled, onKeyPress, debounceMs]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [handleKeyDown]);

  return { lastPressedKey };
}
