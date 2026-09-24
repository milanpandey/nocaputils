import type { Metadata } from "next";
import PiiShieldClient from "@/components/pii-shield/PiiShieldClient";

export const metadata: Metadata = {
  title: "PII Shield — 100% Offline Document Redaction & Safe LLM Workflows | nocaputils",
  description:
    "Permanently redact PDFs, sanitize Word documents, anonymize Excel spreadsheets, and black out sensitive data from images 100% offline before sharing with ChatGPT, Claude, Copilot, Gemini, and other LLMs. Zero cloud uploads, air-gapped security.",
  keywords: [
    "pii shield",
    "document redaction",
    "offline document redaction",
    "redact pdf offline",
    "pii redaction tool",
    "anonymize excel for llm",
    "sanitize word docx",
    "llm privacy",
    "chatgpt data security",
    "gemini prompt privacy",
    "claude ai redaction",
    "copilot data protection",
    "offline pii tool",
    "ai anonymizer",
    "pseudonymization",
    "gdpr redaction software",
    "hipaa de-identification",
    "gliner local ner",
    "easyocr offline",
    "windows desktop app",
    "air-gapped document privacy",
    "nocaputils",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "PII Shield — 100% Offline Document Redaction & Safe LLM Workflows",
    description:
      "Sanitize PDFs, Word, Excel & Images 100% offline before prompting ChatGPT, Claude, Copilot, Gemini & other LLMs. Zero cloud uploads, zero data leakage.",
    url: "https://nocaputils.com/pii-shield",
    siteName: "nocaputils",
    images: [
      {
        url: "https://nocaputils.com/images/pii-shield/social-preview.jpg",
        width: 1200,
        height: 675,
        alt: "PII Shield — 100% Offline Document Redaction & LLM Privacy Guard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PII Shield — 100% Offline Document Redaction & Safe LLM Workflows",
    description:
      "Sanitize PDFs, Word, Excel & Images 100% offline before prompting ChatGPT, Claude, Copilot, Gemini & other LLMs. Zero cloud uploads, zero data leakage.",
    images: ["https://nocaputils.com/images/pii-shield/social-preview.jpg"],
  },
  alternates: {
    canonical: "https://nocaputils.com/pii-shield",
  },
};

export default function PiiShieldPage() {
  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://nocaputils.com/#website",
        name: "nocaputils",
        url: "https://nocaputils.com",
        description: "Free privacy-first utility tools that run entirely in your browser or locally on your desktop.",
      },
      {
        "@type": "WebPage",
        "@id": "https://nocaputils.com/pii-shield#webpage",
        url: "https://nocaputils.com/pii-shield",
        name: "PII Shield — 100% Offline Document Redaction & Safe LLM Workflows",
        description:
          "Permanently redact PDFs, sanitize Word documents, anonymize Excel spreadsheets, and black out sensitive data from images 100% offline before sharing with ChatGPT, Claude, Copilot, Gemini, and other LLMs.",
        isPartOf: { "@id": "https://nocaputils.com/#website" },
        breadcrumb: { "@id": "https://nocaputils.com/pii-shield#breadcrumb" },
        about: { "@id": "https://nocaputils.com/pii-shield#software" },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://nocaputils.com/pii-shield#breadcrumb",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://nocaputils.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Workplace Utilities",
            item: "https://nocaputils.com/workplaceutilities",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "PII Shield",
            item: "https://nocaputils.com/pii-shield",
          },
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://nocaputils.com/pii-shield#software",
        name: "PII Shield",
        operatingSystem: "Windows 10, Windows 11",
        applicationCategory: "SecurityApplication",
        applicationSubCategory: "Document Redaction & Data Privacy",
        offers: {
          "@type": "Offer",
          price: 224,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          description: "Lifetime purchase with free evaluation trial in Microsoft Store",
        },
        author: {
          "@type": "Organization",
          name: "MilanPandey",
          url: "https://nocaputils.com",
        },
        publisher: {
          "@type": "Organization",
          name: "nocaputils",
          url: "https://nocaputils.com",
        },
        description:
          "Fast, privacy-first desktop application to detect, redact, and pseudonymize Personally Identifiable Information (PII) across PDFs, Word documents, Excel spreadsheets, and scanned images before prompting ChatGPT, Claude, Copilot, Gemini, and other LLMs. 100% offline, zero cloud uploads.",
        featureList: [
          "100% Offline Document Redaction with Zero Cloud Endpoints",
          "Permanent Vector Layer Stripping & Metadata Removal for PDFs",
          "Word (.docx) Run-Level XML Redaction with Layout Preservation",
          "Excel (.xlsx, .csv, .tsv) Cell & Column Bulk De-Identification",
          "Local GLiNER AI Named Entity Recognition (NER) for Automatic Detection",
          "Offline EasyOCR Engine with Deskew, Rotation & Interactive Box Redaction",
          "Context-Preserving Pseudonymization for Safe ChatGPT, Claude, Copilot & Gemini Prompts",
          "HIPAA Safe Harbor, GDPR Article 32, CCPA & DPDP Regulatory Compliance",
        ],
        image: "https://nocaputils.com/images/pii-shield/icon.png",
        url: "https://nocaputils.com/pii-shield",
        downloadUrl: "https://apps.microsoft.com/detail/9NM785C34320",
        softwareVersion: "1.0.0",
        screenshot: [
          "https://nocaputils.com/images/pii-shield/screenshot1.png",
          "https://nocaputils.com/images/pii-shield/screenshot2.png",
          "https://nocaputils.com/images/pii-shield/screenshot3.png",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": "https://nocaputils.com/pii-shield#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "Why do I need PII Shield when working with ChatGPT, Claude, Gemini, and other LLMs?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "When you paste customer support tickets, financial records, medical summaries, or legal briefs into LLMs, your sensitive data leaves your organization and enters third-party cloud servers. PII Shield enables you to sanitize and pseudonymize this data 100% offline first. Placeholders like [PERSON_1] or realistic synthetic names preserve grammar, sentence logic, and context so the AI model generates accurate answers without ever seeing real private data.",
            },
          },
          {
            "@type": "Question",
            name: "Does PII Shield require an internet connection or send data to the cloud?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. PII Shield is 100% offline and air-gapped. The Named Entity Recognition model (GLiNER), OCR engine (EasyOCR), and redaction routines execute directly on your local CPU or GPU. No documents, tokens, or telemetry data are ever transmitted to external servers.",
            },
          },
          {
            "@type": "Question",
            name: "Can redacted data or hidden metadata be recovered from exported files?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Unlike simple PDF annotation tools that merely place a black box on top of text, PII Shield completely removes underlying text vectors, strips metadata streams, and burns redaction blocks directly into the document layout. The original text no longer exists in the exported file.",
            },
          },
          {
            "@type": "Question",
            name: "What file formats does PII Shield support?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Native and scanned PDFs (.pdf), Microsoft Word documents (.docx), spreadsheets (.xlsx, .csv, .tsv), and images (.png, .jpg, .jpeg, .tiff, .bmp).",
            },
          },
          {
            "@type": "Question",
            name: "How does licensing and the Microsoft Store purchase work?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "PII Shield is distributed securely via the Microsoft Store. It is an affordable one-time purchase of ₹224 (no recurring monthly subscriptions). A free trial is also available directly in the Microsoft Store so you can evaluate it on your Windows PC before purchasing.",
            },
          },
          {
            "@type": "Question",
            name: "Is PII Shield available for macOS or Linux?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "PII Shield is currently available natively for Windows 10 & 11 via the Microsoft Store. A native macOS build is currently in active development to bring the same 100% offline, air-gapped document redaction and local NER engine to Mac users. Stay tuned!",
            },
          },
        ],
      },
      {
        "@type": "HowTo",
        "@id": "https://nocaputils.com/pii-shield#howto",
        name: "How to Redact and De-Identify Documents Offline for AI Workflows",
        description:
          "Step-by-step workflow to redact sensitive Personally Identifiable Information (PII) from PDFs, Word documents, Excel spreadsheets, and scanned paperwork before pasting into ChatGPT, Claude, Copilot, or Gemini.",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Open Document Offline",
            text: "Open PII Shield on your PC and load your file (.pdf, .docx, .xlsx, .csv, or image). Processing is 100% local with no cloud connection.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Auto-Detect Sensitive Entities",
            text: "The local GLiNER AI Named Entity Recognition engine automatically identifies names, emails, phone numbers, government IDs, credit cards, and addresses.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Choose Redaction or Pseudonymization",
            text: "Select permanent vector blackout redaction to strip confidential text completely, or pseudonymization ([PERSON_1]) to preserve syntax and context for AI models.",
          },
          {
            "@type": "HowToStep",
            position: 4,
            name: "Export and Safely Prompt LLMs",
            text: "Export the cleaned document or sanitized prompt. Safely upload to ChatGPT, Claude, Copilot, Gemini, or other LLMs with zero risk of private data leakage.",
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />
      <PiiShieldClient />
    </>
  );
}
