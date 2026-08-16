export interface BlogPostItem {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    category: "Release" | "Tech" | "Tutorial";
    tags: string[];
    toolPath?: string;
    content: string;
}

export const BLOG_POSTS: BlogPostItem[] = [
    // ─── Aug 16, 2026 ────────────────────────────────────────────────────────
    {
        slug: "extract-text-pdf-to-markdown",
        title: "Extract Text and Formatting with PDF to Markdown",
        date: "Aug 16, 2026",
        category: "Release",
        tags: ["Workplace", "PDF", "Markdown", "OCR"],
        toolPath: "/workplaceutilities/pdf-to-markdown",
        excerpt: "Reconstruct structured Markdown from PDFs using client-side layout parsing and built-in local OCR for scanned pages.",
        content: `Extracting content from PDF documents has historically meant losing all structural formatting—headings get flattened, tables break into scattered text, and scanned pages fail completely.

Today, we're releasing **PDF to Markdown**, a 100% client-side converter that turns PDF documents into clean, structured Markdown.

### Intelligent Layout Reconstruction
By analyzing font sizes, spatial positioning, and text weights directly with \`pdfjs-dist\`, our engine automatically detects:
- **Heading Levels**: Headings (#, ##, ###) inferred from font scale and line spacing.
- **Text Styles**: Bold, italic, and inline code formatting preserved.
- **Lists & Tables**: Automatically groups items into Markdown bullet lists and GFM tables.

### Client-Side OCR for Scanned Documents
When you upload a scanned PDF or image-only page, our built-in **Tesseract.js OCR engine** activates with a single click. Optical character recognition runs right inside your browser worker threads without sending a single byte to an external server.`
    },
    {
        slug: "export-vector-documents-markdown-to-pdf",
        title: "Export Beautiful Vector Documents with Markdown to PDF",
        date: "Aug 16, 2026",
        category: "Release",
        tags: ["Workplace", "Markdown", "PDF", "Design"],
        toolPath: "/workplaceutilities/markdown-to-pdf",
        excerpt: "Convert Markdown notes and reports into styled vector PDFs with 5 curated themes, print preview, and selectable text.",
        content: `Markdown is the cleanest way to write notes, documentation, and reports, but sharing them as polished documents often requires tedious word processor formatting.

Our new **Markdown to PDF** utility converts any Markdown text into a beautifully styled, print-ready PDF document in seconds.

### 5 Curated Document Themes
Choose from five distinct aesthetic themes tailored for any context:
- **Minimal**: Crisp serif typography inspired by classic editorial design.
- **Academic**: Times-style formatting structured for research papers.
- **Report**: High-contrast modern sans-serif with bold headers and colored callouts.
- **Nature**: Earthy green accents on warm paper tones.
- **Dark**: High-legibility dark theme for digital reading.

### Smart Vector Output & Selectable Text
Unlike basic canvas screenshots that blur when printed or zoomed, our default **Vector PDF engine** utilizes browser-native print rendering. This ensures razor-sharp vector typography, smart page breaks that avoid cutting table rows or headings, and 100% selectable text.`
    },
    {
        slug: "build-clean-markdown-tables",
        title: "Build Clean Markdown Tables with Visual Markdown Table Generator",
        date: "Aug 16, 2026",
        category: "Release",
        tags: ["Workplace", "Markdown", "Tables", "Productivity"],
        toolPath: "/workplaceutilities/markdown-table",
        excerpt: "Easily design, format, align, and generate GitHub Flavored Markdown tables with an intuitive interactive spreadsheet grid.",
        content: `Hand-formatting tables with pipes (\`|\`) and hyphens (\`---\`) in Markdown is slow and error-prone. One misplaced pipe breaks the entire layout.

To solve this, we built the **Markdown Table Generator**—an interactive spreadsheet-like grid that makes creating tables effortless.

### Features That Speed Up Your Workflow
- **Interactive Grid**: Add, delete, and reorder rows and columns with single clicks.
- **Column Alignment**: Visually set text alignment to Left, Center, or Right with live pipe syntax updating.
- **CSV / TSV Import & Export**: Paste data directly from Excel, Google Sheets, or CSV files to generate formatted Markdown tables instantly.
- **One-Click Copy**: Copy generated GitHub Flavored Markdown (GFM) directly to your clipboard or download as a \`.md\` snippet.`
    },
    {
        slug: "streamline-writing-markdown-editor",
        title: "Streamline Writing with the Real-Time Markdown Editor",
        date: "Aug 16, 2026",
        category: "Release",
        tags: ["Workplace", "Markdown", "Writing", "Editor"],
        toolPath: "/workplaceutilities/markdown-editor",
        excerpt: "A distraction-free, side-by-side Markdown editor with instant live preview, word statistics, and HTML/MD export.",
        content: `Whether you are drafting a README, writing blog posts, or taking quick meeting notes, having a distraction-free writing environment makes all the difference.

The **nocaputils Markdown Editor** gives you a fast, privacy-first editor that runs completely in your browser.

### Key Highlights
- **Side-by-Side Live Preview**: See your rendered HTML update in real-time as you type.
- **Formatting Toolbar & Keyboard Shortcuts**: Quickly insert headings, bold, italic, blockquotes, code blocks, and tables.
- **Live Statistics**: Real-time word, character, and line counters keep your writing on target.
- **Export Options**: Export your work as raw \`.md\`, formatted HTML, or copy directly to clipboard.`
    },

    // ─── Aug 2, 2026 ─────────────────────────────────────────────────────────
    {
        slug: "compress-bundle-archive-files",
        title: "Compress and Bundle Files with Archive Files (ZIP/TAR)",
        date: "Aug 2, 2026",
        category: "Release",
        tags: ["Workplace", "Archive", "ZIP", "Security"],
        toolPath: "/workplaceutilities/archive-files",
        excerpt: "Create and unpack ZIP and TAR archives right in the browser with password protection and custom compression levels.",
        content: `Archiving multiple files shouldn't require installing desktop utilities or uploading sensitive client deliverables to cloud zip services.

With **Archive Files**, you can bundle, compress, and extract ZIP and TAR files directly within your browser.

### Complete Client-Side Archiving
- **ZIP & TAR Creation**: Drag and drop multiple files or folders to package them into a single downloadable archive.
- **Compression Controls**: Fine-tune compression ratios for optimal balance between speed and file size.
- **Local Extraction**: Inspect archive contents and extract individual files without saving unwanted temp files to disk.
- **Zero Server Uploads**: Your files never leave your machine.`
    },
    {
        slug: "consolidate-spreadsheets-merge-excel",
        title: "Consolidate Spreadsheets with Merge Excel Files",
        date: "Aug 2, 2026",
        category: "Release",
        tags: ["Workplace", "Excel", "Data", "Spreadsheet"],
        toolPath: "/workplaceutilities/merge-excel",
        excerpt: "Combine multiple XLSX and CSV workbooks into a single master spreadsheet or multi-sheet workbook instantly.",
        content: `Consolidating quarterly reports, monthly sales sheets, or data exports from different departments often means hours of manual copying and pasting.

The **Merge Excel Files** utility automates spreadsheet combination safely in your browser.

### Versatile Merge Modes
- **Combine into One Sheet**: Stack rows from multiple identical sheets into one unified master table with automatic header detection.
- **Multi-Tab Workbook**: Preserve each uploaded file as its own named tab in a single master \`.xlsx\` workbook.
- **CSV & XLSX Support**: Seamlessly mix and match Excel workbooks and comma-separated value files.`
    },
    {
        slug: "combine-documents-pdf-merger",
        title: "Combine Documents Seamlessly with PDF Merger",
        date: "Aug 2, 2026",
        category: "Release",
        tags: ["Workplace", "PDF", "Organization", "Workflow"],
        toolPath: "/workplaceutilities/pdf-merge",
        excerpt: "Reorder, combine, and merge multiple PDF files into a single unified document with intuitive drag-and-drop.",
        content: `Combining separate PDF pages, scanned attachments, and contract agreements into a single file is one of the most common workplace tasks.

Our new **PDF Merger** makes combining documents fast and effortless.

### Effortless Document Assembly
- **Drag-and-Drop Reordering**: Rearrange files and pages in any order before merging.
- **Visual Previews**: See thumbnail previews of your documents to confirm page sequence.
- **Instant Processing**: Merging happens in milliseconds using client-side WebAssembly, ensuring strict data confidentiality.`
    },
    {
        slug: "shrink-heavy-documents-compress-pdf",
        title: "Shrink Heavy Documents with PDF Compressor",
        date: "Aug 2, 2026",
        category: "Release",
        tags: ["Workplace", "PDF", "Compression", "Efficiency"],
        toolPath: "/workplaceutilities/compress-pdf",
        excerpt: "Reduce PDF file sizes for easy email attachments and archiving while maintaining crisp document readability.",
        content: `Large PDF files often hit strict email size caps and take forever to upload.

With the **nocaputils PDF Compressor**, you can significantly reduce document file sizes right in your browser.

### Tailored Compression Profiles
- **Low, Medium, and High Compression**: Choose the right balance between file size savings and visual clarity.
- **Real-Time Size Comparison**: View exact before-and-after byte counts and percentage reductions before downloading.
- **Text & Vector Integrity**: Optimizes heavy embedded images while keeping text and vectors razor sharp.`
    },
    {
        slug: "convert-documents-pdf-to-word",
        title: "Convert Documents Privately with PDF to Word",
        date: "Aug 2, 2026",
        category: "Release",
        tags: ["Workplace", "PDF", "Word", "DOCX"],
        toolPath: "/workplaceutilities/pdf-to-word",
        excerpt: "Turn PDF files into editable Microsoft Word (.docx) documents directly in your browser with zero server uploads.",
        content: `Need to make quick edits to a PDF agreement or proposal without the original source file?

Our **PDF to Word** converter transforms static PDF documents into fully editable Microsoft Word (\`.docx\`) files.

### Clean Document Formatting
- **Preserves Text & Hierarchy**: Accurately reproduces paragraphs, bold/italic text, and heading structures.
- **Table Reconstruction**: Converts document tables into editable Word tables.
- **100% Private**: Ideal for legal, financial, and confidential documents that cannot be uploaded to third-party conversion websites.`
    },
    {
        slug: "organize-receipts-file-bills",
        title: "Organize Receipts and Invoices with File Bills & Expense Ledger",
        date: "Aug 2, 2026",
        category: "Release",
        tags: ["Workplace", "Finance", "Expenses", "Ledger"],
        toolPath: "/workplaceutilities/file-bills",
        excerpt: "Track expenses, categorize receipts, and export clean financial summaries locally without uploading confidential data.",
        content: `Tax season and monthly expense reporting can quickly turn chaotic without an organized tracking system.

We built **File Bills & Expense Ledger** to give freelancers, small businesses, and individuals a private, offline expense tracker.

### Simple, Powerful Bookkeeping
- **Receipt & Invoice Logging**: Log vendor names, dates, amounts, payment methods, and tax categories.
- **Instant Expense Summaries**: View visual spending breakdowns across categories in real time.
- **Export to CSV & PDF**: Generate clean expense ledgers ready to hand off to your accountant or submit for company reimbursement.`
    },

    // ─── Aug 1, 2026 ─────────────────────────────────────────────────────────
    {
        slug: "uncover-inner-archetype-color-quest",
        title: "Uncover Your Inner Archetype with Color Quest Personality Test",
        date: "Aug 1, 2026",
        category: "Release",
        tags: ["Personality", "Colors", "Psychology", "Self-Discovery"],
        toolPath: "/personality/color-quest",
        excerpt: "Take a Lüscher-inspired color psychology assessment to reveal insights about your emotional state and personality traits.",
        content: `Color choices reveal much more about human psychology than simple aesthetic preferences.

The **Color Quest Personality Test** is an interactive chromatic assessment inspired by Max Lüscher's classic psychological research on color perception and emotion.

### How It Works
1. **Intuitive Selection**: Choose the colors you are most naturally drawn to across progressive test rounds.
2. **Chromodynamic Analysis**: Our engine evaluates your color preferences, pairings, and rejected hues.
3. **In-Depth Personality Profile**: Receive a personalized breakdown of your dominant archetype, current emotional drivers, stress resilience, and interpersonal strengths.`
    },
    {
        slug: "explore-subconscious-rorschach-test",
        title: "Explore Your Subconscious with the Rorschach Inkblot Test",
        date: "Aug 1, 2026",
        category: "Release",
        tags: ["Personality", "Psychology", "Explorer", "Mind"],
        toolPath: "/personality/rorschach-test",
        excerpt: "Discover classic projective psychological inkblots and explore your perceptual interpretations privately.",
        content: `First introduced by Swiss psychiatrist Hermann Rorschach in 1921, the inkblot test remains one of the most famous projective psychological tools in history.

The **Rorschach Inkblot Explorer** brings this classic assessment into an interactive digital experience.

### What You'll Discover
- **10 Classic Inkblot Plates**: Examine full-resolution plates and record what forms, figures, and patterns you perceive.
- **Perceptual Archetypes**: Explore common popular interpretations and the psychological theories behind form and color responses.
- **Private & Reflective**: Designed for self-discovery and curious minds with zero data storage or external tracking.`
    },

    // ─── Jun 14, 2026 ────────────────────────────────────────────────────────
    {
        slug: "master-numbers-count-along",
        title: "Master Numbers with Count Along",
        date: "Jun 14, 2026",
        category: "Release",
        tags: ["Games", "Math", "Counting", "Kids"],
        toolPath: "/games/count-along",
        excerpt: "A delightful interactive counting game that reinforces early math concepts with engaging animations.",
        content: `Early numeracy is the foundation for all future math learning, and hands-on visual counting is the best way to build confidence.

**Count Along** is an engaging interactive game designed to make learning numbers fun and rewarding for young learners.

### Playful Learning Features
- **Voice-Guided Counting**: Uses the Web Speech API to clearly pronounce numbers as objects are counted.
- **Vibrant Interactive Objects**: Count colorful stars, balloons, animals, and toys across progressive difficulty tiers.
- **Positive Reinforcement**: Celebrate milestones with encouraging sound effects and animations.`
    },
    {
        slug: "construct-create-shape-builder",
        title: "Construct and Create with Shape Builder",
        date: "Jun 14, 2026",
        category: "Release",
        tags: ["Games", "Shapes", "Puzzle", "Kids"],
        toolPath: "/games/shape-builder",
        excerpt: "Assemble geometric shapes and build colorful objects in a hands-on spatial reasoning game.",
        content: `Developing spatial awareness and geometric recognition early in life sets kids up for creative problem-solving and engineering thinking.

With **Shape Builder**, children explore how simple geometric shapes combine to form complex, recognizable objects.

### Interactive Puzzle Play
- **Tangram-Style Building**: Drag, snap, and assemble triangles, squares, circles, and polygons to build houses, animals, cars, and rockets.
- **Multi-Level Challenges**: Progressive stages guide learners from basic silhouette matching to creative freeform construction.
- **Tactile Audio & Haptic Feedback**: Satisfying snap-to-grid mechanics keep kids engaged and focused.`
    },
    {
        slug: "audio-adventure-sound-safari",
        title: "Go on an Audio Adventure with Sound Safari",
        date: "Jun 14, 2026",
        category: "Release",
        tags: ["Games", "Audio", "Animals", "Kids"],
        toolPath: "/games/sound-safari",
        excerpt: "Listen to animal sounds and instrument notes to guess the right match in this auditory game.",
        content: `Children learn about the world through sound just as much as through sight.

**Sound Safari** takes kids on an auditory exploration game that trains active listening and sound-to-image association.

### Explore the Sounds of the World
- **Animal Habitats**: Listen to lions roaring in the savanna, dolphins whistling in the ocean, and birds chirping in the jungle.
- **Musical Instruments**: Recognize the distinct tones of pianos, violins, trumpets, and drums.
- **Auditory Memory Challenges**: Fun interactive quizzes encourage children to listen carefully before choosing their answer.`
    },
    {
        slug: "explore-hues-color-quest-game",
        title: "Explore Hues and Shades with Color Quest Game",
        date: "Jun 14, 2026",
        category: "Release",
        tags: ["Games", "Colors", "Learning", "Kids"],
        toolPath: "/games/color-quest",
        excerpt: "Help kids discover and identify colors through fun, voice-guided interactive challenges.",
        content: `Learning colors is one of childhood's most magical developmental milestones.

The **Color Quest Game** transforms color learning into an interactive quest filled with bright animations and audio guidance.

### Color Learning in Action
- **Voice-Assisted Recognition**: Prompts encourage children to identify primary, secondary, and tertiary colors.
- **Color Mixing Lab**: Interactive experiments show what happens when colors combine (e.g. blue + yellow = green!).
- **Accessible & Kid-Friendly**: Large buttons, high-contrast visuals, and friendly audio narration make it easy for little hands to play independently.`
    },
    {
        slug: "boost-brain-power-memory-match",
        title: "Boost Brain Power with Memory Match",
        date: "Jun 14, 2026",
        category: "Release",
        tags: ["Games", "Memory", "Focus", "Brain"],
        toolPath: "/games/memory-match",
        excerpt: "Test your focus and visual recall with our playful, interactive card-matching game.",
        content: `Memory matching games are proven exercises for sharpening short-term visual recall, concentration, and pattern recognition.

**Memory Match** brings the classic card-flipping game to your browser with smooth animations and responsive controls.

### Game Features
- **Multiple Themed Decks**: Play with charming animal icons, expressive emojis, delicious fruits, and geometric shapes.
- **Adjustable Difficulty**: From beginner 2x2 grids for toddlers up to complex 6x6 memory challenges for adults.
- **Speed & Streak Tracking**: Track your move counts, fastest times, and try to beat your personal best.`
    },

    // ─── May 21, 2026 ────────────────────────────────────────────────────────
    {
        slug: "learn-alphabet-wheres-the-letter",
        title: "Learn the Alphabet with Where's the Letter",
        date: "May 21, 2026",
        category: "Release",
        tags: ["Games", "Alphabet", "Education", "Kids"],
        toolPath: "/games/wheres-the-letter",
        excerpt: "An interactive, speech-powered educational game designed to help children master alphabet recognition.",
        content: `Recognizing letter shapes and matching them with phonics is the first big step in learning to read.

**Where's the Letter?** is an educational game designed to make letter recognition engaging, voice-prompted, and rewarding.

### How It Works
- **Phonics & Audio Prompts**: The game clearly announces letters using native browser speech synthesis ("Can you find the letter B?").
- **Uppercase & Lowercase**: Practice identifying uppercase capitals and lowercase forms.
- **Timer & Score Modes**: Choose relaxed exploration or a friendly countdown timer to test quick recognition.`
    },

    // ─── May 4, 2026 ─────────────────────────────────────────────────────────
    {
        slug: "convert-audio-to-video-audio-to-mp4",
        title: "Convert Audio to Video with Audio to MP4",
        date: "May 4, 2026",
        category: "Release",
        tags: ["Audio", "Video", "Social Media", "YouTube"],
        toolPath: "/audio-to-mp4",
        excerpt: "Turn any audio track and image into a shareable MP4 video ready for YouTube, Instagram, and TikTok.",
        content: `Major platforms like YouTube, Instagram, and TikTok are video-first—they don't accept raw MP3 or WAV uploads.

With **Audio to MP4**, you can turn any song, podcast episode, or voice memo into an HD video with custom cover artwork in seconds.

### Fast, Offline Video Generation
- **Custom Artwork**: Upload your album art, podcast cover, or photograph as the background image.
- **Aspect Ratio Options**: Export in 16:9 for YouTube and desktop, or 9:16 for Shorts, Reels, and TikTok.
- **100% Client-Side FFmpeg**: Encoded directly on your device using WebAssembly for instant processing without upload wait times.`
    },

    // ─── Existing Video & Audio Posts (Apr – Mar 2026) ───────────────────────
    {
        slug: "studio-quality-audio-effects",
        title: "Studio Quality Audio Effects in the Browser",
        date: "Apr 29, 2026",
        category: "Tech",
        tags: ["Audio", "Effects", "Release"],
        toolPath: "/audio-effects",
        excerpt: "Apply professional filters, delays, and EQs to your audio files without leaving the browser.",
        content: `We are expanding our toolkit beyond video with the release of the Audio Effects engine! 

### Granular Audio Processing
You can now apply granular audio processing—including lowpass/highpass filters, delays, pitch shifting, and gain control—directly within your browser. By utilizing the Web Audio API for playback and custom buffer processing for offline export, we ensure zero latency and studio-quality output in a downloadable WAV format. Try it out today!`
    },
    {
        slug: "audio-reactive-music-visualizer",
        title: "Create Audio-Reactive Videos with the Music Visualizer",
        date: "Apr 18, 2026",
        category: "Release",
        tags: ["Music", "Visualizer", "YouTube"],
        toolPath: "/music-visualizer",
        excerpt: "Turn your audio tracks into stunning, audio-reactive visualizers perfect for YouTube.",
        content: `Musicians and podcasters, this one is for you. We've launched a high-performance, NCS-style Music Visualizer. 

### Render Stunning Visuals
Upload your audio track and an image background, and watch our engine generate dynamic, audio-reactive visual particles that pulse to the beat. Best of all, it features deterministic offline rendering to export perfectly smooth MP4 videos. Customize your frequency bands, colors, and particle counts to match your brand.`
    },
    {
        slug: "master-time-with-video-speed-control",
        title: "Master Time with Video Speed Control",
        date: "Apr 1, 2026",
        category: "Release",
        tags: ["Speed", "Effects", "Video"],
        toolPath: "/change-video-speed",
        excerpt: "Speed up or slow down your videos to create dramatic slow-motion or fast-paced timelapses.",
        content: `Time manipulation is a powerful storytelling tool. Our new Video Speed Control utility lets you adjust the playback speed of your videos seamlessly.

### Cinematic Slow-Mo and Timelapses
Want to highlight a split-second action? Slow it down to create a dramatic slow-motion effect. Need to condense a long process? Speed it up into a snappy timelapse. Our browser-based engine re-encodes the video locally, ensuring smooth playback at any speed.`
    },
    {
        slug: "extract-pure-audio-video-to-mp3",
        title: "Extract Pure Audio with Video to MP3",
        date: "Mar 28, 2026",
        category: "Tutorial",
        tags: ["Audio", "MP3", "Workflow"],
        toolPath: "/video-to-mp3",
        excerpt: "Need just the audio from a video? Our new extractor gets the job done securely.",
        content: `Sometimes the best part of a video is the soundtrack. With the new Video to MP3 tool, you can instantly strip the audio track from any video file and save it as a high-quality MP3.

### Workflow Optimization
Whether you're grabbing a soundbite for a podcast, saving a lecture, or extracting a music track, our tool handles it locally. No need to upload your heavy video files to a random converter website—nocaputils does it all offline.`
    },
    {
        slug: "create-looping-gifs-instantly",
        title: "Create Looping GIFs Instantly with Video to GIF",
        date: "Mar 24, 2026",
        category: "Release",
        tags: ["GIF", "Social Media", "Release"],
        toolPath: "/video-to-gif",
        excerpt: "Turn your favorite video clips into high-quality, looping GIFs in seconds.",
        content: `GIFs are the language of the internet, but creating them shouldn't require complex software. Today, we're introducing the Video to GIF converter.

### Fast and Secure
Simply load your video, select the start and end points, and hit convert. The entire process happens in your browser memory, ensuring your original clips remain private. You can customize the framerate and resolution to get the perfect balance between smooth animation and file size.`
    },
    {
        slug: "video-compressor-shrink-files-keep-quality",
        title: "Video Compressor: Shrink Files, Keep Quality",
        date: "Mar 24, 2026",
        category: "Tech",
        tags: ["Compression", "Performance", "Video"],
        toolPath: "/compress-video",
        excerpt: "Learn how our new Video Compressor reduces file sizes significantly while maintaining crisp visuals.",
        content: `Large video files can be a nightmare to share, upload, or store. That's why we added the Video Compressor to the nocaputils suite.

### Advanced Local Encoding
By leveraging advanced encoding algorithms directly in your browser, you can dramatically reduce the file size of your videos without noticeably degrading the quality. Choose your target bitrate, see real-time estimated file sizes, and compress securely on your own device. Say goodbye to upload limits!`
    },
    {
        slug: "extract-cinematic-stills-frame-grab",
        title: "Extract High-Res Cinematic Stills with Frame Grab",
        date: "Mar 23, 2026",
        category: "Tutorial",
        tags: ["Frame Grab", "Images", "Tutorial"],
        toolPath: "/video-frame-extractor",
        excerpt: "Stop taking blurry screenshots of your videos. Use Frame Grab for perfect, full-resolution stills.",
        content: `Have you ever tried to pause a video and take a screenshot, only to end up with a blurry, low-resolution image? We felt that pain, which is why we built the Frame Grab tool.

### Precision Control
Now you can upload your video, scrub through frame by frame, and extract the exact moment you want in its original, uncompressed resolution. Whether you are creating thumbnails for YouTube, capturing a beautiful cinematic still, or just saving a memory, Frame Grab makes it effortless and precise.`
    },
    {
        slug: "introducing-browser-video-editor",
        title: "Introducing the Online Video Editor: Trim, Crop, and Filter in Your Browser",
        date: "Mar 18, 2026",
        category: "Release",
        tags: ["Video Editor", "Release", "Privacy"],
        toolPath: "/online-video-editor",
        content: `We are thrilled to launch the nocaputils Online Video Editor. Our goal has always been to make professional video editing accessible and secure. With our new browser-based editor, you can trim clips, crop dimensions, and apply filters instantly.

### The Power of Client-Side Processing
Because it runs entirely on your device using WebAssembly and FFmpeg, your videos are never uploaded to a server. This guarantees 100% privacy and blazing fast performance, regardless of your internet connection speed.

### Keyboard Shortcuts
To speed up your editing workflow, we've added the following keyboard shortcuts:
- **Space**: Play / Pause
- **Backspace / Delete**: Delete selected clip
- **← / →**: Move playhead by 1 second (Hold **Shift** for precise frame-by-frame scrubbing)`,
        excerpt: "A fast, privacy-first way to edit your videos without leaving your browser."
    }
];

export const getPostBySlug = (slug: string): BlogPostItem | undefined => {
    return BLOG_POSTS.find((p) => p.slug === slug);
};
