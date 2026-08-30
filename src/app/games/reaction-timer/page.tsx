import type { Metadata } from "next";
import ReactionTimerClient from "@/components/personality/reaction-timer/ReactionTimerClient";

export const metadata: Metadata = {
  title: "Reaction Time Reflex Game — Fun Kids & Family Reflex Tester | NoCapUtils",
  description:
    "Test your reflexes in this fast-paced visual and audio reaction game! Watch for green lights, dodge trick yellow decoys, and benchmark your speed against family and friends. 100% free and private.",
  keywords:
    "reaction time game, reflex game for kids, speed reflex game, test reaction speed, tap game, visual reflex game, kids learning games, free online games",
  openGraph: {
    title: "Reaction Time Reflex Game — Free Online Reflex Tester",
    description:
      "Fast-paced visual & audio reflex game. Test your reaction speed with zero lag!",
    type: "website",
    url: "https://nocaputils.com/games/reaction-timer",
  },
};

export default function ReactionTimerGamePage() {
  return <ReactionTimerClient backHref="/games" backLabel="Games" />;
}
