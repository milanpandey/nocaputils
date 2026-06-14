"use client";

import { KEYBOARD_ROWS } from "@/lib/games/gameData";
import type { GamePhase } from "@/hooks/games/useGameState";

interface OnScreenKeyboardProps {
  onKeyPress: (key: string) => void;
  targetChar: string;
  phase: GamePhase;
  attempts: number;
  wrongKey: string | null;
  lastPressedKey: string | null;
  mode: "letters" | "numbers";
}

export default function OnScreenKeyboard({
  onKeyPress,
  targetChar,
  phase,
  attempts,
  wrongKey,
  lastPressedKey,
  mode,
}: OnScreenKeyboardProps) {
  const isAwaitingInput = phase === "awaiting" || phase === "wrong";
  const showHint = phase === "failed" || attempts >= 2;

  const rows = mode === "numbers" ? [KEYBOARD_ROWS[0]] : KEYBOARD_ROWS;

  return (
    <div className="wtl-keyboard" role="group" aria-label="On-screen keyboard">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="wtl-keyboard-row">
          {row.map((key) => {
            const isTarget =
              key.toUpperCase() === targetChar.toUpperCase();
            const isWrongPress = wrongKey?.toUpperCase() === key;
            const isPhysicalPress = lastPressedKey === key;
            const isCorrectReveal = isTarget && showHint;
            const isCorrectHit = isTarget && phase === "correct";

            let stateClass = "";
            if (isCorrectHit) stateClass = "wtl-key--correct";
            else if (isWrongPress) stateClass = "wtl-key--wrong";
            else if (isCorrectReveal) stateClass = "wtl-key--hint";
            else if (isPhysicalPress) stateClass = "wtl-key--pressed";

            return (
              <button
                key={key}
                className={`wtl-key ${stateClass}`}
                onClick={() => {
                  if (isAwaitingInput) onKeyPress(key);
                }}
                disabled={!isAwaitingInput}
                aria-label={`Key ${key}`}
                type="button"
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
