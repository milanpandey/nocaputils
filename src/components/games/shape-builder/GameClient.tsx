"use client";

import { useCallback, useEffect, useState } from "react";
import { useSpeech } from "@/hooks/games/useSpeech";
import { useShapeState } from "@/hooks/games/useShapeState";

export default function ShapeBuilderClient() {
  const { speak, setEnabled, isSupported } = useSpeech();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const {
    phase,
    targetShape,
    choices,
    streak,
    totalCorrect,
    attempts,
    highScore,
    isNewRecord,
    selectedId,
    startGame,
    handleSelect,
  } = useShapeState({ speak, soundEnabled });

  useEffect(() => {
    setEnabled(soundEnabled);
  }, [soundEnabled, setEnabled]);

  const handleSoundToggle = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const isIdle = phase === "idle";

  return (
    <div className="sb-game">
      <header className="sb-header">
        <a href="/games" className="sb-back-link">
          <span aria-hidden="true">←</span>
          <span className="sb-back-text">Games</span>
        </a>
        <div className="sb-header-controls">
          <button
            type="button"
            className={`sb-sound-btn ${!soundEnabled ? "sb-sound-btn--muted" : ""}`}
            onClick={handleSoundToggle}
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>
      </header>

      {isIdle ? (
        <div className="sb-start-screen">
          <div className="sb-start-decoration" aria-hidden="true">
            <svg viewBox="0 0 100 100" className="sb-deco-svg sb-deco-svg--circle">
              <circle cx="50" cy="50" r="40" fill="#E63946" />
            </svg>
            <svg viewBox="0 0 100 100" className="sb-deco-svg sb-deco-svg--square">
              <rect x="15" y="15" width="70" height="70" fill="#457B9D" />
            </svg>
            <svg viewBox="0 0 100 100" className="sb-deco-svg sb-deco-svg--triangle">
              <polygon points="50,10 90,85 10,85" fill="#F4D35E" />
            </svg>
          </div>

          <h2 className="sb-start-title">Shape<br />Builder</h2>
          <p className="sb-start-subtitle">
            Find the matching shape!
            <br />
            <span className="sb-start-hint">Listen and tap the correct shape.</span>
          </p>

          <button className="sb-start-btn" onClick={startGame} type="button">
            <span>Let&apos;s Build!</span>
            <span aria-hidden="true">🔺</span>
          </button>

          {highScore.streak > 0 && (
            <div className="sb-start-highscore">
              🏆 Best streak: <strong>{highScore.streak}</strong>
            </div>
          )}

          {!isSupported && (
            <p className="sb-tts-warning">
              ⚠️ Voice prompts are not supported in your browser.
            </p>
          )}
        </div>
      ) : (
        <div className="sb-game-area">
          {/* Score bar */}
          <div className="sb-score-bar">
            <div className="sb-score-pill">
              <span className="sb-score-value">{totalCorrect}</span>
              <span className="sb-score-label">Correct</span>
            </div>
            {streak >= 2 && (
              <div className="sb-score-pill sb-score-pill--streak">
                <span>🔥</span>
                <span className="sb-score-value">{streak}</span>
              </div>
            )}
          </div>

          {isNewRecord && <div className="sb-new-record">🏆 New Record!</div>}

          {/* Target shape outline */}
          {targetShape && (
            <div className="sb-target-area">
              <div className="sb-prompt-text">Find the <strong>{targetShape.name}</strong>!</div>
              <div className={`sb-target ${phase === "correct" ? "sb-target--correct" : ""} ${phase === "failed" ? "sb-target--reveal" : ""}`}>
                <svg
                  viewBox="0 0 100 100"
                  className="sb-target-svg"
                >
                  <path
                    d={targetShape.path}
                    fill={phase === "correct" || phase === "failed" ? targetShape.color : "none"}
                    stroke={targetShape.color}
                    strokeWidth="3"
                    strokeDasharray={phase === "correct" || phase === "failed" ? "none" : "6 4"}
                    opacity={phase === "correct" || phase === "failed" ? 1 : 0.6}
                  />
                </svg>
              </div>

              {/* Attempt dots */}
              <div className="sb-attempts">
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className={`sb-attempt-dot ${i < attempts ? "sb-attempt-dot--used" : ""}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Shape choices */}
          <div className="sb-choices">
            {choices.map((shape) => {
              const isSelected = selectedId === shape.id;
              const isCorrectAnswer = targetShape?.id === shape.id;
              const showCorrect = (phase === "correct" || phase === "failed") && isCorrectAnswer;
              const showWrong = isSelected && !isCorrectAnswer && (phase === "wrong" || phase === "failed");

              return (
                <button
                  key={shape.id}
                  type="button"
                  className={`sb-shape-btn ${showCorrect ? "sb-shape-btn--correct" : ""} ${showWrong ? "sb-shape-btn--wrong" : ""}`}
                  onClick={() => handleSelect(shape.id)}
                  disabled={phase !== "awaiting"}
                  aria-label={shape.name}
                >
                  <svg viewBox="0 0 100 100" className="sb-shape-svg">
                    <path d={shape.path} fill={shape.color} />
                  </svg>
                  <span className="sb-shape-name">{shape.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
