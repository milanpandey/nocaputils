// ── Phonics Map: letter → word + emoji ──
export const PHONICS_MAP: Record<string, { word: string; emoji: string }> = {
  A: { word: "Apple", emoji: "🍎" },
  B: { word: "Ball", emoji: "🏀" },
  C: { word: "Cat", emoji: "🐱" },
  D: { word: "Dog", emoji: "🐶" },
  E: { word: "Egg", emoji: "🥚" },
  F: { word: "Fish", emoji: "🐟" },
  G: { word: "Goat", emoji: "🐐" },
  H: { word: "Hat", emoji: "🎩" },
  I: { word: "Ice cream", emoji: "🍦" },
  J: { word: "Jar", emoji: "🫙" },
  K: { word: "Kite", emoji: "🪁" },
  L: { word: "Lion", emoji: "🦁" },
  M: { word: "Moon", emoji: "🌙" },
  N: { word: "Nest", emoji: "🪺" },
  O: { word: "Orange", emoji: "🍊" },
  P: { word: "Pig", emoji: "🐷" },
  Q: { word: "Queen", emoji: "👑" },
  R: { word: "Rainbow", emoji: "🌈" },
  S: { word: "Sun", emoji: "☀️" },
  T: { word: "Tree", emoji: "🌳" },
  U: { word: "Umbrella", emoji: "☂️" },
  V: { word: "Van", emoji: "🚐" },
  W: { word: "Whale", emoji: "🐋" },
  X: { word: "Xylophone", emoji: "🎵" },
  Y: { word: "Yo-yo", emoji: "🪀" },
  Z: { word: "Zebra", emoji: "🦓" },
};

// ── Voice Scripts ──
export const VOICE_CORRECT = [
  "Well done!",
  "Great job!",
  "You got it!",
  "Woohoo!",
  "Brilliant!",
  "Amazing!",
  "Perfect!",
  "Fantastic!",
];

export const VOICE_WRONG = [
  "Try again!",
  "Oops! Try once more!",
  "Not quite! Try again!",
  "Almost! Give it another go!",
];

export const VOICE_FAIL = (char: string, isNumber: boolean) =>
  `That's okay! This is the ${isNumber ? "number" : "letter"} ${char}!`;

export const VOICE_PROMPT_LETTER = (char: string) => {
  const variants = [
    `Where's the letter ${char}?`,
    `Can you find the letter ${char}?`,
    `Press the letter ${char}!`,
  ];
  return variants[Math.floor(Math.random() * variants.length)];
};

export const VOICE_PROMPT_NUMBER = (char: string) => {
  const variants = [
    `Where's the number ${char}?`,
    `Can you find the number ${char}?`,
    `Press the number ${char}!`,
  ];
  return variants[Math.floor(Math.random() * variants.length)];
};

export const VOICE_STREAK: Record<number, string> = {
  3: "Three in a row! Nice!",
  5: "Five in a row! You're on fire!",
  10: "Ten correct! You're a superstar!",
  15: "Fifteen! Unbelievable!",
  20: "Twenty in a row! You're a champion!",
};

export const VOICE_NEW_RECORD = "New record! You're amazing!";

// ── Keyboard Layout ──
export const KEYBOARD_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

// ── Character Colors (Bauhaus palette cycle) ──
export const CHAR_COLORS = [
  "#E63946", // red
  "#457B9D", // blue
  "#F4D35E", // yellow
  "#2A9D8F", // teal
  "#E76F51", // coral
  "#6A4C93", // purple
  "#1D3557", // navy
  "#F77F00", // orange
];

export function getCharColor(char: string): string {
  const code = char.charCodeAt(0);
  return CHAR_COLORS[code % CHAR_COLORS.length];
}

// ── CVC Word List (for future Word Typing mode) ──
export const CVC_WORDS = {
  tier1: ["CAT", "DOG", "SUN", "BIG", "RED", "HAT", "PIG", "CUP", "BUS", "BED"],
  tier2: ["FROG", "SHIP", "CLAP", "DRUM", "FLAT"],
  tier3: ["DUCK", "FISH", "BIRD", "JUMP", "KING", "PLAY", "RING", "SING", "TREE"],
};

// ── Helpers ──
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateCharacter(
  mode: "letters" | "numbers",
  caseMode: "upper" | "lower" | "mixed",
  exclude?: string
): string {
  const pool =
    mode === "numbers"
      ? "0123456789".split("")
      : "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  let char: string;
  do {
    char = pickRandom(pool);
  } while (char === exclude && pool.length > 1);

  if (mode === "letters") {
    if (caseMode === "lower") return char.toLowerCase();
    if (caseMode === "mixed") return Math.random() > 0.5 ? char : char.toLowerCase();
  }

  return char;
}
