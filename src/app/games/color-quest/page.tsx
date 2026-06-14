import type { Metadata } from "next";
import GameClient from "@/components/games/color-quest/GameClient";

export const metadata: Metadata = {
  title: "Color Quest | Free Color Learning Game for Kids — nocaputils",
  description:
    "A free, voice-driven color recognition game for kids ages 2–5. Learn colors through interactive puzzles. Progressive difficulty. No downloads, no ads, no data collection.",
  keywords:
    "color learning game, kids color game, learn colors, toddler game, color recognition, educational game, free browser game, games for kids, games for toddlers, games for toddlers and little kids, learn letters, learn numbers",
  openGraph: {
    title: "Color Quest — Free Color Learning Game for Kids",
    description:
      "Voice-driven color recognition for kids. 100% free, 100% private.",
    type: "website",
    url: "https://nocaputils.com/games/color-quest",
  },
};

export default function ColorQuestPage() {
  return <GameClient />;
}
