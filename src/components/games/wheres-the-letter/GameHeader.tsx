"use client";

import type { GameMode, CaseMode } from "@/hooks/games/useGameState";

interface GameHeaderProps {
  mode: GameMode;
  caseMode: CaseMode;
  soundEnabled: boolean;
  onModeChange: (mode: GameMode) => void;
  onCaseChange: (caseMode: CaseMode) => void;
  onSoundToggle: (enabled: boolean) => void;
}

export default function GameHeader({
  mode,
  caseMode,
  soundEnabled,
  onModeChange,
  onCaseChange,
  onSoundToggle,
}: GameHeaderProps) {
  return (
    <header className="wtl-header">
      <a href="/games" className="wtl-back-link" aria-label="Back to Games">
        <span aria-hidden="true">←</span>
        <span className="wtl-back-text">Games</span>
      </a>

      <div className="wtl-header-controls">
        {/* Mode toggle */}
        <div className="wtl-toggle-group" role="radiogroup" aria-label="Game mode">
          <button
            className={`wtl-toggle-btn ${mode === "letters" ? "wtl-toggle-btn--active" : ""}`}
            onClick={() => onModeChange("letters")}
            role="radio"
            aria-checked={mode === "letters"}
            type="button"
          >
            ABC
          </button>
          <button
            className={`wtl-toggle-btn ${mode === "numbers" ? "wtl-toggle-btn--active" : ""}`}
            onClick={() => onModeChange("numbers")}
            role="radio"
            aria-checked={mode === "numbers"}
            type="button"
          >
            123
          </button>
        </div>

        {/* Case toggle (only for letter mode) */}
        {mode === "letters" && (
          <div className="wtl-toggle-group" role="radiogroup" aria-label="Letter case">
            <button
              className={`wtl-toggle-btn ${caseMode === "upper" ? "wtl-toggle-btn--active" : ""}`}
              onClick={() => onCaseChange("upper")}
              role="radio"
              aria-checked={caseMode === "upper"}
              type="button"
            >
              A
            </button>
            <button
              className={`wtl-toggle-btn ${caseMode === "lower" ? "wtl-toggle-btn--active" : ""}`}
              onClick={() => onCaseChange("lower")}
              role="radio"
              aria-checked={caseMode === "lower"}
              type="button"
            >
              a
            </button>
            <button
              className={`wtl-toggle-btn ${caseMode === "mixed" ? "wtl-toggle-btn--active" : ""}`}
              onClick={() => onCaseChange("mixed")}
              role="radio"
              aria-checked={caseMode === "mixed"}
              type="button"
            >
              Aa
            </button>
          </div>
        )}

        {/* Sound toggle */}
        <button
          className={`wtl-sound-btn ${soundEnabled ? "" : "wtl-sound-btn--muted"}`}
          onClick={() => onSoundToggle(!soundEnabled)}
          aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
          type="button"
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>
      </div>
    </header>
  );
}
