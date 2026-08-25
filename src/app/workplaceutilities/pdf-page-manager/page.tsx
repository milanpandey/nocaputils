import type { Metadata } from "next";
import PdfPageManagerClient from "@/components/workplace/pdf-page-manager/PdfPageManagerClient";

export const metadata: Metadata = {
  title: "PDF Page Manager — Split, Rotate, Reorder & Delete | nocaputils",
  description:
    "Visually reorder, rotate, delete, or split individual pages from any PDF document. Generate a modified PDF or export pages as individual files in a ZIP. 100% private, zero server uploads.",
  keywords: "pdf page manager, split pdf, rotate pdf, reorder pdf pages, delete pdf pages, pdf editor, browser pdf tool, nocaputils",
  openGraph: {
    title: "PDF Page Manager — Split, Rotate, Reorder & Delete | nocaputils",
    description: "Visually manage PDF pages: reorder, rotate, delete, or split — all offline in your browser.",
    type: "website",
    url: "https://nocaputils.com/workplaceutilities/pdf-page-manager",
  },
};

export default function PdfPageManagerPage() {
  return <PdfPageManagerClient />;
}
