import type { Metadata } from "next";
import ArchetypeQuizClient from "@/components/personality/archetype-quiz/ArchetypeQuizClient";

export const metadata: Metadata = {
  title: "Archetype Personality Quiz — Free Psychometric Profile & Radar Chart | NoCapUtils",
  description:
    "Take the free, 100% private Archetype Personality Quiz. Discover your primary archetype (Strategist, Creator, Empath, Visionary, Realist, Catalyst) with a visual radar chart balance.",
  keywords:
    "archetype quiz, personality profile, radar chart personality, personality test, strategist archetype, creator archetype, empath archetype, visionary archetype, free psychometric test, private personality quiz",
  openGraph: {
    title: "Archetype Personality Quiz — Free & 100% Private Profile",
    description:
      "Discover your primary archetype with a visual radar chart balance. 100% browser-based, zero uploads, instant insights.",
    type: "website",
    url: "https://nocaputils.com/personality/archetype-quiz",
  },
};

export default function ArchetypeQuizPage() {
  return <ArchetypeQuizClient />;
}
