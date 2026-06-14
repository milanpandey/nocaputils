"use client";

import { useCallback, useEffect, useState } from "react";
import { useSpeech } from "@/hooks/games/useSpeech";
import { useMemoryState } from "@/hooks/games/useMemoryState";
import { MEMORY_THEMES, MEMORY_GRID_SIZES, type MemoryDifficulty } from "@/lib/games/gameData";

export default function MemoryMatchClient() {
  const { speak, setEnabled, isSupported } = useSpeech();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const {
    phase,
    theme,
    difficulty,
    board,
    moves,
    streak,
    matchedPairs,
    totalPairs,
    highScore,
    isNewRecord,
    setTheme,
    setDifficulty,
    startGame,
    flipCard,
  } = useMemoryState({ speak, soundEnabled });

  useEffect(() => {
    setEnabled(soundEnabled);
  }, [soundEnabled, setEnabled]);

  const gridCols = MEMORY_GRID_SIZES[difficulty].cols;

  const handleSoundToggle = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const isIdle = phase === "idle";
  const isComplete = phase === "complete";

  return (
    <div className="mm-game">
      {/* Header */}
      <header className="mm-header">
        <a href="/games" className="mm-back-link">
          <span aria-hidden="true">←</span>
          <span className="mm-back-text">Games</span>
        </a>
        <div className="mm-header-controls">
          {isIdle && (
            <>
              <div className="mm-toggle-group">
                {Object.entries(MEMORY_THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    className={`mm-toggle-btn ${theme === key ? "mm-toggle-btn--active" : ""}`}
                    onClick={() => setTheme(key)}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>
              <div className="mm-toggle-group">
                {(["easy", "medium", "hard"] as MemoryDifficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`mm-toggle-btn ${difficulty === d ? "mm-toggle-btn--active" : ""}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d === "easy" ? "3×2" : d === "medium" ? "4×3" : "4×4"}
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            type="button"
            className={`mm-sound-btn ${!soundEnabled ? "mm-sound-btn--muted" : ""}`}
            onClick={handleSoundToggle}
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>
      </header>

      {isIdle ? (
        <div className="mm-start-screen">
          <div className="mm-start-decoration" aria-hidden="true">
            <span className="mm-deco-shape mm-deco-shape--circle" />
            <span className="mm-deco-shape mm-deco-shape--square" />
            <span className="mm-deco-shape mm-deco-shape--circle mm-deco-shape--small" />
          </div>

          <h2 className="mm-start-title">Memory<br />Match</h2>
          <p className="mm-start-subtitle">
            Find all the matching pairs!
            <br />
            <span className="mm-start-hint">Tap cards to flip them over.</span>
          </p>

          <button
            className="mm-start-btn"
            onClick={startGame}
            type="button"
          >
            <span className="mm-start-btn-text">Let&apos;s Play!</span>
            <span className="mm-start-btn-icon" aria-hidden="true">🧠</span>
          </button>

          {highScore.bestMoves > 0 && (
            <div className="mm-start-highscore">
              🏆 Best: <strong>{highScore.bestMoves}</strong> moves
            </div>
          )}

          {!isSupported && (
            <p className="mm-tts-warning">
              ⚠️ Voice prompts are not supported in your browser.
            </p>
          )}
        </div>
      ) : (
        <div className="mm-game-area">
          {/* Score bar */}
          <div className="mm-score-bar">
            <div className="mm-score-pill">
              <span className="mm-score-icon">🃏</span>
              <span className="mm-score-value">{moves}</span>
              <span className="mm-score-label">Moves</span>
            </div>
            <div className="mm-score-pill">
              <span className="mm-score-icon">✨</span>
              <span className="mm-score-value">{matchedPairs}/{totalPairs}</span>
              <span className="mm-score-label">Pairs</span>
            </div>
            {streak >= 2 && (
              <div className="mm-score-pill mm-score-pill--streak">
                <span className="mm-score-icon">🔥</span>
                <span className="mm-score-value">{streak}</span>
                <span className="mm-score-label">Streak</span>
              </div>
            )}
          </div>

          {isNewRecord && (
            <div className="mm-new-record">🏆 New Record!</div>
          )}

          {/* Game board */}
          <div
            className="mm-board"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            }}
          >
            {board.map((card, index) => (
              <button
                key={card.uid}
                type="button"
                className={`mm-card ${card.flipped || card.matched ? "mm-card--flipped" : ""} ${card.matched ? "mm-card--matched" : ""}`}
                onClick={() => flipCard(index)}
                disabled={card.flipped || card.matched || phase === "checking"}
                aria-label={card.flipped || card.matched ? card.card.name : "Hidden card"}
              >
                <div className="mm-card-inner">
                  <div className="mm-card-front">
                    <span className="mm-card-question">?</span>
                  </div>
                  <div className="mm-card-back">
                    <span className="mm-card-emoji">{card.card.emoji}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Complete overlay */}
          {isComplete && (
            <div className="mm-complete-overlay">
              <div className="mm-complete-card">
                <div className="mm-complete-emoji">🎉</div>
                <h3 className="mm-complete-title">Amazing!</h3>
                <p className="mm-complete-stats">
                  You found all pairs in <strong>{moves}</strong> moves!
                </p>
                <button
                  className="mm-start-btn"
                  onClick={startGame}
                  type="button"
                >
                  Play Again!
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
