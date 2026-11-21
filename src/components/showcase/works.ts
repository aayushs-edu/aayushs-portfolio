// The works the showcase holds, as one typed list: the hero gallery's
// paintings and projects (images and depth maps from public/hero/), the early
// paintings and the "Where it all started" photo (public/showcase/paintings),
// the films and the 3D models (public/showcase/animation), with their stories
// and links taken from the old pages.

import { GALLERY, type GalleryItem } from "../hero/heroConfig";
import animationMedia from "./stations/animation/animation.generated.json";
import paintingsMedia from "./stations/paintings/paintings.generated.json";
import paintwiseMedia from "./stations/paintwise/paintwise.generated.json";

export type GroupId = "paintwise" | "paintings" | "animation" | "hackathons" | "games";

/** Each group's name, as its section heading shows it. */
export const GROUP_TITLES: Record<GroupId, string> = {
  paintwise: "Paintwise",
  paintings: "Paintings",
  animation: "Animation",
  hackathons: "Hackathons",
  games: "Games",
};

/** The page's order: Paintwise first, then the art half, then the code half. */
export const GROUP_ORDER: GroupId[] = ["paintwise", "hackathons", "paintings", "games", "animation"];

export type WorkKind = "painting" | "project" | "game" | "animation" | "model" | "hackathon";
export type WorkSide = "art" | "code" | "both";

export interface WorkLink {
  label: string;
  href: string;
}

export interface WorkMedia {
  image: string;
  depth?: string;
  video?: string;
  /** width / height */
  aspect: number;
  avgColor: string;
  /** A figure that stands for the work without 3D (Paintwise's pipeline) */
  figure?: string;
  /** A photo of the painting being held */
  held?: { src: string; aspect: number };
  /** A film: its short muted loop (same-origin), and the full film */
  loop?: string;
  film?: string;
  /** A 3D model (GLB, Draco-compressed) */
  model?: string;
}

export interface Work {
  /** URL-safe id */
  slug: string;
  kind: WorkKind;
  side: WorkSide;
  /** The station that holds it */
  group: GroupId;
  /** Paintings: on the main wall, or the early work round its edges */
  wall?: "portfolio" | "early";
  title: string;
  year?: string;
  /** Medium (art) or stack (code): one line */
  line: string;
  /** A few short paragraphs */
  story: string[];
  links: WorkLink[];
  media: WorkMedia;
}

export const isExternal = (href: string) => /^https?:\/\//.test(href);

interface Extra {
  side?: WorkSide;
  /** Projects only (paintings are always in "paintings") */
  group?: GroupId;
  figure?: string;
  year?: string;
  story: string[];
  links: WorkLink[];
}

const ALL_PAINTINGS: WorkLink = { label: "All paintings", href: "/paintings" };
const itch = (slug: string): WorkLink => ({ label: "Play on itch.io", href: `https://aayushs-edu.itch.io/${slug}` });

/** Paintings: the descriptions from public/paintings/manifest.json. */
const PAINTINGS: Record<string, Extra> = {
  "snorkeling-hawaii": {
    story: ["A sea turtle glides gracefully through a coral reef alive with color and light, accompanied by fish and a diver exploring the vibrant depths."],
    links: [ALL_PAINTINGS],
  },
  snowboarding: {
    story: ["A snowboarder carves through fresh powder at sunset, fiery skies and mountain silhouettes framing the thrill of speed and freedom."],
    links: [ALL_PAINTINGS],
  },
  "taj-mahal": {
    story: ["At sunset, a camel and its keeper rest by the riverbank, while the Taj Mahal glows in the golden light of the fading day."],
    links: [ALL_PAINTINGS],
  },
  "safari-kid": {
    story: ["Giraffes and an elephant graze peacefully near a winding stream, as books and a backpack hint at a traveler observing the wild."],
    links: [ALL_PAINTINGS],
  },
  "soccer-penalty": {
    story: ["A decisive moment as a player takes a penalty shot, the ball aimed for the net while the goalkeeper dives in a stadium filled with anticipation."],
    links: [ALL_PAINTINGS],
  },
  "red-dead-redemption": {
    story: ["A lone rider guides his horse through a shimmering mountain stream, surrounded by tall pines and morning mist."],
    links: [ALL_PAINTINGS],
  },
  "childhood-toys": {
    story: [
      "A playful still life arrangement of everyday objects: soccer ball, game controller, chess pieces, and toys, capturing the essence of childhood energy and imagination.",
    ],
    links: [ALL_PAINTINGS],
  },
};

/** Projects: from /hackathons, /games, /paintwise and the home page. */
const PROJECTS: Record<string, Extra> = {
  paintwise: {
    side: "both",
    group: "paintwise",
    figure: paintwiseMedia.figure.src,
    year: "2025",
    story: [
      "If you ever wanted to learn how to draw, YouTube was the place to go. But following along with those videos was not actually teaching you anything, and good art teachers are not always available or affordable.",
      "Paintwise is a model that generates the steps to draw a piece the way a real artist would, from primitive shapes to final forms, and gives feedback at each step on proportions, perspective and lighting.",
      "The build log follows the hard parts: segmentation that sees too much, deciding what to paint first, and making AI critique feel human.",
    ],
    links: [
      { label: "Read the build log", href: "/paintwise" },
      { label: "GitHub", href: "https://github.com/aayushs-edu/paintwise" },
    ],
  },
  exovision: {
    group: "hackathons",
    story: [
      "ExoVision is a 3D interactive star map for exoplanets throughout the universe. Select one of the exoplanets in the database and gaze at its sky.",
      "It has the accurate distance, brightness and color for all of its stars, creating an easy-to-use scientific tool for everyone.",
      "Built in 48 hours by a team of four for the NASA Space Apps Challenge 2024.",
    ],
    links: [
      { label: "Live demo", href: "https://mijosexoskydemo.github.io" },
      { label: "GitHub", href: "https://github.com/mijosexoskydemo/mijosexoskydemo.github.io" },
      { label: "Submission", href: "https://www.spaceappschallenge.org/nasa-space-apps-2024/find-a-team/the-mijos/?tab=project" },
    ],
  },
  lumina: {
    group: "hackathons",
    story: [
      "Lumina is a platform dedicated to illuminating hidden inequalities and sharing stories of marginalized communities. Its goal is to bring awareness, spark dialogue, and empower individuals to create change.",
      "It pairs authentic stories with an Inequality Atlas, a themed forum, and LuminaLens, which drafts policy ideas with AI.",
      "Top 10 at the GNEC Hackathon 2025, built over a month and a half by a team of two.",
    ],
    links: [
      { label: "Live demo", href: "https://luminadev.netlify.app" },
      { label: "GitHub", href: "https://github.com/aayushs-edu/lumina" },
      { label: "Devpost", href: "https://devpost.com/software/lumina-ivry7c" },
    ],
  },
  medai: {
    group: "hackathons",
    story: [
      "MedAI democratizes access to early disease detection by putting an intelligent AI doctor in your pocket.",
      "Its Naive-Bayes model has an 85% accuracy in describing the disease as its top three predictions, and its zero-shot model has an almost 93% accuracy in describing a given image.",
      "Built for the GNEC Hackathon 2024 by a team of four.",
    ],
    links: [
      { label: "Live demo", href: "https://medai24.netlify.app" },
      { label: "GitHub", href: "https://github.com/aayushs-edu/MedAI" },
      { label: "Devpost", href: "https://devpost.com/software/medai-ftinjx" },
    ],
  },
  stockapp: {
    group: "hackathons",
    story: ["A tool for a family in India managing a portfolio of over $1M."],
    links: [{ label: "More projects", href: "/hackathons" }],
  },
  "bounce-back": {
    group: "games",
    story: [
      "A puzzle platformer made in 11 hours with a twist: your past self brings your end. Every jump leaves a mark of danger but also gives you platforms to rebuild the level around you.",
      "You can only move forward, avoiding the remnants of your past self.",
      "GMTK Game Jam: top 20% submission.",
    ],
    links: [itch("bounce-back")],
  },
  "reign-or-ruin": {
    group: "games",
    story: [
      "Rule over your village in this power management game, but these aren't ordinary villagers: they are AI-powered, understand what happens around them, and can act on it, even rebellion.",
      "Hoard too much power and you might get overthrown; keeping villagers happy is expensive, and harming them by accident has dire consequences.",
      "Player2 AI NPC Jam: $50 reward and a special mention.",
    ],
    links: [itch("reign-or-ruin")],
  },
  "biscuit-bandit": {
    group: "games",
    story: [
      "Risk it for the biscuit: you're after the family biscuits, and your parents are lurking, ready to catch you.",
      "Use stealth and strategy to sneak to the biscuit and back, night after night.",
      "Made for the Brackeys 2025.2 Jam.",
    ],
    links: [itch("biscuit-bandit")],
  },
  "murphys-rocket": {
    group: "games",
    story: [
      "Earth is under a robot takeover, so humans must set foot on Mars. You are Murphy, the only scientist left, and you need to build a rocket as fast as possible.",
      "According to Murphy's law, everything that can go wrong will go wrong. Ignite the robots with electricity and defend the rocket at all costs.",
      "Made for the Brackeys 2025.1 Jam.",
    ],
    links: [itch("murphys-rocket")],
  },
};

function toWork(item: GalleryItem): Work {
  const painting = item.mode === "art";
  const extra = (painting ? PAINTINGS : PROJECTS)[item.slug];
  if (!extra) throw new Error(`Showcase: no story for ${item.mode}/${item.slug} in works.ts`);
  const group = painting ? "paintings" : extra.group;
  if (!group) throw new Error(`Showcase: no group for project ${item.slug} in works.ts`);
  return {
    slug: item.slug,
    kind: painting ? "painting" : "project",
    side: extra.side ?? (painting ? "art" : "code"),
    group,
    title: item.title,
    year: extra.year ?? item.year,
    line: item.detail,
    story: extra.story,
    links: extra.links,
    ...(painting ? { wall: "portfolio" as const } : {}),
    media: {
      image: item.assets.color,
      depth: item.assets.depth,
      aspect: item.aspect,
      avgColor: item.avgColor,
      ...(extra.figure ? { figure: extra.figure } : {}),
      ...(HELD[item.slug] ? { held: HELD[item.slug] } : {}),
    },
  };
}

const HELD: Record<string, { src: string; aspect: number }> = paintingsMedia.held;

/** The paintings from before the portfolio, from public/paintings/manifest.json (by the asset script). */
const EARLY: Work[] = paintingsMedia.early.map((p) => ({
  slug: p.slug,
  kind: "painting",
  side: "art",
  group: "paintings",
  wall: "early",
  title: p.title,
  year: p.year,
  line: "Early work",
  story: [p.story],
  links: [ALL_PAINTINGS],
  media: { image: p.image, depth: p.depth, aspect: p.aspect, avgColor: p.avgColor, ...(HELD[p.slug] ? { held: HELD[p.slug] } : {}) },
}));

/** From the /paintings page's "Where it all started". */
const ORIGIN: Work = {
  slug: "where-it-all-started",
  kind: "painting",
  side: "art",
  group: "paintings",
  wall: "early",
  title: "Where It All Started",
  line: "The beginning",
  story: [
    "This all started when Ms. Hromec asked me to draw a book cover on the whiteboard and I left the class in awe.",
    "She saw something in me and informed my parents about my artistic talent. They immediately enrolled me in art class, and from then I have been improving my craft.",
  ],
  links: [ALL_PAINTINGS],
  media: { image: paintingsMedia.origin.image, aspect: paintingsMedia.origin.aspect, avgColor: paintingsMedia.origin.avgColor },
};

const ALL_ANIMATION: WorkLink = { label: "All animation", href: "/animation" };
const MAYA = "Autodesk Maya · Arnold · Premiere Pro";

/** The films (drafts from what each film shows: rewrite freely). */
const FILM_TEXT: Record<string, { title: string; year: string; story: string[] }> = {
  "wild-west": {
    title: "Wild West",
    year: "2024",
    story: ["A Wild West short: inside the saloon with its regulars, then out in the dusty street. Modelled, rigged and animated in Autodesk Maya, rendered with Arnold."],
  },
  "soccer-star": {
    title: "Soccer Star",
    year: "2024",
    story: ["A stadium under the lights, one kick, and a crowd on its feet. Modelled and animated in Autodesk Maya, rendered with Arnold."],
  },
  sanctuary: {
    title: "Sanctuary",
    year: "2023",
    story: ["A flight over floating islands, waterfalls and low-poly trees. Modelled and animated in Autodesk Maya, rendered with Arnold."],
  },
};

const FILMS: Work[] = animationMedia.films.map((f) => {
  const text = FILM_TEXT[f.slug];
  if (!text) throw new Error(`Showcase: no text for film ${f.slug} in works.ts`);
  return {
    slug: f.slug,
    kind: "animation",
    side: "art",
    group: "animation",
    title: text.title,
    year: text.year,
    line: MAYA,
    story: text.story,
    links: [ALL_ANIMATION],
    media: { image: f.poster, aspect: f.aspect, avgColor: "#1d1d1d", loop: f.loop, film: f.film },
  };
});

/** The 3D models from the Wild West short (on Sketchfab). */
const MODEL_TEXT: Record<string, { title: string; story: string[] }> = {
  "main-character": { title: "Main Character", story: ["The Wild West short's lead: modelled, textured and rigged in Autodesk Maya."] },
  "banana-gun": { title: "Banana Gun", story: ["A prop from the Wild West short, modelled in Autodesk Maya."] },
  saloon: { title: "Saloon", story: ["The Wild West short's saloon, modelled and textured in Autodesk Maya."] },
};

const MODELS: Work[] = animationMedia.models.map((m) => {
  const text = MODEL_TEXT[m.slug];
  if (!text) throw new Error(`Showcase: no text for model ${m.slug} in works.ts`);
  return {
    slug: m.slug,
    kind: "model",
    side: "art",
    group: "animation",
    title: text.title,
    line: "3D model · Autodesk Maya",
    story: text.story,
    links: [{ label: "View on Sketchfab", href: `https://sketchfab.com/3d-models/${m.uid}` }, ALL_ANIMATION],
    media: { image: m.thumb, aspect: 16 / 9, avgColor: "#1d1d1d", model: m.glb },
  };
});

/** A hackathon project that isn't in the hero gallery (from its README; media in public/showcase/hackathons). */
const VRSHOP: Work = {
  slug: "vrshop",
  kind: "project",
  side: "code",
  group: "hackathons",
  title: "VRShop",
  year: "2026",
  line: "Unity · C# · Meta Quest 2 · Node.js · TypeScript · OpenAI",
  story: [
    "VRShop is a mixed-reality furniture store for the Meta Quest 2. Browse real products, see them in your own room, replace the furniture you already have, and talk to an AI interior designer without taking off the headset.",
    "Products snap against the walls the headset has scanned, warn when they block a door or overlap, and can stand in for a sofa you already own. Ask the designer for “a black leather sofa under fifteen hundred”, then “put it here”.",
    "“Buy the room” groups the bag by store and checks out with an agent that signs each request (Visa's Trusted Agent Protocol) and stays inside a budget you set. Built at HackGT 13.",
  ],
  links: [
    { label: "Watch the demo", href: "https://www.youtube.com/watch?v=DlslMQg8jPs" },
    { label: "GitHub", href: "https://github.com/AbhirajTiwari12/vrshop" },
  ],
  media: { image: "/showcase/hackathons/vrshop-poster.webp", aspect: 16 / 9, avgColor: "#3a3a3a" },
};

/** A game that isn't in the hero gallery (from its itch.io page; images in public/images). */
const SKYBALL: Work = {
  slug: "skyball",
  kind: "game",
  side: "code",
  group: "games",
  title: "Skyball",
  year: "2026",
  line: "Unity · C# · WebGL",
  story: [
    "Keep the ball up the longest in this arcade, physics-based keep-up game in the sky. Juggle the ball with precise mouse movements, defend it from enemies, and score goals.",
    "Tricks earn combos and multipliers, but scoring shoots the ball up and away, so don't let it escape your control. Earn your spot on the global leaderboard.",
    "Made for ScoreJam #37; still in development.",
  ],
  links: [itch("skyball")],
  media: { image: "/images/skyball-cover.webp", aspect: 495 / 291, avgColor: "#1ad0f2" },
};

export const WORKS: Work[] = [...GALLERY.art.map(toWork), ...EARLY, ORIGIN, ...FILMS, ...MODELS, ...GALLERY.code.map(toWork), VRSHOP, SKYBALL];
