import type { Metadata } from "next";
import ColorQuestClient from "@/components/games/color-quest/GameClient";

export const metadata: Metadata = {
  title: "Color Quest | nocaputils",
  description:
    "Discover your true personality color in this fun, quick, 100% private mini-adventure!",
  keywords: "color quest, personality test, kids mbti, fun quiz, nocaputils",
  openGraph: {
    title: "Color Quest | nocaputils",
    description: "Discover your true personality color in this fun mini-adventure!",
    type: "website",
    url: "https://nocaputils.com/personality/color-quest",
  },
};

export default function ColorQuestPage() {
  return <ColorQuestClient />;
}
