// The works the showcase holds, as one typed list. Stage 1: the hero gallery's
// paintings and projects (images and depth maps from public/hero/), with their
// stories and links taken from the old pages.

import { GALLERY, type GalleryItem } from "../hero/heroConfig";
import type { GroupId } from "./room/types";
import paintwiseMedia from "./stations/paintwise/paintwise.generated.json";

export { GROUP_TITLES } from "./room/types";

export type WorkKind = "painting" | "project" | "game" | "animation" | "hackathon";
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
}

export interface Work {
  /** URL-safe id */
  slug: string;
  kind: WorkKind;
  side: WorkSide;
  /** The station that holds it */
  group: GroupId;
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

/** Each kind's heading, in the order the fallback page lists them. */
export const KIND_TITLES: Record<WorkKind, string> = {
  painting: "Paintings",
  project: "Projects",
  game: "Games",
  animation: "Animation",
  hackathon: "Hackathons",
};

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
    links: [{ label: "Read the build log", href: "/paintwise" }],
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
    media: { image: item.assets.color, depth: item.assets.depth, aspect: item.aspect, avgColor: item.avgColor, ...(extra.figure ? { figure: extra.figure } : {}) },
  };
}

export const WORKS: Work[] = [...GALLERY.art, ...GALLERY.code].map(toWork);
