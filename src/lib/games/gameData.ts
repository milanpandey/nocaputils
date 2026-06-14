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

// ── Speech Profiles (rate, pitch) ──
// Different energy levels for different moments
export interface SpeechProfile {
  rate: number;
  pitch: number;
}

/** Warm, friendly prompt — slightly slow and melodic */
export const SPEECH_PROMPT: SpeechProfile = { rate: 0.82, pitch: 1.15 };
/** Excited celebration — faster and higher */
export const SPEECH_CELEBRATE: SpeechProfile = { rate: 1.0, pitch: 1.35 };
/** Gentle encouragement on wrong answer — calm, warm */
export const SPEECH_ENCOURAGE: SpeechProfile = { rate: 0.8, pitch: 1.05 };
/** Compassionate "it's okay" on failure — soft and slow */
export const SPEECH_COMFORT: SpeechProfile = { rate: 0.75, pitch: 1.0 };
/** High-energy streak milestone — fast and soaring */
export const SPEECH_STREAK: SpeechProfile = { rate: 1.05, pitch: 1.4 };
/** New record hype — the most excited */
export const SPEECH_RECORD: SpeechProfile = { rate: 1.1, pitch: 1.5 };
/** Hint / repeat — a touch slower, patient */
export const SPEECH_HINT: SpeechProfile = { rate: 0.75, pitch: 1.1 };

// ── Voice Scripts ──
export const VOICE_CORRECT = [
  "Well done!",
  "Great job!",
  "Yaaay, you got it!",
  "Woohoo!",
  "Brilliant!",
  "Amazing!",
  "Perfect!",
  "Fantastic!",
  "Super duper!",
  "Way to go!",
  "You're so smart!",
  "Nailed it!",
];

export const VOICE_WRONG = [
  "Hmm, not that one! Try again!",
  "Oopsie! One more try!",
  "Not quite, but you're so close!",
  "Almost! Give it another go!",
  "Oops! Try the other keys!",
];

export const VOICE_FAIL = (char: string, isNumber: boolean) =>
  `That's okay! This is the ${isNumber ? "number" : "letter"}, ${char}. You'll get it next time!`;

export const VOICE_PROMPT_LETTER = (char: string) => {
  const phonics = PHONICS_MAP[char.toUpperCase()];
  const variants = [
    `Where's the letter, ${char}?`,
    `Can you find, the letter ${char}?`,
    `Press the letter, ${char}!`,
    `Let's find, ${char}!`,
    `Show me, the letter ${char}!`,
  ];
  // Sometimes add a phonics hint for extra engagement
  if (phonics && Math.random() > 0.6) {
    variants.push(
      `${char}, is for ${phonics.word}! Can you find ${char}?`,
      `Find the letter ${char}! Like, ${phonics.word}!`
    );
  }
  return variants[Math.floor(Math.random() * variants.length)];
};

export const VOICE_PROMPT_NUMBER = (char: string) => {
  const variants = [
    `Where's the number, ${char}?`,
    `Can you find, the number ${char}?`,
    `Press the number, ${char}!`,
    `Show me, the number ${char}!`,
    `Let's find, number ${char}!`,
  ];
  return variants[Math.floor(Math.random() * variants.length)];
};

export const VOICE_STREAK: Record<number, string> = {
  3: "Three in a row! Niiice!",
  5: "Five in a row! You're on fire!",
  7: "Seven! You're unstoppable!",
  10: "Ten correct! You're a superstar!",
  15: "Fifteen! That's unbelievable!",
  20: "Twenty in a row! You're a champion!",
  25: "Twenty five! You are a legend!",
};

export const VOICE_NEW_RECORD = "Wow! New record! You are absolutely amazing!";

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

// ═══════════════════════════════════════════════════════════════
// MEMORY MATCH — Themes
// ═══════════════════════════════════════════════════════════════
export interface MemoryCard {
  id: string;
  emoji: string;
  name: string;
}

export const MEMORY_THEMES: Record<string, { label: string; icon: string; cards: MemoryCard[] }> = {
  animals: {
    label: "Animals",
    icon: "🐾",
    cards: [
      { id: "dog", emoji: "🐶", name: "Dog" },
      { id: "cat", emoji: "🐱", name: "Cat" },
      { id: "frog", emoji: "🐸", name: "Frog" },
      { id: "pig", emoji: "🐷", name: "Pig" },
      { id: "cow", emoji: "🐄", name: "Cow" },
      { id: "rabbit", emoji: "🐰", name: "Rabbit" },
      { id: "bear", emoji: "🐻", name: "Bear" },
      { id: "lion", emoji: "🦁", name: "Lion" },
    ],
  },
  food: {
    label: "Food",
    icon: "🍕",
    cards: [
      { id: "apple", emoji: "🍎", name: "Apple" },
      { id: "pizza", emoji: "🍕", name: "Pizza" },
      { id: "cupcake", emoji: "🧁", name: "Cupcake" },
      { id: "banana", emoji: "🍌", name: "Banana" },
      { id: "cookie", emoji: "🍪", name: "Cookie" },
      { id: "icecream", emoji: "🍦", name: "Ice Cream" },
      { id: "watermelon", emoji: "🍉", name: "Watermelon" },
      { id: "donut", emoji: "🍩", name: "Donut" },
    ],
  },
  vehicles: {
    label: "Vehicles",
    icon: "🚀",
    cards: [
      { id: "car", emoji: "🚗", name: "Car" },
      { id: "plane", emoji: "✈️", name: "Plane" },
      { id: "rocket", emoji: "🚀", name: "Rocket" },
      { id: "bus", emoji: "🚌", name: "Bus" },
      { id: "train", emoji: "🚂", name: "Train" },
      { id: "boat", emoji: "⛵", name: "Boat" },
      { id: "helicopter", emoji: "🚁", name: "Helicopter" },
      { id: "bicycle", emoji: "🚲", name: "Bicycle" },
    ],
  },
};

export type MemoryDifficulty = "easy" | "medium" | "hard";
export const MEMORY_GRID_SIZES: Record<MemoryDifficulty, { cols: number; pairs: number }> = {
  easy: { cols: 3, pairs: 3 },
  medium: { cols: 4, pairs: 6 },
  hard: { cols: 4, pairs: 8 },
};

// ═══════════════════════════════════════════════════════════════
// COLOR QUEST — Colors & Objects
// ═══════════════════════════════════════════════════════════════
export interface GameColor {
  name: string;
  hex: string;
  darkHex: string; // slightly darker variant for borders
}

export const GAME_COLORS: GameColor[] = [
  { name: "Red", hex: "#E63946", darkHex: "#c0313d" },
  { name: "Blue", hex: "#457B9D", darkHex: "#396886" },
  { name: "Yellow", hex: "#F4D35E", darkHex: "#d4b43e" },
  { name: "Green", hex: "#2A9D8F", darkHex: "#228276" },
  { name: "Orange", hex: "#F77F00", darkHex: "#d06d00" },
  { name: "Purple", hex: "#6A4C93", darkHex: "#563d78" },
  { name: "Pink", hex: "#FF6B9D", darkHex: "#d9587f" },
  { name: "Brown", hex: "#8B6914", darkHex: "#735610" },
];

export const COLOR_OBJECTS = [
  { emoji: "🎈", name: "balloon" },
  { emoji: "⭐", name: "star" },
  { emoji: "🚗", name: "car" },
  { emoji: "🌸", name: "flower" },
  { emoji: "🐟", name: "fish" },
  { emoji: "🦋", name: "butterfly" },
  { emoji: "🎁", name: "gift" },
  { emoji: "💎", name: "diamond" },
];

// ═══════════════════════════════════════════════════════════════
// COUNT ALONG — Counting Objects
// ═══════════════════════════════════════════════════════════════
export const COUNTING_OBJECTS = [
  { emoji: "🍎", name: "apple", plural: "apples" },
  { emoji: "⭐", name: "star", plural: "stars" },
  { emoji: "⚽", name: "ball", plural: "balls" },
  { emoji: "🦋", name: "butterfly", plural: "butterflies" },
  { emoji: "🎈", name: "balloon", plural: "balloons" },
  { emoji: "🌸", name: "flower", plural: "flowers" },
  { emoji: "🐟", name: "fish", plural: "fish" },
  { emoji: "🍪", name: "cookie", plural: "cookies" },
  { emoji: "🚀", name: "rocket", plural: "rockets" },
  { emoji: "🐣", name: "chick", plural: "chicks" },
];

// ═══════════════════════════════════════════════════════════════
// SOUND SAFARI — Animal Sounds
// ═══════════════════════════════════════════════════════════════
export interface AnimalSound {
  id: string;
  emoji: string;
  name: string;
  sound: string;    // text to speak for the sound
  audioFile: string; // path to natural audio file
}

export const ANIMAL_SOUNDS: AnimalSound[] = [
  { id: "cow", emoji: "🐄", name: "Cow", sound: "Mooooo", audioFile: "/sounds/animals/cow.mp3" },
  { id: "dog", emoji: "🐶", name: "Dog", sound: "Woof woof!", audioFile: "/sounds/animals/dog.ogg" },
  { id: "cat", emoji: "🐱", name: "Cat", sound: "Meeeow", audioFile: "/sounds/animals/cat.ogg" },
  { id: "pig", emoji: "🐷", name: "Pig", sound: "Oink oink!", audioFile: "/sounds/animals/pig.mp3" },
  { id: "chicken", emoji: "🐔", name: "Chicken", sound: "Bawk bawk bawk!", audioFile: "/sounds/animals/chicken.mp3" },
  { id: "horse", emoji: "🐴", name: "Horse", sound: "Neighhh", audioFile: "/sounds/animals/horse.ogg" },
  { id: "sheep", emoji: "🐑", name: "Sheep", sound: "Baaaaa", audioFile: "/sounds/animals/sheep.mp3" },
  { id: "bee", emoji: "🐝", name: "Bee", sound: "Buzzzzz", audioFile: "/sounds/animals/bee.mp3" },
  { id: "crow", emoji: "🐦‍⬛", name: "Crow", sound: "Caw caw!", audioFile: "/sounds/animals/crow.mp3" },
  { id: "owl", emoji: "🦉", name: "Owl", sound: "Hoot hoot!", audioFile: "/sounds/animals/owl.mp3" },
  { id: "mouse", emoji: "🐭", name: "Mouse", sound: "Squeak squeak!", audioFile: "/sounds/animals/mouse.ogg" },
];

// ═══════════════════════════════════════════════════════════════
// SHAPE BUILDER — Shapes
// ═══════════════════════════════════════════════════════════════
export interface GameShape {
  id: string;
  name: string;
  color: string;
  /** SVG path for the shape (viewBox 0 0 100 100) */
  path: string;
}

export const GAME_SHAPES: GameShape[] = [
  {
    id: "circle",
    name: "Circle",
    color: "#E63946",
    path: "M50 5 A45 45 0 1 1 49.99 5 Z",
  },
  {
    id: "square",
    name: "Square",
    color: "#457B9D",
    path: "M10 10 H90 V90 H10 Z",
  },
  {
    id: "triangle",
    name: "Triangle",
    color: "#F4D35E",
    path: "M50 5 L95 90 L5 90 Z",
  },
  {
    id: "star",
    name: "Star",
    color: "#F77F00",
    path: "M50 5 L61 38 L97 38 L68 60 L79 95 L50 73 L21 95 L32 60 L3 38 L39 38 Z",
  },
  {
    id: "diamond",
    name: "Diamond",
    color: "#6A4C93",
    path: "M50 5 L90 50 L50 95 L10 50 Z",
  },
  {
    id: "hexagon",
    name: "Hexagon",
    color: "#2A9D8F",
    path: "M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z",
  },
];

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
