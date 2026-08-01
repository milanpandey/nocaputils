"use client";

import { useState, useEffect, useCallback } from "react";
import { useSpeech } from "@/hooks/games/useSpeech";
import { useColorQuestState } from "@/hooks/games/useColorQuestState";
import { STRINGS, PERSONALITIES } from "@/lib/games/colorQuestData";

export default function ColorQuestClient() {
  const { speak, setEnabled, isSupported } = useSpeech();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCompare, setShowCompare] = useState(false);

  const {
    phase,
    questions,
    currentIndex,
    currentQuestion,
    result,
    history,
    canResume,
    startGame,
    selectChoice,
    goBack,
    resetGame,
  } = useColorQuestState({ speak, soundEnabled });

  useEffect(() => {
    setEnabled(soundEnabled);
  }, [soundEnabled, setEnabled]);

  const handleSoundToggle = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const shareResult = useCallback(() => {
    if (navigator.share && result) {
      navigator.share({
        title: "Color Quest Personality",
        text: `I got ${result.dominant.title} in Color Quest! I'm a ${result.dominant.superpower}!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert("Sharing is not supported on this device, but you can print your certificate!");
    }
  }, [result]);

  const isIdle = phase === "idle";
  const isComplete = phase === "complete" && result;

  return (
    <div className="cq-game">
      {/* ── Header (Hidden when printing) ── */}
      <header className="cq-header print-hidden">
        <a href="/personality" className="cq-back-link">
          <span aria-hidden="true">←</span>
          <span className="cq-back-text">Personality</span>
        </a>

        <div className="cq-header-controls">
          <button
            type="button"
            className={`cq-sound-btn ${!soundEnabled ? "cq-sound-btn--muted" : ""}`}
            onClick={handleSoundToggle}
            aria-label={soundEnabled ? "Mute voice narration" : "Enable voice narration"}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>
      </header>

      {isIdle && (
        <div className="cq-start-screen">
          <div className="cq-hero-emojis" aria-hidden="true">
            <span className="cq-hero-emoji">🦁</span>
            <span className="cq-hero-emoji">🦉</span>
            <span className="cq-hero-emoji">🐼</span>
            <span className="cq-hero-emoji">🐒</span>
          </div>
          
          <h1 className="cq-start-title">{STRINGS.startTitle}</h1>
          <p className="cq-start-subtitle">{STRINGS.startSubtitle}</p>
          
          <div className="cq-start-actions">
            <button className="cq-primary-btn" onClick={() => startGame(false)} type="button">
              <span className="cq-btn-text">{STRINGS.startBtn}</span>
              <span className="cq-btn-icon" aria-hidden="true">🚀</span>
            </button>

            {canResume && (
              <button className="cq-secondary-btn" onClick={() => startGame(true)} type="button">
                {STRINGS.resumeBtn}
              </button>
            )}
          </div>

          {!isSupported && (
            <p className="cq-tts-warning">⚠️ Voice prompts are not supported in your browser.</p>
          )}
        </div>
      )}

      {phase === "playing" && currentQuestion && (
        <div className="cq-play-screen">
          <div className="cq-progress">
            <span className="cq-progress-text">
              {STRINGS.questionPrefix} <strong>{currentIndex + 1}</strong> / {questions.length}
            </span>
            <div className="cq-progress-bar-container">
              <div 
                className="cq-progress-bar-fill" 
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="cq-question-card">
            <div className="cq-question-hero">
              <span className="cq-question-emoji" aria-hidden="true">{currentQuestion.emoji}</span>
              <h2 className="cq-question-title">{currentQuestion.title}</h2>
              <p className="cq-question-speech">{currentQuestion.speechText}</p>
            </div>
            
            <div className="cq-choices-grid">
              {currentQuestion.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className="cq-choice-btn"
                  onClick={() => selectChoice(choice)}
                  aria-label={choice.label}
                >
                  <span className="cq-choice-emoji" aria-hidden="true">{choice.emoji}</span>
                  <span className="cq-choice-label">{choice.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="cq-play-actions">
            <button 
              className="cq-ghost-btn" 
              onClick={goBack} 
              disabled={currentIndex === 0}
              type="button"
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {isComplete && !showCompare && (
        <div className="cq-report-screen">
          <div className="cq-report-card">
            
            {/* Certificate Header (Only visible when printing) */}
            <div className="cq-print-header">
              <h2>Color Quest Certificate</h2>
              <p>Awarded on {result.date}</p>
            </div>

            {/* Confetti (Hidden on print) */}
            <div className="cq-confetti print-hidden" aria-hidden="true">🎉🎊✨</div>

            <h1 className="cq-report-hero-title">{STRINGS.reportHero}</h1>
            
            <div className="cq-dominant-profile" style={{ borderColor: result.dominant.colorHex }}>
              <span className="cq-profile-emoji">{result.dominant.emoji}</span>
              <h2 className="cq-profile-title" style={{ color: result.dominant.colorHex }}>
                {result.dominant.title}
              </h2>
            </div>

            <div className="cq-report-grid">
              <div className="cq-report-box">
                <h3>{STRINGS.superpowerTitle}</h3>
                <p><strong>{result.dominant.superpower}</strong></p>
              </div>

              <div className="cq-report-box">
                <h3>{STRINGS.specialtiesTitle}</h3>
                <ul className="cq-traits-list">
                  {result.dominant.specialties.map(t => (
                    <li key={t}>✓ {t}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="cq-report-box cq-report-box--growth">
              <h3>{STRINGS.growthTitle}</h3>
              <p>{result.dominant.growthTip}</p>
            </div>

            <div className="cq-badge-box">
              <h3>{STRINGS.badgeTitle}</h3>
              <div className="cq-badge-display">
                <span className="cq-badge-emoji">{result.badge.emoji}</span>
                <div className="cq-badge-info">
                  <strong>{result.badge.title}</strong>
                  <p>{result.badge.description}</p>
                </div>
              </div>
            </div>

            <div className="cq-mix-box">
              <h3>{STRINGS.mixTitle}</h3>
              <div className="cq-bars">
                {(Object.entries(result.scores) as [keyof typeof PERSONALITIES, number][])
                  .sort((a, b) => b[1] - a[1])
                  .map(([color, score]) => {
                    const profile = PERSONALITIES[color];
                    const percent = (score / questions.length) * 100;
                    return (
                      <div key={color} className="cq-bar-row">
                        <span className="cq-bar-label" title={profile.title}>
                          {profile.emoji}
                        </span>
                        <div className="cq-bar-track">
                          <div 
                            className="cq-bar-fill"
                            style={{ 
                              width: `${percent}%`, 
                              backgroundColor: profile.colorHex,
                              minWidth: percent > 0 ? '10px' : '0' 
                            }}
                          />
                        </div>
                      </div>
                    );
                })}
              </div>
            </div>

            <div className="cq-report-actions print-hidden">
              <button className="cq-primary-btn" onClick={shareResult} type="button">
                <span className="cq-btn-icon">📤</span>
                <span className="cq-btn-text">{STRINGS.btnShare}</span>
              </button>
              <button className="cq-secondary-btn" onClick={handlePrint} type="button">
                🖨️ {STRINGS.btnPrint}
              </button>
              {history.length > 1 && (
                <button className="cq-secondary-btn" onClick={() => setShowCompare(true)} type="button">
                  ⚖️ {STRINGS.btnCompare}
                </button>
              )}
              <button className="cq-ghost-btn" onClick={resetGame} type="button">
                🔄 {STRINGS.btnReplay}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {isComplete && showCompare && (
        <div className="cq-compare-screen">
          <div className="cq-compare-header">
            <h2>{STRINGS.compareTitle}</h2>
            <button className="cq-ghost-btn" onClick={() => setShowCompare(false)}>
              {STRINGS.closeBtn}
            </button>
          </div>
          
          <div className="cq-compare-grid">
            <div className="cq-compare-col">
              <div className="cq-compare-label">{STRINGS.compareCurrent}</div>
              <div className="cq-compare-card" style={{ borderColor: result.dominant.colorHex }}>
                <span className="cq-profile-emoji">{result.dominant.emoji}</span>
                <h3>{result.dominant.title}</h3>
                <span className="cq-compare-date">{result.date}</span>
              </div>
            </div>

            <div className="cq-compare-col">
              <div className="cq-compare-label">{STRINGS.comparePrevious}</div>
              <div className="cq-compare-card" style={{ borderColor: history[1].dominant.colorHex }}>
                <span className="cq-profile-emoji">{history[1].dominant.emoji}</span>
                <h3>{history[1].dominant.title}</h3>
                <span className="cq-compare-date">{history[1].date}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
