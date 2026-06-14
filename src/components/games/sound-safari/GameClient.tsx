"use client";

import { useCallback, useEffect, useState } from "react";
import { useSpeech } from "@/hooks/games/useSpeech";
import { useSoundSafariState } from "@/hooks/games/useSoundSafariState";

export default function SoundSafariClient() {
  const { speak, setEnabled, isSupported } = useSpeech();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const {
    phase,
    choices,
    targetAnimal,
    streak,
    totalCorrect,
    attempts,
    highScore,
    isNewRecord,
    selectedId,
    startGame,
    handleSelect,
    replaySound,
  } = useSoundSafariState({ speak, soundEnabled });

  useEffect(() => {
    setEnabled(soundEnabled);
  }, [soundEnabled, setEnabled]);

  const handleSoundToggle = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const isIdle = phase === "idle";

  return (
    <div className="ss-game">
      <header className="ss-header">
        <a href="/games" className="ss-back-link">
          <span aria-hidden="true">←</span>
          <span className="ss-back-text">Games</span>
        </a>
        <div className="ss-header-controls">
          <button
            type="button"
            className={`ss-sound-btn ${!soundEnabled ? "ss-sound-btn--muted" : ""}`}
            onClick={handleSoundToggle}
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>
      </header>

      {isIdle ? (
        <div className="ss-start-screen">
          <div className="ss-start-decoration" aria-hidden="true">
            <span className="ss-deco-animal">🐄</span>
            <span className="ss-deco-animal">🐶</span>
            <span className="ss-deco-animal">🐱</span>
          </div>

          <h2 className="ss-start-title">Sound<br />Safari</h2>
          <p className="ss-start-subtitle">
            Listen to the animal sound and find the animal!
            <br />
            <span className="ss-start-hint">Which animal makes that sound?</span>
          </p>

          <button className="ss-start-btn" onClick={startGame} type="button">
            <span>Let&apos;s Listen!</span>
            <span aria-hidden="true">🎵</span>
          </button>

          {highScore.streak > 0 && (
            <div className="ss-start-highscore">
              🏆 Best streak: <strong>{highScore.streak}</strong>
            </div>
          )}

          {!isSupported && (
            <p className="ss-tts-warning">
              ⚠️ This game requires speech synthesis to play sounds.
            </p>
          )}
        </div>
      ) : (
        <div className="ss-game-area">
          {/* Score bar */}
          <div className="ss-score-bar">
            <div className="ss-score-pill">
              <span className="ss-score-value">{totalCorrect}</span>
              <span className="ss-score-label">Correct</span>
            </div>
            {streak >= 2 && (
              <div className="ss-score-pill ss-score-pill--streak">
                <span>🔥</span>
                <span className="ss-score-value">{streak}</span>
              </div>
            )}
          </div>

          {isNewRecord && <div className="ss-new-record">🏆 New Record!</div>}

          {/* Sound prompt area */}
          <div className="ss-sound-area">
            <button
              type="button"
              className={`ss-sound-bubble ${phase === "playing-sound" ? "ss-sound-bubble--playing" : ""}`}
              onClick={replaySound}
              disabled={phase === "playing-sound" || phase === "correct" || phase === "failed"}
              aria-label="Replay animal sound"
            >
              <span className="ss-sound-icon">🔊</span>
              <span className="ss-sound-text">
                {phase === "playing-sound" ? "Listen..." : "Tap to hear again!"}
              </span>
            </button>

            {/* Attempt dots */}
            <div className="ss-attempts">
              {[0, 1].map((i) => (
                <span
                  key={i}
                  className={`ss-attempt-dot ${i < attempts ? "ss-attempt-dot--used" : ""}`}
                />
              ))}
            </div>
          </div>

          {/* Reveal answer on correct/failed */}
          {(phase === "correct" || phase === "failed") && targetAnimal && (
            <div className="ss-reveal">
              <span className="ss-reveal-emoji">{targetAnimal.emoji}</span>
              <span className="ss-reveal-text">
                The {targetAnimal.name} says &quot;{targetAnimal.sound}&quot;
              </span>
            </div>
          )}

          {/* Animal choices */}
          <div className="ss-choices">
            {choices.map((animal) => {
              const isSelected = selectedId === animal.id;
              const isCorrectAnswer = targetAnimal?.id === animal.id;
              const showCorrect = (phase === "correct" || phase === "failed") && isCorrectAnswer;
              const showWrong = isSelected && !isCorrectAnswer && (phase === "wrong" || phase === "failed");

              return (
                <button
                  key={animal.id}
                  type="button"
                  className={`ss-animal-btn ${showCorrect ? "ss-animal-btn--correct" : ""} ${showWrong ? "ss-animal-btn--wrong" : ""}`}
                  onClick={() => handleSelect(animal.id)}
                  disabled={phase !== "awaiting"}
                >
                  <span className="ss-animal-emoji">{animal.emoji}</span>
                  <span className="ss-animal-name">{animal.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
