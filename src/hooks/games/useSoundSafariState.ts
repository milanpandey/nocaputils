"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ANIMAL_SOUNDS,
  VOICE_CORRECT,
  VOICE_WRONG,
  VOICE_STREAK,
  VOICE_NEW_RECORD,
  pickRandom,
  SPEECH_CELEBRATE,
  SPEECH_ENCOURAGE,
  SPEECH_STREAK,
  SPEECH_RECORD,
  SPEECH_COMFORT,
  SPEECH_PROMPT,
  type AnimalSound,
  type SpeechProfile,
} from "@/lib/games/gameData";

export type SafariPhase = "idle" | "playing-sound" | "prompting" | "awaiting" | "correct" | "wrong" | "failed";

interface HighScore {
  streak: number;
  total: number;
}

const LS_KEY = "ss_highscore";

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

interface UseSoundSafariStateOptions {
  speak: (text: string, rate?: number, pitch?: number) => Promise<void>;
  soundEnabled: boolean;
}

export function useSoundSafariState({ speak, soundEnabled }: UseSoundSafariStateOptions) {
  const [phase, setPhase] = useState<SafariPhase>("idle");
  const [choices, setChoices] = useState<AnimalSound[]>([]);
  const [targetAnimal, setTargetAnimal] = useState<AnimalSound | null>(null);
  const [round, setRound] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [highScore, setHighScore] = useState<HighScore>({ streak: 0, total: 0 });
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recentTargetsRef = useRef<string[]>([]);

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

  const speakAnimalSound = useCallback(
    (animal: AnimalSound): Promise<void> => {
      return new Promise((resolve) => {
        if (!soundEnabled) return resolve();
        
        try {
          if (currentAudioRef.current) {
            currentAudioRef.current.pause();
          }
          const audio = new Audio(animal.audioFile);
          currentAudioRef.current = audio;
          audio.onended = () => {
            currentAudioRef.current = null;
            resolve();
          };
          audio.onerror = () => {
            currentAudioRef.current = null;
            speak(animal.sound, 1.0, 1.0)?.then(resolve);
          };
          audio.play().catch((e) => {
            console.error("Audio play failed:", e);
            currentAudioRef.current = null;
            speak(animal.sound, 1.0, 1.0)?.then(resolve);
          });
        } catch (e) {
          console.error("Audio creation failed:", e);
          speak(animal.sound, 1.0, 1.0)?.then(resolve);
        }
      });
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

    // Progressive difficulty: 3 choices → 4 → 5
    const numChoices = Math.min(3 + Math.floor(newRound / 4), 5);

    // Pick a target that isn't in recent history
    let validTargets = ANIMAL_SOUNDS.filter(a => !recentTargetsRef.current.includes(a.id));
    if (validTargets.length === 0) validTargets = ANIMAL_SOUNDS;
    const target = pickRandom(validTargets);

    // Keep history of last 12 targets to prevent repetition
    recentTargetsRef.current = [target.id, ...recentTargetsRef.current].slice(0, 12);

    // Build choices: include target + random others
    const otherAnimals = [...ANIMAL_SOUNDS]
      .filter(a => a.id !== target.id)
      .sort(() => Math.random() - 0.5);
    
    const selected = [target, ...otherAnimals.slice(0, numChoices - 1)]
      .sort(() => Math.random() - 0.5);

    setChoices(selected);
    setTargetAnimal(target);
    setPhase("playing-sound");

    // Play the animal sound after a brief pause
    timerRef.current = setTimeout(() => {
      setTargetAnimal(target);
      setPhase("prompting");
      speakIfEnabled(`Which animal makes this sound?`, SPEECH_PROMPT).catch(() => {});
      
      timerRef.current = setTimeout(() => {
        // Let user guess immediately
        setPhase("awaiting");
        
        // Play animal sound without awaiting
        speakAnimalSound(target).catch(() => {});
      }, 1000);
    }, 600);
  }, [round, speakAnimalSound, speakIfEnabled]);

  const replaySound = useCallback(() => {
    if (targetAnimal && (phase === "awaiting" || phase === "wrong")) {
      speakAnimalSound(targetAnimal);
    }
  }, [targetAnimal, phase, speakAnimalSound]);

  const startGame = useCallback(() => {
    setStreak(0);
    setTotalCorrect(0);
    setRound(0);
    setIsNewRecord(false);
    recentTargetsRef.current = [];
    nextRound();
  }, [nextRound]);

  const handleSelect = useCallback(
    async (animalId: string) => {
      if (phase !== "awaiting") return;
      setSelectedId(animalId);
      
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      if (targetAnimal && animalId === targetAnimal.id) {
        setPhase("correct");
        const newStreak = streak + 1;
        const newTotal = totalCorrect + 1;
        setStreak(newStreak);
        setTotalCorrect(newTotal);

        if (VOICE_STREAK[newStreak]) {
          await speakIfEnabled(VOICE_STREAK[newStreak], SPEECH_STREAK);
        } else {
          await speakIfEnabled(
            `${pickRandom(VOICE_CORRECT)} The ${targetAnimal.name} says ${targetAnimal.sound}`,
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
            `That's okay! That was the ${targetAnimal?.name}! The ${targetAnimal?.name} says ${targetAnimal?.sound}`,
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
    [phase, targetAnimal, streak, totalCorrect, attempts, speakIfEnabled, nextRound]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  return {
    phase,
    choices,
    targetAnimal,
    round,
    streak,
    totalCorrect,
    attempts,
    highScore,
    isNewRecord,
    selectedId,
    startGame,
    handleSelect,
    replaySound,
  };
}
