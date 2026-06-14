"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  COUNTING_OBJECTS,
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
  type SpeechProfile,
} from "@/lib/games/gameData";

export type CountPhase = "idle" | "showing" | "awaiting" | "correct" | "wrong" | "failed";

interface HighScore {
  streak: number;
  total: number;
}

const LS_KEY = "ca_highscore";

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

interface UseCountStateOptions {
  speak: (text: string, rate?: number, pitch?: number) => void;
  soundEnabled: boolean;
}

export function useCountState({ speak, soundEnabled }: UseCountStateOptions) {
  const [phase, setPhase] = useState<CountPhase>("idle");
  const [objectEmoji, setObjectEmoji] = useState("");
  const [objectName, setObjectName] = useState("");
  const [objectPlural, setObjectPlural] = useState("");
  const [count, setCount] = useState(0);
  const [maxNumber, setMaxNumber] = useState(5);
  const [round, setRound] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [highScore, setHighScore] = useState<HighScore>({ streak: 0, total: 0 });
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

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
    setSelectedNumber(null);
    setIsNewRecord(false);

    // Progressive difficulty: increase max number
    const newMax = Math.min(3 + Math.floor(newRound / 3), 10);
    setMaxNumber(newMax);

    const obj = pickRandom(COUNTING_OBJECTS);
    const newCount = 1 + Math.floor(Math.random() * newMax);
    setObjectEmoji(obj.emoji);
    setObjectName(obj.name);
    setObjectPlural(obj.plural);
    setCount(newCount);
    setPhase("showing");

    timerRef.current = setTimeout(() => {
      const noun = newCount === 1 ? obj.name : obj.plural;
      speakIfEnabled(`How many ${noun} do you see?`, SPEECH_PROMPT).catch(() => {});
      
      timerRef.current = setTimeout(() => {
        setPhase("awaiting");
      }, 1000);
    }, 600);
  }, [round, speakIfEnabled]);

  const startGame = useCallback(() => {
    setStreak(0);
    setTotalCorrect(0);
    setRound(0);
    setIsNewRecord(false);
    nextRound();
  }, [nextRound]);

  const handleSelect = useCallback(
    async (num: number) => {
      if (phase !== "awaiting") return;
      setSelectedNumber(num);

      if (num === count) {
        setPhase("correct");
        const newStreak = streak + 1;
        const newTotal = totalCorrect + 1;
        setStreak(newStreak);
        setTotalCorrect(newTotal);

        const noun = count === 1 ? objectName : objectPlural;
        if (VOICE_STREAK[newStreak]) {
          await speakIfEnabled(VOICE_STREAK[newStreak], SPEECH_STREAK);
        } else {
          await speakIfEnabled(
            `${pickRandom(VOICE_CORRECT)} There ${count === 1 ? "is" : "are"} ${count} ${noun}!`,
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
          const noun = count === 1 ? objectName : objectPlural;
          await speakIfEnabled(
            `That's okay! There ${count === 1 ? "is" : "are"} ${count} ${noun}!`,
            SPEECH_COMFORT
          );
          timerRef.current = setTimeout(() => {
            nextRound();
          }, 1000);
        } else {
          setPhase("wrong");
          speakIfEnabled(pickRandom(VOICE_WRONG), SPEECH_ENCOURAGE).catch(() => {});
          timerRef.current = setTimeout(() => {
            setSelectedNumber(null);
            setPhase("awaiting");
          }, 1000);
        }
      }
    },
    [phase, count, streak, totalCorrect, attempts, objectName, objectPlural, speakIfEnabled, nextRound]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    phase,
    objectEmoji,
    objectName,
    objectPlural,
    count,
    maxNumber,
    round,
    streak,
    totalCorrect,
    attempts,
    highScore,
    isNewRecord,
    selectedNumber,
    startGame,
    handleSelect,
  };
}
