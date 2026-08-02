import type { Metadata } from "next";
import ArchiveFilesClient from "@/components/workplace/archive-files/ArchiveFilesClient";

export const metadata: Metadata = {
  title: "Create ZIP Archives Online Free & Private | NoCapUtils",
  description: "Package up to 10 files into a standard ZIP archive in your browser memory with zero quality loss. Compression levels, size estimators, and OS email compatibility. 100% free with no downloads or ads.",
};

export default function ArchiveFilesPage() {
  return <ArchiveFilesClient />;
}
