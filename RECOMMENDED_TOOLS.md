# nocaputils — Toolset Expansion Roadmap & Plan

> **Core Philosophy**: 100% private, client-side in-browser processing (WASM, Canvas, Web Audio, Web APIs), zero server uploads, no watermarks, no sign-in required.

---

## 1. Workplace & Document Power Tools

Expanding the existing document & spreadsheet utility suite (`pdf-lib`, `pdfjs-dist`, `xlsx`, `tesseract.js`).

| Tool Name | Key Features & Value Proposition | Client-Side Implementation Stack |
| :--- | :--- | :--- |
| **PDF Page Manager** *(Split, Reorder, Rotate & Delete)* | • Visual grid of thumbnail previews for each page<br>• Drag-and-drop to reorder pages<br>• Rotate individual pages (90°/180°/270°)<br>• Delete selected pages or split into multiple PDFs | `pdf-lib` + `pdfjs-dist` (canvas rendering for thumbnails) |
| **OCR Image & PDF to Text** | • Extract selectable, editable text from receipt photos, scanned documents, and screenshots<br>• Multi-language OCR support<br>• Copy as plain text or export as Markdown | `tesseract.js` |
| **CSV ↔ JSON ↔ Excel Converter** | • Convert between `.csv`, `.xlsx`, and `.json`<br>• Live tabular preview with column filtering, sorting, and deduplication<br>• Data transposition and column renaming | `xlsx` + Native JavaScript |
| **PDF Redact & Sanitize** | • Draw black-out redaction boxes over sensitive PII, credit card numbers, or signatures<br>• Rasterize/flatten modified pages to ensure underlying text cannot be extracted or recovered | `pdf-lib` + HTML5 Canvas rendering |
| **PDF Watermark & Page Numbering** | • Add custom text/image watermarks with opacity and rotation controls<br>• Add custom header/footer page numbers (e.g. "Page X of Y", Bates numbering) | `pdf-lib` |
| **Complete PDF to Word (.docx)** | • Convert text-based PDF documents into editable Microsoft Word documents<br>• Preserve headings, lists, tables, and paragraphs | `pdfjs-dist` + `docx` (already in `package.json`) |

---

## 2. Creator & Media Power Tools

Building on the existing `@ffmpeg/ffmpeg` WASM, Web Audio, and Canvas infrastructure.

| Tool Name | Key Features & Value Proposition | Client-Side Implementation Stack |
| :--- | :--- | :--- |
| **In-Browser Screen & Webcam Recorder** | • Record full screen, application window, or browser tab<br>• Optional webcam overlay (picture-in-picture) & microphone audio<br>• In-browser trimming before exporting to MP4 / WebM<br>• No watermarks or time limits | `navigator.mediaDevices.getDisplayMedia` + `MediaRecorder` API |
| **Subtitle / SRT Generator & Hardcoder** | • Upload video + `.srt` file to preview with custom fonts, colors, and shadows<br>• Burn styled subtitles directly into video frames for TikTok, Instagram Reels, and YouTube Shorts | FFmpeg WASM / OffscreenCanvas overlay |
| **Video Audio Normalizer & Cleaner** | • Boost quiet audio dialogue without clipping<br>• Apply low-pass / high-pass filters to cut microphone rumble and hiss | Web Audio API (`AudioContext`, `BiquadFilterNode`) / FFmpeg WASM |
| **Social Media Image & Thumbnail Resizer** | • Quick presets for YouTube Thumbnails (16:9), Instagram Posts (1:1), Stories/Reels (9:16), Twitter headers<br>• Crop, rotate, compress, and convert between WebP, PNG, JPG, and AVIF | HTML5 Canvas / `createImageBitmap` |
| **Audio Voice Pitch & Detune FX** | • Pitch-shift voice audio (chipmunk, deep announcer, robotic modulator, reverse playback)<br>• Instant preview with one-click MP3/WAV download | Web Audio API (`AudioBufferSourceNode.playbackRate`, `ConvolverNode`) |

---

## 3. Developer & Privacy Utilities *(High SEO & Zero Server Overhead)*

High-intent developer and sysadmin utilities where users specifically seek private tools that won't send sensitive tokens or keys over a network.

| Tool Name | Key Features & Value Proposition | Client-Side Implementation Stack |
| :--- | :--- | :--- |
| **JWT Inspector & Token Decoder** | • Decode JWT Header, Payload, and Signature client-side<br>• Human-readable expiration countdown & timestamps (`iat`, `exp`, `nbf`)<br>• Complete privacy guarantee for staging/production tokens | Native `atob` / `jwt-decode` |
| **Cron Expression Visualizer & Generator** | • Interactive visual schedule builder (minute, hour, day, month, day-of-week)<br>• Plain-English schedule translation (e.g. *"At 04:00 AM on every Monday"* )<br>• List next 10 calculated execution timestamps | `cronstrue` / cron parser |
| **Regex Tester & Cheat Sheet** | • Real-time regex testing with pattern syntax highlighting<br>• Capture group breakdown and match table<br>• Built-in cheatsheet for common patterns (Email, URL, IP, UUID, phone) | JavaScript `RegExp` engine |
| **Diff & Text Comparator** | • Side-by-side split and unified diff view<br>• Inline character-level and line-level difference highlights<br>• Whitespace trimming and case-insensitive comparison toggles | `diff` / `diff-match-patch` |
| **Web Crypto Hash & Base64 Studio** | • Generate SHA-256, SHA-512, MD5, and HMAC hashes<br>• Base64, URL encode/decode, Hex conversion, and UUID v4 generator | Web Crypto API (`window.crypto.subtle`) |

---

## 4. Kids' Learning Games & Personality Tests

Interactive, gamified components reinforcing the existing educational games and personality modules.

### Kids' Games (`/games`)
1. **Typing Balloon Popper (`/games/typing-balloons`)**
   - *Concept*: Balloons with letters or simple words float up; typing the corresponding key pops the balloon with satisfying sound effects.
   - *Target*: Ages 4–8 (keyboard familiarity & hand-eye coordination).
2. **Pattern Sequence Puzzle (`/games/pattern-puzzle`)**
   - *Concept*: Complete the sequence (e.g. 🍎 🍌 🍎 🍌 [?], 🔵 🔺 🔵 🔺 [?]) with interactive drag-and-drop.
   - *Target*: Ages 3–6 (early logic & cognitive patterning).

### Personality & Engagement (`/personality`)
1. **Archetype / Quick Personality Profile (`/personality/archetype-quiz`)**
   - *Concept*: A 15–20 question streamlined personality quiz providing a visual radar chart archetype breakdown (e.g. Strategist, Creator, Empath).
2. **Visual & Auditory Reaction Time Tester (`/personality/reaction-timer`)**
   - *Concept*: Test millisecond reflexes upon color changes and sound cues with percentile benchmarking.

---

## 5. Phased Implementation Roadmap

### Phase 1: High ROI Workplace Quick Wins
- [ ] **PDF Page Manager (Split / Rotate / Reorder)** — high search demand, natural synergy with PDF Merger.
- [ ] **OCR Image / PDF to Text** — leverages `tesseract.js` for scanned receipts and screenshots.
- [ ] **Finalize PDF to Word (.docx)** — transitions the existing "Coming Soon" tool to "Live".

### Phase 2: Media & Creator Expansions
- [ ] **Screen & Camera Recorder** — uses standard browser Web APIs, zero external dependencies.
- [ ] **Social Media Image / Thumbnail Resizer & Converter** — fast Canvas-based tool with high recurring usage.
- [ ] **Subtitle Hardcoder / Caption Styler** — high value for short-form video creators.

### Phase 3: Developer & Sysadmin Toolkit
- [ ] **JWT Inspector & Decoder** — privacy-first developer staple.
- [ ] **Cron Expression Visualizer & Generator** — zero dependencies, clean UI component.
- [ ] **Side-by-Side Diff Comparator** — fast text comparison tool.
