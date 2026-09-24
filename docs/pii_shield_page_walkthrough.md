# Walkthrough: Dedicated PII Shield Showcase Page on NoCapUtils

We have built, launched, and refined the dedicated product showcase page for **PII Shield** at [`/pii-shield`](http://localhost:3000/pii-shield).

---

## What Was Created & Updated

### 1. Dedicated Landing Page (`/pii-shield`)
- **[page.tsx](file:///Users/milan/workspace/nocaputils/src/app/pii-shield/page.tsx)**: Server component configuring full SEO metadata, OpenGraph tags, Twitter cards, and rich JSON-LD `SoftwareApplication` structured schema.
- **[PiiShieldClient.tsx](file:///Users/milan/workspace/nocaputils/src/components/pii-shield/PiiShieldClient.tsx)**: Interactive client component matching the signature NoCapUtils Neo-Brutalist styling with light/dark theme support.

### 2. Light & Dark Theme Contrast Fixes
Following the visual inspection in both Light and Dark modes:
- **Hero Badges ("Windows Desktop App")**:
  - Replaced `.neo-panel` which caused CSS specificity conflicts (forcing `background: var(--bg-panel)` which resulted in white text on white background) with explicit high-contrast neo-brutalist styling: `border-2 border-[var(--border-main)] !bg-[#2A9D8F] !text-white`.
- **Header Navigation Buttons**:
  - Applied `.neo-button-theme` to `← NOCAPUTILS HOME` and `WORKPLACE UTILITIES` so they render crisp dark text in Light Mode and bright white `#f8fafc` text on slate in Dark Mode, with yellow hover feedback.
- **Hero Primary Call to Action**:
  - Elevated "GET ON MICROSOFT STORE" into a prominent neo-brutalist primary button with `!bg-[var(--accent)]` (vibrant yellow), bold black text, 4px border, and 5px shadow in both modes.
  - Secondary button "LAUNCH IN WINDOWS STORE APP →" uses `.neo-button-theme` for clean dark-slate and white typography.
- **Bottom Yellow CTA Banner**:
  - Resolved black-on-black button text issue by applying explicit `!text-white`, `style={{ backgroundColor: "#000000", color: "#ffffff" }}`, and `fill="#ffffff"` on the Microsoft logo SVG.
  - Secondary button "Open in Windows Store App" has crisp black text on white background.
- **Technical Specifications & Declarations**:
  - Replaced murky background with `.neo-button-theme` for all 5 document links, making them high contrast in both themes.
- **LLM Safety Feature Cards**:
  - Updated card backgrounds to `bg-[var(--bg-panel-muted)]` for clean contrast in both modes.

### 3. High-Impact Sections
- **Hero & Call to Action**:
  - High-impact headline: *"Sanitize Before You Prompt: 100% Offline PII Redaction & LLM Privacy Guard"*.
  - App icon badge, Windows 10/11 compatibility tag, ₹224 price indicator, and Free Trial notice.
  - Direct Microsoft Store web CTA + Windows protocol link (`ms-windows-store://`).
- **Interactive AI & LLM Safety Demo**:
  - Interactive toggle comparing **Raw Confidential Data (Unsafe)** vs. **Sanitized Prompt (Pseudonymized)**.
  - Demonstrates how context, grammar, and analytical precision are preserved for ChatGPT / Claude while completely eliminating private data leakage.
- **Trust & Compliance Persona**:
  - High-resolution photograph of an enterprise corporate compliance / privacy professional at her workstation with a data privacy shield dashboard.
  - Persona breakdown for Attorneys, Healthcare/Researchers, HR, Finance, and AI Engineers.
- **Interactive Screenshot Showcase**:
  - 3 official high-resolution screenshots pulled from the Microsoft Store:
    1. *PDF Multi-Format Redaction*
    2. *AI Entity Review & Detection Table*
    3. *Scanned Paperwork & Image OCR Tool*
  - Interactive tabs + click-to-zoom fullscreen modal.
- **Multi-Format Workflows & Engine Details**:
  - Breakdown of PDF vector stripping, Word run-level XML redaction, Excel bulk row/column de-identification, and Image OCR with manual rectangle drawing.
- **Air-Gapped Architecture & Regulatory Compliance**:
  - Technical overview of Tauri v2, Python sidecar, GLiNER NER model, EasyOCR, and ONNX Runtime.
  - Compliance coverage for HIPAA Safe Harbor, GDPR, CCPA/CPRA, and FOIA.
- **PII Shield vs Cloud Redactors Comparison Table**:
  - Detailed feature matrix comparing offline local processing vs cloud subscriptions.
- **FAQ Accordion & Legal Documentation Hub**:
  - Expandable answers for common questions.
  - Direct links to the Technical Overview, Privacy Policy, Terms of Service, EULA, and Third-Party OSS Licenses.

---

### 4. SEO & Twitter / OpenGraph Social Card
- Dedicated 16:9 social preview card: [`public/images/pii-shield/social-preview.jpg`](file:///Users/milan/workspace/nocaputils/public/images/pii-shield/social-preview.jpg)
- Twitter card & OpenGraph tags:
  - `twitter:card`: `summary_large_image`
  - `twitter:title`: *PII Shield — 100% Offline Document Redaction & Safe LLM Workflows*
  - `twitter:description`: *Sanitize PDFs, Word, Excel & Images 100% offline before prompting ChatGPT, Claude, Copilot, Gemini & other LLMs. Zero cloud uploads, zero data leakage.*
  - `twitter:image`: `https://nocaputils.com/images/pii-shield/social-preview.jpg`

---

### 5. Site Integration & Discovery
- **[constants.ts](file:///Users/milan/workspace/nocaputils/src/lib/constants.ts)**: Configured store links, campaign parameters (`homepage`, `piishield_page`), dynamic `?cid=` URL generator without hardcoded locale query parameters, and legal document URLs.
- **[toolRegistry.ts](file:///Users/milan/workspace/nocaputils/src/lib/toolRegistry.ts)**: Registered `pii-shield` under Workplace Utilities / Windows App with expanded keywords: `["pii", "shield", "redact", "redaction", "anonymizer", "llm", "chatgpt", "claude", "copilot", "gemini", "offline", "privacy", "pdf", "word", "excel", "ocr", "gdpr", "hipaa", "windows"]`.
- **[sitemap.ts](file:///Users/milan/workspace/nocaputils/src/app/sitemap.ts)**: Added `${baseUrl}/pii-shield` with priority 0.95.
- **[page.tsx](file:///Users/milan/workspace/nocaputils/src/app/page.tsx)**: Added a featured spotlight banner on the homepage with direct tracked Store link (`?cid=homepage`), tracked internal link (`/pii-shield?cid=homepage`), and copy covering ChatGPT, Claude, Copilot, Gemini, and other LLMs.

---

## Verification Results

1. **TypeScript Typecheck**:
   ```bash
   npx tsc --noEmit
   # Passed with 0 errors
   ```

2. **Tracking & Copy Verification**:
   - **Homepage (`/`)**:
     - Direct Store link: `https://apps.microsoft.com/detail/9NM785C34320?cid=homepage`
     - Dedicated page link: `/pii-shield?cid=homepage`
     - Copy: *"Sanitize PDFs, Word documents, Excel spreadsheets, and scanned paperwork before uploading to ChatGPT, Claude, Copilot, Gemini, or other LLMs."*
   - **PII Shield Page (`/pii-shield`)**:
     - Hero subtitle: *"De-identify sensitive data before sharing with ChatGPT, Claude, Copilot, Gemini & other LLMs."*
     - Prompt preview: *"Sanitized Prompt (Safe For ChatGPT, Claude & Gemini)"*
     - Store links: `https://apps.microsoft.com/detail/9NM785C34320?cid=piishield_page`
     - Dynamic query passthrough: If visitor arrives from `/pii-shield?cid=homepage`, the store links dynamically reflect `?cid=homepage`.
     - **OS Detection & Platform-Aware CTA Buttons**:
       - On Windows: Displays active *"Launch in Windows Store App &rarr;"* button (`ms-windows-store://`).
       - On macOS: Automatically detects Mac / MacBook environment and renders a grayed-out button: *"Coming Soon to macOS [IN DEV]"* with Apple logo in both the hero and bottom yellow banner sections.
       - Subtext updates to *"Windows 10 & 11 (macOS Coming Soon)"*.
       - Added FAQ entry explaining Windows availability and macOS version in development.

---

## Microsoft Store Install Referrer & Tracking Guide

To track acquisitions, store visits, and conversions:

1. **How It Works**:
   The Microsoft Store supports campaign attribution using the `cid` parameter:
   - Web URL: `https://apps.microsoft.com/detail/9NM785C34320?cid=<campaign_id>`
   - Windows App Protocol: `ms-windows-store://pdp/?productid=9NM785C34320&cid=<campaign_id>`

2. **Registered Campaign Identifiers**:
   - `homepage`: For clicks originating directly from the NoCapUtils homepage (`nocaputils.com/`).
   - `piishield_page`: For clicks originating from the dedicated product showcase (`nocaputils.com/pii-shield`).
   - Dynamic query passthrough: If a campaign is passed in the URL (e.g., `?cid=twitter` or `?cid=homepage`), `PiiShieldClient` preserves that campaign ID for store clicks.

3. **In Microsoft Partner Center**:
   - Go to **Partner Center** &rarr; **Apps and games** &rarr; **PII Shield**.
   - Navigate to **Analytics** &rarr; **Custom app promotion campaigns**.
   - Register `homepage` and `piishield_page` (or any custom campaign) to track page impressions, downloads, and revenue attributed to each source.
