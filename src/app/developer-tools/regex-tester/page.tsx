import type { Metadata } from "next";
import RegexTesterClient from "@/components/developer/regex-tester/RegexTesterClient";

export const metadata: Metadata = {
  title: "Regex Tester & Cheat Sheet — Free Online Regular Expression Tool | NoCapUtils",
  description:
    "Test regular expressions in real-time with syntax-highlighted matches, capture group breakdown, and a built-in cheat sheet. 100% private, in-browser.",
};

export default function RegexTesterPage() {
  return <RegexTesterClient />;
}
