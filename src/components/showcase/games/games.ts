import { WORKS, type Work } from "../works";

/**
 * The games, newest first, with what the Games section adds to their works:
 * the itch.io HTML5 build (itch's own embed, by the upload id from each
 * game's itch page, at its native size), or a video for a game that only
 * downloads, the
 * screenshots, the jam, and a colour from the cover for the case spines,
 * marquees and cartridges.
 */
export interface Game {
  slug: string;
  work: Work;
  tagline: string;
  jam: string;
  award?: string;
  /**
   * itch.io's embed of the build (the raw itch.zone build shows a "use itch.io"
   * banner when framed elsewhere), and how its canvas sizes: `fill` builds
   * stretch to any window; the rest have a fixed canvas of width × height
   * (measured from the build, not itch's listed viewport, which can be bigger).
   */
  build?: { src: string; width: number; height: number; fill?: boolean };
  /** A YouTube id, for a game with no browser build. */
  video?: string;
  shots: string[];
  accent: string;
  /** Which input it wants, when its page says so. */
  input?: string;
}

const RAW: Omit<Game, "work">[] = [
  {
    slug: "skyball",
    tagline: "Keep the ball up!",
    jam: "ScoreJam #37",
    award: "Top 10",
    build: { src: "https://itch.io/embed-upload/15923378?color=000000", width: 960, height: 600 },
    shots: ["/images/skyball-1.webp", "/images/skyball-2.webp", "/images/skyball-cover.webp"],
    accent: "#3bc4e0",
    input: "Mouse recommended",
  },
  {
    slug: "bounce-back",
    tagline: "Build around your past self.",
    jam: "GMTK Game Jam 2025",
    award: "Top 20%",
    build: { src: "https://itch.io/embed-upload/14547530?color=000000", width: 960, height: 600, fill: true },
    shots: ["/images/bounce-back-1.webp", "/images/bounce-back-2.webp", "/images/bounce-back-3.webp"],
    accent: "#eb9854",
  },
  {
    slug: "reign-or-ruin",
    tagline: "Reign benevolently, or get overthrown by AI-powered villagers.",
    jam: "Player2 AI NPC Jam",
    award: "$50 prize · special mention",
    build: { src: "https://itch.io/embed-upload/14596305?color=000000", width: 1920, height: 1080 },
    shots: ["/images/reign-or-ruin-1.webp", "/images/reign-or-ruin-2.webp", "/images/reign-or-ruin-3.webp"],
    accent: "#d56e49",
  },
  {
    slug: "biscuit-bandit",
    tagline: "Don't get caught by your parents!",
    jam: "Brackeys Game Jam 2025.2",
    build: { src: "https://itch.io/embed-upload/14825022?color=000000", width: 960, height: 600 },
    shots: ["/images/biscuit-bandit-cover.webp"],
    accent: "#deaf56",
  },
  {
    slug: "murphys-rocket",
    tagline: "Everything that can go wrong, will.",
    jam: "Brackeys Game Jam 2025.1",
    video: "JSxPAp4jn3Y",
    shots: ["/images/murphys-rocket-1.webp", "/images/murphys-rocket-2.webp", "/images/murphys-rocket-3.webp", "/images/murphys-rocket-4.webp"],
    accent: "#89afd6",
  },
];

export const GAMES: Game[] = RAW.map((g) => {
  const work = WORKS.find((w) => w.slug === g.slug);
  if (!work) throw new Error(`Games: no work for ${g.slug} in works.ts`);
  return { ...g, work };
});

/** itch's embed adds a bar this tall under the game (its logo and a full-screen button). */
export const EMBED_BAR = 20;

/**
 * The screen takes the game's shape: its canvas's plus itch's bar, or 16:9 for
 * a `fill` build or a video. The handheld holds the screen at a 16:9 height,
 * so a narrower game is narrower, never taller.
 */
export const screenAspect = (g: Game) => (g.build && !g.build.fill ? g.build.width / (g.build.height + EMBED_BAR) : 16 / 9);

export const itchHref = (g: Game) => g.work.links[0]?.href ?? `https://aayushs-edu.itch.io/${g.slug}`;
