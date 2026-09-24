# Dedicated PII Shield Showcase Page on NoCapUtils

Create a high-converting, neo-brutalist dedicated product landing page for **PII Shield** (`/pii-shield`) on `nocaputils.com`, highlighting its 100% offline document redaction capabilities, air-gapped safety for ChatGPT/LLM workflows, Microsoft Store availability, high-resolution visual previews, Twitter/OG social share card, and install referrer tracking.

---

## User Review Required

> [!IMPORTANT]
> **Twitter / Social Share Card & Preview Image**:
> We inspected the repository's git log and confirmed that **no site-wide preview image exists on the main branch yet**. Per your note, the main site preview can be addressed in a subsequent pull request.
> For **PII Shield**, we have generated a high-definition 16:9 social preview image featuring a modern female corporate compliance / privacy professional with a data privacy shield workspace (`public/images/pii-shield/social-preview.jpg`). This image is configured in the page metadata for `openGraph` and `twitter:card: summary_large_image` with concise, high-converting copy for Twitter/X shares.

> [!NOTE]
> **Microsoft Store Install Referrer / Campaign Tracking**:
> Microsoft Store supports Campaign IDs via the `cid` query parameter (e.g., `https://apps.microsoft.com/detail/9nm785c34320?cid=nocaputils_web` and protocol link `ms-windows-store://pdp/?productid=9nm785c34320&cid=nocaputils_web`).
> In Microsoft Partner Center under **Analytics > Custom app promotion campaigns**, you can register a custom campaign ID (up to 100 characters) to track clicks, store page views, installs, and conversions. We have created modular constants in `src/lib/constants.ts` with a default `cid=nocaputils_web`, which you can adjust once you view it on localhost.

---

## Open Questions

None. All assets (3 app screenshots, official icon, generated social preview photo) are downloaded and stored in `public/images/pii-shield/`.

---

## Proposed Changes

### Core Constants & Tracking

#### [MODIFY] [constants.ts](file:///Users/milan/workspace/nocaputils/src/lib/constants.ts)
- Add `PII_SHIELD_STORE_ID = "9nm785c34320"`
- Add `PII_SHIELD_CAMPAIGN_ID = "nocaputils_web"`
- Add `PII_SHIELD_STORE_WEB_URL` and `PII_SHIELD_STORE_PROTOCOL_URL`
- Add helper function `getPiiShieldStoreLink(campaign?: string, isProtocol?: boolean)` to generate links with tracking parameters.
- Add PII Shield legal and documentation link constants (`https://okpi-5e20b.web.app/piishield/*`).

---

### Tool Registry & Sitemap

#### [MODIFY] [toolRegistry.ts](file:///Users/milan/workspace/nocaputils/src/lib/toolRegistry.ts)
- Register `pii-shield` under Workplace Utilities / Featured Desktop App with category badge `"Windows App"`, pricing `"$2.49 (Trial Available)"`, description, keywords, and link to `/pii-shield`.

#### [MODIFY] [sitemap.ts](file:///Users/milan/workspace/nocaputils/src/app/sitemap.ts)
- Add `${baseUrl}/pii-shield` with `priority: 0.9` and `changeFrequency: 'weekly'`.

---

### Dedicated PII Shield Page & Components

#### [NEW] [page.tsx](file:///Users/milan/workspace/nocaputils/src/app/pii-shield/page.tsx)
- Server component defining comprehensive metadata, OpenGraph tags, Twitter card tags (`summary_large_image`, title, description, image URL), and structured JSON-LD schema (`SoftwareApplication` / `Product` schema) for maximum search engine and social media visibility.
- Renders the interactive client component.

#### [NEW] [PiiShieldClient.tsx](file:///Users/milan/workspace/nocaputils/src/components/pii-shield/PiiShieldClient.tsx)
Interactive Neo-Brutalist product page matching the NoCapUtils design system:
1. **Hero Section**:
   - High-impact headline: *"Sanitize Before You Prompt: 100% Offline PII Redaction & LLM Privacy Guard"*.
   - App badge, Windows 10/11 compatibility tag, version 1.0.0, zero-cloud badge.
   - Primary Call-to-Action: Neo-brutalist "Get on Microsoft Store" button with official Windows Store badge icon, price tag (`$2.49 / One-time`), and free trial mention.
   - Secondary button: View Live Demo / Explore Features.
2. **Social Proof & Compliance Persona**:
   - Featuring the professional compliance officer image in a dedicated showcase card: *"Built for Enterprise Privacy, Legal Counsel & AI Engineers"*.
3. **LLM Safety Deep Dive ("Why You Need This for ChatGPT & AI Workflows")**:
   - Visual breakdown of the problem: accidental leakage of customer names, API keys, medical charts, financial data when chatting with LLMs.
   - The Solution: Local NER (Named Entity Recognition via GLiNER) + EasyOCR + Pseudonymization.
   - Visual interactive code/text diff demonstrating raw text vs pseudonymized text (`[PERSON_1]`, `[EMAIL_1]`) preserving grammar and prompt intelligence while keeping personal identities 100% shielded.
4. **Interactive Screenshot Showcase**:
   - Interactive neo-brutalist tab/gallery displaying the 3 Microsoft Store screenshots:
     - Document redaction interface (PDF black-bar redaction).
     - Automated entity detection & manual review table.
     - Scanned paperwork & image OCR tool.
   - Modal / full-view zoom with high performance.
5. **Supported Formats & Workflow Grid**:
   - PDF Documents (`.pdf`): Permanent black-bar redaction, vector stripping, metadata removal.
   - Microsoft Word (`.docx`): Format-preserving XML run-level redaction.
   - Spreadsheets (`.xlsx`, `.csv`, `.tsv`): Row and column bulk de-identification.
   - Scanned Images (`.png`, `.jpg`, `.bmp`, `.tiff`): OCR engine with box-level precision.
6. **Security & Architecture Guarantee**:
   - Local Tauri v2 + Python Sidecar.
   - 100% Offline / Air-Gapped execution. Zero telemetry, zero telemetry servers.
   - Permissive licensing (no AGPL).
7. **Regulatory Compliance Standards**:
   - HIPAA (Safe Harbor De-identification), GDPR, CCPA / CPRA, FERPA, FOIA, DPDP.
8. **Detailed Comparison Table**:
   - PII Shield vs Cloud-based Redaction Services (Cloud vs Local, Privacy, Speed, Subscription vs One-Time).
9. **Documentation & Legal Links**:
   - Direct cards linking to Technical Overview (`about.html`), Privacy Policy, Terms of Service, EULA, and Third-Party OSS Licenses.
10. **FAQ Section**:
    - Clear expandable neo-brutalist accordion answering common questions about LLM workflows, offline safety, file formats, and Microsoft Store licensing.

---

### Homepage Integration

#### [MODIFY] [page.tsx](file:///Users/milan/workspace/nocaputils/src/app/page.tsx)
- Add a spotlight banner / card for PII Shield on the homepage, giving immediate visibility and referral traffic to the new `/pii-shield` page.

---

## Verification Plan

### Automated Tests & Linting
1. Type check:
   ```bash
   npx tsc --noEmit
   ```
2. Lint check:
   ```bash
   npm run lint
   ```
3. Production build test:
   ```bash
   npm run build
   ```

### Manual Verification
1. Start local dev server (`npm run dev`) on port 3000.
2. Verify `/pii-shield` in browser:
   - Check Neo-Brutalist styling, colors, borders, and dark/light mode toggle.
   - Verify all screenshots and model preview image load crisply.
   - Test Microsoft Store button and referrer link generation.
   - Test responsive layout on desktop and mobile viewports.
   - Inspect JSON-LD schema, Twitter card tags, and OG meta tags in page source.
3. Present localhost preview and guide user on configuring Microsoft Partner Center campaign tracking.
