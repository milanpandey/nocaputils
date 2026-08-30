import type { Metadata } from "next";
import ReactionTimerClient from "@/components/personality/reaction-timer/ReactionTimerClient";

export const metadata: Metadata = {
  title: "Reaction Time Tester — Millisecond Visual & Auditory Reflex Benchmark | NoCapUtils",
  description:
    "Test your visual, auditory, and selective reflexes with millisecond precision in your browser. Benchmark against global human percentiles with zero server latency.",
  keywords:
    "reaction time test, reaction timer, reflex test, reflex benchmark, visual reaction time, audio reaction test, go nogo test, gaming reflexes, millisecond reflex test",
  openGraph: {
    title: "Reaction Time Tester — Benchmark Your Reflexes Online",
    description:
      "Test visual, audio, and choice reflexes with millisecond precision. 100% in-browser, no lag, zero server uploads.",
    type: "website",
    url: "https://nocaputils.com/personality/reaction-timer",
  },
};

export default function ReactionTimerPage() {
  return <ReactionTimerClient />;
}
