import type { Metadata } from "next";
import PdfToWordClient from "@/components/workplace/pdf-to-word/PdfToWordClient";

export const metadata: Metadata = {
  title: "PDF to Word Converter | nocaputils",
  description:
    "Convert PDF documents to editable Microsoft Word (.docx) files completely offline in your browser. 100% private, zero server uploads.",
  keywords: "pdf to word, pdf converter, docx, browser pdf converter, private pdf tool, nocaputils",
  openGraph: {
    title: "PDF to Word Converter | nocaputils",
    description: "Convert PDF documents to editable Microsoft Word files offline in your browser.",
    type: "website",
    url: "https://nocaputils.com/workplaceutilities/pdf-to-word",
  },
};

export default function PdfToWordPage() {
  return <PdfToWordClient />;
}
