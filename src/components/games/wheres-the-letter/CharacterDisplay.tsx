"use client";

import { useMemo } from "react";
import { PHONICS_MAP, getCharColor } from "@/lib/games/gameData";
import type { GamePhase } from "@/hooks/games/useGameState";

interface CharacterDisplayProps {
  char: string;
  phase: GamePhase;
  isNewRecord: boolean;
}

export default function CharacterDisplay({ char, phase, isNewRecord }: CharacterDisplayProps) {
  const upperChar = char.toUpperCase();
  const phonics = PHONICS_MAP[upperChar];
  const color = getCharColor(upperChar);

  const isCorrect = phase === "correct";
  const isWrong = phase === "wrong";
  const isFailed = phase === "failed";
  const isShowing = phase === "showing";

  // Animation class based on phase
  let animClass = "";
  if (isCorrect) animClass = "wtl-bounce";
  else if (isWrong) animClass = "wtl-shake";
  else if (isFailed) animClass = "wtl-reveal";
  else if (isShowing) animClass = "wtl-enter";

  const confettiStyles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      // eslint-disable-next-line react-hooks/purity
      left: `${Math.random() * 100}%`,
      // eslint-disable-next-line react-hooks/purity
      animationDelay: `${Math.random() * 0.3}s`,
      backgroundColor: ["#E63946", "#457B9D", "#F4D35E", "#2A9D8F", "#E76F51"][i % 5],
    }));
  }, []);

  return (
    <div className="wtl-character-area" aria-live="polite">
      {/* Confetti on correct */}
      {isCorrect && (
        <div className="wtl-confetti" aria-hidden="true">
          {confettiStyles.map((style, i) => (
            <span
              key={i}
              className="wtl-confetti-piece"
              style={style}
            />
          ))}
        </div>
      )}

      {/* New Record flash */}
      {isNewRecord && (
        <div className="wtl-new-record" aria-label="New record!">
          🏆 NEW RECORD!
        </div>
      )}

      {/* Main character */}
      <div
        className={`wtl-big-char ${animClass}`}
        style={{ color }}
        role="img"
        aria-label={
          /[0-9]/.test(char)
            ? `The number ${char}`
            : `The letter ${char.toUpperCase()}`
        }
      >
        {char}
      </div>

      {/* Emoji companion */}
      {phonics && (
        <div className={`wtl-companion ${isShowing ? "wtl-enter-delay" : ""}`}>
          <span className="wtl-companion-emoji" aria-hidden="true">
            {phonics.emoji}
          </span>
        </div>
      )}

      {/* Phase feedback */}
      {isFailed && (
        <div className="wtl-hint-label" style={{ color }}>
          This is <strong>{/[0-9]/.test(char) ? `the number ${char}` : `the letter ${char.toUpperCase()}`}</strong>
        </div>
      )}
    </div>
  );
}
