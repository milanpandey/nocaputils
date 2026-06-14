import type { Metadata } from "next";
import GameClient from "@/components/games/memory-match/GameClient";

export const metadata: Metadata = {
  title: "Memory Match | Free Card Matching Game for Kids — nocaputils",
  description:
    "A free, fun memory card game for kids ages 2–6. Match emoji pairs across animals, food, and vehicle themes. Three difficulty levels. No downloads, no ads, no data collection.",
  keywords:
    "memory match game, card matching game, kids memory game, toddler matching game, educational game, free browser game, emoji memory game, games for kids, games for toddlers, games for toddlers and little kids, learn letters, learn numbers",
  openGraph: {
    title: "Memory Match — Free Card Matching Game for Kids",
    description:
      "Fun emoji memory game with themes and difficulty levels. 100% free, 100% private.",
    type: "website",
    url: "https://nocaputils.com/games/memory-match",
  },
};

export default function MemoryMatchPage() {
  return <GameClient />;
}
