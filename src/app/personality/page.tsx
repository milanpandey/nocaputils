import CategoryHubPage from "@/components/CategoryHubPage";
import { getToolsByCategory } from "@/lib/toolRegistry";

const tests = getToolsByCategory("personality");

export default function PersonalityHub() {
  return (
    <CategoryHubPage
      title="PERSONALITY TESTS"
      titleFontSize="clamp(3rem, 9vw, 6.5rem)"
      taglineLead="Free. Private. Insightful."
      taglineSub="No downloads · No ads · 100% browser-based"
      sectionTitle="Take Test"
      sectionDotColor="#9C27B0"
      tools={tests}
      actionLabel="Take Test"
      cardIdPrefix="test-card"
      useToolColorForAction
      shapes={{
        circleColor: "#9C27B0",
        rectColor: "#2A9D8F",
        triColor: "#F77F00",
        showLines: true,
      }}
    />
  );
}
