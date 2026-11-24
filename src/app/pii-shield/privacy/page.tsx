import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { PII_SHIELD_SUPPORT_EMAIL, PII_SHIELD_SUPPORT_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "PII Shield Privacy Policy | nocaputils",
  description:
    "Privacy Policy for PII Shield on macOS and Windows. 100% offline, zero data collection, sandboxed on-device AI & OCR document redaction.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://nocaputils.com/pii-shield/privacy",
  },
};

export default function PiiShieldPrivacyPage() {
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
              href={PII_SHIELD_SUPPORT_URL}
              className="neo-button neo-button-theme hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] transition-all"
            >
              Support &amp; Help
            </Link>
          </div>
          <ThemeToggle />
        </header>

        <main className="neo-panel bg-[var(--bg-panel)] p-8 md:p-12">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="border-2 border-[var(--border-main)] bg-[#2A9D8F] px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
              100% Offline &bull; Zero Data Collection
            </span>
            <span className="border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] px-3 py-1 text-xs font-black uppercase tracking-wider text-[var(--text-main)]">
              macOS &amp; Windows
            </span>
          </div>

          <h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-[var(--text-main)] md:text-5xl">
            PII Shield Privacy Policy
          </h1>
          <p className="mb-8 text-xs font-bold uppercase tracking-wider text-[var(--text-soft)]">
            Last updated: November 24, 2026 &bull; Applies to PII Shield for macOS and Windows
          </p>

          <div className="mb-8 border-l-4 border-[#2A9D8F] bg-[var(--bg-panel-muted)] p-5">
            <p className="text-sm font-bold leading-relaxed text-[var(--text-main)] md:text-base">
              Executive Summary: PII Shield processes every document, spreadsheet, PDF, and image strictly on your local computer. We do not collect, transmit, store, or access your documents or personal data.
            </p>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-[var(--text-soft)] md:text-base">
            <section>
              <h2 className="mb-3 border-b-2 border-[var(--border-main)] pb-2 text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                1. Overview
              </h2>
              <p>
                PII Shield is a native desktop security application for <strong>macOS</strong> (Apple Silicon) and{" "}
                <strong>Windows</strong> that detects and permanently redacts personally identifiable information (PII) from documents, spreadsheets, and images. All parsing, optical character recognition (OCR), AI entity extraction, and file exports run locally on your device.
              </p>
            </section>

            <section>
              <h2 className="mb-3 border-b-2 border-[var(--border-main)] pb-2 text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                2. Data We Do Not Collect
              </h2>
              <p className="mb-3">
                PII Shield does <strong>not</strong> collect, transmit, sell, or store any of the following:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Your documents, PDFs, Word/Excel files, CSVs, images, or extracted text.</li>
                <li>Detected PII entities, redaction bounding boxes, tags, or generated pseudonyms.</li>
                <li>Account credentials, names, or email addresses (no account or login is required).</li>
                <li>Usage telemetry, behavioral analytics, advertising IDs, or third-party tracking SDKs.</li>
                <li>IP addresses, hardware fingerprints, MAC addresses, or location data.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 border-b-2 border-[var(--border-main)] pb-2 text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                3. Local Data Storage on Your Device
              </h2>
              <p className="mb-3">
                Operational preferences and audit records remain strictly on your local drive:
              </p>
              <ul className="list-disc space-y-3 pl-6">
                <li>
                  <strong>macOS (App Sandbox):</strong> Stored inside the macOS App Sandbox container (
                  <code className="rounded bg-[var(--bg-panel-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-main)]">
                    ~/Library/Containers/com.actred.piishield.mac/Data/
                  </code>
                  ). Local state consists of a SwiftData redaction history log (file names, file paths, timestamps, redaction modes, and entity counts — never document contents), application preferences in{" "}
                  <code className="rounded bg-[var(--bg-panel-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-main)]">
                    UserDefaults
                  </code>
                  , and any custom rules you define. You can erase the local history log at any time via{" "}
                  <strong>History &rarr; Clear History</strong>.
                </li>
                <li>
                  <strong>Windows:</strong> Stored locally in{" "}
                  <code className="rounded bg-[var(--bg-panel-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-main)]">
                    %APPDATA%\PIIShield\
                  </code>{" "}
                  (local SQLite history database and application settings), also clearable from within the app.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 border-b-2 border-[var(--border-main)] pb-2 text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                4. On-Device AI &amp; OCR Engines
              </h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>macOS:</strong> Runs the bundled Apache-2.0 GLiNER Small v2.1 ONNX FP16 model locally via ONNX Runtime and performs OCR on-device using Apple&apos;s built-in <code className="rounded bg-[var(--bg-panel-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-main)]">Vision</code> framework.
                </li>
                <li>
                  <strong>Windows:</strong> Runs local GLiNER (ONNX Runtime) and EasyOCR directly on your CPU/GPU.
                </li>
              </ul>
              <p className="mt-3">
                No prompts, embeddings, images, or document text are ever sent to external AI APIs or cloud servers.
              </p>
            </section>

            <section>
              <h2 className="mb-3 border-b-2 border-[var(--border-main)] pb-2 text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                5. Network Access &amp; Sandboxing
              </h2>
              <p>
                On macOS, PII Shield is compiled under the strict macOS App Sandbox with outbound network entitlements intentionally omitted (
                <code className="rounded bg-[var(--bg-panel-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-main)]">
                  com.apple.security.network.client
                </code>{" "}
                is not enabled), so macOS blocks outbound network requests at the kernel level. File access is limited exclusively to files and folders you explicitly choose through system Open/Save panels or drag-and-drop. Application distribution and updates are handled directly by the Mac App Store and Microsoft Store.
              </p>
            </section>

            <section>
              <h2 className="mb-3 border-b-2 border-[var(--border-main)] pb-2 text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                6. Website vs. Desktop Application
              </h2>
              <p>
                Minimal privacy-compliant website analytics (Google Analytics) used on{" "}
                <code className="rounded bg-[var(--bg-panel-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-main)]">
                  nocaputils.com
                </code>{" "}
                apply strictly when browsing this website in your web browser and are completely absent from the offline PII Shield desktop applications.
              </p>
            </section>

            <section>
              <h2 className="mb-3 border-b-2 border-[var(--border-main)] pb-2 text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                7. Compliance &amp; Regulatory Context
              </h2>
              <p>
                Because PII Shield operates locally on your device without transmitting user data to external servers, using the application does not involve third-party data transfers under GDPR, HIPAA, CCPA/CPRA, or DPDP.
              </p>
            </section>

            <section>
              <h2 className="mb-3 border-b-2 border-[var(--border-main)] pb-2 text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                8. Contact
              </h2>
              <p>
                For privacy or security questions regarding PII Shield, please contact{" "}
                <a
                  href={`mailto:${PII_SHIELD_SUPPORT_EMAIL}`}
                  className="font-bold text-[var(--text-main)] underline decoration-[#2A9D8F]"
                >
                  {PII_SHIELD_SUPPORT_EMAIL}
                </a>{" "}
                or visit the{" "}
                <Link href={PII_SHIELD_SUPPORT_URL} className="font-bold text-[var(--text-main)] underline">
                  PII Shield Support page
                </Link>
                .
              </p>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
