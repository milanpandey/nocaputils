import type { Metadata } from "next";
import DiffComparatorClient from "@/components/developer/diff-comparator/DiffComparatorClient";

export const metadata: Metadata = {
  title: "Text Diff & Compare Tool — Side-by-Side Online Diff | NoCapUtils",
  description:
    "Compare two texts side-by-side with line-level and character-level diff highlighting. Unified and split views, whitespace trimming — 100% in-browser, private.",
};

export default function DiffComparatorPage() {
  return <DiffComparatorClient />;
}
