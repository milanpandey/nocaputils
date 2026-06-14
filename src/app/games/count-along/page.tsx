import type { Metadata } from "next";
import GameClient from "@/components/games/count-along/GameClient";

export const metadata: Metadata = {
  title: "Count Along | Free Counting Game for Kids — nocaputils",
  description:
    "A free, voice-driven counting game for kids ages 2–6. Count objects and tap the right number. Progressive difficulty from 1–3 up to 1–10. No downloads, no ads, no data collection.",
  keywords:
    "counting game kids, learn to count, toddler counting, number learning game, educational game, free browser game, math game toddlers, games for kids, games for toddlers, games for toddlers and little kids, learn letters, learn numbers",
  openGraph: {
    title: "Count Along — Free Counting Game for Kids",
    description:
      "Fun counting game with voice guidance. 100% free, 100% private.",
    type: "website",
    url: "https://nocaputils.com/games/count-along",
  },
};

export default function CountAlongPage() {
  return <GameClient />;
}
