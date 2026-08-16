import type { Metadata } from "next";
import MarkdownToPdfClient from "@/components/workplace/markdown-to-pdf/MarkdownToPdfClient";

export const metadata: Metadata = {
  title: "Markdown to PDF Converter — Free & Private | NoCapUtils",
  description:
    "Convert any Markdown file or text to a styled, print-ready PDF directly in your browser. Choose paper size and theme. Zero server uploads.",
};

export default function MarkdownToPdfPage() {
  return <MarkdownToPdfClient />;
}
