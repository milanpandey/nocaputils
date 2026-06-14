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
  SPEECH_PROMPT,
  SPEECH_CELEBRATE,
  SPEECH_ENCOURAGE,
  SPEECH_COMFORT,
  SPEECH_STREAK,
  SPEECH_RECORD,
  SPEECH_HINT,
  type SpeechProfile,
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
  const [roundStartTime, setRoundStartTime] = useState<number | null>(null);

  const phaseTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load high score on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighScore(loadHighScore());
  }, []);

  const clearTimers = useCallback(() => {
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
  }, []);

  const speakIfEnabled = useCallback(
    (text: string, profile?: SpeechProfile) => {
      if (soundEnabled) return speak(text, profile?.rate, profile?.pitch);
      return Promise.resolve();
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
    setRoundStartTime(null);

    // Brief delay then speak the prompt
    phaseTimerRef.current = setTimeout(() => {
      const prompt =
        mode === "numbers"
          ? VOICE_PROMPT_NUMBER(char)
          : VOICE_PROMPT_LETTER(char.toUpperCase());
      speakIfEnabled(prompt, SPEECH_PROMPT).catch(() => {});

      phaseTimerRef.current = setTimeout(() => {
        setPhase("awaiting");
        setRoundStartTime(Date.now());

        // Auto-hint after 15 seconds
        hintTimerRef.current = setTimeout(() => {
          const hintText =
            mode === "numbers"
              ? `The number is ${char}. Can you press ${char}?`
              : `The letter is ${char.toUpperCase()}. Can you press ${char.toUpperCase()}?`;
          speakIfEnabled(hintText, SPEECH_HINT).catch(() => {});

          // Auto-advance after another 15 seconds (30s total)
          autoAdvanceTimerRef.current = setTimeout(() => {
            setPhase("next");
          }, 15000);
        }, 15000);
      }, 1000);
    }, 600);
  }, [mode, caseMode, currentChar, clearTimers, speakIfEnabled]);

  const startGame = useCallback(() => {
    setStreak(0);
    setTotalCorrect(0);
    setIsNewRecord(false);
    nextCharacter();
  }, [nextCharacter]);

  const handleCorrect = useCallback(async () => {
    clearTimers();
    setPhase("correct");
    setRoundStartTime(null);

    const newStreak = streak + 1;
    const newTotal = totalCorrect + 1;
    setStreak(newStreak);
    setTotalCorrect(newTotal);

    // Check for streak milestone
    if (VOICE_STREAK[newStreak]) {
      await speakIfEnabled(VOICE_STREAK[newStreak], SPEECH_STREAK);
    } else {
      await speakIfEnabled(pickRandom(VOICE_CORRECT), SPEECH_CELEBRATE);
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
        await speakIfEnabled(VOICE_NEW_RECORD, SPEECH_RECORD);
      }
    }

    // Auto-advance to next character
    phaseTimerRef.current = setTimeout(() => {
      if (newRecord) setIsNewRecord(false);
      nextCharacter();
    }, 500);
  }, [streak, totalCorrect, clearTimers, nextCharacter, speakIfEnabled]);

  const handleWrong = useCallback(
    async (pressedKey: string) => {
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
        setRoundStartTime(null);
        const isNum = mode === "numbers";
        await speakIfEnabled(VOICE_FAIL(currentChar.toUpperCase(), isNum), SPEECH_COMFORT);
        setStreak(0);

        // Auto-advance after reveal
        phaseTimerRef.current = setTimeout(() => {
          nextCharacter();
        }, 1000);
      } else {
        setPhase("wrong");
        speakIfEnabled(pickRandom(VOICE_WRONG), SPEECH_ENCOURAGE).catch(() => {});

        phaseTimerRef.current = setTimeout(() => {
          setPhase("awaiting");
        }, 1000);
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    roundStartTime,

    // Actions
    startGame,
    handleInput,
    setMode,
    setCaseMode,
    setSoundEnabled,
  };
}
