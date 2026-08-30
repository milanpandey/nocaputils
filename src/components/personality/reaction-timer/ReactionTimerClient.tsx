"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import {
  type TestMode,
  type RoundState,
  type ReactionRound,
  type ReflexStats,
  calculateReflexStats,
} from "@/lib/personality/reactionTimerData";
import {
  playClick,
  playGoCue,
  playErrorBuzz,
  playSuccessChime,
  playBeep,
} from "@/lib/personality/soundEffects";

const TOTAL_ROUNDS = 5;

interface ReactionTimerClientProps {
  backHref?: string;
  backLabel?: string;
}

export default function ReactionTimerClient({
  backHref = "/personality",
  backLabel = "Personality",
}: ReactionTimerClientProps = {}) {
  const [mode, setMode] = useState<TestMode>("visual");
  const [gameState, setGameState] = useState<RoundState>("idle");
  const [rounds, setRounds] = useState<ReactionRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [lastTimeMs, setLastTimeMs] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [nogoStimulus, setNogoStimulus] = useState<"go" | "nogo">("go");
  const [hadIntermediateDecoy, setHadIntermediateDecoy] = useState<boolean>(false);
  const [clickedOnYellow, setClickedOnYellow] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const decoyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const stats: ReflexStats = useMemo(() => {
    return calculateReflexStats(rounds);
  }, [rounds]);

  const clearWaitTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (decoyTimerRef.current) {
      clearTimeout(decoyTimerRef.current);
      decoyTimerRef.current = null;
    }
  }, []);

  const triggerNextRound = useCallback(() => {
    clearWaitTimer();
    setGameState("waiting");
    setClickedOnYellow(false);

    // Decide if this round is a decoy round (introduced intermediate yellow before green)
    // Applied to visual & gonogo modes on specific rounds (e.g. Round 2, Round 4, or 40% random chance)
    const isDecoyRound =
      (mode === "visual" || mode === "gonogo") &&
      (currentRoundIndex === 1 || currentRoundIndex === 3 || Math.random() < 0.35);

    setHadIntermediateDecoy(isDecoyRound);

    // For Go/No-Go mode: 75% chance Go (Green), 25% chance No-Go (Red)
    const nextStimulus: "go" | "nogo" = mode === "gonogo" ? (Math.random() < 0.25 ? "nogo" : "go") : "go";
    setNogoStimulus(nextStimulus);

    if (isDecoyRound) {
      // Stage 1: Wait in Red (1.2s to 2.4s)
      const firstDelay = Math.floor(Math.random() * 1200) + 1200;
      timerRef.current = setTimeout(() => {
        // Stage 2: Flash Yellow Intermediate Decoy!
        setGameState("intermediate");
        if (soundEnabled) {
          playBeep(440, 0.08); // Subtle decoy cue
        }

        // Stage 3: After yellow decoy (900ms to 1800ms), switch to Green GO!
        const decoyDuration = Math.floor(Math.random() * 900) + 900;
        decoyTimerRef.current = setTimeout(() => {
          startTimeRef.current = performance.now();
          setGameState("ready");

          if (soundEnabled) {
            if (nextStimulus === "go") {
              playGoCue();
            } else {
              playBeep(300, 0.2);
            }
          }

          if (mode === "gonogo" && nextStimulus === "nogo") {
            decoyTimerRef.current = setTimeout(() => {
              setRounds((prev) => [
                ...prev,
                {
                  roundNumber: currentRoundIndex + 1,
                  timeMs: 250,
                  isEarly: false,
                  stimulusType: "nogo",
                  hadIntermediateDecoy: true,
                  mode,
                },
              ]);
              setLastTimeMs(0);
              setGameState("completed");
            }, 1200);
          }
        }, decoyDuration);
      }, firstDelay);
    } else {
      // Direct transition without decoy (1.5s to 3.8s)
      const directDelay = Math.floor(Math.random() * 2300) + 1500;
      timerRef.current = setTimeout(() => {
        startTimeRef.current = performance.now();
        setGameState("ready");

        if (soundEnabled) {
          if (nextStimulus === "go") {
            playGoCue();
          } else {
            playBeep(300, 0.2);
          }
        }

        if (mode === "gonogo" && nextStimulus === "nogo") {
          timerRef.current = setTimeout(() => {
            setRounds((prev) => [
              ...prev,
              {
                roundNumber: currentRoundIndex + 1,
                timeMs: 250,
                isEarly: false,
                stimulusType: "nogo",
                hadIntermediateDecoy: false,
                mode,
              },
            ]);
            setLastTimeMs(0);
            setGameState("completed");
          }, 1200);
        }
      }, directDelay);
    }
  }, [clearWaitTimer, mode, soundEnabled, currentRoundIndex]);

  const handleStartTest = useCallback(() => {
    if (soundEnabled) playClick();
    setRounds([]);
    setCurrentRoundIndex(0);
    setLastTimeMs(0);
    setClickedOnYellow(false);
    triggerNextRound();
  }, [soundEnabled, triggerNextRound]);

  const handleUserAction = useCallback(() => {
    if (gameState === "idle") {
      handleStartTest();
      return;
    }

    if (gameState === "waiting") {
      // Too early on Red!
      clearWaitTimer();
      setClickedOnYellow(false);
      if (soundEnabled) playErrorBuzz();
      setGameState("clicked_early");
      return;
    }

    if (gameState === "intermediate") {
      // Fooled by the Yellow decoy!
      clearWaitTimer();
      setClickedOnYellow(true);
      if (soundEnabled) playErrorBuzz();
      setGameState("clicked_early");
      return;
    }

    if (gameState === "clicked_early") {
      // Retry same round
      if (soundEnabled) playClick();
      triggerNextRound();
      return;
    }

    if (gameState === "ready") {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      clearWaitTimer();

      // In Go/No-Go mode, if player clicked on a No-Go stimulus:
      if (mode === "gonogo" && nogoStimulus === "nogo") {
        if (soundEnabled) playErrorBuzz();
        setClickedOnYellow(false);
        setGameState("clicked_early");
        return;
      }

      if (soundEnabled) playClick();
      setLastTimeMs(elapsed);

      const newRound: ReactionRound = {
        roundNumber: currentRoundIndex + 1,
        timeMs: elapsed,
        isEarly: false,
        stimulusType: nogoStimulus,
        hadIntermediateDecoy,
        mode,
      };

      const updatedRounds = [...rounds, newRound];
      setRounds(updatedRounds);

      if (currentRoundIndex + 1 >= TOTAL_ROUNDS) {
        setGameState("summary");
        if (soundEnabled) playSuccessChime();
      } else {
        setGameState("completed");
      }
      return;
    }

    if (gameState === "completed") {
      // Advance to next round
      if (soundEnabled) playClick();
      setCurrentRoundIndex((prev) => prev + 1);
      triggerNextRound();
    }
  }, [
    gameState,
    handleStartTest,
    clearWaitTimer,
    soundEnabled,
    triggerNextRound,
    mode,
    nogoStimulus,
    currentRoundIndex,
    rounds,
    hadIntermediateDecoy,
  ]);

  // Spacebar trigger support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleUserAction();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUserAction]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => clearWaitTimer();
  }, [clearWaitTimer]);

  const copyResult = useCallback(() => {
    const text = `⚡ My Reaction Time is ${stats.averageMs} ms (${stats.benchmark.badge} - ${stats.benchmark.title})!\n` +
      `Best Round: ${stats.bestMs} ms | Consistency: Grade ${stats.consistencyGrade}\n` +
      `Test your reflexes free & private on nocaputils: https://nocaputils.com/personality/reaction-timer`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [stats]);

  return (
    <div className="subtle-pattern min-h-screen">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 pb-12 pt-6 md:px-8 md:pt-10">
        {/* Top Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <a
            href={backHref}
            className="neo-button neo-button-theme flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all"
          >
            ← {backLabel}
          </a>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="neo-button bg-[var(--bg-panel)] px-3 py-2 text-sm transition-all"
              title={soundEnabled ? "Mute Sound" : "Enable Sound"}
              aria-label={soundEnabled ? "Mute Sound" : "Enable Sound"}
            >
              {soundEnabled ? "🔊" : "🔇"}
            </button>
            <ThemeToggle />
          </div>
        </div>

        <main className="flex flex-1 flex-col items-center">
          {/* Header */}
          <div className="mb-8 text-center max-w-2xl">
            <div className="inline-block border-2 border-[var(--border-main)] bg-[#EF4444] px-3 py-1 text-xs font-black uppercase tracking-widest text-white shadow-[3px_3px_0_0_var(--border-main)]">
              Reflex Benchmark
            </div>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-5xl">
              Reaction Time Tester
            </h1>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[var(--text-soft)]">
              Millisecond precision · Visual &amp; Audio Reflexes · 100% Private in-browser
            </p>
          </div>

          {/* Mode Selector (only when idle or summary) */}
          {(gameState === "idle" || gameState === "summary") && (
            <div className="mb-8 flex flex-wrap justify-center gap-2 w-full max-w-xl">
              {[
                { id: "visual" as TestMode, label: "Visual Reflex", emoji: "👁️", desc: "Red to Green" },
                { id: "auditory" as TestMode, label: "Audio Reflex", emoji: "🔊", desc: "Sound Beep" },
                { id: "gonogo" as TestMode, label: "Go / No-Go", emoji: "🚦", desc: "Selective Reflex" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    if (soundEnabled) playClick();
                    setMode(m.id);
                    setGameState("idle");
                    setRounds([]);
                  }}
                  className={`flex-1 min-w-[140px] neo-button p-3 text-center transition-all ${
                    mode === m.id
                      ? "bg-[#3B82F6] text-white shadow-[4px_4px_0_0_var(--border-main)] translate-x-[1px] translate-y-[1px]"
                      : "bg-[var(--bg-panel)] text-[var(--text-main)] hover:bg-[var(--bg-panel-muted)]"
                  }`}
                >
                  <div className="text-xl">{m.emoji}</div>
                  <div className="text-xs font-black uppercase tracking-wider mt-1">{m.label}</div>
                  <div className="text-[10px] font-bold opacity-75">{m.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* ── INTERACTIVE PLAYING ARENA ── */}
          {gameState !== "summary" ? (
            <div className="w-full max-w-3xl">
              {/* Round Tracker Indicator */}
              {gameState !== "idle" && (
                <div className="mb-4 flex items-center justify-between px-2 text-xs font-black uppercase tracking-widest text-[var(--text-soft)]">
                  <span>Round {currentRoundIndex + 1} of {TOTAL_ROUNDS}</span>
                  <span>Press Spacebar or Click anywhere</span>
                </div>
              )}

              {/* Reactive Main Arena Surface */}
              <div
                onClick={handleUserAction}
                className={`relative flex min-h-[360px] sm:min-h-[420px] w-full cursor-pointer select-none flex-col items-center justify-center rounded-2xl border-4 border-[var(--border-main)] p-8 text-center shadow-[8px_8px_0_0_var(--border-main)] transition-colors duration-100 ${
                  gameState === "idle"
                    ? "bg-[var(--bg-panel)] text-[var(--text-main)]"
                    : gameState === "waiting"
                    ? "bg-[#EF4444] text-white"
                    : gameState === "intermediate"
                    ? "bg-[#F59E0B] text-black"
                    : gameState === "ready"
                    ? nogoStimulus === "nogo"
                      ? "bg-[#1E293B] text-[#EF4444]"
                      : "bg-[#10B981] text-white"
                    : gameState === "clicked_early"
                    ? "bg-[#F59E0B] text-black"
                    : "bg-[#3B82F6] text-white"
                }`}
              >
                {gameState === "idle" && (
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-7xl animate-bounce">
                      {mode === "visual" ? "🔴" : mode === "auditory" ? "🎧" : "🚦"}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                      {mode === "visual" && "Click When Red Turns Green"}
                      {mode === "auditory" && "Click As Soon As You Hear The Tone"}
                      {mode === "gonogo" && "Click on GREEN ONLY. Ignore RED / Low tones!"}
                    </h2>
                    <p className="mt-3 max-w-md text-xs font-bold uppercase tracking-wider text-[var(--text-soft)]">
                      {mode === "visual"
                        ? "5 rounds to test reflexes. Watch out: some rounds will flash a YELLOW decoy first to test your discipline!"
                        : "5 quick rounds to benchmark your reflexes against global human percentiles."}
                    </p>
                    <div className="mt-8 neo-button bg-[#3B82F6] px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_var(--border-main)]">
                      ⚡ Start Test
                    </div>
                  </div>
                )}

                {gameState === "waiting" && (
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-7xl animate-pulse">⏳</div>
                    <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                      Wait for Green...
                    </h2>
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest opacity-80">
                      Do not click yet!
                    </p>
                  </div>
                )}

                {gameState === "intermediate" && (
                  <div className="flex flex-col items-center animate-pulse">
                    <div className="mb-4 text-7xl">🟡</div>
                    <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
                      HOLD ON — IT&apos;S YELLOW!
                    </h2>
                    <p className="mt-2 text-xs font-black uppercase tracking-widest text-black">
                      Do not click yet! Wait for GREEN...
                    </p>
                  </div>
                )}

                {gameState === "clicked_early" && (
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-7xl">{clickedOnYellow ? "🟡" : "⚠️"}</div>
                    <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
                      {clickedOnYellow ? "Fooled by the Yellow Decoy!" : "Too Soon!"}
                    </h2>
                    <p className="mt-2 text-xs font-black uppercase tracking-widest text-black max-w-md">
                      {clickedOnYellow
                        ? "You clicked when the screen turned Yellow. Remember: only click when the screen turns GREEN!"
                        : "You clicked before the green signal appeared. Tap to try this round again."}
                    </p>
                    <div className="mt-6 neo-button bg-black text-white px-6 py-2 text-xs font-black uppercase tracking-wider">
                      Try Round Again ↺
                    </div>
                  </div>
                )}

                {gameState === "ready" && (
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-8xl scale-110">
                      {nogoStimulus === "nogo" ? "⛔" : "⚡"}
                    </div>
                    <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight">
                      {nogoStimulus === "nogo" ? "DO NOT CLICK!" : "CLICK NOW!"}
                    </h2>
                  </div>
                )}

                {gameState === "completed" && (
                  <div className="flex flex-col items-center">
                    <div className="mb-2 text-5xl font-mono font-black">
                      {lastTimeMs > 0 ? `${lastTimeMs} ms` : "Patience ✓"}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                      {lastTimeMs > 0 ? (lastTimeMs < 200 ? "Lightning Fast! 🚀" : "Nice Reflex! 🎯") : "Perfect Hold! 🛡️"}
                    </h2>
                    <p className="mt-3 text-xs font-bold uppercase tracking-widest opacity-90">
                      Click anywhere for Round {currentRoundIndex + 2} of {TOTAL_ROUNDS} →
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── SUMMARY RESULTS VIEW ── */
            <div className="w-full max-w-4xl">
              {/* Main Score Banner */}
              <div className="neo-panel mb-8 overflow-hidden bg-[var(--bg-panel)] text-center">
                <div
                  className="border-b-4 border-[var(--border-main)] py-4 px-6 text-white"
                  style={{ background: stats.benchmark.color }}
                >
                  <span className="text-xs font-black uppercase tracking-[0.25em]">
                    Reflex Benchmark Result
                  </span>
                </div>

                <div className="p-6 sm:p-10">
                  <div className="mb-2 text-6xl">{stats.benchmark.emoji}</div>
                  <div className="font-mono text-5xl sm:text-7xl font-black text-[var(--text-main)]">
                    {stats.averageMs} <span className="text-3xl sm:text-4xl text-[var(--text-soft)]">ms</span>
                  </div>
                  <h2 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight">
                    {stats.benchmark.title}
                  </h2>
                  <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[var(--text-soft)]">
                    {stats.benchmark.percentile}
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <div
                      className="neo-panel px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white"
                      style={{ background: stats.benchmark.color }}
                    >
                      {stats.benchmark.badge}
                    </div>
                    <div className="neo-panel bg-[var(--bg-panel-muted)] px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                      Consistency: Grade {stats.consistencyGrade} (±{stats.stdDevMs}ms)
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats & Breakdown Grid */}
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="neo-panel p-6 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-soft)]">
                    Fastest Single Reflex
                  </span>
                  <div className="mt-2 text-3xl font-mono font-black text-[#10B981]">
                    {stats.bestMs} ms
                  </div>
                </div>

                <div className="neo-panel p-6 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-soft)]">
                    Average Latency
                  </span>
                  <div className="mt-2 text-3xl font-mono font-black text-[#3B82F6]">
                    {stats.averageMs} ms
                  </div>
                </div>

                <div className="neo-panel p-6 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-soft)]">
                    Slowest Round
                  </span>
                  <div className="mt-2 text-3xl font-mono font-black text-[#EF4444]">
                    {stats.worstMs} ms
                  </div>
                </div>
              </div>

              {/* Round-by-Round Bar Chart */}
              <div className="neo-panel mb-8 p-6">
                <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em]">
                  Round-by-Round Breakdown
                </h3>

                <div className="flex flex-col gap-3">
                  {rounds.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs font-bold">
                      <span className="w-16 font-mono text-[var(--text-soft)]">Round {r.roundNumber}</span>
                      {r.hadIntermediateDecoy && (
                        <span className="neo-panel bg-[#F59E0B] text-black px-1.5 py-0.5 text-[9px] font-black uppercase shrink-0">
                          🟡 Decoy Round
                        </span>
                      )}
                      <div className="flex-1 h-6 rounded-lg border border-[var(--border-main)] bg-[var(--bg-panel-muted)] overflow-hidden">
                        <div
                          className="h-full bg-[#3B82F6] flex items-center justify-end pr-2 text-[10px] text-white font-mono font-black"
                          style={{ width: `${Math.min(100, Math.max(15, (r.timeMs / 400) * 100))}%` }}
                        >
                          {r.timeMs}ms
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Global Benchmarks Reference Table */}
              <div className="neo-panel mb-8 p-6">
                <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em]">
                  Global Human Benchmark Guide
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-panel-muted)] border border-[var(--border-main)]">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <div className="font-black">&lt; 180 ms — Esports &amp; F1 Driver</div>
                      <div className="text-[10px] text-[var(--text-soft)]">Top 0.5% Neuromuscular Transmission</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-panel-muted)] border border-[var(--border-main)]">
                    <span className="text-2xl">🏎️</span>
                    <div>
                      <div className="font-black">180 – 215 ms — Elite Athlete</div>
                      <div className="text-[10px] text-[var(--text-soft)]">Top 5% Rapid Sensory Perception</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-panel-muted)] border border-[var(--border-main)]">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <div className="font-black">215 – 275 ms — Standard Human Median</div>
                      <div className="text-[10px] text-[var(--text-soft)]">Global Typical Benchmark (Healthy Reflexes)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-panel-muted)] border border-[var(--border-main)]">
                    <span className="text-2xl">☕</span>
                    <div>
                      <div className="font-black">&gt; 275 ms — Casual / Measured Pace</div>
                      <div className="text-[10px] text-[var(--text-soft)]">Calm response or standard 60Hz display lag</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={handleStartTest}
                  className="neo-button bg-[var(--bg-panel)] px-6 py-3 text-xs font-black uppercase tracking-wider transition-all hover:bg-[var(--bg-panel-muted)]"
                >
                  ↺ Retest Reflexes
                </button>

                <button
                  onClick={copyResult}
                  className="neo-button bg-[#3B82F6] px-8 py-3 text-xs font-black uppercase tracking-wider text-white transition-all shadow-[4px_4px_0_0_var(--border-main)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                >
                  {copied ? "✓ Copied to Clipboard!" : "📋 Copy Score Summary"}
                </button>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
