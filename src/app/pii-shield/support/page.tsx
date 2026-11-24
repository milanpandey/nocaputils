import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { PII_SHIELD_PRIVACY_URL, PII_SHIELD_SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "PII Shield Support & Help | nocaputils",
  description:
    "Support, system requirements, troubleshooting, and contact details for PII Shield on macOS and Windows.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://nocaputils.com/pii-shield/support",
  },
};

export default function PiiShieldSupportPage() {
  const troubleshooting = [
    {
      q: "How do I verify that PDF redactions cannot be copied or recovered?",
      a: "PII Shield for macOS rasterizes redacted PDF pages at 200 DPI and strips PDF author/creator metadata instead of drawing overlay annotations. Underlying selectable text vectors are completely removed.",
    },
    {
      q: "Are image EXIF and GPS tags removed on export?",
      a: "Yes. Exported images are re-encoded cleanly without EXIF camera/owner tags or GPS coordinates.",
    },
    {
      q: "How do I test detection without opening my own confidential files?",
      a: "On macOS, click Try a Sample Document on the Home screen or choose File → Open Sample Document from the menu bar to scan a built-in synthetic contract.",
    },
    {
      q: "How do I clear my redaction history?",
      a: "Open History in the sidebar and click Clear History. This removes local audit entries without deleting your exported redacted files.",
    },
    {
      q: "What happens if I moved an exported file and click Reveal in Finder?",
      a: "History keeps a local audit entry of past exports. Reveal in Finder highlights the output file if it remains at its saved path; if the file was moved or deleted, you can inspect or clear the history log as needed.",
    },
    {
      q: "How are purchases, refunds, and updates handled?",
      a: "macOS builds will be distributed exclusively through the Mac App Store (Apple handles licensing, Family Sharing, and updates). Windows builds are distributed through the Microsoft Store.",
    },
  ];

  return (
    <div className="subtle-pattern min-h-screen">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-6 pb-12 pt-8 md:px-10 md:pt-12">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/pii-shield"
              className="neo-button neo-button-theme flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] transition-all"
            >
              <span aria-hidden="true">&larr;</span> Back to PII Shield
            </Link>
            <Link
              href={PII_SHIELD_PRIVACY_URL}
              className="neo-button neo-button-theme hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] transition-all"
            >
              Privacy Policy
            </Link>
          </div>
          <ThemeToggle />
        </header>

        <main className="space-y-8">
          <section className="neo-panel bg-[var(--bg-panel)] p-8 md:p-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="border-2 border-[var(--border-main)] bg-[var(--accent)] px-3 py-1 text-xs font-black uppercase tracking-wider text-black">
                Official App Support
              </span>
              <span className="border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] px-3 py-1 text-xs font-black uppercase tracking-wider text-[var(--text-main)]">
                100% Offline Architecture
              </span>
            </div>

            <h1 className="mb-3 text-3xl font-black uppercase tracking-tight text-[var(--text-main)] md:text-5xl">
              PII Shield Support
            </h1>
            <p className="mb-6 max-w-2xl text-sm leading-relaxed text-[var(--text-soft)] md:text-base">
              Need help with document redaction, supported file types, or troubleshooting? Reach us directly by email and check the system requirements and FAQs below.
            </p>

            <div className="border-4 border-[var(--border-main)] bg-[var(--bg-panel-muted)] p-6">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]">
                Direct Support Email
              </h2>
              <p className="mt-2">
                <a
                  href={`mailto:${PII_SHIELD_SUPPORT_EMAIL}?subject=PII%20Shield%20Support`}
                  className="text-lg font-black text-[var(--text-main)] underline decoration-[#2A9D8F] sm:text-xl"
                >
                  {PII_SHIELD_SUPPORT_EMAIL}
                </a>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-soft)]">
                When contacting support, please include your operating system version (macOS or Windows), app version, file extension (e.g., <code className="font-mono">.pdf</code>, <code className="font-mono">.docx</code>), and steps to reproduce. <strong>Never attach confidential documents containing real personal data.</strong>
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="neo-panel bg-[var(--bg-panel)] p-6">
              <div className="mb-2 inline-block border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--text-main)]">
                macOS (Coming Soon &bull; In Dev)
              </div>
              <h2 className="mb-3 text-xl font-black uppercase text-[var(--text-main)]">
                macOS Requirements
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--text-soft)]">
                <li><strong>Hardware:</strong> Apple Silicon Mac (M1 or newer)</li>
                <li><strong>OS:</strong> macOS 26.0 (Tahoe) or later</li>
                <li><strong>AI &amp; OCR:</strong> Built-in GLiNER FP16 ONNX + Apple Vision OCR</li>
                <li><strong>Network:</strong> Zero network access required (sandboxed offline)</li>
              </ul>
            </div>

            <div className="neo-panel bg-[var(--bg-panel)] p-6">
              <div className="mb-2 inline-block border-2 border-[var(--border-main)] bg-[#2A9D8F] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                Windows (Live on Microsoft Store)
              </div>
              <h2 className="mb-3 text-xl font-black uppercase text-[var(--text-main)]">
                Windows Requirements
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--text-soft)]">
                <li><strong>Hardware:</strong> x64 PC (4 GB RAM minimum, 8 GB recommended)</li>
                <li><strong>OS:</strong> Windows 10 (1809+) or Windows 11</li>
                <li><strong>AI &amp; OCR:</strong> Local GLiNER ONNX + EasyOCR</li>
                <li><strong>Network:</strong> Zero cloud uploads; offline processing</li>
              </ul>
            </div>
          </section>

          <section className="neo-panel bg-[var(--bg-panel)] p-6 md:p-8">
            <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-[var(--text-main)]">
              Supported Formats &amp; Quick Start
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-[var(--text-soft)]">
              PII Shield supports <strong>PDF</strong> (<code className="font-mono">.pdf</code>),{" "}
              <strong>Word</strong> (<code className="font-mono">.docx</code>),{" "}
              <strong>Excel &amp; Delimited Text</strong> (<code className="font-mono">.xlsx</code>,{" "}
              <code className="font-mono">.csv</code>, <code className="font-mono">.tsv</code>,{" "}
              <code className="font-mono">.txt</code>), and <strong>Images</strong> (<code className="font-mono">.png</code>,{" "}
              <code className="font-mono">.jpg</code>, <code className="font-mono">.tiff</code>,{" "}
              <code className="font-mono">.bmp</code>, <code className="font-mono">.heic</code> on macOS).
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-soft)]">
              <li>Open a file by dragging it onto the Home drop zone or pressing <code className="font-mono">&#8984;O</code> (macOS) / selecting Browse.</li>
              <li>Review detected entities, toggle items to include or skip, and pick a redaction mode (<strong>Solid Block</strong>, <strong>Partial Mask</strong>, <strong>Entity Tag</strong>, or <strong>Smart Pseudonym</strong>).</li>
              <li>Preview the rendered output and save your redacted copy to disk.</li>
            </ol>
          </section>

          <section className="neo-panel bg-[var(--bg-panel)] p-6 md:p-8">
            <h2 className="mb-6 text-2xl font-black uppercase tracking-tight text-[var(--text-main)]">
              Troubleshooting &amp; FAQ
            </h2>
            <div className="space-y-4">
              {troubleshooting.map((item) => (
                <div
                  key={item.q}
                  className="border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] p-5"
                >
                  <h3 className="text-sm font-black uppercase text-[var(--text-main)] md:text-base">
                    {item.q}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-soft)] md:text-sm">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
