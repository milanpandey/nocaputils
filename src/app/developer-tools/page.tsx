import type { Metadata } from "next";
import CategoryHubPage from "@/components/CategoryHubPage";
import { getToolsByCategory } from "@/lib/toolRegistry";

export const metadata: Metadata = {
  title: "Free Developer & Privacy Tools — JWT, Cron, Regex, Diff, Hash | NoCapUtils",
  description:
    "Private, in-browser developer utilities: JWT decoder, cron expression visualizer, regex tester, text diff comparator, and hash/Base64 studio. Zero server uploads, 100% client-side.",
};

const tools = getToolsByCategory("developer");

export default function DeveloperToolsHub() {
  return (
    <CategoryHubPage
      title="DEVELOPER TOOLS"
      titleFontSize="clamp(2.5rem, 8vw, 5.5rem)"
      taglineLead="Private. Zero-Upload. Client-Side."
      taglineSub="Decode tokens, build cron jobs, test regex, diff text & hash data — all in your browser"
      sectionTitle="Developer & Privacy Utilities"
      sectionDotColor="#3B82F6"
      tools={tools}
      actionLabel="Open Tool"
      cardIdPrefix="dev-card"
      useToolColorForAction
      centerHero
      shapes={{
        rectColor: "#3B82F6",
        circleColor: "#2563EB",
        triColor: "#BFDBFE",
        showLines: false,
        rectFirst: true,
      }}
    />
  );
}
