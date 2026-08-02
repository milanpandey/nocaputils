import type { Metadata } from "next";
import FileBillsClient from "@/components/workplace/file-bills/FileBillsClient";

export const metadata: Metadata = {
  title: "File Bills - Receipt Organizer & Ledger | nocaputils",
  description:
    "Organize receipts into a compiled printable PDF and Excel summary ledger. 100% private in-browser receipt processing.",
  keywords: "file bills, receipt organizer, expense ledger, receipt to pdf, receipt to excel, nocaputils",
  openGraph: {
    title: "File Bills - Receipt Organizer & Ledger | nocaputils",
    description: "Organize up to 10 receipts into a compiled PDF and Excel tabular summary offline.",
    type: "website",
    url: "https://nocaputils.com/workplaceutilities/file-bills",
  },
};

export default function FileBillsPage() {
  return <FileBillsClient />;
}
