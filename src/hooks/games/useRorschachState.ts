"use client";

import { useCallback, useState } from "react";
import {
  INKBLOT_CARDS,
  ARCHETYPES,
  type InkblotCard,
  type InkblotChoice,
  type ColorTheme,
  type ArchetypeProfile,
} from "@/lib/games/rorschachData";

export interface AnswerItem {
  cardId: string;
  choice: InkblotChoice;
}

export function useRorschachState({
  speak,
  soundEnabled,
}: {
  speak: (text: string) => void;
  soundEnabled: boolean;
}) {
  const [phase, setPhase] = useState<"idle" | "playing" | "complete">("idle");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [colorTheme, setColorTheme] = useState<ColorTheme>("classic");
  const [rotation, setRotation] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const totalCards = INKBLOT_CARDS.length;
  const currentCard: InkblotCard = INKBLOT_CARDS[currentIndex] || INKBLOT_CARDS[0];

  const startGame = useCallback(() => {
    setPhase("playing");
    setCurrentIndex(0);
    setAnswers([]);
    setRotation(0);
    setIsFlipped(false);
    if (soundEnabled) {
      speak("Welcome to Rorschach Inkblot Explorer! What do you see in the first shape?");
    }
  }, [speak, soundEnabled]);

  const selectChoice = useCallback(
    (choice: InkblotChoice) => {
      if (phase !== "playing") return;

      const newAnswer: AnswerItem = {
        cardId: currentCard.id,
        choice,
      };

      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);

      if (soundEnabled) {
        speak(choice.speechText);
      }

      if (currentIndex < totalCards - 1) {
        setCurrentIndex((prev) => prev + 1);
        setRotation(0);
        setIsFlipped(false);
      } else {
        setPhase("complete");
        if (soundEnabled) {
          setTimeout(() => {
            speak("Amazing job! Your imagination report is ready!");
          }, 800);
        }
      }
    },
    [phase, currentCard, answers, currentIndex, totalCards, soundEnabled, speak]
  );

  const rotateCard = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const toggleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const getArchetype = useCallback((): ArchetypeProfile => {
    const categoryCounts: Record<string, number> = {
      nature: 0,
      sky: 0,
      fantasy: 0,
      play: 0,
      joy: 0,
      neutral: 0,
    };

    answers.forEach((ans) => {
      if (ans.choice?.category) {
        categoryCounts[ans.choice.category] = (categoryCounts[ans.choice.category] || 0) + 1;
      }
    });

    // If ALL answers are neutral, give the neutral archetype
    const nonNeutralTotal = Object.entries(categoryCounts)
      .filter(([cat]) => cat !== "neutral")
      .reduce((sum, [, count]) => sum + count, 0);

    if (nonNeutralTotal === 0) {
      return ARCHETYPES.neutral;
    }

    // Otherwise find the top non-neutral category
    let topCategory = "nature";
    let maxCount = -1;

    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (cat !== "neutral" && count > maxCount) {
        maxCount = count;
        topCategory = cat;
      }
    });

    return ARCHETYPES[topCategory] || ARCHETYPES.nature;
  }, [answers]);

  return {
    phase,
    currentIndex,
    totalCards,
    currentCard,
    answers,
    colorTheme,
    rotation,
    isFlipped,
    setColorTheme,
    startGame,
    selectChoice,
    rotateCard,
    toggleFlip,
    getArchetype,
  };
}
