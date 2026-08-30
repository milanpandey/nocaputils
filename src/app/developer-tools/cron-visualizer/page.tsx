import type { Metadata } from "next";
import CronVisualizerClient from "@/components/developer/cron-visualizer/CronVisualizerClient";

export const metadata: Metadata = {
  title: "Cron Expression Visualizer & Generator — Free Online Tool | NoCapUtils",
  description:
    "Build, visualize, and validate cron expressions interactively. Plain-English translations, next 10 execution times, and quick presets — 100% in-browser.",
};

export default function CronVisualizerPage() {
  return <CronVisualizerClient />;
}
