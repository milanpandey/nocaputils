import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personality Tests | nocaputils — Free Browser-Based Personality Explorer",
  description:
    "Fun, free, private personality tests. Explore inkblots, perceptual archetypes, and self-discovery tools directly in your browser — no downloads, no ads, no data collection. 100% private.",
  keywords:
    "free personality test, rorschach test, inkblot test, online personality test, perceptual archetype, personality quiz, browser personality test, private personality test",
  openGraph: {
    title: "Personality Tests | nocaputils",
    description:
      "Explore free, private personality tests in your browser. No downloads, no ads, no data collection.",
    type: "website",
    url: "https://nocaputils.com/personality",
  },
};

export default function PersonalityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
