import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Games | nocaputils — Free Browser-Based Learning Games",
  description:
    "Fun, free educational games for kids and everyone. Play directly in your browser — no downloads, no ads, no data collection. 100% private.",
  keywords:
    "free kids games, educational games, toddler learning games, browser games, letter recognition, keyboard learning, free online games, learning games for toddlers, games for kids, games for toddlers and little kids, learn letters, learn numbers",
  openGraph: {
    title: "Games | nocaputils",
    description:
      "Fun, free educational browser games. No downloads, no ads, no data collection.",
    type: "website",
    url: "https://nocaputils.com/games",
  },
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
