"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  generateCharacter,
  VOICE_CORRECT,
  VOICE_WRONG,
  VOICE_FAIL,
  VOICE_PROMPT_LETTER,
  VOICE_PROMPT_NUMBER,
  VOICE_STREAK,
  VOICE_NEW_RECORD,
  pickRandom,
} from "@/lib/games/gameData";

export type GamePhase =
  | "idle"
  | "showing"
  | "awaiting"
  | "correct"
  | "wrong"
  | "failed"
  | "next";

export type GameMode = "letters" | "numbers";
export type CaseMode = "upper" | "lower" | "mixed";

interface HighScore {
  streak: number;
  total: number;
}

const LS_KEY = "wtl_highscore";

function loadHighScore(): HighScore {
  if (typeof window === "undefined") return { streak: 0, total: 0 };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { streak: 0, total: 0 };
}

function saveHighScore(hs: HighScore) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(hs));
  } catch {
    // ignore
  }
}

interface UseGameStateOptions {
  speak: (text: string, rate?: number, pitch?: number) => void;
}

export function useGameState({ speak }: UseGameStateOptions) {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [mode, setMode] = useState<GameMode>("letters");
  const [caseMode, setCaseMode] = useState<CaseMode>("upper");
  const [currentChar, setCurrentChar] = useState<string>("");
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [highScore, setHighScore] = useState<HighScore>({ streak: 0, total: 0 });
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const phaseTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load high score on mount
  useEffect(() => {
    setHighScore(loadHighScore());
  }, []);

  const clearTimers = useCallback(() => {
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
  }, []);

  const speakIfEnabled = useCallback(
    (text: string, rate?: number, pitch?: number) => {
      if (soundEnabled) speak(text, rate, pitch);
    },
    [speak, soundEnabled]
  );

  const nextCharacter = useCallback(() => {
    clearTimers();
    const char = generateCharacter(mode, caseMode, currentChar);
    setCurrentChar(char);
    setAttempts(0);
    setWrongKey(null);
    setIsNewRecord(false);
    setPhase("showing");

    // Brief delay then speak the prompt
    phaseTimerRef.current = setTimeout(() => {
      const prompt =
        mode === "numbers"
          ? VOICE_PROMPT_NUMBER(char)
          : VOICE_PROMPT_LETTER(char.toUpperCase());
      speakIfEnabled(prompt);
      setPhase("awaiting");

      // Auto-hint after 10 seconds
      hintTimerRef.current = setTimeout(() => {
        const hintText =
          mode === "numbers"
            ? `The number is ${char}. Can you press ${char}?`
            : `The letter is ${char.toUpperCase()}. Can you press ${char.toUpperCase()}?`;
        speakIfEnabled(hintText);

        // Auto-advance after another 10 seconds (20s total)
        autoAdvanceTimerRef.current = setTimeout(() => {
          setPhase("next");
        }, 10000);
      }, 10000);
    }, 600);
  }, [mode, caseMode, currentChar, clearTimers, speakIfEnabled]);

  const startGame = useCallback(() => {
    setStreak(0);
    setTotalCorrect(0);
    setIsNewRecord(false);
    nextCharacter();
  }, [nextCharacter]);

  const handleCorrect = useCallback(() => {
    clearTimers();
    setPhase("correct");

    const newStreak = streak + 1;
    const newTotal = totalCorrect + 1;
    setStreak(newStreak);
    setTotalCorrect(newTotal);

    // Check for streak milestone
    if (VOICE_STREAK[newStreak]) {
      speakIfEnabled(VOICE_STREAK[newStreak]);
    } else {
      speakIfEnabled(pickRandom(VOICE_CORRECT));
    }

    // Check for new high score
    const currentHS = loadHighScore();
    let newRecord = false;
    if (newStreak > currentHS.streak || newTotal > currentHS.total) {
      const updated = {
        streak: Math.max(newStreak, currentHS.streak),
        total: Math.max(newTotal, currentHS.total),
      };
      saveHighScore(updated);
      setHighScore(updated);
      if (newStreak > currentHS.streak && currentHS.streak > 0) {
        newRecord = true;
        setIsNewRecord(true);
        // Speak new record after the correct celebration
        setTimeout(() => speakIfEnabled(VOICE_NEW_RECORD), 1200);
      }
    }

    // Auto-advance to next character
    phaseTimerRef.current = setTimeout(() => {
      if (newRecord) setIsNewRecord(false);
      nextCharacter();
    }, newRecord ? 2500 : 1500);
  }, [streak, totalCorrect, clearTimers, nextCharacter, speakIfEnabled]);

  const handleWrong = useCallback(
    (pressedKey: string) => {
      if (phase !== "awaiting") return;

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setWrongKey(pressedKey);

      // Clear wrong key highlight after 400ms
      setTimeout(() => setWrongKey(null), 400);

      if (newAttempts >= 3) {
        // Failed — reveal the answer
        clearTimers();
        setPhase("failed");
        const isNum = mode === "numbers";
        speakIfEnabled(VOICE_FAIL(currentChar.toUpperCase(), isNum));
        setStreak(0);

        // Auto-advance after reveal
        phaseTimerRef.current = setTimeout(() => {
          nextCharacter();
        }, 3000);
      } else {
        setPhase("wrong");
        speakIfEnabled(pickRandom(VOICE_WRONG));

        phaseTimerRef.current = setTimeout(() => {
          setPhase("awaiting");
        }, 800);
      }
    },
    [phase, attempts, mode, currentChar, clearTimers, nextCharacter, speakIfEnabled]
  );

  const handleInput = useCallback(
    (key: string) => {
      if (phase !== "awaiting" && phase !== "wrong") return;

      // Compare case-insensitively
      if (key.toUpperCase() === currentChar.toUpperCase()) {
        handleCorrect();
      } else {
        handleWrong(key);
      }
    },
    [phase, currentChar, handleCorrect, handleWrong]
  );

  // Cleanup on unmount
  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  // Auto-advance from "next" phase
  useEffect(() => {
    if (phase === "next") {
      nextCharacter();
    }
  }, [phase, nextCharacter]);

  return {
    // State
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

    // Actions
    startGame,
    handleInput,
    setMode,
    setCaseMode,
    setSoundEnabled,
  };
}
