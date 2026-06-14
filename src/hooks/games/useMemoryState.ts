"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MEMORY_THEMES,
  MEMORY_GRID_SIZES,
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
  type MemoryDifficulty,
  type MemoryCard,
  type SpeechProfile,
} from "@/lib/games/gameData";

export type MemoryPhase = "idle" | "playing" | "checking" | "matched" | "complete";

interface BoardCard {
  uid: string; // unique id for this card slot
  card: MemoryCard;
  flipped: boolean;
  matched: boolean;
}

interface HighScore {
  bestMoves: number;
  bestStreak: number;
}

const LS_KEY = "mm_highscore";

function loadHighScore(): HighScore {
  if (typeof window === "undefined") return { bestMoves: 0, bestStreak: 0 };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { bestMoves: 0, bestStreak: 0 };
}

function saveHighScore(hs: HighScore) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(hs));
  } catch { /* ignore */ }
}

interface UseMemoryStateOptions {
  speak: (text: string, rate?: number, pitch?: number) => Promise<void>;
  soundEnabled: boolean;
}

export function useMemoryState({ speak, soundEnabled }: UseMemoryStateOptions) {
  const [phase, setPhase] = useState<MemoryPhase>("idle");
  const [theme, setTheme] = useState("animals");
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>("easy");
  const [board, setBoard] = useState<BoardCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [highScore, setHighScore] = useState<HighScore>({ bestMoves: 0, bestStreak: 0 });
  const [isNewRecord, setIsNewRecord] = useState(false);

  const checkTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  const buildBoard = useCallback((themeName: string, diff: MemoryDifficulty) => {
    const themeData = MEMORY_THEMES[themeName];
    const gridSize = MEMORY_GRID_SIZES[diff];
    const selectedCards = [...themeData.cards]
      .sort(() => Math.random() - 0.5)
      .slice(0, gridSize.pairs);

    // Create pairs and shuffle
    const pairs: BoardCard[] = [];
    selectedCards.forEach((card, i) => {
      pairs.push({ uid: `${card.id}-a-${i}`, card, flipped: false, matched: false });
      pairs.push({ uid: `${card.id}-b-${i}`, card, flipped: false, matched: false });
    });

    // Fisher-Yates shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    return pairs;
  }, []);

  const startGame = useCallback(async () => {
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    const newBoard = buildBoard(theme, difficulty);
    setBoard(newBoard);
    setFlippedIndices([]);
    setMoves(0);
    setStreak(0);
    setBestStreak(0);
    setMatchedPairs(0);
    setTotalPairs(MEMORY_GRID_SIZES[difficulty].pairs);
    setIsNewRecord(false);
    setPhase("playing");
    speakIfEnabled("Let's play Memory Match! Find the pairs!", SPEECH_PROMPT).catch(() => {});
  }, [theme, difficulty, buildBoard, speakIfEnabled]);

  const flipCard = useCallback(
    async (index: number) => {
      if (phase !== "playing") return;
      if (board[index].flipped || board[index].matched) return;
      if (flippedIndices.length >= 2) return;

      const newBoard = [...board];
      newBoard[index] = { ...newBoard[index], flipped: true };
      setBoard(newBoard);

      const newFlipped = [...flippedIndices, index];
      setFlippedIndices(newFlipped);

      if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        const [first, second] = newFlipped;
        const isMatch = newBoard[first].card.id === newBoard[second].card.id;

        if (isMatch) {
          // Match found!
          setPhase("checking");
          
          const matchedBoard = [...newBoard];
          matchedBoard[first] = { ...matchedBoard[first], matched: true };
          matchedBoard[second] = { ...matchedBoard[second], matched: true };
          setBoard(matchedBoard);
          setFlippedIndices([]);

          const newMatched = matchedPairs + 1;
          setMatchedPairs(newMatched);
          const newStreak = streak + 1;
          setStreak(newStreak);
          const newBest = Math.max(bestStreak, newStreak);
          setBestStreak(newBest);

          const cardName = newBoard[first].card.name;
          if (VOICE_STREAK[newStreak]) {
            await speakIfEnabled(VOICE_STREAK[newStreak], SPEECH_STREAK);
          } else {
            await speakIfEnabled(
              `You found the ${cardName}! ${pickRandom(VOICE_CORRECT)}`,
              SPEECH_CELEBRATE
            );
          }

          if (newMatched >= totalPairs) {
            // Game complete!
            setPhase("complete");
            const currentHS = loadHighScore();
            const currentMoves = moves + 1; // include this move
            let isRecord = false;
            if (currentHS.bestMoves === 0 || currentMoves < currentHS.bestMoves || newBest > currentHS.bestStreak) {
              const updated = {
                bestMoves: currentHS.bestMoves === 0 ? currentMoves : Math.min(currentMoves, currentHS.bestMoves),
                bestStreak: Math.max(newBest, currentHS.bestStreak),
              };
              saveHighScore(updated);
              setHighScore(updated);
              if (currentHS.bestMoves > 0 && currentMoves < currentHS.bestMoves) {
                isRecord = true;
                setIsNewRecord(true);
              }
            }
            setTimeout(async () => {
              await speakIfEnabled(
                isRecord
                  ? VOICE_NEW_RECORD
                  : `Amazing! You found all the pairs in ${currentMoves} moves!`,
                isRecord ? SPEECH_RECORD : SPEECH_CELEBRATE
              );
            }, 600);
          } else {
            setPhase("playing");
          }
        } else {
          // No match
          setPhase("checking");
          setStreak(0);
          speakIfEnabled(pickRandom(VOICE_WRONG), SPEECH_ENCOURAGE).catch(() => {});
          checkTimerRef.current = setTimeout(() => {
            const resetBoard = [...newBoard];
            resetBoard[first] = { ...resetBoard[first], flipped: false };
            resetBoard[second] = { ...resetBoard[second], flipped: false };
            setBoard(resetBoard);
            setFlippedIndices([]);
            setPhase("playing");
          }, 400);
        }
      }
    },
    [phase, board, flippedIndices, moves, matchedPairs, totalPairs, streak, bestStreak, speakIfEnabled]
  );

  useEffect(() => {
    return () => {
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    };
  }, []);

  return {
    phase,
    theme,
    difficulty,
    board,
    moves,
    streak,
    matchedPairs,
    totalPairs,
    highScore,
    isNewRecord,
    setTheme,
    setDifficulty,
    startGame,
    flipCard,
  };
}
