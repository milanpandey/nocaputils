"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GAME_SHAPES,
  VOICE_CORRECT,
  VOICE_WRONG,
  VOICE_STREAK,
  VOICE_NEW_RECORD,
  pickRandom,
  SPEECH_CELEBRATE,
  SPEECH_ENCOURAGE,
  SPEECH_STREAK,
  SPEECH_RECORD,
  SPEECH_PROMPT,
  SPEECH_COMFORT,
  type GameShape,
  type SpeechProfile,
} from "@/lib/games/gameData";

export type ShapePhase = "idle" | "prompting" | "awaiting" | "correct" | "wrong" | "failed";

interface HighScore {
  streak: number;
  total: number;
}

const LS_KEY = "sb_highscore";

function loadHighScore(): HighScore {
  if (typeof window === "undefined") return { streak: 0, total: 0 };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { streak: 0, total: 0 };
}

function saveHighScore(hs: HighScore) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(hs));
  } catch { /* ignore */ }
}

interface UseShapeStateOptions {
  speak: (text: string, rate?: number, pitch?: number) => void;
  soundEnabled: boolean;
}

export function useShapeState({ speak, soundEnabled }: UseShapeStateOptions) {
  const [phase, setPhase] = useState<ShapePhase>("idle");
  const [targetShape, setTargetShape] = useState<GameShape | null>(null);
  const [choices, setChoices] = useState<GameShape[]>([]);
  const [round, setRound] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [highScore, setHighScore] = useState<HighScore>({ streak: 0, total: 0 });
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighScore(loadHighScore());
  }, []);

  const speakIfEnabled = useCallback(
    (text: string, profile?: SpeechProfile) => {
      if (soundEnabled) return speak(text, profile?.rate, profile?.pitch);
      return Promise.resolve();
    },
    [speak, soundEnabled]
  );

  const nextRound = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const newRound = round + 1;
    setRound(newRound);
    setAttempts(0);
    setSelectedId(null);
    setIsNewRecord(false);

    // Progressive difficulty: 3 → 4 → 5 → 6 choices
    const numChoices = Math.min(3 + Math.floor(newRound / 3), GAME_SHAPES.length);
    const shuffled = [...GAME_SHAPES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numChoices);
    const target = pickRandom(selected);

    setChoices(selected);
    setTargetShape(target);
    setPhase("prompting");

    timerRef.current = setTimeout(() => {
      speakIfEnabled(`Can you find the ${target.name}?`, SPEECH_PROMPT).catch(() => {});
      
      timerRef.current = setTimeout(() => {
        setPhase("awaiting");
      }, 1000);
    }, 500);
  }, [round, speakIfEnabled]);

  const startGame = useCallback(() => {
    setStreak(0);
    setTotalCorrect(0);
    setRound(0);
    setIsNewRecord(false);
    nextRound();
  }, [nextRound]);

  const handleSelect = useCallback(
    async (shapeId: string) => {
      if (phase !== "awaiting") return;
      setSelectedId(shapeId);

      if (targetShape && shapeId === targetShape.id) {
        setPhase("correct");
        const newStreak = streak + 1;
        const newTotal = totalCorrect + 1;
        setStreak(newStreak);
        setTotalCorrect(newTotal);

        if (VOICE_STREAK[newStreak]) {
          await speakIfEnabled(VOICE_STREAK[newStreak], SPEECH_STREAK);
        } else {
          await speakIfEnabled(
            `${pickRandom(VOICE_CORRECT)} That's the ${targetShape.name}!`,
            SPEECH_CELEBRATE
          );
        }

        const currentHS = loadHighScore();
        if (newStreak > currentHS.streak || newTotal > currentHS.total) {
          const updated = {
            streak: Math.max(newStreak, currentHS.streak),
            total: Math.max(newTotal, currentHS.total),
          };
          saveHighScore(updated);
          setHighScore(updated);
          if (newStreak > currentHS.streak && currentHS.streak > 0) {
            setIsNewRecord(true);
            await speakIfEnabled(VOICE_NEW_RECORD, SPEECH_RECORD);
          }
        }

        timerRef.current = setTimeout(() => {
          nextRound();
        }, 500);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 2) {
          setPhase("failed");
          setStreak(0);
          await speakIfEnabled(
            `That's okay! This is the ${targetShape?.name}!`,
            SPEECH_COMFORT
          );
          timerRef.current = setTimeout(() => {
            nextRound();
          }, 1000);
        } else {
          setPhase("wrong");
          speakIfEnabled(pickRandom(VOICE_WRONG), SPEECH_ENCOURAGE).catch(() => {});
          timerRef.current = setTimeout(() => {
            setSelectedId(null);
            setPhase("awaiting");
          }, 1000);
        }
      }
    },
    [phase, targetShape, streak, totalCorrect, attempts, speakIfEnabled, nextRound]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    phase,
    targetShape,
    choices,
    round,
    streak,
    totalCorrect,
    attempts,
    highScore,
    isNewRecord,
    selectedId,
    startGame,
    handleSelect,
  };
}
