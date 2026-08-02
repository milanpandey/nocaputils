import type { Metadata } from "next";
import PdfMergeClient from "@/components/workplace/pdf-merge/PdfMergeClient";

export const metadata: Metadata = {
  title: "Merge PDF Files Free & Private Online | NoCapUtils",
  description: "Combine up to 5 PDF files into a single document in your browser memory. Interactive reordering, page preview, and size compression tradeoffs. 100% free with no downloads or ads.",
};

export default function PdfMergePage() {
  return <PdfMergeClient />;
}
