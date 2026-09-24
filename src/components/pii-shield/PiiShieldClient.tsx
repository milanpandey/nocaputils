"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import {
  getPiiShieldStoreLink,
  PII_SHIELD_CAMPAIGN_PAGE,
  PII_SHIELD_DOCS_URL,
  PII_SHIELD_PRIVACY_URL,
  PII_SHIELD_TERMS_URL,
  PII_SHIELD_EULA_URL,
  PII_SHIELD_THIRD_PARTY_LICENSES_URL,
} from "@/lib/constants";

export default function PiiShieldClient() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [demoMode, setDemoMode] = useState<"raw" | "pseudonymized">("pseudonymized");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<string>(PII_SHIELD_CAMPAIGN_PAGE);
  const [detectedOs, setDetectedOs] = useState<"windows" | "mac" | "other" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const customCid = params.get("cid") || params.get("ref");
      if (customCid) {
        setCampaign(customCid);
      }

      // Detect OS for platform-aware CTA buttons
      const nav = window.navigator as {
        userAgent?: string;
        platform?: string;
        userAgentData?: { platform?: string };
      };
      const ua = nav.userAgent || "";
      const platform = nav.userAgentData?.platform || nav.platform || "";
      if (
        /Macintosh|MacIntel|MacPPC|Mac68K|Mac OS X|macOS/i.test(platform) ||
        /Macintosh|Mac OS X|macOS/i.test(ua)
      ) {
        setDetectedOs("mac");
      } else if (
        /Win32|Win64|Windows|WinCE/i.test(platform) ||
        /Windows/i.test(ua)
      ) {
        setDetectedOs("windows");
      } else {
        setDetectedOs("other");
      }
    }
  }, []);

  const storeWebUrl = getPiiShieldStoreLink(campaign, false);
  const storeProtocolUrl = getPiiShieldStoreLink(campaign, true);

  const screenshots = [
    {
      title: "PDF Document Redaction",
      desc: "Permanent black-bar redaction that strips underlying text and metadata layers with pixel precision.",
      src: "/images/pii-shield/screenshot1.png",
      tag: "PDF Editor",
    },
    {
      title: "AI Entity Review & Detection",
      desc: "Inspect auto-detected names, emails, phones, SSNs, and custom entities with 1-click approve or edit.",
      src: "/images/pii-shield/screenshot2.png",
      tag: "GLiNER NER",
    },
    {
      title: "Scanned Paperwork & Image OCR",
      desc: "Built-in local OCR engine with zoom, pan, and manual rectangle drawing for IDs, receipts, and scans.",
      src: "/images/pii-shield/screenshot3.png",
      tag: "EasyOCR Engine",
    },
  ];

  const faqs = [
    {
      q: "Why do I need PII Shield when working with ChatGPT, Claude, Gemini, and other LLMs?",
      a: "When you paste customer support tickets, financial records, medical summaries, or legal briefs into LLMs, your sensitive data leaves your organization and enters third-party cloud servers. PII Shield enables you to sanitize and pseudonymize this data 100% offline first. Placeholders like [PERSON_1] or realistic synthetic names preserve grammar, sentence logic, and context so the AI model generates accurate answers without ever seeing real private data.",
    },
    {
      q: "Does PII Shield require an internet connection?",
      a: "No! PII Shield is 100% offline and air-gapped. The Named Entity Recognition model (GLiNER), OCR engine (EasyOCR), and redaction routines execute directly on your local CPU or GPU. No documents, tokens, or telemetry data are ever transmitted to external servers.",
    },
    {
      q: "Can redacted data be recovered or un-hidden from exported files?",
      a: "No. Unlike simple PDF annotation tools that merely place a black box on top of text, PII Shield completely removes underlying text vectors, strips metadata streams, and burns redaction blocks directly into the document layout. The original text no longer exists in the exported file.",
    },
    {
      q: "What file formats does PII Shield support?",
      a: "Native and scanned PDFs (.pdf), Microsoft Word documents (.docx), spreadsheets (.xlsx, .csv, .tsv), and images (.png, .jpg, .jpeg, .tiff, .bmp).",
    },
    {
      q: "How does licensing and the Microsoft Store purchase work?",
      a: "PII Shield is distributed securely via the Microsoft Store. It is an affordable one-time purchase of $2.49 (no recurring monthly subscriptions). A free trial is also available directly in the Microsoft Store so you can evaluate it on your Windows PC before purchasing.",
    },
    {
      q: "Is PII Shield available for macOS or Linux?",
      a: "PII Shield is currently available natively for Windows 10 & 11 via the Microsoft Store. A native macOS build is currently in active development to bring the same 100% offline, air-gapped document redaction and local NER engine to Mac users. Stay tuned!",
    },
  ];

  return (
    <div className="subtle-pattern min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-12 pt-8 md:px-10 md:pt-12">
        {/* ── Header Navigation ── */}
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="neo-button neo-button-theme flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] transition-all"
            >
              <span aria-hidden="true">&larr;</span> nocaputils Home
            </Link>
            <Link
              href="/workplaceutilities"
              className="hidden sm:inline-flex neo-button neo-button-theme items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] transition-all"
            >
              Workplace Utilities
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center">
          {/* ── Hero Section ── */}
          <section className="mb-16 w-full max-w-5xl text-center">
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
              <span
                className="inline-block border-2 border-[var(--border-main)] !bg-[#2A9D8F] px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.18em] !text-white shadow-[2px_2px_0_0_var(--border-main)]"
                style={{ backgroundColor: "#2A9D8F", color: "#ffffff" }}
              >
                Windows Desktop App
              </span>
              <span className="inline-block border-2 border-[var(--border-main)] bg-[var(--bg-panel)] px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[var(--text-main)] shadow-[2px_2px_0_0_var(--border-main)]">
                100% Offline &middot; Air-Gapped
              </span>
              <span
                className="inline-block border-2 border-[var(--border-main)] !bg-[var(--accent)] px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.18em] !text-black shadow-[2px_2px_0_0_var(--border-main)]"
                style={{ backgroundColor: "var(--accent)", color: "#000000" }}
              >
                Safe For LLM Workflows
              </span>
            </div>

            <div className="mb-6 flex items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-[var(--border-main)] bg-[var(--bg-panel)] p-2 shadow-[4px_4px_0_0_var(--border-main)] sm:h-28 sm:w-28">
                <Image
                  src="/images/pii-shield/icon.png"
                  alt="PII Shield Logo"
                  width={112}
                  height={112}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
            </div>

            <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.05em] text-[var(--text-main)] sm:text-6xl lg:text-[4.75rem]">
              <span>Sanitize Before</span>
              <br />
              <span className="my-2 inline-block rotate-[-1.5deg] border-4 border-[var(--border-main)] bg-[var(--accent)] px-4 py-1 text-black shadow-[6px_6px_0_0_var(--border-main)]">
                You Prompt
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg font-bold leading-relaxed text-[var(--text-main)] sm:text-2xl">
              Permanently redact PDFs, Word documents, Excel sheets &amp; scanned images{" "}
              <span className="underline decoration-wavy decoration-[#2A9D8F]">100% offline</span>.
              De-identify sensitive data before sharing with ChatGPT, Claude, Copilot, Gemini &amp; other LLMs.
            </p>

            <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-[var(--text-soft)] sm:text-base">
              Air-gapped desktop security for legal teams, compliance officers, HR, healthcare, and developers.
              Zero cloud uploads. Zero telemetry. No subscription lock-in.
            </p>

            {/* ── CTA Buttons ── */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <a
                href={storeWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neo-button flex items-center justify-center gap-3 !bg-[var(--accent)] px-8 py-4 text-base font-black uppercase tracking-[0.15em] !text-black hover:brightness-105 transition-transform hover:-translate-y-1 sm:text-lg border-4 border-[var(--border-main)] shadow-[5px_5px_0_0_var(--border-main)]"
                style={{ backgroundColor: "var(--accent)", color: "#000000" }}
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="#000000"
                  aria-hidden="true"
                >
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.901-1.799" />
                </svg>
                <span style={{ color: "#000000" }}>Get on Microsoft Store</span>
              </a>

              {detectedOs === "mac" ? (
                <div
                  className="flex items-center justify-center gap-2.5 border-2 border-dashed border-[var(--border-main)] bg-[var(--bg-panel-muted)] px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[var(--text-soft)] opacity-80 cursor-not-allowed select-none shadow-[2px_2px_0_0_var(--border-main)]"
                  title="PII Shield is currently available for Windows 10 & 11. macOS version is coming soon."
                >
                  <svg
                    className="h-4 w-4 fill-current opacity-80"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.67-1.09 1.74-.96 2.77 1 .08 2.08-.52 2.69-1.27z" />
                  </svg>
                  <span>Coming Soon to macOS</span>
                  <span className="rounded bg-[var(--border-main)] px-1.5 py-0.5 text-[10px] font-black text-[var(--bg-panel)]">
                    In Dev
                  </span>
                </div>
              ) : (
                <a
                  href={storeProtocolUrl}
                  className="neo-button neo-button-theme flex items-center justify-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-[0.15em] transition-all"
                  title="Launch directly inside the Windows Store app"
                >
                  <span>Launch in Windows Store App</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider text-[var(--text-soft)]">
              <span>$2.49 Lifetime Purchase</span>
              <span>&bull;</span>
              <span>Free Trial Available</span>
              <span>&bull;</span>
              <span>
                {detectedOs === "mac" ? "Windows 10 & 11 (macOS Coming Soon)" : "Windows 10 & 11 (x64)"}
              </span>
            </div>
          </section>

          {/* ── LLM Safety Deep Dive Section (Interactive) ── */}
          <section className="mb-20 w-full max-w-5xl">
            <div className="neo-panel bg-[var(--bg-panel)] p-6 sm:p-10">
              <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b-4 border-[var(--border-main)] pb-6 md:flex-row md:items-center">
                <div>
                  <div className="mb-2 inline-block border-2 border-[var(--border-main)] bg-[var(--accent)] px-3 py-0.5 text-xs font-black uppercase tracking-widest text-black">
                    AI &amp; LLM Safety
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-[var(--text-main)] sm:text-3xl">
                    Why Sanitize Data Before AI Prompts?
                  </h2>
                </div>
                {/* Toggle demo button */}
                <div className="flex border-2 border-[var(--border-main)] p-1 bg-[var(--bg-panel-muted)]">
                  <button
                    type="button"
                    onClick={() => setDemoMode("raw")}
                    className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                      demoMode === "raw"
                        ? "bg-[#E63946] text-white shadow-[2px_2px_0_0_var(--border-main)]"
                        : "text-[var(--text-soft)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    Raw Data (Unsafe)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoMode("pseudonymized")}
                    className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                      demoMode === "pseudonymized"
                        ? "bg-[#2A9D8F] text-white shadow-[2px_2px_0_0_var(--border-main)]"
                        : "text-[var(--text-soft)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    Sanitized (Safe AI)
                  </button>
                </div>
              </div>

              {/* Code comparison box */}
              <div className="relative mb-6 overflow-hidden rounded-lg border-4 border-[var(--border-main)] bg-[#0d1117] p-5 font-mono text-sm leading-relaxed text-gray-200 shadow-[4px_4px_0_0_var(--border-main)]">
                <div className="mb-3 flex items-center justify-between border-b border-gray-800 pb-2 text-xs uppercase tracking-widest">
                  <span className={demoMode === "raw" ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                    {demoMode === "raw" ? "⚠️ Confidential Prompt (Leaking PII)" : "🛡️ Sanitized Prompt (Safe For ChatGPT, Claude & Gemini)"}
                  </span>
                  <span className="text-gray-400">Prompt Preview</span>
                </div>

                {demoMode === "raw" ? (
                  <div className="space-y-2">
                    <p className="text-gray-400">{"// Prompt submitted to ChatGPT / Claude / Gemini / LLM:"}</p>
                    <p>
                      &quot;Please summarize this legal settlement dispute for client{" "}
                      <span className="bg-red-950 text-red-300 px-1.5 py-0.5 border border-red-500 rounded font-bold">
                        Dr. Evelyn Vance
                      </span>{" "}
                      (SSN:{" "}
                      <span className="bg-red-950 text-red-300 px-1.5 py-0.5 border border-red-500 rounded font-bold">
                        984-21-6540
                      </span>
                      , email:{" "}
                      <span className="bg-red-950 text-red-300 px-1.5 py-0.5 border border-red-500 rounded font-bold">
                        evelyn.vance@vancemedical.com
                      </span>
                      ). The settlement agreement of{" "}
                      <span className="bg-red-950 text-red-300 px-1.5 py-0.5 border border-red-500 rounded font-bold">
                        $1,250,000
                      </span>{" "}
                      with{" "}
                      <span className="bg-red-950 text-red-300 px-1.5 py-0.5 border border-red-500 rounded font-bold">
                        Apex Biometrics Corp
                      </span>{" "}
                      covers clinic license #VA-99201.&quot;
                    </p>
                    <div className="mt-4 rounded border border-red-700 bg-red-950/50 p-3 text-xs text-red-300">
                      🚨 <strong>Risk:</strong> Patient name, national ID, business email, and confidential settlement amounts exposed to third-party AI training servers and logs!
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-400">{"// Sanitized with PII Shield (Pseudonymized & Zero Leakage):"}</p>
                    <p>
                      &quot;Please summarize this legal settlement dispute for client{" "}
                      <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 border border-emerald-500 rounded font-bold">
                        [PERSON_1]
                      </span>{" "}
                      (SSN:{" "}
                      <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 border border-emerald-500 rounded font-bold">
                        [GOV_ID_1]
                      </span>
                      , email:{" "}
                      <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 border border-emerald-500 rounded font-bold">
                        [EMAIL_1]
                      </span>
                      ). The settlement agreement of{" "}
                      <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 border border-emerald-500 rounded font-bold">
                        [SETTLEMENT_AMOUNT_1]
                      </span>{" "}
                      with{" "}
                      <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 border border-emerald-500 rounded font-bold">
                        [ORG_1]
                      </span>{" "}
                      covers clinic license [LICENSE_1].&quot;
                    </p>
                    <div className="mt-4 rounded border border-emerald-700 bg-emerald-950/50 p-3 text-xs text-emerald-300">
                      ✅ <strong>Safe:</strong> Sentence syntax and contextual relationships remain 100% intact. The AI provides full analysis while real confidential identities never leave your device.
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="border-2 border-[var(--border-main)] p-4 bg-[var(--bg-panel-muted)]">
                  <div className="text-xl mb-1">🤖</div>
                  <h3 className="text-sm font-black uppercase text-[var(--text-main)]">Context Preservation</h3>
                  <p className="text-xs text-[var(--text-soft)] mt-1">
                    Synthetic labels maintain grammatical structure so AI models retain 100% reasoning accuracy.
                  </p>
                </div>
                <div className="border-2 border-[var(--border-main)] p-4 bg-[var(--bg-panel-muted)]">
                  <div className="text-xl mb-1">⚡</div>
                  <h3 className="text-sm font-black uppercase text-[var(--text-main)]">Local GLiNER NER</h3>
                  <p className="text-xs text-[var(--text-soft)] mt-1">
                    State-of-the-art zero-shot Named Entity Recognition detects names, IDs, dates, and organizations offline.
                  </p>
                </div>
                <div className="border-2 border-[var(--border-main)] p-4 bg-[var(--bg-panel-muted)]">
                  <div className="text-xl mb-1">🛡️</div>
                  <h3 className="text-sm font-black uppercase text-[var(--text-main)]">Total Regulatory Shield</h3>
                  <p className="text-xs text-[var(--text-soft)] mt-1">
                    Comply with HIPAA Safe Harbor, GDPR, CCPA, and DPDP rules without hindering your AI adoption.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── AI Search & Overview Key Facts (Generative Engine Optimization) ── */}
          <section className="mb-20 w-full max-w-5xl" aria-label="PII Redaction Executive Summary">
            <div className="border-4 border-[var(--border-main)] bg-[var(--bg-panel)] p-6 sm:p-8 shadow-[6px_6px_0_0_var(--border-main)]">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="border-2 border-[var(--border-main)] bg-[var(--accent)] px-3 py-1 text-xs font-black uppercase tracking-wider text-black">
                  AI Overview &amp; Key Facts
                </span>
                <span className="border-2 border-[var(--border-main)] bg-[#2A9D8F] px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
                  Zero Cloud &middot; Air-Gapped
                </span>
              </div>

              <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)] sm:text-3xl">
                What is PII Shield and How Does Offline Redaction Work?
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-[var(--text-soft)] sm:text-base">
                <strong>PII Shield</strong> is a native desktop security tool for Windows 10 &amp; 11 designed to detect, redact, and pseudonymize Personally Identifiable Information (PII) 100% offline before sharing text, PDFs, spreadsheets, or documents with AI models such as <strong>ChatGPT, Claude, Copilot, Gemini, and other LLMs</strong>.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] p-4">
                  <h3 className="text-xs font-black uppercase text-[var(--text-main)]">1. Permanent Vector Redaction</h3>
                  <p className="mt-1.5 text-xs text-[var(--text-soft)]">
                    Unlike visual overlay boxes, PII Shield permanently strips text vectors, fonts, and metadata streams from PDFs, preventing data recovery through copy-paste or extraction scripts.
                  </p>
                </div>
                <div className="border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] p-4">
                  <h3 className="text-xs font-black uppercase text-[var(--text-main)]">2. LLM Context Preservation</h3>
                  <p className="mt-1.5 text-xs text-[var(--text-soft)]">
                    Uses context-preserving pseudonymization (e.g. <code>[PERSON_1]</code>, <code>[ORG_1]</code>) so AI reasoning models maintain 100% syntactic understanding without seeing raw private identities.
                  </p>
                </div>
                <div className="border-2 border-[var(--border-main)] bg-[var(--bg-panel-muted)] p-4">
                  <h3 className="text-xs font-black uppercase text-[var(--text-main)]">3. Local Machine Learning</h3>
                  <p className="mt-1.5 text-xs text-[var(--text-soft)]">
                    Powered by local GLiNER zero-shot entity extraction and EasyOCR with zero cloud roundtrips, zero telemetry, and full air-gap compliance (HIPAA, GDPR, CCPA).
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Built for Enterprise Compliance & Legal (Featuring Persona Model) ── */}
          <section className="mb-20 grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="neo-panel overflow-hidden border-4 border-[var(--border-main)] bg-[var(--bg-panel)] shadow-[6px_6px_0_0_var(--border-main)]">
              <div className="relative aspect-[16/9] w-full border-b-4 border-[var(--border-main)] bg-gray-900">
                <Image
                  src="/images/pii-shield/social-preview.jpg"
                  alt="Enterprise Compliance Professional using PII Shield"
                  width={640}
                  height={360}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-3 left-3 border-2 border-[var(--border-main)] bg-[var(--accent)] px-3 py-1 text-xs font-black uppercase tracking-wider text-black">
                  Active Privacy Shield
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">
                  Built For Those Who Cannot Afford A Leak
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">
                  From solo law practices and independent accounting firms to enterprise data protection officers,
                  PII Shield gives professionals the confidence to redact documents locally without trusting third-party cloud uploaders.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4">
              <div className="neo-panel flex-1 bg-[var(--bg-panel)] p-6">
                <div className="text-2xl mb-2">⚖️</div>
                <h3 className="text-lg font-black uppercase text-[var(--text-main)]">Attorneys &amp; Law Firms</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-soft)]">
                  Sanitize pleadings, discovery disclosures, evidentiary exhibits, and settlement agreements. Permanently destroy metadata and underlying text before filing.
                </p>
              </div>

              <div className="neo-panel flex-1 bg-[var(--bg-panel)] p-6">
                <div className="text-2xl mb-2">🏥</div>
                <h3 className="text-lg font-black uppercase text-[var(--text-main)]">Healthcare &amp; Researchers</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-soft)]">
                  De-identify clinical trials, case studies, patient notes, and diagnostic records in accordance with HIPAA Safe Harbor and ethical review guidelines.
                </p>
              </div>

              <div className="neo-panel flex-1 bg-[var(--bg-panel)] p-6">
                <div className="text-2xl mb-2">💼</div>
                <h3 className="text-lg font-black uppercase text-[var(--text-main)]">HR, Finance &amp; Operations</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-soft)]">
                  Anonymize resumes, employee background checks, payroll spreadsheets, invoices, and bank statements before circulating with external stakeholders.
                </p>
              </div>
            </div>
          </section>

          {/* ── Interactive Screenshot Showcase ── */}
          <section className="mb-20 w-full max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-[var(--text-main)] sm:text-5xl">
                See PII Shield in Action
              </h2>
              <p className="mt-3 text-sm font-bold uppercase tracking-wider text-[var(--text-soft)]">
                Inspect the native Windows desktop interface
              </p>
            </div>

            {/* Screenshot selector tabs */}
            <div className="mb-6 flex flex-wrap justify-center gap-3">
              {screenshots.map((s, idx) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`neo-button px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                    activeTab === idx
                      ? "bg-[var(--accent)] text-black font-extrabold translate-x-[2px] translate-y-[2px]"
                      : "bg-[var(--bg-panel)] text-[var(--text-main)] hover:bg-[var(--bg-panel-muted)]"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Screenshot preview panel */}
            <div className="neo-panel overflow-hidden bg-[var(--bg-panel)] p-4 sm:p-6">
              <div className="relative group cursor-pointer overflow-hidden border-4 border-[var(--border-main)] bg-gray-900"
                   onClick={() => setSelectedScreenshot(screenshots[activeTab].src)}>
                <Image
                  src={screenshots[activeTab].src}
                  alt={screenshots[activeTab].title}
                  width={1190}
                  height={826}
                  className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="inline-block border-2 border-[var(--border-main)] bg-[var(--accent)] px-4 py-2 text-xs font-black uppercase tracking-widest text-black shadow-[3px_3px_0_0_var(--border-main)]">
                    Click to Zoom Fullscreen 🔍
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-black uppercase text-[var(--text-main)]">
                    {screenshots[activeTab].title}
                  </h3>
                  <p className="text-xs text-[var(--text-soft)]">
                    {screenshots[activeTab].desc}
                  </p>
                </div>
                <span className="self-start rounded border border-[var(--border-main)] bg-[var(--bg-page)] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[var(--text-main)]">
                  {screenshots[activeTab].tag}
                </span>
              </div>
            </div>
          </section>

          {/* ── Supported Formats & Workflows ── */}
          <section className="mb-20 w-full max-w-5xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-[var(--text-main)] sm:text-5xl">
                Multi-Format Workflows
              </h2>
              <p className="mt-3 text-sm font-bold uppercase tracking-wider text-[var(--text-soft)]">
                Permanent, format-preserving redaction across everyday file types
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="neo-panel flex flex-col justify-between bg-[var(--bg-panel)] p-6">
                <div>
                  <div className="mb-3 text-3xl">📄</div>
                  <h3 className="text-lg font-black uppercase text-[var(--text-main)]">PDF Documents</h3>
                  <div className="mt-1 text-xs font-bold text-[#2A9D8F] dark:text-[#52b788]">.pdf (Native &amp; Scanned)</div>
                  <p className="mt-3 text-xs leading-relaxed text-[var(--text-soft)]">
                    Permanent black-bar redaction. Automatically strips vector layers and hidden metadata so text cannot be copied or selected.
                  </p>
                </div>
                <div className="mt-4 border-t border-[var(--border-main)]/20 pt-3 text-[10px] font-bold uppercase text-[var(--text-soft)]">
                  Poppler Engine Export
                </div>
              </div>

              <div className="neo-panel flex flex-col justify-between bg-[var(--bg-panel)] p-6">
                <div>
                  <div className="mb-3 text-3xl">📝</div>
                  <h3 className="text-lg font-black uppercase text-[var(--text-main)]">Word Documents</h3>
                  <div className="mt-1 text-xs font-bold text-[#2A9D8F] dark:text-[#52b788]">.docx Documents</div>
                  <p className="mt-3 text-xs leading-relaxed text-[var(--text-soft)]">
                    Run-level XML redaction. Preserves full document formatting, bullet points, headers, footers, and table geometries.
                  </p>
                </div>
                <div className="mt-4 border-t border-[var(--border-main)]/20 pt-3 text-[10px] font-bold uppercase text-[var(--text-soft)]">
                  Native Layout Preservation
                </div>
              </div>

              <div className="neo-panel flex flex-col justify-between bg-[var(--bg-panel)] p-6">
                <div>
                  <div className="mb-3 text-3xl">📊</div>
                  <h3 className="text-lg font-black uppercase text-[var(--text-main)]">Spreadsheets</h3>
                  <div className="mt-1 text-xs font-bold text-[#2A9D8F] dark:text-[#52b788]">.xlsx, .csv, .tsv</div>
                  <p className="mt-3 text-xs leading-relaxed text-[var(--text-soft)]">
                    Column-hint heuristic detection and cell-level de-identification for thousands of customer rows in seconds.
                  </p>
                </div>
                <div className="mt-4 border-t border-[var(--border-main)]/20 pt-3 text-[10px] font-bold uppercase text-[var(--text-soft)]">
                  Bulk Row &amp; Column Processing
                </div>
              </div>

              <div className="neo-panel flex flex-col justify-between bg-[var(--bg-panel)] p-6">
                <div>
                  <div className="mb-3 text-3xl">🖼️</div>
                  <h3 className="text-lg font-black uppercase text-[var(--text-main)]">Scanned Images</h3>
                  <div className="mt-1 text-xs font-bold text-[#2A9D8F] dark:text-[#52b788]">.png, .jpg, .tiff, .bmp</div>
                  <p className="mt-3 text-xs leading-relaxed text-[var(--text-soft)]">
                    Built-in EasyOCR engine with automated deskew, rotation correction, and interactive canvas rectangle drawing.
                  </p>
                </div>
                <div className="mt-4 border-t border-[var(--border-main)]/20 pt-3 text-[10px] font-bold uppercase text-[var(--text-soft)]">
                  Precision OCR Box Redaction
                </div>
              </div>
            </div>
          </section>

          {/* ── Architecture & Security Guarantee ── */}
          <section className="mb-20 w-full max-w-5xl">
            <div className="neo-panel bg-[var(--bg-panel)] p-8 sm:p-12">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div>
                  <div className="mb-3 inline-block border-2 border-[var(--border-main)] bg-[var(--accent)] px-3 py-0.5 text-xs font-black uppercase tracking-wider text-black">
                    Air-Gapped Architecture
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)] sm:text-4xl">
                    100% Local &amp; Private By Design
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--text-soft)]">
                    PII Shield is built with <strong>Tauri v2</strong> and a dedicated local Python sidecar.
                    All machine learning inference (GLiNER for zero-shot entity extraction, EasyOCR, ONNX Runtime) runs in your physical system memory.
                  </p>
                  <ul className="mt-6 space-y-3 text-xs font-bold uppercase text-[var(--text-main)]">
                    <li className="flex items-center gap-2">
                      <span className="text-[#2A9D8F] dark:text-[#52b788] text-base">&#x2714;</span> Zero cloud endpoints &middot; Zero network requests
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#2A9D8F] dark:text-[#52b788] text-base">&#x2714;</span> No telemetry or analytics trackers embedded
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#2A9D8F] dark:text-[#52b788] text-base">&#x2714;</span> No account registration or login required
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#2A9D8F] dark:text-[#52b788] text-base">&#x2714;</span> Permissive, clean architecture (No AGPL obligations)
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col justify-center rounded-lg border-4 border-[var(--border-main)] bg-[var(--bg-panel-muted)] p-6">
                  <h3 className="text-base font-black uppercase text-[var(--text-main)]">
                    Regulatory Compliance Standards
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded border-2 border-[var(--border-main)] bg-[var(--bg-panel)] p-3 font-bold">
                      <div className="text-[#2A9D8F] dark:text-[#52b788] font-black">HIPAA</div>
                      <div className="text-[11px] text-[var(--text-soft)] font-medium mt-0.5">Safe Harbor De-identification</div>
                    </div>
                    <div className="rounded border-2 border-[var(--border-main)] bg-[var(--bg-panel)] p-3 font-bold">
                      <div className="text-[#2A9D8F] dark:text-[#52b788] font-black">GDPR / UK GDPR</div>
                      <div className="text-[11px] text-[var(--text-soft)] font-medium mt-0.5">Article 32 Technical Safeguards</div>
                    </div>
                    <div className="rounded border-2 border-[var(--border-main)] bg-[var(--bg-panel)] p-3 font-bold">
                      <div className="text-[#2A9D8F] dark:text-[#52b788] font-black">CCPA / CPRA</div>
                      <div className="text-[11px] text-[var(--text-soft)] font-medium mt-0.5">Consumer Data De-identification</div>
                    </div>
                    <div className="rounded border-2 border-[var(--border-main)] bg-[var(--bg-panel)] p-3 font-bold">
                      <div className="text-[#2A9D8F] dark:text-[#52b788] font-black">FOIA &amp; FERPA</div>
                      <div className="text-[11px] text-[var(--text-soft)] font-medium mt-0.5">Government &amp; Student Privacy</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Comparison Table (PII Shield vs Cloud Redactors) ── */}
          <section className="mb-20 w-full max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text-main)] sm:text-4xl">
                PII Shield vs. Cloud Services
              </h2>
              <p className="mt-2 text-sm font-bold uppercase tracking-wider text-[var(--text-soft)]">
                Why a native desktop app beats cloud redaction web tools
              </p>
            </div>

            <div className="neo-panel overflow-x-auto bg-[var(--bg-panel)] p-6">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b-4 border-[var(--border-main)]">
                    <th className="py-3 px-4 font-black uppercase text-[var(--text-main)]">Feature</th>
                    <th className="py-3 px-4 font-black uppercase text-black bg-[var(--accent)]">PII Shield (Windows)</th>
                    <th className="py-3 px-4 font-black uppercase text-[var(--text-soft)]">Standard Cloud Redactors</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[var(--border-main)]/20 font-medium">
                  <tr>
                    <td className="py-3 px-4 font-bold text-[var(--text-main)]">Document Processing</td>
                    <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">100% Offline (Local CPU/GPU)</td>
                    <td className="py-3 px-4 text-red-600 dark:text-red-400">Uploaded to remote cloud servers</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-[var(--text-main)]">Data Breach Risk</td>
                    <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">Zero (Never leaves device)</td>
                    <td className="py-3 px-4 text-red-600 dark:text-red-400">High (Third-party data storage)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-[var(--text-main)]">Pricing Model</td>
                    <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">$2.49 One-Time Purchase</td>
                    <td className="py-3 px-4 text-[var(--text-soft)]">$20 - $50 / month subscription</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-[var(--text-main)]">AI/LLM Pseudonymization</td>
                    <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">Yes (Context-preserving labels)</td>
                    <td className="py-3 px-4 text-[var(--text-soft)]">Rarely supported (black bars only)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-[var(--text-main)]">Batch Folder Redaction</td>
                    <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">Yes (Unlimited files locally)</td>
                    <td className="py-3 px-4 text-[var(--text-soft)]">Metered per-page credits</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── FAQ Section ── */}
          <section className="mb-20 w-full max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--text-main)] sm:text-4xl">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="neo-panel bg-[var(--bg-panel)] transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-5 text-left text-sm font-black uppercase tracking-wide text-[var(--text-main)] sm:text-base"
                    >
                      <span>{faq.q}</span>
                      <span className="text-xl font-bold ml-4">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <div className="border-t-2 border-[var(--border-main)] px-5 pb-5 pt-3 text-xs leading-relaxed text-[var(--text-soft)] sm:text-sm">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Legal & Technical Documentation ── */}
          <section className="mb-20 w-full max-w-5xl">
            <div className="neo-panel bg-[var(--bg-panel)] p-6 sm:p-8">
              <h3 className="text-lg font-black uppercase text-[var(--text-main)]">
                Technical Specifications &amp; Declarations
              </h3>
              <p className="mt-1 text-xs text-[var(--text-soft)]">
                Transparent software declarations, licenses, and architecture docs:
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <a
                  href={PII_SHIELD_DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-button neo-button-theme flex items-center justify-between p-3.5 text-xs font-black uppercase tracking-wider transition-all"
                >
                  <span>Technical Overview</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
                <a
                  href={PII_SHIELD_PRIVACY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-button neo-button-theme flex items-center justify-between p-3.5 text-xs font-black uppercase tracking-wider transition-all"
                >
                  <span>Privacy Policy</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
                <a
                  href={PII_SHIELD_TERMS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-button neo-button-theme flex items-center justify-between p-3.5 text-xs font-black uppercase tracking-wider transition-all"
                >
                  <span>Terms of Service</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
                <a
                  href={PII_SHIELD_EULA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-button neo-button-theme flex items-center justify-between p-3.5 text-xs font-black uppercase tracking-wider transition-all"
                >
                  <span>EULA / License</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
                <a
                  href={PII_SHIELD_THIRD_PARTY_LICENSES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-button neo-button-theme flex items-center justify-between p-3.5 text-xs font-black uppercase tracking-wider transition-all"
                >
                  <span>Third-Party Licenses</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </section>

          {/* ── Final Call to Action ── */}
          <section className="mb-16 w-full max-w-5xl">
            <div className="border-4 border-[var(--border-main)] bg-[var(--accent)] p-8 text-center text-black shadow-[8px_8px_0_0_var(--border-main)] sm:p-14">
              <h2 className="text-3xl font-black uppercase leading-tight tracking-[-0.04em] text-black sm:text-5xl">
                Ready to Secure Your Documents &amp; AI Prompts?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm font-bold leading-relaxed text-black/85 sm:text-lg">
                Download PII Shield from the Microsoft Store today. Instant offline processing for PDFs, Word, Excel, and images.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href={storeWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-button flex items-center justify-center gap-3 !bg-black px-8 py-4 text-base font-black uppercase tracking-[0.15em] !text-white hover:!bg-neutral-800 transition-transform hover:-translate-y-1 sm:text-lg shadow-[4px_4px_0_0_#000]"
                  style={{ backgroundColor: "#000000", color: "#ffffff" }}
                >
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="#ffffff"
                    aria-hidden="true"
                  >
                    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.901-1.799" />
                  </svg>
                  <span style={{ color: "#ffffff" }}>Download on Microsoft Store</span>
                </a>
                {detectedOs === "mac" ? (
                  <div
                    className="flex items-center justify-center gap-2 border-2 border-dashed border-black/40 bg-black/10 px-6 py-4 text-sm font-black uppercase tracking-wider text-black/70 cursor-not-allowed select-none shadow-[2px_2px_0_0_rgba(0,0,0,0.15)]"
                    title="PII Shield is currently available for Windows 10 & 11. macOS version is coming soon."
                  >
                    <svg
                      className="h-4 w-4 fill-current opacity-70"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.67-1.09 1.74-.96 2.77 1 .08 2.08-.52 2.69-1.27z" />
                    </svg>
                    <span>Coming Soon to macOS</span>
                    <span className="rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-black text-white">
                      In Dev
                    </span>
                  </div>
                ) : (
                  <a
                    href={storeProtocolUrl}
                    className="neo-button border-2 border-black !bg-white px-6 py-4 text-sm font-black uppercase tracking-wider !text-black hover:!bg-gray-100 transition-all shadow-[4px_4px_0_0_#000]"
                    style={{ backgroundColor: "#ffffff", color: "#000000" }}
                  >
                    <span style={{ color: "#000000" }}>Open in Windows Store App</span>
                  </a>
                )}
              </div>

              <div className="mt-4 text-xs font-black uppercase tracking-wider text-black/80">
                Only $2.49 &middot; One-time purchase &middot; Free Trial Available
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {/* ── Lightbox Zoom Modal ── */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setSelectedScreenshot(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-h-[90vh] max-w-[95vw] overflow-hidden rounded-lg border-4 border-white bg-black p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedScreenshot(null)}
              className="absolute right-4 top-4 neo-button z-10 flex h-10 w-10 items-center justify-center bg-[var(--accent)] font-black text-black"
              aria-label="Close image preview"
            >
              &times;
            </button>
            <Image
              src={selectedScreenshot}
              alt="Screenshot Full View"
              width={1366}
              height={826}
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
