"use client";

import { useCallback, useEffect, useState } from "react";
import { useSpeech } from "@/hooks/games/useSpeech";
import { useCountState } from "@/hooks/games/useCountState";

export default function CountAlongClient() {
  const { speak, setEnabled, isSupported } = useSpeech();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const {
    phase,
    objectEmoji,
    count,
    maxNumber,
    streak,
    totalCorrect,
    attempts,
    highScore,
    isNewRecord,
    selectedNumber,
    startGame,
    handleSelect,
  } = useCountState({ speak, soundEnabled });

  useEffect(() => {
    setEnabled(soundEnabled);
  }, [soundEnabled, setEnabled]);

  const handleSoundToggle = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const isIdle = phase === "idle";

  // Generate the object display
  const objects = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="ca-game">
      <header className="ca-header">
        <a href="/games" className="ca-back-link">
          <span aria-hidden="true">←</span>
          <span className="ca-back-text">Games</span>
        </a>
        <div className="ca-header-controls">
          <button
            type="button"
            className={`ca-sound-btn ${!soundEnabled ? "ca-sound-btn--muted" : ""}`}
            onClick={handleSoundToggle}
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>
      </header>

      {isIdle ? (
        <div className="ca-start-screen">
          <div className="ca-start-decoration" aria-hidden="true">
            <span className="ca-deco-num">1</span>
            <span className="ca-deco-num">2</span>
            <span className="ca-deco-num">3</span>
          </div>

          <h2 className="ca-start-title">Count<br />Along</h2>
          <p className="ca-start-subtitle">
            Count the objects and tap the right number!
            <br />
            <span className="ca-start-hint">How many can you see?</span>
          </p>

          <button className="ca-start-btn" onClick={startGame} type="button">
            <span>Let&apos;s Count!</span>
            <span aria-hidden="true">🔢</span>
          </button>

          {highScore.streak > 0 && (
            <div className="ca-start-highscore">
              🏆 Best streak: <strong>{highScore.streak}</strong>
            </div>
          )}

          {!isSupported && (
            <p className="ca-tts-warning">
              ⚠️ Voice prompts are not supported in your browser.
            </p>
          )}
        </div>
      ) : (
        <div className="ca-game-area">
          {/* Score bar */}
          <div className="ca-score-bar">
            <div className="ca-score-pill">
              <span className="ca-score-value">{totalCorrect}</span>
              <span className="ca-score-label">Correct</span>
            </div>
            {streak >= 2 && (
              <div className="ca-score-pill ca-score-pill--streak">
                <span>🔥</span>
                <span className="ca-score-value">{streak}</span>
              </div>
            )}
          </div>

          {isNewRecord && <div className="ca-new-record">🏆 New Record!</div>}

          {/* Attempt dots */}
          <div className="ca-attempts">
            {[0, 1].map((i) => (
              <span
                key={i}
                className={`ca-attempt-dot ${i < attempts ? "ca-attempt-dot--used" : ""}`}
              />
            ))}
          </div>

          {/* Object display */}
          <div className="ca-object-area">
            <div className="ca-objects">
              {objects.map((i) => (
                <span
                  key={i}
                  className={`ca-object ${phase === "correct" ? "ca-object--bounce" : ""} ${phase === "failed" ? "ca-object--reveal" : ""}`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {objectEmoji}
                </span>
              ))}
            </div>
          </div>

          {/* Number buttons */}
          <div className="ca-number-row">
            {Array.from({ length: maxNumber }, (_, i) => i + 1).map((num) => {
              const isSelected = selectedNumber === num;
              const isCorrectAnswer = num === count;
              const showCorrect = (phase === "correct" || phase === "failed") && isCorrectAnswer;
              const showWrong = isSelected && !isCorrectAnswer && (phase === "wrong" || phase === "failed");

              return (
                <button
                  key={num}
                  type="button"
                  className={`ca-num-btn ${showCorrect ? "ca-num-btn--correct" : ""} ${showWrong ? "ca-num-btn--wrong" : ""}`}
                  onClick={() => handleSelect(num)}
                  disabled={phase !== "awaiting"}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
