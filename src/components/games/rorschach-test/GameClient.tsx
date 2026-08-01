"use client";

import { useCallback, useEffect, useState } from "react";
import { useSpeech } from "@/hooks/games/useSpeech";
import { useRorschachState } from "@/hooks/games/useRorschachState";
import { COLOR_THEMES, type ColorTheme } from "@/lib/games/rorschachData";

export default function RorschachGameClient() {
  const { speak, setEnabled, isSupported } = useSpeech();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const {
    phase,
    currentIndex,
    totalCards,
    currentCard,
    answers,
    colorTheme,
    rotation,
    isFlipped,
    setColorTheme,
    startGame,
    selectChoice,
    rotateCard,
    toggleFlip,
    getArchetype,
  } = useRorschachState({ speak, soundEnabled });

  useEffect(() => {
    setEnabled(soundEnabled);
  }, [soundEnabled, setEnabled]);

  const handleSoundToggle = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const isIdle = phase === "idle";
  const isComplete = phase === "complete";
  const activeTheme = COLOR_THEMES[colorTheme];
  const archetype = isComplete ? getArchetype() : null;

  return (
    <div className="rt-game">
      {/* Header */}
      <header className="rt-header">
        <a href="/personality" className="rt-back-link">
          <span aria-hidden="true">←</span>
          <span className="rt-back-text">Personality</span>
        </a>

        <div className="rt-header-controls">
          {/* Color theme selector */}
          <div className="rt-theme-picker" aria-label="Color Palette">
            {Object.entries(COLOR_THEMES).map(([key, t]) => (
              <button
                key={key}
                type="button"
                className={`rt-theme-dot ${colorTheme === key ? "rt-theme-dot--active" : ""}`}
                style={{ backgroundColor: t.main }}
                onClick={() => setColorTheme(key as ColorTheme)}
                title={t.name}
                aria-label={`Theme ${t.name}`}
              />
            ))}
          </div>

          <button
            type="button"
            className={`rt-sound-btn ${!soundEnabled ? "rt-sound-btn--muted" : ""}`}
            onClick={handleSoundToggle}
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>
      </header>

      {isIdle ? (
        /* ── Start Screen ── */
        <div className="rt-start-screen">
          <div className="rt-start-decoration" aria-hidden="true">
            <span className="rt-deco-shape rt-deco-shape--circle" />
            <span className="rt-deco-shape rt-deco-shape--rect" />
            <span className="rt-deco-shape rt-deco-shape--tri" />
          </div>

          <h1 className="rt-start-title">
            Rorschach<br />Inkblot Explorer
          </h1>

          <p className="rt-start-subtitle">
            What do you see in the mystery inkblots?
            <br />
            <span className="rt-start-hint">
              {totalCards} fun shapes · 6 choices each · 100% private!
            </span>
          </p>

          <button className="rt-start-btn" onClick={startGame} type="button">
            <span className="rt-start-btn-text">Let&apos;s Explore!</span>
            <span className="rt-start-btn-icon" aria-hidden="true">🎨</span>
          </button>

          {!isSupported && (
            <p className="rt-tts-warning">
              ⚠️ Voice prompts are not supported in your browser.
            </p>
          )}
        </div>
      ) : isComplete && archetype ? (
        /* ── Final Report Screen ── */
        <div className="rt-report-screen">
          <div className="rt-report-card">
            <div className="rt-report-header" style={{ borderColor: archetype.color }}>
              <span className="rt-report-emoji">{archetype.emoji}</span>
              <span className="rt-report-badge" style={{ backgroundColor: archetype.color }}>
                {archetype.subtitle}
              </span>
              <h2 className="rt-report-title">{archetype.title}</h2>
              <p className="rt-report-desc">{archetype.description}</p>
            </div>

            <div className="rt-report-details">
              <div className="rt-report-pill">
                <strong>⚡ Superpower:</strong> {archetype.superpower}
              </div>
              <div className="rt-report-pill rt-report-pill--fact">
                <strong>💡 Fun Fact:</strong> {archetype.funFact}
              </div>
            </div>

            <h3 className="rt-gallery-title">Your {totalCards} Inkblot Interpretations</h3>
            <div className="rt-gallery-grid">
              {answers.map((ans, idx) => (
                <div key={ans.cardId} className="rt-gallery-item">
                  <span className="rt-gallery-num">#{idx + 1}</span>
                  <span className="rt-gallery-emoji">{ans.choice.emoji}</span>
                  <span className="rt-gallery-label">{ans.choice.label}</span>
                </div>
              ))}
            </div>

            <div className="rt-report-actions">
              <button className="rt-start-btn" onClick={startGame} type="button">
                <span>Play Again!</span>
                <span aria-hidden="true">🔄</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Playing Game Screen ── */
        <div className="rt-game-area">
          {/* Progress bar */}
          <div className="rt-progress-bar">
            <div className="rt-progress-pill">
              <span className="rt-progress-icon">📜</span>
              <span className="rt-progress-text">
                Card <strong>{currentIndex + 1}</strong> of {totalCards}
              </span>
            </div>

            <div className="rt-progress-dots">
              {Array.from({ length: totalCards }).map((_, i) => (
                <span
                  key={i}
                  className={`rt-dot ${i === currentIndex ? "rt-dot--active" : i < currentIndex ? "rt-dot--done" : ""}`}
                />
              ))}
            </div>
          </div>

          {/* Inkblot Viewport */}
          <div className="rt-viewport" style={{ backgroundColor: activeTheme.bg }}>
            <div className="rt-viewport-controls">
              <button
                type="button"
                className="rt-tool-btn"
                onClick={rotateCard}
                title="Rotate Shape"
                aria-label="Rotate shape"
              >
                🔄 {rotation}°
              </button>
              <button
                type="button"
                className={`rt-tool-btn ${isFlipped ? "rt-tool-btn--active" : ""}`}
                onClick={toggleFlip}
                title="Flip Shape"
                aria-label="Flip shape"
              >
                ↔️ Mirror
              </button>
            </div>

            <div
              className="rt-svg-wrapper"
              style={{
                transform: `rotate(${rotation}deg) scaleX(${isFlipped ? -1 : 1})`,
                transition: "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <svg viewBox="0 0 300 320" className="rt-svg-inkblot">
                {/* Left paths */}
                <g fill={activeTheme.main}>
                  {currentCard.svgPaths.map((d, i) => (
                    <path key={`left-${i}`} d={d} />
                  ))}
                </g>

                {/* Right mirrored paths */}
                <g transform="translate(300, 0) scale(-1, 1)" fill={activeTheme.main}>
                  {currentCard.svgPaths.map((d, i) => (
                    <path key={`right-${i}`} d={d} />
                  ))}
                </g>

                {/* Center paths */}
                {currentCard.centerPaths && (
                  <g fill={activeTheme.main}>
                    {currentCard.centerPaths.map((d, i) => (
                      <path key={`center-${i}`} d={d} />
                    ))}
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Prompt */}
          <div className="rt-prompt">
            <h2>What do you see in this inkblot?</h2>
            <p>Tap the picture that matches your imagination!</p>
          </div>

          {/* 6 Options Grid — 3 per row */}
          <div className="rt-options-grid">
            {currentCard.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className={`rt-option-btn ${choice.category === "neutral" ? "rt-option-btn--neutral" : ""}`}
                onClick={() => selectChoice(choice)}
              >
                <span className="rt-option-emoji">{choice.emoji}</span>
                <span className="rt-option-label">{choice.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
