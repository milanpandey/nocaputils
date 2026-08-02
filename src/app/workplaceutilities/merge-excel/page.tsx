import type { Metadata } from "next";
import MergeExcelClient from "@/components/workplace/merge-excel/MergeExcelClient";

export const metadata: Metadata = {
  title: "Merge Excel Files Online Free & Private | NoCapUtils",
  description: "Combine up to 5 Excel (.xlsx, .xls) and CSV files into a multi-tab master workbook in your browser memory. Serial sheet ordering, tab count stats, and format export options. 100% free with no downloads or ads.",
};

export default function MergeExcelPage() {
  return <MergeExcelClient />;
}
