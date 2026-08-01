export interface InkblotChoice {
  id: string;
  emoji: string;
  label: string;
  speechText: string;
  category: "nature" | "sky" | "fantasy" | "play" | "joy" | "neutral";
}

export interface InkblotCard {
  id: string;
  title: string;
  svgPaths: string[];
  centerPaths?: string[];
  choices: [InkblotChoice, InkblotChoice, InkblotChoice, InkblotChoice, InkblotChoice, InkblotChoice];
}

export interface ArchetypeProfile {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  description: string;
  superpower: string;
  funFact: string;
}

export type ColorTheme = "classic" | "purple" | "ocean" | "sunset" | "forest";

export const COLOR_THEMES: Record<ColorTheme, { name: string; main: string; bg: string; accent: string }> = {
  classic: { name: "Classic Ink", main: "#1D3557", bg: "#F1FAEE", accent: "#E63946" },
  purple: { name: "Magic Purple", main: "#6A0572", bg: "#F3E5F5", accent: "#AB47BC" },
  ocean: { name: "Ocean Blue", main: "#023E8A", bg: "#E0F7FA", accent: "#00B4D8" },
  sunset: { name: "Sunset Glow", main: "#D84315", bg: "#FFF3E0", accent: "#FF9800" },
  forest: { name: "Enchanted Forest", main: "#1B5E20", bg: "#E8F5E9", accent: "#4CAF50" },
};

const NO_IDEA = (cardNum: number): InkblotChoice => ({
  id: `c${cardNum}-6`,
  emoji: "🤷",
  label: "No Idea!",
  speechText: "That's totally okay! Imagination works differently for everyone!",
  category: "neutral",
});

export const INKBLOT_CARDS: InkblotCard[] = [
  {
    id: "inkblot-1",
    title: "Card 1",
    svgPaths: [
      "M 150 50 Q 120 20 90 40 T 50 90 Q 30 130 60 160 T 110 200 Q 140 220 150 250",
      "M 150 100 C 110 80 70 110 80 140 C 90 170 130 160 150 180",
      "M 110 70 A 15 15 0 1 0 90 90 A 15 15 0 1 0 110 70 Z",
    ],
    centerPaths: [
      "M 150 30 C 145 40 145 260 150 280 C 155 260 155 40 150 30 Z",
    ],
    choices: [
      { id: "c1-1", emoji: "🦋", label: "A Royal Butterfly", speechText: "A Royal Butterfly spreading its wings!", category: "nature" },
      { id: "c1-2", emoji: "👑", label: "A Golden Crown", speechText: "A Golden Crown fit for a king or queen!", category: "fantasy" },
      { id: "c1-3", emoji: "🚀", label: "A Space Rocket", speechText: "A Space Rocket zooming to the moon!", category: "sky" },
      { id: "c1-4", emoji: "🪁", label: "A Soaring Kite", speechText: "A Soaring Kite high in the windy sky!", category: "play" },
      { id: "c1-5", emoji: "🍦", label: "A Giant Ice Cream", speechText: "A Giant Ice Cream with rainbow sprinkles!", category: "joy" },
      NO_IDEA(1),
    ],
  },
  {
    id: "inkblot-2",
    title: "Card 2",
    svgPaths: [
      "M 150 40 Q 100 30 70 70 Q 40 110 60 150 Q 80 190 130 170 Q 140 220 100 240 Q 70 260 90 290 Q 130 310 150 270",
      "M 150 90 Q 110 70 90 110 Q 70 150 110 170 Q 140 180 150 210",
      "M 80 60 A 12 12 0 1 0 60 80 Z",
    ],
    centerPaths: [
      "M 150 20 Q 140 150 150 300 Q 160 150 150 20 Z",
    ],
    choices: [
      { id: "c2-1", emoji: "🐻", label: "Two Dancing Bears", speechText: "Two friendly Dancing Bears giving a high five!", category: "nature" },
      { id: "c2-2", emoji: "🐲", label: "A Friendly Dragon", speechText: "A gentle Friendly Dragon with big wings!", category: "fantasy" },
      { id: "c2-3", emoji: "🛸", label: "A Cosmic UFO", speechText: "A Cosmic UFO shining bright lights!", category: "sky" },
      { id: "c2-4", emoji: "🏎️", label: "A Super Race Car", speechText: "A Super Race Car speeding on the track!", category: "play" },
      { id: "c2-5", emoji: "🎈", label: "Floating Balloons", speechText: "Fun Floating Balloons at a birthday party!", category: "joy" },
      NO_IDEA(2),
    ],
  },
  {
    id: "inkblot-3",
    title: "Card 3",
    svgPaths: [
      "M 150 60 Q 110 40 80 80 T 60 140 Q 40 180 90 200 T 140 230 Q 130 260 90 270 T 120 310 Q 145 310 150 290",
      "M 150 120 C 120 100 90 130 110 160 C 130 190 140 200 150 220",
      "M 70 100 A 14 14 0 1 0 50 115 Z",
    ],
    centerPaths: [
      "M 150 50 L 142 160 L 150 280 L 158 160 Z",
    ],
    choices: [
      { id: "c3-1", emoji: "🦉", label: "A Wise Owl", speechText: "A Wise Owl peeking through the forest!", category: "nature" },
      { id: "c3-2", emoji: "🦄", label: "A Magical Unicorn", speechText: "A Magical Unicorn with a glowing horn!", category: "fantasy" },
      { id: "c3-3", emoji: "⭐", label: "A Shooting Star", speechText: "A Shooting Star granting a wish!", category: "sky" },
      { id: "c3-4", emoji: "🤖", label: "A Friendly Robot", speechText: "A Friendly Robot waving hello!", category: "play" },
      { id: "c3-5", emoji: "🍩", label: "A Delicious Donut", speechText: "A Delicious Donut with colorful sprinkles!", category: "joy" },
      NO_IDEA(3),
    ],
  },
  {
    id: "inkblot-4",
    title: "Card 4",
    svgPaths: [
      "M 150 30 Q 90 20 60 60 Q 30 100 50 150 Q 70 200 120 220 Q 80 240 60 270 Q 50 300 90 310 Q 130 310 150 280",
      "M 150 80 Q 110 60 80 100 Q 50 140 90 170 Q 130 190 150 210",
      "M 110 130 A 16 16 0 1 0 85 145 Z",
    ],
    centerPaths: [
      "M 150 10 Q 135 150 150 320 Q 165 150 150 10 Z",
    ],
    choices: [
      { id: "c4-1", emoji: "🐧", label: "Two Happy Penguins", speechText: "Two Happy Penguins sliding on the ice!", category: "nature" },
      { id: "c4-2", emoji: "🏰", label: "A Magic Castle", speechText: "A Magic Castle with tall towers!", category: "fantasy" },
      { id: "c4-3", emoji: "☁️", label: "A Fluffy Cloud", speechText: "A Fluffy Cloud floating in the blue sky!", category: "sky" },
      { id: "c4-4", emoji: "⛵", label: "A Sailboat", speechText: "A Sailboat sailing across the ocean!", category: "play" },
      { id: "c4-5", emoji: "🎁", label: "A Mystery Gift", speechText: "A Mystery Gift wrapped with a big bow!", category: "joy" },
      NO_IDEA(4),
    ],
  },
  {
    id: "inkblot-5",
    title: "Card 5",
    svgPaths: [
      "M 150 40 Q 110 20 75 55 Q 40 90 60 135 Q 80 180 130 195 Q 90 220 70 255 Q 60 290 100 300 Q 135 305 150 275",
      "M 150 100 Q 115 85 90 120 Q 65 155 105 175 Q 135 185 150 205",
      "M 90 75 A 15 15 0 1 0 70 95 Z",
    ],
    centerPaths: [
      "M 150 15 Q 140 140 150 310 Q 160 140 150 15 Z",
    ],
    choices: [
      { id: "c5-1", emoji: "🦁", label: "A Brave Lion", speechText: "A Brave Lion with a fluffy golden mane!", category: "nature" },
      { id: "c5-2", emoji: "🔮", label: "A Crystal Ball", speechText: "A Crystal Ball full of magic sparkles!", category: "fantasy" },
      { id: "c5-3", emoji: "🌈", label: "A Bright Rainbow", speechText: "A Bright Rainbow after a warm summer rain!", category: "sky" },
      { id: "c5-4", emoji: "🎡", label: "A Ferris Wheel", speechText: "A Giant Ferris Wheel spinning at the fair!", category: "play" },
      { id: "c5-5", emoji: "🍕", label: "A Yummy Pizza", speechText: "A Yummy Slice of Pizza with extra cheese!", category: "joy" },
      NO_IDEA(5),
    ],
  },
  {
    id: "inkblot-6",
    title: "Card 6",
    svgPaths: [
      "M 150 35 Q 100 25 65 65 Q 30 105 55 155 Q 80 205 100 190 Q 120 175 140 210 Q 130 250 110 280 Q 140 310 150 280",
      "M 150 85 Q 120 65 95 95 Q 70 125 95 155 Q 120 180 150 200",
      "M 100 55 A 13 13 0 1 0 82 72 Z",
      "M 75 180 A 10 10 0 1 0 60 195 Z",
    ],
    centerPaths: [
      "M 150 25 Q 142 155 150 295 Q 158 155 150 25 Z",
    ],
    choices: [
      { id: "c6-1", emoji: "🐬", label: "A Playful Dolphin", speechText: "A Playful Dolphin jumping through waves!", category: "nature" },
      { id: "c6-2", emoji: "🧙", label: "A Wizard's Hat", speechText: "A tall Wizard's Hat full of magic spells!", category: "fantasy" },
      { id: "c6-3", emoji: "🌙", label: "A Crescent Moon", speechText: "A beautiful Crescent Moon lighting the night!", category: "sky" },
      { id: "c6-4", emoji: "🎸", label: "An Electric Guitar", speechText: "An awesome Electric Guitar ready to rock!", category: "play" },
      { id: "c6-5", emoji: "🧁", label: "A Fancy Cupcake", speechText: "A fancy Cupcake with swirly frosting!", category: "joy" },
      NO_IDEA(6),
    ],
  },
  {
    id: "inkblot-7",
    title: "Card 7",
    svgPaths: [
      "M 150 45 Q 105 35 75 65 Q 45 95 65 135 Q 85 175 115 160 Q 135 145 145 175 Q 125 215 95 235 Q 75 255 105 290 Q 135 305 150 275",
      "M 150 95 Q 125 80 105 105 Q 85 130 105 150 Q 125 165 150 175",
      "M 95 65 A 11 11 0 1 0 80 80 Z",
    ],
    centerPaths: [
      "M 150 35 Q 143 150 150 295 Q 157 150 150 35 Z",
      "M 150 130 A 18 18 0 1 0 150 166 A 18 18 0 1 0 150 130 Z",
    ],
    choices: [
      { id: "c7-1", emoji: "🐘", label: "A Gentle Elephant", speechText: "A Gentle Elephant with big floppy ears!", category: "nature" },
      { id: "c7-2", emoji: "🧚", label: "A Sparkly Fairy", speechText: "A Sparkly Fairy spreading pixie dust!", category: "fantasy" },
      { id: "c7-3", emoji: "🌋", label: "A Cool Volcano", speechText: "A cool Volcano erupting with fireworks!", category: "sky" },
      { id: "c7-4", emoji: "🏗️", label: "A Tall Crane", speechText: "A Tall Crane building something amazing!", category: "play" },
      { id: "c7-5", emoji: "🎂", label: "A Birthday Cake", speechText: "A Birthday Cake with candles to wish on!", category: "joy" },
      NO_IDEA(7),
    ],
  },
  {
    id: "inkblot-8",
    title: "Card 8",
    svgPaths: [
      "M 150 50 Q 115 25 80 50 Q 45 75 55 115 Q 65 155 100 170 Q 70 195 55 225 Q 40 255 75 280 Q 110 305 150 280",
      "M 150 110 Q 120 90 95 115 Q 70 140 100 165 Q 130 180 150 200",
      "M 95 55 A 12 12 0 1 0 78 70 Z",
      "M 80 215 A 14 14 0 1 0 60 230 Z",
    ],
    centerPaths: [
      "M 150 30 Q 140 160 150 300 Q 160 160 150 30 Z",
    ],
    choices: [
      { id: "c8-1", emoji: "🐙", label: "A Wiggly Octopus", speechText: "A friendly Wiggly Octopus waving all its arms!", category: "nature" },
      { id: "c8-2", emoji: "🗡️", label: "A Knight's Shield", speechText: "A shiny Knight's Shield with a royal crest!", category: "fantasy" },
      { id: "c8-3", emoji: "💫", label: "A Swirling Galaxy", speechText: "A Swirling Galaxy full of a million stars!", category: "sky" },
      { id: "c8-4", emoji: "🎮", label: "A Game Controller", speechText: "A Game Controller ready for an adventure!", category: "play" },
      { id: "c8-5", emoji: "🎪", label: "A Circus Tent", speechText: "A colorful Circus Tent with performers!", category: "joy" },
      NO_IDEA(8),
    ],
  },
  {
    id: "inkblot-9",
    title: "Card 9",
    svgPaths: [
      "M 150 55 Q 100 35 70 65 Q 40 95 50 135 Q 60 175 95 190 Q 130 205 135 240 Q 115 270 90 285 Q 120 310 150 285",
      "M 150 100 Q 125 80 100 110 Q 75 140 100 165 Q 125 185 150 205",
      "M 85 70 A 13 13 0 1 0 68 87 Z",
    ],
    centerPaths: [
      "M 150 40 L 143 165 L 150 295 L 157 165 Z",
    ],
    choices: [
      { id: "c9-1", emoji: "🦅", label: "A Soaring Eagle", speechText: "A majestic Soaring Eagle riding the wind!", category: "nature" },
      { id: "c9-2", emoji: "🧞", label: "A Friendly Genie", speechText: "A Friendly Genie granting three wishes!", category: "fantasy" },
      { id: "c9-3", emoji: "🌊", label: "A Giant Wave", speechText: "A Giant Wave crashing on the shore!", category: "sky" },
      { id: "c9-4", emoji: "🎯", label: "A Bullseye Target", speechText: "A perfect Bullseye Target for a game!", category: "play" },
      { id: "c9-5", emoji: "🎠", label: "A Merry-Go-Round", speechText: "A colorful Merry-Go-Round with horses!", category: "joy" },
      NO_IDEA(9),
    ],
  },
  {
    id: "inkblot-10",
    title: "Card 10",
    svgPaths: [
      "M 150 40 Q 105 20 70 55 Q 35 90 50 135 Q 65 180 100 195 Q 80 225 60 260 Q 50 290 85 305 Q 120 315 150 285",
      "M 150 90 Q 120 70 95 100 Q 70 130 95 160 Q 120 185 150 205",
      "M 95 55 A 14 14 0 1 0 75 73 Z",
      "M 85 245 A 11 11 0 1 0 68 260 Z",
    ],
    centerPaths: [
      "M 150 20 Q 138 155 150 310 Q 162 155 150 20 Z",
      "M 150 145 A 20 20 0 1 0 150 185 A 20 20 0 1 0 150 145 Z",
    ],
    choices: [
      { id: "c10-1", emoji: "🐢", label: "A Wise Turtle", speechText: "A Wise Turtle carrying the world!", category: "nature" },
      { id: "c10-2", emoji: "🪄", label: "A Magic Wand", speechText: "A Magic Wand ready to cast a spell!", category: "fantasy" },
      { id: "c10-3", emoji: "🌻", label: "A Sunflower", speechText: "A happy Sunflower reaching for the sun!", category: "sky" },
      { id: "c10-4", emoji: "🛝", label: "A Playground Slide", speechText: "A giant Playground Slide for zooming down!", category: "play" },
      { id: "c10-5", emoji: "🎵", label: "Musical Notes", speechText: "Musical Notes dancing in the air!", category: "joy" },
      NO_IDEA(10),
    ],
  },
];

export const ARCHETYPES: Record<string, ArchetypeProfile> = {
  nature: {
    id: "nature",
    title: "The Nature Adventurer",
    subtitle: "Friend of All Living Things",
    emoji: "🌿",
    color: "#2A9D8F",
    description: "You have a wonderful eye for animal friends, trees, and the beauty of nature! You notice living details that make the world feel alive.",
    superpower: "Animal Whisperer & Forest Explorer",
    funFact: "Did you know? Butterflies taste food with their feet!",
  },
  sky: {
    id: "sky",
    title: "The Cosmic Explorer",
    subtitle: "Dreamer of Stars & Sky",
    emoji: "🚀",
    color: "#457B9D",
    description: "Your imagination loves to soar high into the clouds, space, and beyond! You see endless possibilities in every cloud and star.",
    superpower: "Rocket Flight & Cloud Shaper",
    funFact: "Did you know? There are more stars in space than grains of sand on Earth!",
  },
  fantasy: {
    id: "fantasy",
    title: "The Magic Dreamer",
    subtitle: "Master of Magical Worlds",
    emoji: "✨",
    color: "#9C27B0",
    description: "You are full of wonder and magic! You see castles, dragons, unicorns, and enchanting mysteries wherever you look.",
    superpower: "Spell Caster & Dragon Pal",
    funFact: "Did you know? Unicorns are the official national animal of Scotland!",
  },
  play: {
    id: "play",
    title: "The Playful Inventor",
    subtitle: "Creator of Fun & Games",
    emoji: "🎈",
    color: "#F77F00",
    description: "You love fun, action, building, and adventure! Your brain is always finding fun games and clever inventions in shapes.",
    superpower: "Toy Creator & Speed Master",
    funFact: "Did you know? Lego bricks made in 1958 still fit together with bricks made today!",
  },
  joy: {
    id: "joy",
    title: "The Joyful Storyteller",
    subtitle: "Spreader of Happiness & Smiles",
    emoji: "🎨",
    color: "#E63946",
    description: "You bring bright warmth and happiness! You see treats, gifts, celebrations, and fun stories in every shape.",
    superpower: "Happiness Generator & Party Planner",
    funFact: "Did you know? Laughing releases happy endorphins that make your brain super strong!",
  },
  neutral: {
    id: "neutral",
    title: "The Open-Minded Explorer",
    subtitle: "Thinker Beyond Shapes",
    emoji: "🌟",
    color: "#607D8B",
    description: "You think differently — and that's amazing! You don't rush to see things others expect. Your mind is free and open to infinite possibilities.",
    superpower: "Free Thinker & Curious Mind",
    funFact: "Did you know? Albert Einstein said imagination is more important than knowledge!",
  },
};
