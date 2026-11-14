import CategoryHubPage from "@/components/CategoryHubPage";
import { getToolsByCategory } from "@/lib/toolRegistry";

const tools = getToolsByCategory("creator");

export default function CreatorToolsHub() {
  return (
    <CategoryHubPage
      title="CREATOR TOOLS"
      taglineLead="Professional. Private. Powerful."
      taglineSub="No downloads · No ads · 100% browser-based"
      sectionTitle="Audio & Video Tools"
      sectionDotColor="#F2EF13"
      tools={tools}
      actionLabel="Open Tool"
      cardIdPrefix="creator-card"
      shapes={{ circleColor: "#F2EF13", rectColor: "#457B9D", showLines: true }}
    />
  );
}
