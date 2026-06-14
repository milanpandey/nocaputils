"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GAME_COLORS,
  COLOR_OBJECTS,
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
  type GameColor,
  type SpeechProfile,
} from "@/lib/games/gameData";

export type CQPhase = "idle" | "prompting" | "awaiting" | "correct" | "wrong" | "failed";

interface Choice {
  color: GameColor;
  objectEmoji: string;
  objectName: string;
  isCorrect: boolean;
}

interface HighScore {
  streak: number;
  total: number;
}

const LS_KEY = "cq_highscore";

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

interface UseColorQuestStateOptions {
  speak: (text: string, rate?: number, pitch?: number) => Promise<void>;
  soundEnabled: boolean;
}

export function useColorQuestState({ speak, soundEnabled }: UseColorQuestStateOptions) {
  const [phase, setPhase] = useState<CQPhase>("idle");
  const [choices, setChoices] = useState<Choice[]>([]);
  const [targetColor, setTargetColor] = useState<GameColor | null>(null);
  const [targetObject, setTargetObject] = useState("");
  const [round, setRound] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [highScore, setHighScore] = useState<HighScore>({ streak: 0, total: 0 });
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

  const generateRound = useCallback((roundNum: number) => {
    // More colors as rounds progress
    const numChoices = Math.min(3 + Math.floor(roundNum / 3), 6);
    const shuffledColors = [...GAME_COLORS].sort(() => Math.random() - 0.5);
    const selectedColors = shuffledColors.slice(0, numChoices);
    const obj = pickRandom(COLOR_OBJECTS);
    const correctIdx = Math.floor(Math.random() * numChoices);

    const newChoices: Choice[] = selectedColors.map((color, i) => ({
      color,
      objectEmoji: obj.emoji,
      objectName: obj.name,
      isCorrect: i === correctIdx,
    }));

    return {
      choices: newChoices,
      targetColor: selectedColors[correctIdx],
      objectName: obj.name,
    };
  }, []);

  const nextRound = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const newRound = round + 1;
    setRound(newRound);
    setAttempts(0);
    setSelectedIndex(null);
    setIsNewRecord(false);

    const { choices: newChoices, targetColor: newTarget, objectName } = generateRound(newRound);
    setChoices(newChoices);
    setTargetColor(newTarget);
    setTargetObject(objectName);
    setPhase("prompting");

    timerRef.current = setTimeout(() => {
      speakIfEnabled(
        `Find the ${newTarget.name.toLowerCase()} ${objectName}!`,
        SPEECH_PROMPT
      ).catch(() => {});
      
      timerRef.current = setTimeout(() => {
        setPhase("awaiting");
      }, 1000);
    }, 400);
  }, [round, generateRound, speakIfEnabled]);

  const startGame = useCallback(() => {
    setStreak(0);
    setTotalCorrect(0);
    setRound(0);
    setIsNewRecord(false);
    nextRound();
  }, [nextRound]);

  const handleSelect = useCallback(
    async (index: number) => {
      if (phase !== "awaiting") return;
      setSelectedIndex(index);

      if (choices[index].isCorrect) {
        setPhase("correct");
        const newStreak = streak + 1;
        const newTotal = totalCorrect + 1;
        setStreak(newStreak);
        setTotalCorrect(newTotal);

        if (VOICE_STREAK[newStreak]) {
          await speakIfEnabled(VOICE_STREAK[newStreak], SPEECH_STREAK);
        } else {
          const color = choices[index].color.name.toLowerCase();
          await speakIfEnabled(
            `${pickRandom(VOICE_CORRECT)} You found the ${color} ${targetObject}!`,
            SPEECH_CELEBRATE
          );
        }

        // Check high score
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
            `That's okay! This is the ${targetColor?.name.toLowerCase()} ${targetObject}!`,
            SPEECH_COMFORT
          );
          timerRef.current = setTimeout(() => {
            nextRound();
          }, 1000);
        } else {
          setPhase("wrong");
          speakIfEnabled(pickRandom(VOICE_WRONG), SPEECH_ENCOURAGE).catch(() => {});
          timerRef.current = setTimeout(() => {
            setSelectedIndex(null);
            setPhase("awaiting");
          }, 1000);
        }
      }
    },
    [phase, choices, streak, totalCorrect, attempts, targetColor, targetObject, speakIfEnabled, nextRound]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    phase,
    choices,
    targetColor,
    targetObject,
    round,
    streak,
    totalCorrect,
    attempts,
    highScore,
    isNewRecord,
    selectedIndex,
    startGame,
    handleSelect,
  };
}
