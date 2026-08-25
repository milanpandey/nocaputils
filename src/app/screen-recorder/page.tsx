import type { Metadata } from "next";
import ScreenRecorderClient from "@/components/screen-recorder/ScreenRecorderClient";

export const metadata: Metadata = {
  title: "Free Screen Recorder — No Watermark, No Time Limit | nocaputils",
  description:
    "Record your screen, window, or browser tab with optional webcam overlay and microphone audio. 100% private, zero uploads, no watermarks, no time limits. Download as WebM.",
  keywords: "screen recorder, free screen recorder, no watermark, browser screen recorder, webcam recorder, private screen recording, nocaputils",
  openGraph: {
    title: "Free Screen Recorder — No Watermark, No Time Limit | nocaputils",
    description: "Record your screen with webcam overlay and microphone — free, private, no watermarks.",
    type: "website",
    url: "https://nocaputils.com/screen-recorder",
  },
};

export default function ScreenRecorderPage() {
  return <ScreenRecorderClient />;
}
