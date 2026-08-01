import type { Metadata } from "next";
import GameClient from "@/components/games/rorschach-test/GameClient";

export const metadata: Metadata = {
  title: "Rorschach Inkblot Explorer | Free Kids Browser Game — nocaputils",
  description:
    "A free, fun Rorschach Inkblot test for kids and families. Explore 5 interactive inkblots, choose what you see, and discover your perceptual imagination profile. 100% private, no ads.",
  keywords:
    "rorschach test, rorschach inkblot test, kids rorschach test, kids imagination game, inkblot game for kids, free educational games, browser games for kids, personality archetype for kids, kids creative games",
  openGraph: {
    title: "Rorschach Inkblot Explorer — Free Kids Imagination Game",
    description:
      "Explore mystery inkblots and reveal your perceptual archetype! 100% free, 100% private.",
    type: "website",
    url: "https://nocaputils.com/games/rorschach-test",
  },
};

export default function RorschachTestPage() {
  return <GameClient />;
}
