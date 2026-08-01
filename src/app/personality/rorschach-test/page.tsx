import type { Metadata } from "next";
import GameClient from "@/components/games/rorschach-test/GameClient";

export const metadata: Metadata = {
  title: "Rorschach Inkblot Explorer | Free Personality Test — nocaputils",
  description:
    "A free, fun Rorschach Inkblot test. Explore 5 interactive inkblots, choose what you see, and discover your perceptual imagination profile. 100% private, no ads.",
  keywords:
    "rorschach test, rorschach inkblot test, personality test, free personality test, inkblot game, online rorschach test, perceptual archetype, browser personality test",
  openGraph: {
    title: "Rorschach Inkblot Explorer — Free Personality Test",
    description:
      "Explore mystery inkblots and reveal your perceptual archetype! 100% free, 100% private.",
    type: "website",
    url: "https://nocaputils.com/personality/rorschach-test",
  },
};

export default function RorschachTestPage() {
  return <GameClient />;
}
