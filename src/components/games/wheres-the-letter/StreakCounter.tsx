"use client";

interface StreakCounterProps {
  streak: number;
  totalCorrect: number;
  highScore: { streak: number; total: number };
  isNewRecord: boolean;
}

export default function StreakCounter({
  streak,
  totalCorrect,
  highScore,
  isNewRecord,
}: StreakCounterProps) {
  // Determine streak emoji
  let streakIcon = "⭐";
  if (streak >= 20) streakIcon = "👑";
  else if (streak >= 10) streakIcon = "🌟";
  else if (streak >= 5) streakIcon = "🔥";
  else if (streak >= 3) streakIcon = "✨";

  return (
    <div className="wtl-streak-panel">
      {/* Current streak */}
      <div className={`wtl-streak-count ${streak >= 5 ? "wtl-streak-fire" : ""}`}>
        <span className="wtl-streak-icon" aria-hidden="true">
          {streak > 0 ? streakIcon : "⭐"}
        </span>
        <div className="wtl-streak-numbers">
          <span className="wtl-streak-value">{streak}</span>
          <span className="wtl-streak-label">streak</span>
        </div>
      </div>

      {/* Score */}
      <div className="wtl-score-pill">
        <span className="wtl-score-value">{totalCorrect}</span>
        <span className="wtl-score-label">correct</span>
      </div>

      {/* High score */}
      <div className={`wtl-highscore ${isNewRecord ? "wtl-record-glow" : ""}`}>
        <span className="wtl-highscore-icon" aria-hidden="true">🏆</span>
        <span className="wtl-highscore-value">{highScore.streak}</span>
      </div>
    </div>
  );
}
