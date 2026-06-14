"use client";

import { useCallback, useEffect, useState } from "react";
import { useSpeech } from "@/hooks/games/useSpeech";
import { useColorQuestState } from "@/hooks/games/useColorQuestState";

export default function ColorQuestClient() {
  const { speak, setEnabled, isSupported } = useSpeech();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const {
    phase,
    choices,
    targetColor,
    targetObject,
    round,
    streak,
    totalCorrect,
    attempts,
    highScore,
    isNewRecord,
    selectedIndex,
    startGame,
    handleSelect,
  } = useColorQuestState({ speak, soundEnabled });

  useEffect(() => {
    setEnabled(soundEnabled);
  }, [soundEnabled, setEnabled]);

  const handleSoundToggle = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const isIdle = phase === "idle";

  return (
    <div className="cq-game">
      <header className="cq-header">
        <a href="/games" className="cq-back-link">
          <span aria-hidden="true">←</span>
          <span className="cq-back-text">Games</span>
        </a>
        <div className="cq-header-controls">
          <button
            type="button"
            className={`cq-sound-btn ${!soundEnabled ? "cq-sound-btn--muted" : ""}`}
            onClick={handleSoundToggle}
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>
      </header>

      {isIdle ? (
        <div className="cq-start-screen">
          <div className="cq-start-decoration" aria-hidden="true">
            <span className="cq-deco-blob" style={{ background: "#E63946" }} />
            <span className="cq-deco-blob" style={{ background: "#457B9D" }} />
            <span className="cq-deco-blob" style={{ background: "#F4D35E" }} />
            <span className="cq-deco-blob" style={{ background: "#2A9D8F" }} />
          </div>

          <h2 className="cq-start-title">Color<br />Quest</h2>
          <p className="cq-start-subtitle">
            Find the right color!
            <br />
            <span className="cq-start-hint">Listen and tap the matching color.</span>
          </p>

          <button className="cq-start-btn" onClick={startGame} type="button">
            <span>Let&apos;s Play!</span>
            <span aria-hidden="true">🎨</span>
          </button>

          {highScore.streak > 0 && (
            <div className="cq-start-highscore">
              🏆 Best streak: <strong>{highScore.streak}</strong>
            </div>
          )}

          {!isSupported && (
            <p className="cq-tts-warning">
              ⚠️ Voice prompts are not supported in your browser.
            </p>
          )}
        </div>
      ) : (
        <div className="cq-game-area">
          {/* Score bar */}
          <div className="cq-score-bar">
            <div className="cq-score-pill">
              <span className="cq-score-value">{totalCorrect}</span>
              <span className="cq-score-label">Correct</span>
            </div>
            {streak >= 2 && (
              <div className="cq-score-pill cq-score-pill--streak">
                <span>🔥</span>
                <span className="cq-score-value">{streak}</span>
              </div>
            )}
            <div className="cq-score-pill">
              <span className="cq-score-value">R{round}</span>
              <span className="cq-score-label">Round</span>
            </div>
          </div>

          {isNewRecord && <div className="cq-new-record">🏆 New Record!</div>}

          {/* Prompt */}
          <div className="cq-prompt">
            <div className="cq-prompt-text">
              Find the{" "}
              <span
                className="cq-prompt-color"
                style={{ color: targetColor?.hex }}
              >
                {targetColor?.name}
              </span>
              {" "}{targetObject}!
            </div>

            {/* Attempt dots */}
            <div className="cq-attempts">
              {[0, 1].map((i) => (
                <span
                  key={i}
                  className={`cq-attempt-dot ${i < attempts ? "cq-attempt-dot--used" : ""}`}
                />
              ))}
            </div>
          </div>

          {/* Choices grid */}
          <div className="cq-choices">
            {choices.map((choice, index) => {
              const isSelected = selectedIndex === index;
              const isCorrectAnswer = choice.isCorrect;
              const showCorrect = (phase === "correct" || phase === "failed") && isCorrectAnswer;
              const showWrong = isSelected && (phase === "wrong" || (phase === "failed" && !isCorrectAnswer));

              return (
                <button
                  key={`${choice.color.name}-${index}`}
                  type="button"
                  className={`cq-choice ${showCorrect ? "cq-choice--correct" : ""} ${showWrong ? "cq-choice--wrong" : ""}`}
                  onClick={() => handleSelect(index)}
                  disabled={phase !== "awaiting"}
                  style={{ "--cq-color": choice.color.hex, "--cq-color-dark": choice.color.darkHex } as React.CSSProperties}
                >
                  <span className="cq-choice-emoji">{choice.objectEmoji}</span>
                  <span className="cq-choice-color-name">{choice.color.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
