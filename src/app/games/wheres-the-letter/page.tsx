import type { Metadata } from "next";
import GameClient from "@/components/games/wheres-the-letter/GameClient";

export const metadata: Metadata = {
  title: "Where's the Letter? | Free Toddler Keyboard Learning Game — nocaputils",
  description:
    "A free, voice-driven educational game for toddlers ages 2–6. Teaches letter recognition, number recognition, and keyboard skills through playful interaction. No downloads, no ads, no data collection.",
  keywords:
    "where's the letter, toddler keyboard game, letter recognition game, phonics game, kids typing game, educational game toddlers, learn alphabet game, free learning game, keyboard learning kids, number recognition game, games for kids, games for toddlers, games for toddlers and little kids, learn letters, learn numbers",
  openGraph: {
    title: "Where's the Letter? — Free Toddler Learning Game",
    description:
      "Voice-driven letter & number recognition for kids. 100% free, 100% private.",
    type: "website",
    url: "https://nocaputils.com/games/wheres-the-letter",
  },
};

export default function WheresTheLetterPage() {
  return <GameClient />;
}
