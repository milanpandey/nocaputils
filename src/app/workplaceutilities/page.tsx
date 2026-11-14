import CategoryHubPage from "@/components/CategoryHubPage";
import { getToolsByCategory } from "@/lib/toolRegistry";

const tools = getToolsByCategory("workplace");

export default function WorkplaceUtilitiesHub() {
  return (
    <CategoryHubPage
      title="WORKPLACE UTILITIES"
      titleFontSize="clamp(2.5rem, 8vw, 5.5rem)"
      taglineLead="Free. Private. Productive."
      taglineSub="No downloads · No ads · 100% browser-based"
      sectionTitle="Workplace Tools"
      sectionDotColor="#2A9D8F"
      tools={tools}
      actionLabel="Open Tool"
      cardIdPrefix="workplace-card"
      useToolColorForAction
      centerHero
      shapes={{
        rectColor: "#457B9D",
        circleColor: "#E63946",
        triColor: "#F4D35E",
        showLines: false,
        rectFirst: true,
      }}
    />
  );
}
