import type { Metadata } from "next";
import GameClient from "@/components/games/shape-builder/GameClient";

export const metadata: Metadata = {
  title: "Shape Builder | Free Shape Learning Game for Kids — nocaputils",
  description:
    "A free, voice-driven shape recognition game for kids ages 2–5. Match shapes including circles, squares, triangles, stars, and more. No downloads, no ads, no data collection.",
  keywords:
    "shape game kids, learn shapes, toddler shape game, shape matching game, educational game, free browser game, geometry game kids, games for kids, games for toddlers, games for toddlers and little kids, learn letters, learn numbers",
  openGraph: {
    title: "Shape Builder — Free Shape Learning Game for Kids",
    description:
      "Fun shape matching game with voice guidance. 100% free, 100% private.",
    type: "website",
    url: "https://nocaputils.com/games/shape-builder",
  },
};

export default function ShapeBuilderPage() {
  return <GameClient />;
}
