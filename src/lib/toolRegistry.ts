// ─── Tool Registry ─────────────────────────────────────────────────────────
// Single source of truth for every tool on nocaputils.
// Import from here instead of maintaining per-page arrays.

export type ToolCategory = "creator" | "workplace" | "games" | "personality";

export interface ToolEntry {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  href: string;
  emoji: string;
  keywords: string[];
  status: "Live" | "Coming Soon";
  color: string;
  isPopular?: boolean;
  /** Extra badge text (e.g. "Ages 2-6", "PDF + Excel") */
  badge?: string;
  /** Art class for homepage legacy cards (creator tools only) */
  artClass?: string;
}

// ─── Category Metadata ─────────────────────────────────────────────────────

export interface CategoryMeta {
  key: ToolCategory;
  label: string;
  tagline: string;
  color: string;
  emoji: string;
  href: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: "creator",
    label: "Creator Tools",
    tagline: "Professional audio & video tools, 100% in-browser.",
    color: "#F2EF13",
    emoji: "🎬",
    href: "/creator-tools",
  },
  {
    key: "workplace",
    label: "Workplace Utilities",
    tagline: "PDFs, spreadsheets, markdown & more — free and private.",
    color: "#2A9D8F",
    emoji: "💼",
    href: "/workplaceutilities",
  },
  {
    key: "games",
    label: "Kids' Games",
    tagline: "Free learning games for kids — play now!",
    color: "#E63946",
    emoji: "🎮",
    href: "/games",
  },
  {
    key: "personality",
    label: "Personality Tests",
    tagline: "Free. Private. Insightful.",
    color: "#9C27B0",
    emoji: "🦋",
    href: "/personality",
  },
];

// ─── Full Tool Catalog ─────────────────────────────────────────────────────

export const ALL_TOOLS: ToolEntry[] = [
  // ── Creator Tools ──
  {
    id: "online-video-editor",
    name: "Video Editor",
    description: "Trim, crop, and filter in-browser.",
    category: "creator",
    href: "/online-video-editor",
    emoji: "🎬",
    keywords: ["video", "editor", "trim", "crop", "filter", "cut", "edit"],
    status: "Live",
    color: "#F2EF13",
    artClass: "tool-art-edit",
    isPopular: true,
  },
  {
    id: "video-frame-extractor",
    name: "Frame Grab",
    description: "Extract high-res cinematic stills.",
    category: "creator",
    href: "/video-frame-extractor",
    emoji: "🖼️",
    keywords: ["frame", "grab", "extract", "screenshot", "still", "image", "capture"],
    status: "Live",
    color: "#457B9D",
    artClass: "tool-art-grab",
  },
  {
    id: "video-to-gif",
    name: "Video to GIF",
    description: "Convert clips to looping GIFs.",
    category: "creator",
    href: "/video-to-gif",
    emoji: "🔄",
    keywords: ["gif", "video", "convert", "loop", "animation", "meme"],
    status: "Live",
    color: "#E76F51",
    artClass: "tool-art-gif",
    isPopular: true,
  },
  {
    id: "compress-video",
    name: "Video Compressor",
    description: "Shrink files, keep quality.",
    category: "creator",
    href: "/compress-video",
    emoji: "🗜️",
    keywords: ["compress", "video", "shrink", "reduce", "size", "smaller"],
    status: "Live",
    color: "#2A9D8F",
    artClass: "tool-art-shrink",
    isPopular: true,
  },
  {
    id: "video-to-mp3",
    name: "Video to MP3",
    description: "Extract pure audio from any video.",
    category: "creator",
    href: "/video-to-mp3",
    emoji: "🎵",
    keywords: ["mp3", "audio", "extract", "video", "sound", "convert"],
    status: "Live",
    color: "#6A4C93",
    artClass: "tool-art-mp3",
  },
  {
    id: "audio-to-mp4",
    name: "Audio to MP4",
    description: "Convert audio to video in seconds.",
    category: "creator",
    href: "/audio-to-mp4",
    emoji: "🎞️",
    keywords: ["audio", "mp4", "video", "convert", "music"],
    status: "Live",
    color: "#F77F00",
    artClass: "tool-art-mp4",
  },
  {
    id: "change-video-speed",
    name: "Video Speed Control",
    description: "Speed up or slow down videos.",
    category: "creator",
    href: "/change-video-speed",
    emoji: "⏩",
    keywords: ["speed", "slow", "fast", "video", "tempo", "playback"],
    status: "Live",
    color: "#E63946",
    artClass: "tool-art-speed",
  },
  {
    id: "music-visualizer",
    name: "Music Visualizer",
    description: "Audio-reactive videos for YouTube.",
    category: "creator",
    href: "/music-visualizer",
    emoji: "📊",
    keywords: ["music", "visualizer", "audio", "reactive", "youtube", "waveform"],
    status: "Live",
    color: "#457B9D",
    artClass: "tool-art-visualizer",
  },
  {
    id: "audio-effects",
    name: "Audio Effects",
    description: "Apply filters, delays, and EQs to audio.",
    category: "creator",
    href: "/audio-effects",
    emoji: "🎛️",
    keywords: ["audio", "effects", "filter", "delay", "eq", "reverb", "sound"],
    status: "Live",
    color: "#9C27B0",
    artClass: "tool-art-audio",
  },

  // ── Workplace Utilities ──
  {
    id: "file-bills",
    name: "File Bills & Expense Ledger",
    description: "Organize receipt photos into a compiled printable PDF and Excel summary ledger.",
    category: "workplace",
    href: "/workplaceutilities/file-bills",
    emoji: "🧾",
    keywords: ["bills", "expense", "receipt", "ledger", "invoice", "pdf", "excel"],
    status: "Live",
    color: "#2A9D8F",
    badge: "PDF + Excel",
    isPopular: true,
  },
  {
    id: "pdf-merge",
    name: "PDF Merger",
    description: "Combine multiple PDF documents into a single consolidated file offline.",
    category: "workplace",
    href: "/workplaceutilities/pdf-merge",
    emoji: "📚",
    keywords: ["pdf", "merge", "combine", "join", "document"],
    status: "Live",
    color: "#457B9D",
    badge: "Fast & Private",
    isPopular: true,
  },
  {
    id: "compress-pdf",
    name: "PDF Compressor",
    description: "Compress and reduce PDF file size directly in your browser.",
    category: "workplace",
    href: "/workplaceutilities/compress-pdf",
    emoji: "🗜️",
    keywords: ["pdf", "compress", "reduce", "size", "shrink"],
    status: "Live",
    color: "#E76F51",
    badge: "100% Private",
  },
  {
    id: "merge-excel",
    name: "Merge Excel Files",
    description: "Combine multiple Excel spreadsheets (.xlsx, .xls, .csv) into one workbook.",
    category: "workplace",
    href: "/workplaceutilities/merge-excel",
    emoji: "📊",
    keywords: ["excel", "merge", "spreadsheet", "xlsx", "csv", "combine"],
    status: "Live",
    color: "#107C41",
    badge: "XLSX + CSV",
  },
  {
    id: "archive-files",
    name: "Archive Files (ZIP/TAR)",
    description: "Compress multiple files into ZIP or extract archives offline without server uploads.",
    category: "workplace",
    href: "/workplaceutilities/archive-files",
    emoji: "📦",
    keywords: ["zip", "tar", "archive", "compress", "extract", "unzip"],
    status: "Live",
    color: "#F4A261",
    badge: "ZIP / Extract",
  },
  {
    id: "pdf-to-word",
    name: "PDF to Word Converter",
    description: "Convert PDF documents to editable Microsoft Word (.docx) files offline.",
    category: "workplace",
    href: "/workplaceutilities/pdf-to-word",
    emoji: "📄",
    keywords: ["pdf", "word", "docx", "convert", "document"],
    status: "Coming Soon",
    color: "#E63946",
    badge: "In Development",
  },
  {
    id: "pdf-to-markdown",
    name: "PDF → Markdown",
    description: "Extract clean Markdown from text-based PDFs — headings, tables, lists, bold & italic.",
    category: "workplace",
    href: "/workplaceutilities/pdf-to-markdown",
    emoji: "📄→✍️",
    keywords: ["pdf", "markdown", "convert", "extract", "text", "md"],
    status: "Live",
    color: "#2A9D8F",
    badge: "WASM · Private",
  },
  {
    id: "markdown-editor",
    name: "Markdown Editor",
    description: "Write and preview Markdown live in a split-pane editor. Toolbar shortcuts, import/export, word count.",
    category: "workplace",
    href: "/workplaceutilities/markdown-editor",
    emoji: "✍️",
    keywords: ["markdown", "editor", "write", "preview", "md", "text"],
    status: "Live",
    color: "#6A4C93",
    badge: "Live Preview",
    isPopular: true,
  },
  {
    id: "markdown-to-pdf",
    name: "Markdown → PDF",
    description: "Convert Markdown to a styled, print-ready PDF. Choose paper size (A4/Letter) and document theme.",
    category: "workplace",
    href: "/workplaceutilities/markdown-to-pdf",
    emoji: "✍️→📄",
    keywords: ["markdown", "pdf", "convert", "export", "print", "a4", "letter"],
    status: "Live",
    color: "#E76F51",
    badge: "A4 · Letter",
  },
  {
    id: "markdown-table",
    name: "Markdown Table Generator",
    description: "Build GitHub-Flavored Markdown tables visually. Import CSV, set alignment per column, copy in one click.",
    category: "workplace",
    href: "/workplaceutilities/markdown-table",
    emoji: "📊",
    keywords: ["markdown", "table", "generator", "csv", "github", "gfm"],
    status: "Live",
    color: "#457B9D",
    badge: "CSV Import",
  },

  // ── Kids' Games ──
  {
    id: "wheres-the-letter",
    name: "Where's the Letter?",
    description: "A voice-driven game teaching letter & number recognition through keyboard play.",
    category: "games",
    href: "/games/wheres-the-letter",
    emoji: "🔤",
    keywords: ["letter", "alphabet", "keyboard", "voice", "learn", "kids"],
    status: "Live",
    color: "#E63946",
    badge: "Ages 2–6",
  },
  {
    id: "memory-match",
    name: "Memory Match",
    description: "Classic memory card game with fun animal, food, and vehicle themes.",
    category: "games",
    href: "/games/memory-match",
    emoji: "🧠",
    keywords: ["memory", "match", "card", "game", "brain", "kids"],
    status: "Live",
    color: "#457B9D",
    badge: "Ages 2–6",
    isPopular: true,
  },
  {
    id: "color-quest-game",
    name: "Color Quest",
    description: "Learn colors through interactive voice-guided puzzles.",
    category: "games",
    href: "/games/color-quest",
    emoji: "🎨",
    keywords: ["color", "quest", "puzzle", "learn", "kids", "voice"],
    status: "Live",
    color: "#2A9D8F",
    badge: "Ages 2–5",
  },
  {
    id: "count-along",
    name: "Count Along",
    description: "Count the objects and tap the right number! Progressive counting fun.",
    category: "games",
    href: "/games/count-along",
    emoji: "🔢",
    keywords: ["count", "number", "math", "kids", "learn"],
    status: "Live",
    color: "#F77F00",
    badge: "Ages 2–6",
  },
  {
    id: "sound-safari",
    name: "Sound Safari",
    description: "Listen to animal sounds and find the matching animal!",
    category: "games",
    href: "/games/sound-safari",
    emoji: "🎵",
    keywords: ["sound", "animal", "safari", "listen", "kids", "music"],
    status: "Live",
    color: "#6A4C93",
    badge: "Ages 2–5",
  },
  {
    id: "shape-builder",
    name: "Shape Builder",
    description: "Match geometric shapes — circles, triangles, stars, and more.",
    category: "games",
    href: "/games/shape-builder",
    emoji: "🔺",
    keywords: ["shape", "geometry", "match", "triangle", "circle", "kids"],
    status: "Live",
    color: "#F4D35E",
    badge: "Ages 2–5",
  },

  // ── Personality Tests ──
  {
    id: "rorschach-test",
    name: "Rorschach Test",
    description: "Explore 10 interactive inkblots, choose what you see, and discover your perceptual archetype!",
    category: "personality",
    href: "/personality/rorschach-test",
    emoji: "🦋",
    keywords: ["rorschach", "inkblot", "psychology", "personality", "test", "perception"],
    status: "Live",
    color: "#9C27B0",
    badge: "All Ages",
    isPopular: true,
  },
  {
    id: "color-quest-personality",
    name: "Color Quest",
    description: "Discover your true personality color in this fun, quick, mini-adventure!",
    category: "personality",
    href: "/personality/color-quest",
    emoji: "🎨",
    keywords: ["color", "quest", "personality", "test", "fun"],
    status: "Live",
    color: "#F77F00",
    badge: "4-12 Years",
  },
];

// ─── Derived Subsets ────────────────────────────────────────────────────────

export const POPULAR_TOOLS = ALL_TOOLS.filter((t) => t.isPopular);

export function getToolsByCategory(category: ToolCategory): ToolEntry[] {
  return ALL_TOOLS.filter((t) => t.category === category);
}

export function getCategoryMeta(category: ToolCategory): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.key === category);
}

// ─── Client-Side Search ─────────────────────────────────────────────────────

export function searchTools(query: string): ToolEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_TOOLS;

  const tokens = q.split(/\s+/);

  return ALL_TOOLS.filter((tool) => {
    const haystack = [
      tool.name,
      tool.description,
      ...tool.keywords,
      tool.badge ?? "",
    ]
      .join(" ")
      .toLowerCase();

    // Every token must match somewhere in the haystack
    return tokens.every((token) => haystack.includes(token));
  });
}
