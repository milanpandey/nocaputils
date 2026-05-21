"use client";

import { useCallback, useEffect } from "react";
import { useSpeech } from "@/hooks/games/useSpeech";
import { useGameState } from "@/hooks/games/useGameState";
import { useKeyboard } from "@/hooks/games/useKeyboard";
import CharacterDisplay from "./CharacterDisplay";
import OnScreenKeyboard from "./OnScreenKeyboard";
import StreakCounter from "./StreakCounter";
import GameHeader from "./GameHeader";

export default function GameClient() {
  const { speak, setEnabled, isSupported } = useSpeech();

  const {
    phase,
    mode,
    caseMode,
    currentChar,
    attempts,
    streak,
    totalCorrect,
    highScore,
    isNewRecord,
    wrongKey,
    soundEnabled,
    startGame,
    handleInput,
    setMode,
    setCaseMode,
    setSoundEnabled,
  } = useGameState({ speak });

  // Sync sound toggle with TTS
  useEffect(() => {
    setEnabled(soundEnabled);
  }, [soundEnabled, setEnabled]);

  // Physical keyboard input
  const { lastPressedKey } = useKeyboard({
    enabled: phase === "awaiting" || phase === "wrong",
    onKeyPress: handleInput,
  });

  // On-screen keyboard press
  const handleScreenKey = useCallback(
    (key: string) => {
      handleInput(key);
    },
    [handleInput]
  );

  // Mode change restarts game
  const handleModeChange = useCallback(
    (newMode: "letters" | "numbers") => {
      setMode(newMode);
      // Will auto-restart on next render cycle
    },
    [setMode]
  );

  const handleCaseChange = useCallback(
    (newCase: "upper" | "lower" | "mixed") => {
      setCaseMode(newCase);
    },
    [setCaseMode]
  );

  const isIdle = phase === "idle";

  return (
    <div className="wtl-game">
      <GameHeader
        mode={mode}
        caseMode={caseMode}
        soundEnabled={soundEnabled}
        onModeChange={handleModeChange}
        onCaseChange={handleCaseChange}
        onSoundToggle={setSoundEnabled}
      />

      {isIdle ? (
        /* ── Start Screen ── */
        <div className="wtl-start-screen">
          <div className="wtl-start-decoration" aria-hidden="true">
            <span className="wtl-deco-circle wtl-deco-circle--red" />
            <span className="wtl-deco-circle wtl-deco-circle--blue" />
            <span className="wtl-deco-circle wtl-deco-circle--yellow" />
          </div>

          <h2 className="wtl-start-title">
            Where&apos;s the<br />Letter?
          </h2>

          <p className="wtl-start-subtitle">
            Find the letter on the keyboard!
            <br />
            <span className="wtl-start-hint">
              Use your {isSupported ? "voice-guided " : ""}keyboard or tap the keys below.
            </span>
          </p>

          <button
            className="wtl-start-btn"
            onClick={startGame}
            type="button"
            aria-label="Start the game"
          >
            <span className="wtl-start-btn-text">Let&apos;s Play!</span>
            <span className="wtl-start-btn-icon" aria-hidden="true">🎮</span>
          </button>

          {highScore.streak > 0 && (
            <div className="wtl-start-highscore">
              🏆 Best streak: <strong>{highScore.streak}</strong>
            </div>
          )}

          {!isSupported && (
            <p className="wtl-tts-warning">
              ⚠️ Voice prompts are not supported in your browser.
              The game will still work — just without spoken instructions.
            </p>
          )}
        </div>
      ) : (
        /* ── Active Game ── */
        <div className="wtl-game-area">
          <StreakCounter
            streak={streak}
            totalCorrect={totalCorrect}
            highScore={highScore}
            isNewRecord={isNewRecord}
          />

          <CharacterDisplay
            char={currentChar}
            phase={phase}
            isNewRecord={isNewRecord}
          />

          {/* Attempt dots */}
          <div className="wtl-attempts" aria-label={`${3 - attempts} attempts remaining`}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`wtl-attempt-dot ${i < attempts ? "wtl-attempt-dot--used" : ""}`}
                aria-hidden="true"
              />
            ))}
          </div>

          <OnScreenKeyboard
            onKeyPress={handleScreenKey}
            targetChar={currentChar}
            phase={phase}
            attempts={attempts}
            wrongKey={wrongKey}
            lastPressedKey={lastPressedKey}
            mode={mode}
          />
        </div>
      )}
    </div>
  );
}
