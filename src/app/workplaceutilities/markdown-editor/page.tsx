import type { Metadata } from "next";
import MarkdownEditorClient from "@/components/workplace/markdown-editor/MarkdownEditorClient";

export const metadata: Metadata = {
  title: "Markdown Editor & Live Preview — Free | NoCapUtils",
  description:
    "Write and preview Markdown in a split-pane editor. Import .md files, format with toolbar shortcuts, export as Markdown or HTML. Fully offline, nothing leaves your browser.",
};

export default function MarkdownEditorPage() {
  return <MarkdownEditorClient />;
}
