"use client";

import { useState, useCallback, useEffect } from "react";
import {
  QUESTION_PACKS,
  PERSONALITIES,
  BADGES,
  type CQQuestion,
  type CQChoice,
  type PersonalityColor,
  type PersonalityProfile,
  type CQBadge,
} from "@/lib/games/colorQuestData";

export interface CQResult {
  date: string;
  dominant: PersonalityProfile;
  secondary: PersonalityProfile;
  badge: CQBadge;
  scores: Record<PersonalityColor, number>;
}

export function useColorQuestState({
  speak,
  soundEnabled,
}: {
  speak: (text: string) => void;
  soundEnabled: boolean;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "complete">("idle");
  const [questions, setQuestions] = useState<CQQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<CQChoice[]>([]);
  const [result, setResult] = useState<CQResult | null>(null);
  const [history, setHistory] = useState<CQResult[]>([]);
  const [canResume, setCanResume] = useState(false);

  // Load history & potential resume state on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("nocaputils_cq_history");
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedProgress = localStorage.getItem("nocaputils_cq_progress");
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        if (parsed.answers && parsed.answers.length > 0 && parsed.answers.length < 10) {
          setCanResume(true);
        }
      }
    } catch (e) {
      console.warn("Failed to read LocalStorage", e);
    }
  }, []);

  // Save progress automatically
  useEffect(() => {
    if (phase === "playing") {
      try {
        localStorage.setItem(
          "nocaputils_cq_progress",
          JSON.stringify({ questions, answers, currentIndex })
        );
      } catch (e) {
        // ignore
      }
    }
  }, [phase, questions, answers, currentIndex]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const startGame = useCallback(
    (resume = false) => {
      if (resume) {
        try {
          const savedProgress = localStorage.getItem("nocaputils_cq_progress");
          if (savedProgress) {
            const parsed = JSON.parse(savedProgress);
            setQuestions(parsed.questions);
            setAnswers(parsed.answers);
            setCurrentIndex(parsed.currentIndex);
            setPhase("playing");
            return;
          }
        } catch (e) {
          console.warn("Could not resume");
        }
      }

      const pack = QUESTION_PACKS.classic;
      setQuestions(shuffleArray(pack));
      setCurrentIndex(0);
      setAnswers([]);
      setPhase("playing");
      setCanResume(false);
      localStorage.removeItem("nocaputils_cq_progress");

      if (soundEnabled) {
        speak("Welcome to Color Quest! Let's start the adventure.");
      }
    },
    [soundEnabled, speak]
  );

  const calculateResult = useCallback((finalAnswers: CQChoice[]) => {
    const scores: Record<PersonalityColor, number> = {
      red: 0,
      blue: 0,
      green: 0,
      yellow: 0,
    };

    finalAnswers.forEach((ans) => {
      scores[ans.color] += 1;
    });

    // Sort by score
    const sortedColors = (Object.keys(scores) as PersonalityColor[]).sort((a, b) => {
      if (scores[b] !== scores[a]) return scores[b] - scores[a];
      
      // Tie breaker: check last 3 answers
      const last3 = finalAnswers.slice(-3);
      const aRecent = last3.filter((ans) => ans.color === a).length;
      const bRecent = last3.filter((ans) => ans.color === b).length;
      return bRecent - aRecent;
    });

    const dominantColor = sortedColors[0];
    const secondaryColor = sortedColors[1];

    const dominant = PERSONALITIES[dominantColor];
    const secondary = PERSONALITIES[secondaryColor];

    // Assign a badge
    let badge = BADGES[0];
    if (dominantColor === "red") badge = BADGES.find(b => b.id === "treasure") || BADGES[0];
    if (dominantColor === "blue") badge = BADGES.find(b => b.id === "puzzle") || BADGES[0];
    if (dominantColor === "green") badge = BADGES.find(b => b.id === "animal") || BADGES[0];
    if (dominantColor === "yellow") badge = BADGES.find(b => b.id === "rainbow") || BADGES[0];

    const newResult: CQResult = {
      date: new Date().toLocaleDateString(),
      dominant,
      secondary,
      badge,
      scores,
    };

    setResult(newResult);
    
    // Save to history
    setHistory((prev) => {
      const updated = [newResult, ...prev].slice(0, 5); // Keep last 5
      try {
        localStorage.setItem("nocaputils_cq_history", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Clear progress
    try {
      localStorage.removeItem("nocaputils_cq_progress");
    } catch (e) {}
  }, []);

  const selectChoice = useCallback(
    (choice: CQChoice) => {
      if (phase !== "playing") return;

      const newAnswers = [...answers, choice];
      setAnswers(newAnswers);

      if (soundEnabled) {
        speak(choice.speechText);
      }

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setPhase("complete");
        calculateResult(newAnswers);
        if (soundEnabled) {
          setTimeout(() => {
            speak("All done! Your magical result is ready!");
          }, 1000);
        }
      }
    },
    [phase, answers, currentIndex, questions.length, soundEnabled, speak, calculateResult]
  );

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setAnswers((prev) => prev.slice(0, -1));
    }
  }, [currentIndex]);

  const resetGame = useCallback(() => {
    setPhase("idle");
    setResult(null);
  }, []);

  return {
    phase,
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex],
    answers,
    result,
    history,
    canResume,
    startGame,
    selectChoice,
    goBack,
    resetGame,
  };
}
