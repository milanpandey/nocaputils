import type { Metadata } from "next";
import CompressPdfClient from "@/components/workplace/compress-pdf/CompressPdfClient";

export const metadata: Metadata = {
  title: "Compress PDF Files Online Free & Private | NoCapUtils",
  description: "Reduce PDF file size in your browser memory. Interactive compression slider, real-time size estimator, and quality tradeoffs. 100% free with no downloads or ads.",
};

export default function CompressPdfPage() {
  return <CompressPdfClient />;
}
