export type PersonalityColor = "red" | "blue" | "green" | "yellow";

export interface CQChoice {
  id: string;
  color: PersonalityColor;
  emoji: string;
  label: string;
  speechText: string;
}

export interface CQQuestion {
  id: string;
  title: string;
  emoji: string;
  speechText: string;
  choices: CQChoice[];
}

export interface PersonalityProfile {
  id: PersonalityColor;
  title: string;
  emoji: string;
  colorHex: string;
  traits: string[];
  growthTip: string;
  superpower: string;
  specialties: string[];
}

export interface CQBadge {
  id: string;
  title: string;
  emoji: string;
  description: string;
}

export const PERSONALITIES: Record<PersonalityColor, PersonalityProfile> = {
  red: {
    id: "red",
    title: "Brave Lion",
    emoji: "🦁",
    colorHex: "#E63946", // Bauhaus Red
    traits: ["Courageous", "Energetic", "Takes Initiative", "Enjoys Adventure"],
    growthTip: "Sometimes pause and take a deep breath before rushing into action.",
    superpower: "Fearless Explorer",
    specialties: ["Leading the way", "Trying new things", "Protecting friends"],
  },
  blue: {
    id: "blue",
    title: "Wise Owl",
    emoji: "🦉",
    colorHex: "#457B9D", // Bauhaus Blue
    traits: ["Curious", "Thoughtful", "Observant", "Enjoys Solving Problems"],
    growthTip: "Sometimes it's perfectly okay to start a project before knowing everything.",
    superpower: "Puzzle Master",
    specialties: ["Figuring things out", "Noticing details", "Giving great advice"],
  },
  green: {
    id: "green",
    title: "Kind Panda",
    emoji: "🐼",
    colorHex: "#2A9D8F", // Bauhaus Green
    traits: ["Caring", "Patient", "Calm", "Supportive"],
    growthTip: "Remember that your own needs matter just as much as your friends'.",
    superpower: "Heart Healer",
    specialties: ["Being a great listener", "Keeping the peace", "Sharing hugs"],
  },
  yellow: {
    id: "yellow",
    title: "Happy Monkey",
    emoji: "🐒",
    colorHex: "#F77F00", // Bauhaus Yellow/Orange
    traits: ["Playful", "Creative", "Funny", "Imaginative"],
    growthTip: "Finishing a project can be just as fun and rewarding as starting a new one.",
    superpower: "Joy Bringer",
    specialties: ["Making people laugh", "Inventing new games", "Cheering everyone up"],
  },
};

export const BADGES: CQBadge[] = [
  { id: "treasure", title: "Treasure Hunter", emoji: "🗺️", description: "You seek out fun and adventure wherever you go!" },
  { id: "space", title: "Space Explorer", emoji: "🚀", description: "Your imagination reaches beyond the stars!" },
  { id: "puzzle", title: "Puzzle Wizard", emoji: "🧩", description: "You can solve any mystery that comes your way!" },
  { id: "rainbow", title: "Rainbow Maker", emoji: "🌈", description: "You bring bright colors and joy to everyone's day!" },
  { id: "animal", title: "Animal Friend", emoji: "🐾", description: "You have a gentle heart that all animals love!" },
  { id: "artist", title: "Creative Artist", emoji: "🎨", description: "Your mind is full of beautiful, colorful ideas!" },
];

export const QUESTION_PACKS: Record<string, CQQuestion[]> = {
  classic: [
    {
      id: "q1",
      title: "Treasure Chest",
      emoji: "🏴‍☠️",
      speechText: "You find a mysterious treasure chest! What do you do?",
      choices: [
        { id: "q1-r", color: "red", emoji: "🏃", label: "Open it right away!", speechText: "Open it right away!" },
        { id: "q1-b", color: "blue", emoji: "🔍", label: "Examine the lock first.", speechText: "Examine the lock first." },
        { id: "q1-g", color: "green", emoji: "🤝", label: "Wait for friends to open it together.", speechText: "Wait for friends to open it together." },
        { id: "q1-y", color: "yellow", emoji: "✨", label: "Imagine the magical things inside.", speechText: "Imagine the magical things inside." },
      ],
    },
    {
      id: "q2",
      title: "Rainy Day",
      emoji: "🌧️",
      speechText: "It's raining outside! What sounds like fun?",
      choices: [
        { id: "q2-r", color: "red", emoji: "👢", label: "Jump in the muddy puddles!", speechText: "Jump in the muddy puddles!" },
        { id: "q2-b", color: "blue", emoji: "📚", label: "Read a good book indoors.", speechText: "Read a good book indoors." },
        { id: "q2-g", color: "green", emoji: "☕", label: "Drink hot cocoa with family.", speechText: "Drink hot cocoa with family." },
        { id: "q2-y", color: "yellow", emoji: "🎨", label: "Paint a colorful picture.", speechText: "Paint a colorful picture." },
      ],
    },
    {
      id: "q3",
      title: "New Friend",
      emoji: "👋",
      speechText: "There's a new kid at school. What do you do?",
      choices: [
        { id: "q3-r", color: "red", emoji: "🏃", label: "Run up and say Hi!", speechText: "Run up and say Hi!" },
        { id: "q3-b", color: "blue", emoji: "👀", label: "Watch and see what they like.", speechText: "Watch and see what they like." },
        { id: "q3-g", color: "green", emoji: "😊", label: "Smile and offer to share your snack.", speechText: "Smile and offer to share your snack." },
        { id: "q3-y", color: "yellow", emoji: "🤡", label: "Tell them a funny joke.", speechText: "Tell them a funny joke." },
      ],
    },
    {
      id: "q4",
      title: "Secret Tunnel",
      emoji: "🕳️",
      speechText: "You discover a secret tunnel in the park. What's your plan?",
      choices: [
        { id: "q4-r", color: "red", emoji: "🔦", label: "Grab a flashlight and go in!", speechText: "Grab a flashlight and go in!" },
        { id: "q4-b", color: "blue", emoji: "🗺️", label: "Draw a map of where it might lead.", speechText: "Draw a map of where it might lead." },
        { id: "q4-g", color: "green", emoji: "🐕", label: "Bring your pet so they aren't lonely.", speechText: "Bring your pet so they aren't lonely." },
        { id: "q4-y", color: "yellow", emoji: "🏰", label: "Pretend it leads to a dragon's castle.", speechText: "Pretend it leads to a dragon's castle." },
      ],
    },
    {
      id: "q5",
      title: "Birthday Party",
      emoji: "🎂",
      speechText: "It's party time! What's the best part?",
      choices: [
        { id: "q5-r", color: "red", emoji: "🏃", label: "Leading the games!", speechText: "Leading the games!" },
        { id: "q5-b", color: "blue", emoji: "🎁", label: "Guessing what's in the presents.", speechText: "Guessing what's in the presents." },
        { id: "q5-g", color: "green", emoji: "🍰", label: "Making sure everyone gets cake.", speechText: "Making sure everyone gets cake." },
        { id: "q5-y", color: "yellow", emoji: "🎈", label: "Playing with the balloons!", speechText: "Playing with the balloons!" },
      ],
    },
    {
      id: "q6",
      title: "Puppy in the Park",
      emoji: "🐶",
      speechText: "A cute puppy runs up to you. What do you do?",
      choices: [
        { id: "q6-r", color: "red", emoji: "🎾", label: "Throw a ball for it to fetch.", speechText: "Throw a ball for it to fetch." },
        { id: "q6-b", color: "blue", emoji: "🏷️", label: "Check its collar for a name tag.", speechText: "Check its collar for a name tag." },
        { id: "q6-g", color: "green", emoji: "🫂", label: "Give it a gentle hug.", speechText: "Give it a gentle hug." },
        { id: "q6-y", color: "yellow", emoji: "🏃", label: "Play tag with it!", speechText: "Play tag with it!" },
      ],
    },
    {
      id: "q7",
      title: "Giant Box",
      emoji: "📦",
      speechText: "You get a giant cardboard box! What does it become?",
      choices: [
        { id: "q7-r", color: "red", emoji: "🏎️", label: "A super-fast race car!", speechText: "A super-fast race car!" },
        { id: "q7-b", color: "blue", emoji: "🏢", label: "A base with secret compartments.", speechText: "A base with secret compartments." },
        { id: "q7-g", color: "green", emoji: "🏠", label: "A cozy house for my stuffed animals.", speechText: "A cozy house for my stuffed animals." },
        { id: "q7-y", color: "yellow", emoji: "🚀", label: "A spaceship to Mars!", speechText: "A spaceship to Mars!" },
      ],
    },
    {
      id: "q8",
      title: "Ice Cream Falls",
      emoji: "🍦",
      speechText: "Oh no! Your friend dropped their ice cream. What do you do?",
      choices: [
        { id: "q8-r", color: "red", emoji: "🏃", label: "Run to get them a new one.", speechText: "Run to get them a new one." },
        { id: "q8-b", color: "blue", emoji: "🧻", label: "Quickly grab napkins to clean up.", speechText: "Quickly grab napkins to clean up." },
        { id: "q8-g", color: "green", emoji: "🤝", label: "Share your ice cream with them.", speechText: "Share your ice cream with them." },
        { id: "q8-y", color: "yellow", emoji: "🤪", label: "Make a silly face to cheer them up.", speechText: "Make a silly face to cheer them up." },
      ],
    },
    {
      id: "q9",
      title: "Magic Paintbrush",
      emoji: "🖌️",
      speechText: "You find a magic paintbrush! What do you paint first?",
      choices: [
        { id: "q9-r", color: "red", emoji: "🦸", label: "A superhero cape that really flies.", speechText: "A superhero cape that really flies." },
        { id: "q9-b", color: "blue", emoji: "🤖", label: "A robot that does chores.", speechText: "A robot that does chores." },
        { id: "q9-g", color: "green", emoji: "🌳", label: "A giant treehouse for everyone.", speechText: "A giant treehouse for everyone." },
        { id: "q9-y", color: "yellow", emoji: "🦄", label: "A dancing unicorn.", speechText: "A dancing unicorn." },
      ],
    },
    {
      id: "q10",
      title: "Friendly Alien",
      emoji: "👽",
      speechText: "A friendly alien lands in your yard. What do you show them?",
      choices: [
        { id: "q10-r", color: "red", emoji: "🚲", label: "How to ride a bicycle.", speechText: "How to ride a bicycle." },
        { id: "q10-b", color: "blue", emoji: "💻", label: "How computers work.", speechText: "How computers work." },
        { id: "q10-g", color: "green", emoji: "🌍", label: "The beautiful nature around us.", speechText: "The beautiful nature around us." },
        { id: "q10-y", color: "yellow", emoji: "🎮", label: "Your favorite video game.", speechText: "Your favorite video game." },
      ],
    },
  ],
};

export const STRINGS = {
  startTitle: "Color Quest",
  startSubtitle: "Discover your true personality color in this fun mini-adventure!",
  startBtn: "Start Adventure!",
  resumeBtn: "Resume Adventure",
  questionPrefix: "Question",
  reportHero: "You are a",
  superpowerTitle: "⚡ Superpower",
  specialtiesTitle: "✨ What Makes You Special",
  growthTitle: "🌱 Your Growth Adventure",
  mixTitle: "🎨 Your Personality Mix",
  badgeTitle: "🏅 Fun Badge Earned",
  btnShare: "Share Result",
  btnPrint: "Print Certificate",
  btnCompare: "Compare Previous",
  btnReplay: "Play Again",
  compareTitle: "Result Comparison",
  compareCurrent: "Today's Result",
  comparePrevious: "Previous Result",
  closeBtn: "Close",
};
