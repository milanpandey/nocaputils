export type ArchetypeId = "strategist" | "creator" | "empath" | "visionary" | "realist" | "catalyst";

export interface ArchetypeProfile {
  id: ArchetypeId;
  name: string;
  tagline: string;
  emoji: string;
  color: string;
  badge: string;
  coreDriver: string;
  superpower: string;
  flowState: string;
  blindSpot: string;
  communicationStyle: string;
  idealEnvironment: string;
  keyTraits: string[];
  growthAdvice: string;
}

export interface ArchetypeChoice {
  text: string;
  archetype: ArchetypeId;
  points: number;
}

export interface ArchetypeQuestion {
  id: number;
  scenario: string;
  question: string;
  category: "Thinking" | "Action" | "Social" | "Creativity" | "Pressure" | "Vision";
  choices: ArchetypeChoice[];
}

export const ARCHETYPES: Record<ArchetypeId, ArchetypeProfile> = {
  strategist: {
    id: "strategist",
    name: "The Strategist",
    tagline: "Architect of Systems, Master of Foresight",
    emoji: "🎯",
    color: "#3B82F6", // Electric Blue
    badge: "Master Planner",
    coreDriver: "Deciphering complex systems and crafting unbreakable long-range roadmaps.",
    superpower: "Anticipating downstream consequences 5 steps before anyone else notices.",
    flowState: "Mapping intricate workflows, optimizing data pipelines, and eliminating inefficiencies.",
    blindSpot: "Analysis paralysis — over-planning when quick, imperfect experimentation is needed.",
    communicationStyle: "Direct, structured, logic-first, concise, backed by proof.",
    idealEnvironment: "Autonomous, high-agency environments with clear objectives and minimal bureaucracy.",
    keyTraits: ["Analytical", "Methodical", "Objective", "Foresighted", "Systemic"],
    growthAdvice: "Set tight decision deadlines: 70% certainty is often enough to take decisive action.",
  },
  creator: {
    id: "creator",
    name: "The Creator",
    tagline: "Inventor of Aesthetics, Explorer of Novelty",
    emoji: "🎨",
    color: "#EC4899", // Pink
    badge: "Innovative Maker",
    coreDriver: "Bringing entirely new concepts, products, and experiences into physical reality.",
    superpower: "Connecting disparate ideas from unrelated fields into startlingly original creations.",
    flowState: "Designing, composing, writing, or tinkering without rigid rules or micro-management.",
    blindSpot: "Losing momentum during the final 10% polishing and maintenance phase.",
    communicationStyle: "Expressive, metaphorical, story-driven, enthusiastic.",
    idealEnvironment: "Flexible, playful spaces with room for experimental prototypes and rapid iteration.",
    keyTraits: ["Inventive", "Aesthetic", "Non-conformist", "Intuitive", "Expressive"],
    growthAdvice: "Partner with a Realist or Strategist to operationalize and finish your greatest ideas.",
  },
  empath: {
    id: "empath",
    name: "The Empath",
    tagline: "Weaver of Trust, Champion of Harmony",
    emoji: "💖",
    color: "#10B981", // Emerald Green
    badge: "Heart of the Team",
    coreDriver: "Cultivating deep psychological safety and helping every individual thrive.",
    superpower: "Sensing unspoken group dynamics, emotional undercurrents, and hidden friction.",
    flowState: "Mentoring, mediating conflict, and creating warm, collaborative team atmospheres.",
    blindSpot: "Over-absorbing other people's stress and hesitating to deliver tough, critical feedback.",
    communicationStyle: "Empathetic, validating, considerate, deeply relational.",
    idealEnvironment: "Values-driven, transparent organizations centered on human connection and mutual respect.",
    keyTraits: ["Compassionate", "Perceptive", "Supportive", "Diplomatic", "Trust-builder"],
    growthAdvice: "Remember that clear boundaries and direct truth-telling are acts of true kindness.",
  },
  visionary: {
    id: "visionary",
    name: "The Visionary",
    tagline: "Pioneer of Tomorrow, Inspiring Catalyst",
    emoji: "🔮",
    color: "#8B5CF6", // Purple
    badge: "Future Builder",
    coreDriver: "Challenging the status quo and rallying people around audacious future visions.",
    superpower: "Transforming vague possibilities into compelling, magnetic narratives.",
    flowState: "Pitching ambitious breakthroughs, brainstorming paradigm shifts, and exploring uncharted frontiers.",
    blindSpot: "Ignoring ground-level operational logistics and underestimating timeline constraints.",
    communicationStyle: "Charismatic, high-energy, inspirational, future-oriented.",
    idealEnvironment: "Fast-moving, high-stakes environments where bold risk-taking is rewarded.",
    keyTraits: ["Bold", "Inspirational", "Big-Picture", "Passionate", "Transformative"],
    growthAdvice: "Anchor your visionary horizon with tangible weekly micro-milestones to build credibility.",
  },
  realist: {
    id: "realist",
    name: "The Realist",
    tagline: "Anchor of Execution, Guardian of Quality",
    emoji: "🛡️",
    color: "#F59E0B", // Amber
    badge: "Execution Powerhouse",
    coreDriver: "Delivering reliable, flawless results under budget and on schedule every single time.",
    superpower: "Spotting practical flaws, risks, and hidden obstacles before they derail projects.",
    flowState: "Tackling tangible checklists, stabilizing chaotic systems, and delivering finished artifacts.",
    blindSpot: "Dismissing unconventional, experimental ideas too quickly as impractical.",
    communicationStyle: "Pragmatic, grounded, fact-based, no-nonsense.",
    idealEnvironment: "Stable, well-organized settings that reward consistency, craftsmanship, and accountability.",
    keyTraits: ["Reliable", "Pragmatic", "Thorough", "Disciplined", "Grounded"],
    growthAdvice: "Leave 15% budget and time in every sprint for playful exploration that has no immediate ROI.",
  },
  catalyst: {
    id: "catalyst",
    name: "The Catalyst",
    tagline: "Spark of Momentum, Fearless Operator",
    emoji: "⚡",
    color: "#EF4444", // Red
    badge: "Action Driver",
    coreDriver: "Unblocking stalemates, seizing immediate opportunities, and maintaining relentless velocity.",
    superpower: "Turning hesitation into swift forward motion when everyone else is stuck debating.",
    flowState: "Crisis triage, rapid prototyping, launching products, and fast-paced negotiations.",
    blindSpot: "Moving so quickly that colleagues feel rushed or left out of the loop.",
    communicationStyle: "Punchy, action-oriented, urgent, outcome-focused.",
    idealEnvironment: "Dynamic, fast-paced teams with rapid feedback loops and high autonomy.",
    keyTraits: ["Decisive", "High-Energy", "Proactive", "Resilient", "Adaptive"],
    growthAdvice: "Pause briefly after major breakthroughs to allow your team to consolidate and celebrate.",
  },
};

export const QUIZ_QUESTIONS: ArchetypeQuestion[] = [
  {
    id: 1,
    category: "Thinking",
    scenario: "Starting a Major New Project",
    question: "When handed a blank canvas and a new high-stakes initiative, what is your immediate instinct?",
    choices: [
      { text: "Break the end goal down into phases, dependencies, and risk matrices.", archetype: "strategist", points: 3 },
      { text: "Envision how this could disrupt old ways of working and sketch a revolutionary vision.", archetype: "visionary", points: 3 },
      { text: "Brainstorm wild visual aesthetics, novel mechanics, and unique creative angles.", archetype: "creator", points: 3 },
      { text: "Identify the critical next step, roll up sleeves, and build a working prototype right now.", archetype: "catalyst", points: 3 },
    ],
  },
  {
    id: 2,
    category: "Social",
    scenario: "Team Meeting Dynamics",
    question: "During a tense debate where team members disagree on the direction:",
    choices: [
      { text: "Check in with quiet members to ensure their perspectives and feelings are validated.", archetype: "empath", points: 3 },
      { text: "Evaluate the concrete feasibility, budget limitations, and delivery timeline.", archetype: "realist", points: 3 },
      { text: "Analyze the underlying logic and data behind each proposal to find the optimal path.", archetype: "strategist", points: 3 },
      { text: "Cut through circular debates and propose a rapid test to get moving immediately.", archetype: "catalyst", points: 3 },
    ],
  },
  {
    id: 3,
    category: "Pressure",
    scenario: "Unforeseen Crisis",
    question: "A critical deadline is in 24 hours and a major dependency just broke. How do you respond?",
    choices: [
      { text: "Shift into emergency execution gear, triage tasks, and drive everyone across the finish line.", archetype: "catalyst", points: 3 },
      { text: "Audit the failure point methodically and engineer a robust contingency workaround.", archetype: "strategist", points: 3 },
      { text: "Keep the team calm, morale high, and ensure no one burns out under the stress.", archetype: "empath", points: 3 },
      { text: "Strip all non-essential features and double down on delivering the core must-haves.", archetype: "realist", points: 3 },
    ],
  },
  {
    id: 4,
    category: "Creativity",
    scenario: "Brainstorming Breakthroughs",
    question: "What kind of brainstorming session makes you feel most energized?",
    choices: [
      { text: "Unbounded blue-sky ideation where no idea is considered impossible.", archetype: "visionary", points: 3 },
      { text: "Translating abstract thoughts into vivid sketches, UI mocks, or tangible artifacts.", archetype: "creator", points: 3 },
      { text: "System design sessions optimizing modularity, scalability, and logic flow.", archetype: "strategist", points: 3 },
      { text: "Storytelling sessions exploring user emotion, empathy maps, and human desires.", archetype: "empath", points: 3 },
    ],
  },
  {
    id: 5,
    category: "Action",
    scenario: "Daily Workflow Preference",
    question: "Which work rhythm best describes your ideal, most productive day?",
    choices: [
      { text: "Focused, deep-work blocks checking off solid, high-craft deliverables with zero drama.", archetype: "realist", points: 3 },
      { text: "Dynamic, fast-paced sprints tackling emergent challenges with quick feedback loops.", archetype: "catalyst", points: 3 },
      { text: "Open-ended tinkering, exploring inspirations, and inventing new solutions.", archetype: "creator", points: 3 },
      { text: "Collaborative pairing, mentoring teammates, and building shared alignment.", archetype: "empath", points: 3 },
    ],
  },
  {
    id: 6,
    category: "Vision",
    scenario: "Definition of Success",
    question: "At the end of a multi-year effort, what outcome gives you the deepest satisfaction?",
    choices: [
      { text: "Seeing a bold, paradigm-shifting idea take root and inspire an entire community.", archetype: "visionary", points: 3 },
      { text: "A robust, elegantly engineered system that runs smoothly without human intervention.", archetype: "strategist", points: 3 },
      { text: "A breathtaking, memorable piece of work that touches people's imagination.", archetype: "creator", points: 3 },
      { text: "Knowing that everyone involved grew closer, felt valued, and flourished together.", archetype: "empath", points: 3 },
    ],
  },
  {
    id: 7,
    category: "Thinking",
    scenario: "Evaluating New Technologies",
    question: "When a new trend or tool goes viral, what is your initial perspective?",
    choices: [
      { text: "Investigate how it changes the multi-year macro horizon and unlocks new frontiers.", archetype: "visionary", points: 3 },
      { text: "Stress-test its real-world performance, security, maintenance cost, and reliability.", archetype: "realist", points: 3 },
      { text: "Deconstruct its architecture and benchmark it against established principles.", archetype: "strategist", points: 3 },
      { text: "Spin up a live experiment immediately to see what playful things it can do.", archetype: "creator", points: 3 },
    ],
  },
  {
    id: 8,
    category: "Social",
    scenario: "Giving Feedback",
    question: "When a peer's work needs significant improvement, how do you deliver your notes?",
    choices: [
      { text: "With immense warmth, highlighting their gifts first so they feel empowered to grow.", archetype: "empath", points: 3 },
      { text: "Directly and clearly, pointing out specific errors with practical step-by-step corrections.", archetype: "realist", points: 3 },
      { text: "Through logical frameworks, explaining why the current architecture will fail at scale.", archetype: "strategist", points: 3 },
      { text: "By showing them inspiring alternative possibilities that elevate the whole standard.", archetype: "visionary", points: 3 },
    ],
  },
  {
    id: 9,
    category: "Pressure",
    scenario: "Dealing with Ambiguity",
    question: "When instructions are vague and leadership is undecided:",
    choices: [
      { text: "Make an executive decision, set a clear direction, and get moving regardless.", archetype: "catalyst", points: 3 },
      { text: "Frame an inspiring narrative of where we should go and pitch it to the team.", archetype: "visionary", points: 3 },
      { text: "Draft a structured decision tree with pros, cons, and probability weightings.", archetype: "strategist", points: 3 },
      { text: "Focus on safeguarding baseline operations so nothing slips while waiting for clarity.", archetype: "realist", points: 3 },
    ],
  },
  {
    id: 10,
    category: "Creativity",
    scenario: "Problem Solving Style",
    question: "When faced with an apparently unsolvable bottleneck:",
    choices: [
      { text: "Question the hidden premises and rewrite the rules of the game entirely.", archetype: "creator", points: 3 },
      { text: "Rally the right people into a room, unlock their collective wisdom, and align them.", archetype: "empath", points: 3 },
      { text: "Break it down into first principles until the mathematical or logical knot untangles.", archetype: "strategist", points: 3 },
      { text: "Try 10 different rapid trial-and-error variations in 30 minutes until one clicks.", archetype: "catalyst", points: 3 },
    ],
  },
  {
    id: 11,
    category: "Action",
    scenario: "Learning New Skills",
    question: "How do you naturally prefer to master a brand new subject?",
    choices: [
      { text: "Dive straight into building a real project, learning through hands-on friction.", archetype: "catalyst", points: 3 },
      { text: "Read comprehensive documentation, understand the theoretical models, and map concepts.", archetype: "strategist", points: 3 },
      { text: "Follow structured, proven tutorials from credible experts with verified outcomes.", archetype: "realist", points: 3 },
      { text: "Remix and play with examples, crafting weird side-experiments to test boundaries.", archetype: "creator", points: 3 },
    ],
  },
  {
    id: 12,
    category: "Vision",
    scenario: "Legacy & Personal Impact",
    question: "What badge of honor best reflects how you want your peers to remember you?",
    choices: [
      { text: "\"They were the rock of our team — unbreakable, dependable, and always delivered.\"", archetype: "realist", points: 3 },
      { text: "\"They brought soul, empathy, and genuine kindness to every room they entered.\"", archetype: "empath", points: 3 },
      { text: "\"They made impossible things happen and catalyzed momentum when all was quiet.\"", archetype: "catalyst", points: 3 },
      { text: "\"They expanded our horizons and inspired us to build a better future.\"", archetype: "visionary", points: 3 },
    ],
  },
  {
    id: 13,
    category: "Thinking",
    scenario: "Dealing with Information Overload",
    question: "When flooded with contradictory data and opinions from dozens of sources:",
    choices: [
      { text: "Filter for hard verifiable facts, eliminating noise and speculation ruthlessly.", archetype: "realist", points: 3 },
      { text: "Synthesize the data into a cohesive conceptual framework with predictive power.", archetype: "strategist", points: 3 },
      { text: "Listen to the human motivations behind each opinion to understand the real stakes.", archetype: "empath", points: 3 },
      { text: "Extract the core pattern and translate it into a compelling big-picture takeaway.", archetype: "visionary", points: 3 },
    ],
  },
  {
    id: 14,
    category: "Social",
    scenario: "Collaboration Sweet Spot",
    question: "You feel you bring the highest value to a team when your role is to:",
    choices: [
      { text: "Provide creative direction, aesthetic polish, and fresh conceptual originality.", archetype: "creator", points: 3 },
      { text: "Bridge gaps between people, resolve tensions, and maintain infectious team spirit.", archetype: "empath", points: 3 },
      { text: "Drive execution speed, remove blockers, and keep the energy level electrifying.", archetype: "catalyst", points: 3 },
      { text: "Establish structural clarity, guardrails, metrics, and tactical roadmap priorities.", archetype: "strategist", points: 3 },
    ],
  },
  {
    id: 15,
    category: "Creativity",
    scenario: "Creative Blocks",
    question: "When you feel mentally drained or creatively stuck, what recharges your battery?",
    choices: [
      { text: "Immersing in music, galleries, fiction, nature, or evocative art.", archetype: "creator", points: 3 },
      { text: "Having an authentic, heart-to-heart conversation with someone I care about.", archetype: "empath", points: 3 },
      { text: "Cleaning my workspace, organizing files, and executing simple tangible chores.", archetype: "realist", points: 3 },
      { text: "Reading visionary science, futurism essays, or exploring cutting-edge breakthroughs.", archetype: "visionary", points: 3 },
    ],
  },
  {
    id: 16,
    category: "Action",
    scenario: "Managing Time & Priorities",
    question: "When managing your calendar across a packed week:",
    choices: [
      { text: "Color-coded blocks prioritized strictly by ROI, systemic impact, and focus state.", archetype: "strategist", points: 3 },
      { text: "Buffer space for emergent sprints, sudden opportunities, and high-impact interventions.", archetype: "catalyst", points: 3 },
      { text: "A predictable, steady schedule ensuring every commitment is fulfilled on time.", archetype: "realist", points: 3 },
      { text: "Large chunks of uninterrupted open studio time reserved for deep flow and creation.", archetype: "creator", points: 3 },
    ],
  },
];

export interface QuizScores {
  strategist: number;
  creator: number;
  empath: number;
  visionary: number;
  realist: number;
  catalyst: number;
}

export interface QuizResult {
  primary: ArchetypeProfile;
  secondary: ArchetypeProfile;
  percentages: Record<ArchetypeId, number>;
  totalScore: number;
}

export function calculateQuizResult(answers: Record<number, ArchetypeChoice>): QuizResult {
  const scores: QuizScores = {
    strategist: 0,
    creator: 0,
    empath: 0,
    visionary: 0,
    realist: 0,
    catalyst: 0,
  };

  Object.values(answers).forEach((choice) => {
    scores[choice.archetype] += choice.points;
  });

  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;

  const percentages: Record<ArchetypeId, number> = {
    strategist: Math.round((scores.strategist / total) * 100),
    creator: Math.round((scores.creator / total) * 100),
    empath: Math.round((scores.empath / total) * 100),
    visionary: Math.round((scores.visionary / total) * 100),
    realist: Math.round((scores.realist / total) * 100),
    catalyst: Math.round((scores.catalyst / total) * 100),
  };

  const sorted = (Object.keys(scores) as ArchetypeId[]).sort((a, b) => scores[b] - scores[a]);

  const primaryId = sorted[0];
  const secondaryId = sorted[1] || sorted[0];

  return {
    primary: ARCHETYPES[primaryId],
    secondary: ARCHETYPES[secondaryId],
    percentages,
    totalScore: total,
  };
}
