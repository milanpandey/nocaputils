import type { Metadata } from "next";
import GameClient from "@/components/games/sound-safari/GameClient";

export const metadata: Metadata = {
  title: "Sound Safari | Free Animal Sound Game for Kids — nocaputils",
  description:
    "A free, voice-driven animal sound matching game for kids ages 2–5. Listen to animal sounds and find the right animal. No downloads, no ads, no data collection.",
  keywords:
    "animal sound game, kids animal game, learn animal sounds, toddler game, educational game, free browser game, animal matching game, games for kids, games for toddlers, games for toddlers and little kids, learn letters, learn numbers",
  openGraph: {
    title: "Sound Safari — Free Animal Sound Game for Kids",
    description:
      "Match animal sounds to animals. 100% free, 100% private.",
    type: "website",
    url: "https://nocaputils.com/games/sound-safari",
  },
};

export default function SoundSafariPage() {
  return <GameClient />;
}
