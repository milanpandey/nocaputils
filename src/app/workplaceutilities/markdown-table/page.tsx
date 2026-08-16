import type { Metadata } from "next";
import MarkdownTableClient from "@/components/workplace/markdown-table/MarkdownTableClient";

export const metadata: Metadata = {
  title: "Markdown Table Generator — Free | NoCapUtils",
  description:
    "Build GitHub-Flavored Markdown tables visually. Add rows and columns, set alignment, import CSV, and copy the raw Markdown output instantly.",
};

export default function MarkdownTablePage() {
  return <MarkdownTableClient />;
}
