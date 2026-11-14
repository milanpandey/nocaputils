import CategoryHubPage from "@/components/CategoryHubPage";
import { getToolsByCategory } from "@/lib/toolRegistry";

const games = getToolsByCategory("games");

export default function GamesHub() {
  return (
    <CategoryHubPage
      title="GAMES"
      taglineLead="Free. Private. Fun."
      taglineSub="No downloads · No ads · 100% browser-based"
      sectionTitle="Play Now"
      sectionDotColor="#E63946"
      tools={games}
      actionLabel="Play Now"
      cardIdPrefix="game-card"
      shapes={{ showLines: true }}
    />
  );
}
