# **Product Requirements Document (PRD)**

## **Project: SEO Utility Tools Platform & In-Browser Video Editor**

URL: nocaputils.com

### **1\. Overview**

The primary strategic goal of this project is to build a suite of highly useful, 100% client-side web applications to drive organic search traffic (SEO) and cross-promote a portfolio of Android applications under the brand **nocaputils.com**.

The flagship tool in this suite is a lightweight, in-browser video editor. By eliminating backend processing, the application ensures absolute user privacy, zero server-side storage costs, and immediate feedback. The platform will leverage these free utility tools as a top-of-funnel marketing channel to acquire users, monetize via ads, and ultimately convert them into Android app installs.

### **2\. Objectives & Goals**

* **SEO & User Acquisition:** Rank high on search engines for utility-based keywords (e.g., "edit video in browser free", "extract frame from video", "crop video online") to drive massive organic traffic.  
* **App Promotion:** Seamlessly and attractively funnel web users to download the associated Android apps.  
* **Privacy First:** All processing happens locally on the user's device. No data is sent to a server.  
* **Zero Infrastructure:** The app can be hosted on any static file server (GitHub Pages, Vercel, Netlify) with zero backend compute requirements.  
* **Performance & Reliability:** Fluid UI, snappy timeline scrubbing, and graceful handling of browser memory limits (Out-Of-Memory/OOM prevention).

### **3\. SEO & App Promotion Strategy**

To maximize the platform's visibility and conversion rate, the following SEO and marketing requirements must be met:

* **Clean URL Structuring:** URLs must be readable, keyword-rich, logically structured, and placed at the root domain for maximum SEO authority.  
  * *Example:* nocaputils.com/online-video-editor, nocaputils.com/video-frame-extractor, nocaputils.com/video-to-mp3.  
* **On-Page SEO & Content:** Below the actual tool workspace, include a text-rich section (e.g., "How to Edit Videos in Your Browser," "FAQs," and feature descriptions) to provide search engines with crawlable content targeting long-tail keywords.  
* **Technical SEO:** Implement proper \<title\>, \<meta description\>, and canonical tags. Use Schema.org structured data (e.g., SoftwareApplication or WebApplication schemas) to get rich snippets in search results.  
* **Lightning Fast Load Times:** Since it's a static site, optimize initial load times (Core Web Vitals) as this is a major ranking factor for Google. Lazy-load heavy WASM files only when the user initiates an action.  
* **App Cross-Promotion:** Strategically place "Download our Android App for more features\!" Call-To-Action (CTA) buttons or banners near the export/download completion screens.

### **4\. Target Audience**

Content creators, social media managers, and Gen-Z/Millennial users who need a quick, safe, and accessible way to manipulate videos without downloading heavy desktop software, and who resonate with modern, bold web aesthetics.

### **5\. Core Features & Scope (Video Editor)**

#### **5.1. Media Management**

* **Local Upload:** Import video files directly from the local file system using the HTML5 File API.  
* **Format Support:** Input support for common web formats (MP4, WebM, MOV).  
* **Memory Check (Pre-flight):** Upon file selection, the app evaluates file size against estimated available memory. If the file is too large, it warns the user and clears the file reference.

#### **5.2. Timeline & Playback**

* **Video Player:** Custom HTML5 video player synchronized with the editing timeline.  
* **Scrubbing:** Click and drag on the timeline to scrub through the video smoothly.  
* **Precise Seeking:** Input fields or buttons to jump to specific timestamps or frames.  
* **Zoom Controls:** Ability to zoom in (for frame-level precision) and zoom out on the timeline.

#### **5.3. Editing & Transformation Tools**

* **Split at Cursor:** A tool to cut the active video segment into two distinct segments at the current playhead position.  
* **Delete Segment:** Remove a selected segment from the timeline.  
* **Trim:** Drag the edges of a video segment to shorten its start or end points.  
* **Crop & Resize:** Allow users to crop the video to specific aspect ratios (e.g., 1:1 Square for Instagram, 9:16 for TikTok/Reels, 16:9 for YouTube) or freeform cropping.  
* **Rotate & Flip:** 90-degree rotations (left/right) and horizontal/vertical flipping.  
* **Speed Adjustment:** Change the playback speed of a selected segment (e.g., 0.5x for slow-mo, 2.0x for fast-forward).

#### **5.4. Visual & Audio Enhancements**

* **Color Finetuning:** Sliders to adjust Brightness, Contrast, and Saturation.  
* **Filters:** Pre-built, lightweight visual filters (e.g., Grayscale, Sepia, Vintage).  
* **Annotations (Text/Stickers):** Add customizable text overlays or basic emoji/stickers to the video at specific timestamps.  
* **Audio Controls:** Ability to mute the original video audio, adjust volume levels, or detach/remove the audio track entirely.

#### **5.5. Export & Rendering**

* **Format Options:** Export to popular formats (e.g., MP4/H.264, WebM, GIF).  
* **Resolution/Quality:** Options to keep original quality or compress (e.g., 1080p, 720p).  
* **Local Download:** Generates a Blob URL upon completion for direct local download.

#### **5.6. Memory Management & OOM Handling**

* **Active Memory Monitoring:** Use navigator.deviceMemory to set dynamic file size limits.  
* **Garbage Collection:** Explicitly revoke Blob URLs (URL.revokeObjectURL) to free up RAM.  
* **OOM Notification:** Catch WASM memory allocation errors, display a user-friendly modal, and reset the state.

### **6\. User Interface & Experience (UI/UX)**

The UI must employ a **Neo-Brutalism design style** while remaining DOM-lightweight to reserve browser resources for video processing. This aesthetic perfectly targets the Gen-Z/creator demographic and aligns with the "nocap" branding.

* **Aesthetic Characteristics:**  
  * **High Contrast & Bold Typography:** Use large, highly legible, sans-serif fonts.  
  * **Stark Borders & Hard Shadows:** UI elements (buttons, modals, timeline tracks) should feature thick, solid black outlines and distinct, unblurred drop shadows (e.g., box-shadow: 4px 4px 0px 0px \#000000;).  
  * **Vibrant Flat Colors:** Utilize a palette of bold, web-safe colors (raw yellows, electric blues, bright pinks) mixed with stark white and pitch black.  
  * **Theme:** Support both a high-contrast Light mode (for maximum brutalist effect) and a deep Dark mode variant to prevent eye strain during long editing sessions.  
* **Fullscreen Mode:** A toggle button to expand the editor to fill the entire browser window for a distraction-free editing experience.  
* **Privacy Messaging:** Prominently display a quirky but clear badge (e.g., "No Cap: 100% Private \- Your files never leave your device\!") to build trust.  
* **App Promotion Placements:** Distinct, brutalist-styled "Download on Google Play" badges integrated natively into the top navigation and the post-export success modal.  
* **Monetization (Ad Spaces):** Incorporate two banner ad spaces without compromising UX. Container boxes should match the Neo-brutalist styling:  
  * *Horizontal Banner:* A leaderboard ad (e.g., 728x90) placed discreetly at the very bottom of the page.  
  * *Vertical Banner:* A skyscraper ad (e.g., 160x600) located in a dedicated right-hand sidebar.  
* **Layout Structure:**  
  * **Top Nav:** App title, Fullscreen toggle, Privacy badge, App Promo Button, Export button.  
  * **Main Content Area:** Video Preview (top), Toolbar with categorical tabs (Trim, Crop, Audio, Filters, Text), Timeline (bottom).  
  * **Right Sidebar:** Vertical ad space container.  
  * **Footer Area:** SEO text content, followed by the Horizontal ad space container.

### **7\. Technical Architecture & Stack**

* **Frontend Framework:** React or Vue.js with Tailwind CSS (Tailwind is highly effective for rapidly styling Neo-Brutalism via custom utility classes).  
* **Routing:** React Router (or equivalent) to manage the clean nocaputils.com/... URL structure.  
* **Video Processing Engine:** FFmpeg.wasm (@ffmpeg/ffmpeg) configured with SharedArrayBuffer headers (Cross-Origin-Opener-Policy, Cross-Origin-Embedder-Policy).  
* **Timeline:** HTML5 Canvas for optimal rendering of waveforms/thumbnails.  
* **Storage/Memory Layer:** Origin Private File System (OPFS) to act as a high-performance local virtual file system for FFmpeg, preventing RAM overload.

### **8\. Risks & Mitigations**

| Risk | Impact | Mitigation |
| :---- | :---- | :---- |
| **Browser Memory Limits (OOM)** | High | Heavily utilize **OPFS** instead of pure RAM for FFmpeg virtual filesystem. Enforce aggressive garbage collection. |
| **Export Performance** | Medium | Keep the UI thread unblocked by running FFmpeg in a Web Worker. Display clear progress indicators. |
| **SEO Cannibalization** | Medium | Ensure each tool in the suite has highly specific \<title\> tags and unique text content so they don't compete with each other on Google. |

### **9\. Future Tool Concepts (Roadmap)**

To continue building the SEO footprint and driving users to the Android apps, the platform will expand to include other related media tools directly off the root domain. By building the main editor, the underlying logic for all of these standalone tools will already be written.

#### **9.1. Video Frame Extractor**

* **URL Target:** /video-frame-extractor  
* **Description:** A tool allowing users to extract high-quality still images from any video file entirely in the browser.  
* **Core Features:** Exact Starting/Ending frame, specific timestamp extraction, frame count extraction, JPG/PNG export.

#### **9.2. Video to Audio (MP3) Extractor**

* **URL Target:** /video-to-mp3  
* **Description:** Strips the visual track from a video and exports just the audio as an MP3 or WAV file. Highly searched utility keyword.

#### **9.3. Online Video Compressor**

* **URL Target:** /compress-video  
* **Description:** A simple, one-click tool to reduce video file sizes for Discord, email, or social media uploads. Allows users to set a target file size (e.g., "Compress to under 25MB").

#### **9.4. Video to GIF Converter**

* **URL Target:** /video-to-gif  
* **Description:** Trims a video segment and exports it as an optimized, looping GIF image. Offers framerate and resolution controls.

#### **9.5. Video Cropper & Resizer**

* **URL Target:** /crop-video  
* **Description:** A standalone version of the cropping tool, optimized specifically for users searching to resize horizontal videos into vertical formats (TikTok/Reels/Shorts).

#### **9.6. Audio-Reactive Music Visualizer**

* **URL Target:** /music-visualizer or /audio-to-video  
* **Description:** Converts an audio file (MP3/WAV) into a video file (MP4) featuring dynamic, audio-reactive visualizers (waveforms, bars, spectrums) tailored for YouTube, Spotify Canvas, or social media music uploads.  
* **Core Features:** \* Upload custom static background images or solid colors.  
  * Select from various visualizer styles (circular spectrum, frequency bars, continuous waveform).  
  * Customize colors, scaling, and position of the visualizer on the canvas.  
  * *Technical note:* Leverages the Web Audio API to analyze audio frequencies in real-time, renders the visualizations to an HTML5 Canvas frame-by-frame, and encodes it into an MP4 utilizing FFmpeg.wasm.