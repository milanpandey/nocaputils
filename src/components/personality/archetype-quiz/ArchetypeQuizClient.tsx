"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import {
  QUIZ_QUESTIONS,
  ARCHETYPES,
  calculateQuizResult,
  type ArchetypeChoice,
  type ArchetypeId,
  type QuizResult,
} from "@/lib/personality/archetypeData";
import { playClick, playSuccessChime } from "@/lib/personality/soundEffects";

export default function ArchetypeQuizClient() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, ArchetypeChoice>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"overview" | "strengths" | "blindspots" | "work">("overview");

  const currentQuestion = QUIZ_QUESTIONS[currentIndex];
  const totalQuestions = QUIZ_QUESTIONS.length;
  const progressPercent = Math.round((Object.keys(answers).length / totalQuestions) * 100);

  const result: QuizResult | null = useMemo(() => {
    if (!isCompleted) return null;
    return calculateQuizResult(answers);
  }, [isCompleted, answers]);

  const handleSelectChoice = useCallback((choice: ArchetypeChoice) => {
    if (soundEnabled) playClick();

    setAnswers((prev) => {
      const next = { ...prev, [currentQuestion.id]: choice };
      return next;
    });

    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 180);
    } else {
      setTimeout(() => {
        setIsCompleted(true);
        if (soundEnabled) playSuccessChime();
      }, 250);
    }
  }, [currentIndex, currentQuestion, soundEnabled, totalQuestions]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      if (soundEnabled) playClick();
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, soundEnabled]);

  const handleRestart = useCallback(() => {
    if (soundEnabled) playClick();
    setAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setActiveTab("overview");
  }, [soundEnabled]);

  // Keyboard navigation for choices (1-4, arrow left)
  useEffect(() => {
    if (isCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4") {
        const choiceIdx = parseInt(e.key, 10) - 1;
        if (currentQuestion.choices[choiceIdx]) {
          handleSelectChoice(currentQuestion.choices[choiceIdx]);
        }
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCompleted, currentQuestion, handleSelectChoice, handlePrev]);

  const copyResultText = useCallback(() => {
    if (!result) return;
    const text = `🎯 My Personality Archetype is ${result.primary.name} (${result.primary.badge})!\n` +
      `Secondary: ${result.secondary.name}\n\n` +
      `✨ Superpower: ${result.primary.superpower}\n` +
      `🔥 Core Driver: ${result.primary.coreDriver}\n\n` +
      `Take the free, 100% private Archetype Quiz on nocaputils: https://nocaputils.com/personality/archetype-quiz`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result]);

  return (
    <div className="subtle-pattern min-h-screen">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 pb-12 pt-6 md:px-8 md:pt-10">
        {/* Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
          <a
            href="/personality"
            className="neo-button neo-button-theme flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all"
          >
            ← Personality
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
          {!isCompleted ? (
            /* ── QUIZ IN PROGRESS ── */
            <div className="w-full max-w-3xl">
              {/* Header Banner */}
              <div className="mb-8 text-center">
                <div className="inline-block border-2 border-[var(--border-main)] bg-[#9C27B0] px-3 py-1 text-xs font-black uppercase tracking-widest text-white shadow-[3px_3px_0_0_var(--border-main)]">
                  Archetype Quiz
                </div>
                <h1 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">
                  Quick Personality Profile
                </h1>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--text-soft)]">
                  Question {currentIndex + 1} of {totalQuestions} · 100% Private in your browser
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-8 neo-panel p-2">
                <div className="flex items-center justify-between px-2 pb-1 text-[10px] font-black uppercase tracking-widest">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)]">
                  <div
                    className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#3B82F6] to-[#10B981] transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="neo-panel mb-6 p-6 sm:p-8">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-block border border-[var(--border-main)] bg-[var(--bg-panel-muted)] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
                    {currentQuestion.category}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--text-soft)]">
                    {currentQuestion.scenario}
                  </span>
                </div>

                <h2 className="mb-8 text-xl font-black leading-snug sm:text-2xl">
                  {currentQuestion.question}
                </h2>

                {/* Choices Grid */}
                <div className="flex flex-col gap-3">
                  {currentQuestion.choices.map((choice, idx) => {
                    const isSelected = answers[currentQuestion.id]?.text === choice.text;
                    const letters = ["A", "B", "C", "D"];
                    const numbers = ["1", "2", "3", "4"];

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectChoice(choice)}
                        className={`group flex items-center gap-4 rounded-xl border-3 border-[var(--border-main)] p-4 text-left font-bold transition-all ${
                          isSelected
                            ? "bg-[#3B82F6] text-white shadow-[4px_4px_0_0_var(--border-main)] translate-x-[2px] translate-y-[2px]"
                            : "bg-[var(--bg-panel)] text-[var(--text-main)] shadow-[4px_4px_0_0_var(--border-main)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_var(--border-main)]"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-[var(--border-main)] text-xs font-black transition-colors ${
                            isSelected
                              ? "bg-white text-black"
                              : "bg-[var(--bg-panel-muted)] group-hover:bg-[#F2EF13] group-hover:text-black"
                          }`}
                        >
                          {letters[idx]}
                        </span>
                        <span className="flex-1 text-sm sm:text-base leading-snug">
                          {choice.text}
                        </span>
                        <span className="hidden sm:inline-block text-[10px] opacity-40 font-mono">
                          [{numbers[idx]}]
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Card Footer Navigation */}
                <div className="mt-8 flex items-center justify-between border-t-2 border-[var(--border-main)] pt-4">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className={`neo-button px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                      currentIndex === 0
                        ? "opacity-30 cursor-not-allowed bg-[var(--bg-panel-muted)]"
                        : "bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-muted)]"
                    }`}
                  >
                    ← Previous
                  </button>

                  <span className="text-[11px] font-bold text-[var(--text-soft)]">
                    Tip: Press 1, 2, 3, or 4 on keyboard
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* ── RESULTS VIEW ── */
            result && (
              <div className="w-full max-w-4xl">
                {/* Result Header Banner */}
                <div className="neo-panel mb-8 overflow-hidden bg-[var(--bg-panel)] text-center">
                  <div
                    className="border-b-4 border-[var(--border-main)] py-4 px-6 text-white"
                    style={{ background: result.primary.color }}
                  >
                    <span className="text-xs font-black uppercase tracking-[0.25em]">
                      Your Primary Archetype
                    </span>
                  </div>

                  <div className="p-6 sm:p-10">
                    <div className="mb-3 text-6xl sm:text-7xl">{result.primary.emoji}</div>
                    <h1 className="text-4xl font-black uppercase tracking-tight sm:text-6xl">
                      {result.primary.name}
                    </h1>
                    <p className="mt-2 text-lg font-bold text-[var(--text-soft)]">
                      &ldquo;{result.primary.tagline}&rdquo;
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <div
                        className="neo-panel px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white"
                        style={{ background: result.primary.color }}
                      >
                        {result.primary.badge}
                      </div>
                      <div className="neo-panel bg-[var(--bg-panel-muted)] px-4 py-1.5 text-xs font-black uppercase tracking-wider">
                        Secondary: {result.secondary.emoji} {result.secondary.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Radar Chart & Breakdown Grid */}
                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Radar Chart Card */}
                  <div className="neo-panel flex flex-col items-center justify-center p-6">
                    <h2 className="mb-2 text-xs font-black uppercase tracking-[0.18em]">
                      Archetype Radar Balance
                    </h2>
                    <p className="mb-4 text-[11px] text-[var(--text-soft)] text-center">
                      Visual breakdown across all 6 core personality dimensions
                    </p>

                    <div className="relative flex w-full max-w-[320px] items-center justify-center">
                      <RadarChart percentages={result.percentages} primaryColor={result.primary.color} />
                    </div>
                  </div>

                  {/* Percentage Progress Bars Card */}
                  <div className="neo-panel flex flex-col justify-center p-6">
                    <h2 className="mb-4 text-xs font-black uppercase tracking-[0.18em]">
                      Dimension Breakdown
                    </h2>

                    <div className="flex flex-col gap-3">
                      {(Object.keys(ARCHETYPES) as ArchetypeId[]).map((id) => {
                        const arch = ARCHETYPES[id];
                        const pct = result.percentages[id] || 0;
                        const isPrimary = id === result.primary.id;

                        return (
                          <div key={id} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="flex items-center gap-2">
                                <span>{arch.emoji}</span>
                                <span className={isPrimary ? "font-black underline" : ""}>
                                  {arch.name}
                                </span>
                              </span>
                              <span className="font-mono text-xs">{pct}%</span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full border border-[var(--border-main)] bg-[var(--bg-panel-muted)]">
                              <div
                                className="h-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: arch.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Tabbed In-Depth Insights */}
                <div className="neo-panel mb-8 overflow-hidden">
                  {/* Tab Navigation */}
                  <div className="flex flex-wrap border-b-3 border-[var(--border-main)] bg-[var(--bg-panel-muted)]">
                    {[
                      { id: "overview", label: "Overview", emoji: "📋" },
                      { id: "strengths", label: "Superpower & Flow", emoji: "⚡" },
                      { id: "blindspots", label: "Blind Spot & Growth", emoji: "🌱" },
                      { id: "work", label: "Work & Communication", emoji: "💼" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          if (soundEnabled) playClick();
                          setActiveTab(tab.id as typeof activeTab);
                        }}
                        className={`flex-1 min-w-[140px] px-4 py-3 text-xs font-black uppercase tracking-wider transition-all ${
                          activeTab === tab.id
                            ? "border-b-4 border-[var(--border-main)] bg-[var(--bg-panel)] text-[var(--text-main)] shadow-[inset_0_-2px_0_0_var(--border-main)]"
                            : "opacity-70 hover:opacity-100"
                        }`}
                      >
                        {tab.emoji} {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents */}
                  <div className="p-6 sm:p-8">
                    {activeTab === "overview" && (
                      <div className="flex flex-col gap-5">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-[#3B82F6]">
                            Core Driver
                          </h3>
                          <p className="mt-1 text-base font-bold leading-relaxed">
                            {result.primary.coreDriver}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-[#10B981]">
                            Key Personality Traits
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {result.primary.keyTraits.map((trait) => (
                              <span
                                key={trait}
                                className="neo-panel bg-[var(--bg-panel-muted)] px-3 py-1 text-xs font-bold uppercase tracking-wider"
                              >
                                ✓ {trait}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-lg border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] p-4">
                          <h4 className="text-xs font-black uppercase tracking-wider">
                            Dynamic Pairing with Secondary Archetype
                          </h4>
                          <p className="mt-1 text-xs font-medium text-[var(--text-soft)] leading-normal">
                            Your primary {result.primary.name} style is enriched by your secondary {result.secondary.name} tendencies, allowing you to combine &ldquo;{result.primary.superpower}&rdquo; with &ldquo;{result.secondary.coreDriver}&rdquo;.
                          </p>
                        </div>
                      </div>
                    )}

                    {activeTab === "strengths" && (
                      <div className="flex flex-col gap-6">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-[#EC4899]">
                            ⚡ Ultimate Superpower
                          </h3>
                          <p className="mt-1 text-base font-bold leading-relaxed">
                            {result.primary.superpower}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-[#8B5CF6]">
                            🌊 Peak Flow State Trigger
                          </h3>
                          <p className="mt-1 text-base font-bold leading-relaxed">
                            {result.primary.flowState}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeTab === "blindspots" && (
                      <div className="flex flex-col gap-6">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-[#EF4444]">
                            ⚠️ Hidden Blind Spot
                          </h3>
                          <p className="mt-1 text-base font-bold leading-relaxed">
                            {result.primary.blindSpot}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-[#10B981]">
                            🌱 Personalized Growth Advice
                          </h3>
                          <p className="mt-1 text-base font-bold leading-relaxed">
                            {result.primary.growthAdvice}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeTab === "work" && (
                      <div className="flex flex-col gap-6">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-[#3B82F6]">
                            💬 Natural Communication Style
                          </h3>
                          <p className="mt-1 text-base font-bold leading-relaxed">
                            {result.primary.communicationStyle}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-[#F59E0B]">
                            🏢 Ideal Work Environment
                          </h3>
                          <p className="mt-1 text-base font-bold leading-relaxed">
                            {result.primary.idealEnvironment}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions & Sharing Footer */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <button
                    onClick={handleRestart}
                    className="neo-button bg-[var(--bg-panel)] px-6 py-3 text-xs font-black uppercase tracking-wider transition-all hover:bg-[var(--bg-panel-muted)]"
                  >
                    ↺ Retake Quiz
                  </button>

                  <button
                    onClick={copyResultText}
                    className="neo-button bg-[#3B82F6] px-8 py-3 text-xs font-black uppercase tracking-wider text-white transition-all shadow-[4px_4px_0_0_var(--border-main)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                  >
                    {copied ? "✓ Copied to Clipboard!" : "📋 Copy Shareable Profile"}
                  </button>
                </div>
              </div>
            )
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

// ── SVG Radar Chart Component ────────────────────────────────────────────────
interface RadarChartProps {
  percentages: Record<ArchetypeId, number>;
  primaryColor: string;
}

function RadarChart({ percentages, primaryColor }: RadarChartProps) {
  const size = 300;
  const center = size / 2;
  const radius = size * 0.38;

  const archetypes: { id: ArchetypeId; label: string; emoji: string }[] = [
    { id: "strategist", label: "Strategist", emoji: "🎯" },
    { id: "visionary", label: "Visionary", emoji: "🔮" },
    { id: "creator", label: "Creator", emoji: "🎨" },
    { id: "empath", label: "Empath", emoji: "💖" },
    { id: "catalyst", label: "Catalyst", emoji: "⚡" },
    { id: "realist", label: "Realist", emoji: "🛡️" },
  ];

  const count = archetypes.length;
  const angleStep = (Math.PI * 2) / count;

  // Concentric polygon grid lines
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (angle: number, distance: number) => {
    const x = center + distance * Math.cos(angle - Math.PI / 2);
    const y = center + distance * Math.sin(angle - Math.PI / 2);
    return { x, y };
  };

  // Build polygon points for data
  const dataPoints = archetypes.map((arch, i) => {
    const angle = i * angleStep;
    const value = Math.max(15, Math.min(100, percentages[arch.id] || 20));
    const dist = (value / 100) * radius;
    return getCoordinates(angle, dist);
  });

  const polygonPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto overflow-visible select-none">
      {/* Background Web Grid */}
      {gridLevels.map((lvl) => {
        const pts = Array.from({ length: count }, (_, i) => {
          const { x, y } = getCoordinates(i * angleStep, radius * lvl);
          return `${x},${y}`;
        }).join(" ");

        return (
          <polygon
            key={lvl}
            points={pts}
            fill="none"
            stroke="var(--border-main)"
            strokeWidth="1"
            strokeDasharray={lvl < 1 ? "3,3" : "none"}
            opacity="0.35"
          />
        );
      })}

      {/* Axis Lines */}
      {archetypes.map((_, i) => {
        const { x, y } = getCoordinates(i * angleStep, radius);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="var(--border-main)"
            strokeWidth="1"
            opacity="0.35"
          />
        );
      })}

      {/* Data Filled Polygon */}
      <path
        d={polygonPath}
        fill={primaryColor}
        fillOpacity="0.35"
        stroke={primaryColor}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Data Points on vertices */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4.5"
          fill={primaryColor}
          stroke="var(--border-main)"
          strokeWidth="2"
        />
      ))}

      {/* Labels with Emojis */}
      {archetypes.map((arch, i) => {
        const angle = i * angleStep;
        const { x, y } = getCoordinates(angle, radius + 26);

        return (
          <g key={arch.id} transform={`translate(${x}, ${y})`}>
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] font-black uppercase tracking-wider fill-[var(--text-main)]"
            >
              {arch.emoji} {arch.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
