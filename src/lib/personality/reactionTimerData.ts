export type TestMode = "visual" | "auditory" | "gonogo";
export type RoundState = "idle" | "waiting" | "intermediate" | "ready" | "clicked_early" | "completed" | "summary";

export interface ReactionRound {
  roundNumber: number;
  timeMs: number;
  isEarly: boolean;
  stimulusType?: "go" | "nogo";
  hadIntermediateDecoy?: boolean;
  mode: TestMode;
}

export interface BenchmarkTier {
  title: string;
  emoji: string;
  color: string;
  badge: string;
  percentile: string;
  description: string;
}

export function getBenchmark(avgMs: number): BenchmarkTier {
  if (avgMs <= 180) {
    return {
      title: "Esports & F1 Driver Reflex",
      emoji: "⚡",
      color: "#EC4899",
      badge: "Top 0.5%",
      percentile: "Top 0.5% of human reflexes",
      description: "Exceptional neuromuscular transmission. Equal to elite Formula 1 drivers and professional FPS esports athletes.",
    };
  }
  if (avgMs <= 215) {
    return {
      title: "Elite Athlete Reflex",
      emoji: "🏎️",
      color: "#3B82F6",
      badge: "Top 5%",
      percentile: "Top 5% speed benchmark",
      description: "Lightning-fast cognitive processing. Your sensory-motor response latency is far ahead of the global average.",
    };
  }
  if (avgMs <= 250) {
    return {
      title: "Sharp & Responsive",
      emoji: "🚀",
      color: "#10B981",
      badge: "Top 25%",
      percentile: "Top 25% human benchmark",
      description: "Crisp, alert sensory perception. You register and act on visual and auditory cues with great velocity.",
    };
  }
  if (avgMs <= 290) {
    return {
      title: "Standard Human Average",
      emoji: "🎯",
      color: "#F59E0B",
      badge: "Global Median",
      percentile: "Typical human benchmark (250–300ms)",
      description: "Solid, standard human reflex speed. Perfectly healthy cognitive perception and neuromuscular control.",
    };
  }
  return {
    title: "Relaxed / Deliberate",
    emoji: "☕",
    color: "#6B7280",
    badge: "Casual Pace",
    percentile: "Patience / Relaxed reflex",
    description: "Calm and measured response. (Tip: high screen refresh rates, wired mice, and intense focus can drop 40–80ms).",
  };
}

export interface ReflexStats {
  averageMs: number;
  bestMs: number;
  worstMs: number;
  stdDevMs: number;
  consistencyGrade: "S" | "A" | "B" | "C";
  benchmark: BenchmarkTier;
  validRoundsCount: number;
}

export function calculateReflexStats(rounds: ReactionRound[]): ReflexStats {
  const validTimes = rounds.filter((r) => !r.isEarly && r.timeMs > 0).map((r) => r.timeMs);

  if (validTimes.length === 0) {
    return {
      averageMs: 0,
      bestMs: 0,
      worstMs: 0,
      stdDevMs: 0,
      consistencyGrade: "C",
      benchmark: getBenchmark(999),
      validRoundsCount: 0,
    };
  }

  const avg = Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length);
  const best = Math.min(...validTimes);
  const worst = Math.max(...validTimes);

  // Standard deviation
  const variance = validTimes.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / validTimes.length;
  const stdDev = Math.round(Math.sqrt(variance));

  let consistencyGrade: "S" | "A" | "B" | "C" = "C";
  if (stdDev <= 15) consistencyGrade = "S";
  else if (stdDev <= 28) consistencyGrade = "A";
  else if (stdDev <= 45) consistencyGrade = "B";

  return {
    averageMs: avg,
    bestMs: best,
    worstMs: worst,
    stdDevMs: stdDev,
    consistencyGrade,
    benchmark: getBenchmark(avg),
    validRoundsCount: validTimes.length,
  };
}
