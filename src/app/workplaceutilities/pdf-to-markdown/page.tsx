import type { Metadata } from "next";
import PdfToMarkdownClient from "@/components/workplace/pdf-to-markdown/PdfToMarkdownClient";

export const metadata: Metadata = {
  title: "PDF to Markdown Converter — Free & Private | NoCapUtils",
  description:
    "Convert text-based PDFs to clean Markdown with headings, tables, and formatting preserved. 100% local — no file uploads, no server, runs in your browser.",
};

export default function PdfToMarkdownPage() {
  return <PdfToMarkdownClient />;
}
