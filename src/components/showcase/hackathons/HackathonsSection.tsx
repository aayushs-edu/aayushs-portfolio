"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type Ref } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Github, Play, X } from "lucide-react";
import { workButtonId } from "../works";
import { WORKS, type Work } from "../works";
import RainingLetters from "./RainingLetters";
import ScrambleTitle from "./ScrambleTitle";
import css from "./HackathonsSection.module.css";

/** The middle panel: the live site itself, or (with nothing to visit) the demo film. */
type Demo =
  | { kind: "site"; url: string; /** A screenshot shown until the site has loaded */ still: string }
  | { kind: "video"; /** A short muted loop (same-origin) */ loop: string; poster: string; /** The YouTube id of the full demo */ youtube: string };

/** What the trifold adds to each work. */
interface Entry {
  slug: string;
  event: string;
  award?: string;
  /** From the project's own colours */
  accent: string;
  /** One or two sentences for the right panel */
  blurb: string;
  /** The left panel: the project's logo on its own ground. `glow` fades a logo cut with its dark ground into the panel. */
  logo: { src: string; width: number; height: number; ground: string; glow?: boolean };
  demo: Demo;
  /** Stills shown under the logo, in turn */
  media?: { src: string; caption: string }[];
  /** Keys the demo needs, shown over it while it's in use */
  keys?: [key: string, does: string][];
}

const DIR = "/showcase/hackathons";

/** Newest first. */
const ENTRIES: Entry[] = [
  {
    slug: "vrshop",
    event: "HackGT 13 · 2026",
    accent: "#62a8ff",
    blurb: "A mixed-reality furniture store for the Meta Quest: try real products in your own room, and ask an AI interior designer to furnish it, without taking off the headset.",
    logo: { src: `${DIR}/vrshop-logo.webp`, width: 720, height: 572, ground: "radial-gradient(circle at 50% 30%, #0c2148 0%, #02060f 75%)", glow: true },
    demo: { kind: "video", loop: `${DIR}/vrshop-loop.mp4`, poster: `${DIR}/vrshop-poster.webp`, youtube: "DlslMQg8jPs" },
    media: [
      { src: `${DIR}/vrshop-showroom.webp`, caption: "The showroom" },
      { src: `${DIR}/vrshop-checkout.webp`, caption: "Buy the room, inside a budget" },
      { src: `${DIR}/vrshop-themes.webp`, caption: "A room to a theme" },
    ],
  },
  {
    slug: "lumina",
    event: "GNEC Hackathon 2025",
    accent: "#ff7a1a",
    blurb: "Stories from marginalized communities, an Inequality Atlas, a themed forum, and LuminaLens, which drafts policy ideas with AI.",
    logo: { src: `${DIR}/lumina-logo.webp`, width: 647, height: 278, ground: "linear-gradient(180deg, #ffd3b8 0%, #ffe8da 55%, #fff8f2 100%)" },
    demo: { kind: "site", url: "https://luminadev.netlify.app", still: `${DIR}/lumina.webp` },
  },
  {
    slug: "exovision",
    event: "NASA Space Apps 2024",
    accent: "#46e05a",
    blurb: "A 3D star map for exoplanets: pick a world and look up at its sky, every star at its true distance, brightness and colour.",
    logo: { src: `${DIR}/exovision-logo.webp`, width: 720, height: 156, ground: "radial-gradient(circle at 50% 45%, #0b1a0e 0%, #000 70%)", glow: true },
    demo: { kind: "site", url: "https://mijosexoskydemo.github.io", still: `${DIR}/exovision.webp` },
    // Its Unity build looks round only while it holds the mouse.
    keys: [
      ["E", "look around"],
      ["R", "free the mouse"],
      ["Space", "next planet"],
    ],
  },
  {
    slug: "medai",
    event: "GNEC Hackathon 2024",
    accent: "#3fbf6e",
    blurb: "An AI doctor in your pocket: describe your symptoms or send a photo, and it suggests what it could be.",
    logo: { src: `${DIR}/medai-logo.webp`, width: 470, height: 172, ground: "radial-gradient(130% 100% at 30% 15%, #2f7d48 0%, #1b4f2c 100%)" },
    demo: { kind: "site", url: "https://medai24.netlify.app", still: `${DIR}/medai.webp` },
  },
];

type Project = Entry & { work: Work; github?: string };

const PROJECTS: Project[] = ENTRIES.flatMap((entry) => {
  const work = WORKS.find((w) => w.slug === entry.slug);
  return work ? [{ ...entry, work, github: work.links.find((l) => l.label === "GitHub")?.href }] : [];
});

/** How long the panels take to fold shut before the next project opens (ms); matches the CSS. */
const FOLD_MS = 330;
/** Each still under a logo stays this long (ms). */
const MEDIA_MS = 3600;
/** A horizontal swipe this long (px) turns to the next project. */
const SWIPE = 50;
/** A demo in use grows by up to this much, keeping this margin (px) to the window's sides and bottom. */
const ZOOM_MAX = 1.5;
const ZOOM_MARGIN = 40;
/** With a demo in use, the heading sits this far (px) from the window's top, and the demo this far under it. */
const HEAD_TOP = 24;
const HEAD_GAP = 24;

const host = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
const stillMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Hackathons: one project at a time, stood up like a trifold without its
 * board. The middle panel is the demo itself: the live site, loaded in place
 * and scaled from desktop size (a click lets you use it), or for VRShop, which
 * runs in a headset, a loop of its demo with the full film a click away. The
 * left panel leans in with the project's logo (and any stills under it); the
 * right one leans in from the other side with its name and a line about it.
 * Turning to another project folds the side panels shut and opens them again.
 * Using a demo (clicking it) brings it forward, larger, under the heading,
 * with the side panels drawn in behind it. The page holds still meanwhile, so
 * scrolling inside the demo never runs on into the page; Done, Esc, a click or
 * a scroll beside it puts it back. Demos load only while the section is near
 * the screen.
 */
export default function HackathonsSection({ onOpen }: { onOpen: (slug: string) => void }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(0);
  const [target, setTarget] = useState(0);
  const [closed, setClosed] = useState(false);
  const [near, setNear] = useState(false);
  const [using, setUsing] = useState(false);
  const [zoom, setZoom] = useState({ scale: 1, shift: 0 });
  const timer = useRef(0);
  const centerRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLElement | null>(null);
  // In use only while it's loaded (the section near the screen).
  const focused = using && near;
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const count = PROJECTS.length;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const seen = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "50% 0px" });
    seen.observe(section);
    return () => {
      seen.disconnect();
      window.clearTimeout(timer.current);
    };
  }, []);

  const go = useCallback(
    (to: number) => {
      const next = (to + count) % count;
      if (next === target) return;
      setTarget(next);
      setUsing(false);
      window.clearTimeout(timer.current);
      if (stillMotion()) {
        setShown(next);
        return;
      }
      setClosed(true);
      timer.current = window.setTimeout(() => {
        setShown(next);
        setClosed(false);
      }, FOLD_MS);
    },
    [count, target],
  );

  // Using a demo: the page scrolls the heading to the top, and the demo grows
  // (up to ZOOM_MAX) to fill the room under it, centred in that room.
  const useDemo = () => {
    const center = centerRef.current;
    const head = headRef.current;
    if (center && head && window.matchMedia("(min-width: 1024px)").matches) {
      const r = center.getBoundingClientRect();
      const by = head.getBoundingClientRect().top - HEAD_TOP;
      const top = head.getBoundingClientRect().bottom - by + HEAD_GAP;
      const bottom = window.innerHeight - ZOOM_MARGIN;
      const scale = Math.max(1, Math.min(ZOOM_MAX, (window.innerWidth - ZOOM_MARGIN * 2) / r.width, (bottom - top) / r.height));
      setZoom({ scale, shift: (top + bottom) / 2 - (r.top - by + r.height / 2) });
      window.scrollTo({ top: window.scrollY + by, behavior: stillMotion() ? "auto" : "smooth" });
    }
    setUsing(true);
  };

  // While a demo is in use the page holds still (as under a dialog), so a
  // scroll that runs off the end of the demo's own page goes nowhere; Esc, or a
  // scroll beside the demo, puts it back.
  useEffect(() => {
    if (!focused) return;
    const root = document.documentElement;
    const gutter = window.innerWidth - root.clientWidth;
    const before = { overflow: root.style.overflow, padding: root.style.paddingRight };
    root.style.overflow = "hidden";
    if (gutter > 0) root.style.paddingRight = `${gutter}px`;
    const onEsc = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setUsing(false);
    };
    const onScrollBeside = (event: Event) => {
      if (!centerRef.current?.contains(event.target as Node)) setUsing(false);
    };
    document.addEventListener("keydown", onEsc);
    window.addEventListener("wheel", onScrollBeside, { passive: true });
    window.addEventListener("touchmove", onScrollBeside, { passive: true });
    return () => {
      root.style.overflow = before.overflow;
      root.style.paddingRight = before.padding;
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("wheel", onScrollBeside);
      window.removeEventListener("touchmove", onScrollBeside);
    };
  }, [focused]);

  const onKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      go(target + (event.key === "ArrowRight" ? 1 : -1));
    }
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    swipe.current = event.pointerType === "touch" ? { x: event.clientX, y: event.clientY } : null;
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.5) go(target + (dx < 0 ? 1 : -1));
  };

  const p = PROJECTS[shown];
  if (!p) return null;

  return (
    <section
      ref={sectionRef}
      id="hackathons"
      className={css.section}
      style={{ "--accent": p.accent } as CSSProperties}
      data-focused={focused}
      aria-labelledby="hackathons-title"
      aria-roledescription="carousel"
    >
      <RainingLetters accent={p.accent} />
      <header ref={headRef} className={css.head}>
        <ScrambleTitle id="hackathons-title" text="Hackathons" pulse={shown} />
        <p className={css.lede}>My best projects</p>
      </header>

      <div
        className={css.stage}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
        // A click beside the demo in use puts it back.
        onClick={(event) => {
          if (focused && !centerRef.current?.contains(event.target as Node)) setUsing(false);
        }}
      >
        <div
          className={css.fold}
          data-closed={closed}
          data-focused={focused}
          style={{ "--zoom": zoom.scale, "--shift": `${zoom.shift.toFixed(1)}px` } as CSSProperties}
          aria-roledescription="slide"
          aria-label={`${shown + 1} of ${count}: ${p.work.title}`}
        >
          <LogoPanel p={p} />
          <DemoPanel ref={centerRef} p={p} live={near} focused={focused} onUse={useDemo} onDone={() => setUsing(false)} />
          <TextPanel p={p} onOpen={onOpen} />
        </div>
      </div>

      <nav className={css.nav} aria-label="Hackathon projects" onKeyDown={onKey}>
        <button type="button" className={css.arrow} onClick={() => go(target - 1)} aria-label="Previous project">
          <ChevronLeft className={css.arrowIcon} aria-hidden="true" />
        </button>
        <ol className={css.picks}>
          {PROJECTS.map((q, i) => (
            <li key={q.slug}>
              <button type="button" className={css.pick} aria-current={i === target} aria-label={q.work.title} onClick={() => go(i)}>
                <span className={css.pickName}>{q.work.title}</span>
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className={css.arrow} onClick={() => go(target + 1)} aria-label="Next project">
          <ChevronRight className={css.arrowIcon} aria-hidden="true" />
        </button>
      </nav>
    </section>
  );
}

/** The left panel: the logo on the project's ground, and its stills (if any) taking turns under it. */
function LogoPanel({ p }: { p: Project }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(0);
  const [slug, setSlug] = useState(p.slug);
  const media = p.media ?? [];
  // Each project's stills start from the first.
  if (slug !== p.slug) {
    setSlug(p.slug);
    setOn(0);
  }

  useEffect(() => {
    const panel = ref.current;
    if (!panel || media.length < 2 || stillMotion()) return;
    let id = 0;
    const seen = new IntersectionObserver(([e]) => {
      window.clearInterval(id);
      if (e.isIntersecting) id = window.setInterval(() => setOn((i) => (i + 1) % media.length), MEDIA_MS);
    });
    seen.observe(panel);
    return () => {
      seen.disconnect();
      window.clearInterval(id);
    };
  }, [p.slug, media.length]);

  return (
    <div ref={ref} className={`${css.panel} ${css.left}`} style={{ background: p.logo.ground }} data-media={media.length > 0}>
      <div className={css.logoBox}>
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized logos in public/showcase */}
        <img src={p.logo.src} width={p.logo.width} height={p.logo.height} alt={`${p.work.title} logo`} decoding="async" className={css.logo} data-glow={!!p.logo.glow} />
      </div>
      {media.length > 0 && (
        <figure className={css.media}>
          <div className={css.mediaFrame}>
            {media.map((m, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- stills from the demo, in public/showcase
              <img key={m.src} src={m.src} alt={i === on ? `${p.work.title}: ${m.caption}` : ""} aria-hidden={i !== on} loading="lazy" decoding="async" data-on={i === on} />
            ))}
          </div>
          <figcaption className={css.mediaCaption}>
            <span>{media[on]?.caption}</span>
            <span className={css.mediaDots} aria-hidden="true">
              {media.map((m, i) => (
                <i key={m.src} data-on={i === on} />
              ))}
            </span>
          </figcaption>
        </figure>
      )}
    </div>
  );
}

interface DemoProps {
  p: Project;
  live: boolean;
  /** In use: the site takes the pointer, or the full film plays */
  focused: boolean;
  onUse: () => void;
  onDone: () => void;
  ref: Ref<HTMLDivElement>;
}

/** The middle panel: a browser's bar over the demo; while it's in use, a Done button in the bar. */
function DemoPanel({ p, live, focused, onUse, onDone, ref }: DemoProps) {
  const demo = p.demo;
  const address = demo.kind === "site" ? host(demo.url) : `youtube.com · ${p.work.title} demo`;
  const href = demo.kind === "site" ? demo.url : `https://www.youtube.com/watch?v=${demo.youtube}`;
  return (
    <div ref={ref} className={`${css.panel} ${css.center}`}>
      <div className={css.bar}>
        <span className={css.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className={css.address}>{address}</span>
        <a href={href} target="_blank" rel="noopener noreferrer" className={css.open} aria-label={`Open ${address} in a new tab`} title="Open in a new tab">
          <ArrowUpRight className={css.openIcon} aria-hidden="true" />
        </a>
        {focused && (
          <button type="button" className={css.done} onClick={onDone}>
            <X className={css.doneIcon} aria-hidden="true" />
            Done
          </button>
        )}
      </div>
      {demo.kind === "site" ? (
        <SiteView key={p.slug} demo={demo} title={p.work.title} live={live} focused={focused} onUse={onUse} keys={p.keys} />
      ) : (
        <FilmView key={p.slug} demo={demo} title={p.work.title} live={live} focused={focused} onUse={onUse} />
      )}
    </div>
  );
}

/** Desktop-size pages, scaled to fit; a phone-size page when the panel is narrow. */
const PAGE_WIDE = 1280;
const PAGE_NARROW = 420;

/** The live site, laid out at desktop width and scaled down; its screenshot shows until it loads, then goes (it showed at the edges otherwise). */
interface SiteViewProps {
  demo: Extract<Demo, { kind: "site" }>;
  title: string;
  live: boolean;
  focused: boolean;
  onUse: () => void;
  keys?: Entry["keys"];
}

function SiteView({ demo, title, live, focused, onUse, keys }: SiteViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState<{ w: number; h: number; s: number } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const view = ref.current;
    if (!view) return;
    // Its layout size, not its size on screen: the panels fold and zoom with transforms, and a size read mid-fold left the site too small (the screenshot showed at its right and bottom).
    const fit = ([entry]: ResizeObserverEntry[]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      const w = width < 600 ? PAGE_NARROW : PAGE_WIDE;
      // A pixel past the panel each way (it clips), so no sliver of what's under it shows at the right or bottom.
      const s = (width + 1) / w;
      setPage({ w, h: Math.ceil((height + 1) / s), s });
    };
    const sizer = new ResizeObserver(fit);
    sizer.observe(view);
    return () => sizer.disconnect();
  }, []);

  return (
    <div ref={ref} className={css.view} data-kind="site">
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized screenshots in public/showcase */}
      <img src={demo.still} alt="" aria-hidden="true" decoding="async" className={css.still} data-hidden={live && loaded} />
      {live && page && <LiveSite url={demo.url} title={title} page={page} trying={focused} onTry={onUse} onLoaded={setLoaded} />}
      {live && focused && keys && (
        <p className={css.keys}>
          {keys.map(([key, does]) => (
            <span key={key} className={css.keyItem}>
              <kbd className={css.kbd}>{key}</kbd>
              {does}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/** The site's frame and, unless it's in use, a cover that keeps the page scrolling past it. */
function LiveSite({
  url,
  title,
  page,
  trying,
  onTry,
  onLoaded,
}: {
  url: string;
  title: string;
  page: { w: number; h: number; s: number };
  trying: boolean;
  onTry: () => void;
  /** Told when the site has loaded, and when it's gone again */
  onLoaded: (loaded: boolean) => void;
}) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => () => onLoaded(false), [onLoaded]);
  return (
    <>
      <iframe
        ref={frameRef}
        src={url}
        title={`${title}, live`}
        className={css.site}
        data-loaded={loaded}
        data-trying={trying}
        tabIndex={trying ? 0 : -1}
        style={{ width: page.w, height: page.h, transform: `scale(${page.s})` }}
        onLoad={() => {
          setLoaded(true);
          onLoaded(true);
        }}
        allow="fullscreen; autoplay; xr-spatial-tracking"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      {!trying && (
        <button
          type="button"
          className={css.cover}
          onClick={() => {
            onTry();
            frameRef.current?.focus({ preventScroll: true });
          }}
        >
          <span className={css.chip}>{loaded ? "Click to try it" : "Loading the live site…"}</span>
        </button>
      )}
    </>
  );
}

/** The demo's loop, playing while on screen; in use, the full film with sound in its place. */
function FilmView({ demo, title, live, focused: watching, onUse }: { demo: Extract<Demo, { kind: "video" }>; title: string; live: boolean; focused: boolean; onUse: () => void }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || stillMotion()) return;
    if (live) video.play().catch(() => {});
    else video.pause();
  }, [live, watching]);

  return (
    <div className={css.view} data-kind="video">
      {watching ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${demo.youtube}?autoplay=1&rel=0`}
          title={`${title} demo`}
          className={css.film}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <>
          <video ref={ref} className={css.still} src={demo.loop} poster={demo.poster} muted loop playsInline preload="metadata" aria-hidden="true" />
          <button type="button" className={css.cover} onClick={onUse}>
            <span className={css.chip}>
              <Play className={css.chipIcon} aria-hidden="true" />
              Watch the full demo
            </span>
          </button>
        </>
      )}
    </div>
  );
}

/** The right panel: the event, the name, a line about it, and where to go next. */
function TextPanel({ p, onOpen }: { p: Project; onOpen: (slug: string) => void }) {
  const visit = p.demo.kind === "site" ? { href: p.demo.url, label: `Visit ${host(p.demo.url)}` } : { href: `https://www.youtube.com/watch?v=${p.demo.youtube}`, label: "Watch the demo on YouTube" };
  return (
    <div className={`${css.panel} ${css.right}`}>
      <p className={css.event}>{p.event}</p>
      <h3 className={css.name}>
        {p.work.title}
        {p.award && <span className={css.award}>{p.award}</span>}
      </h3>
      <p className={css.blurb}>{p.blurb}</p>
      <div className={css.actions}>
        <button id={workButtonId(p.slug)} type="button" className={css.story} onClick={() => onOpen(p.slug)}>
          Read the story
        </button>
        {p.github && (
          <a href={p.github} target="_blank" rel="noopener noreferrer" className={css.iconLink} aria-label={`${p.work.title} on GitHub (opens in a new tab)`} title="GitHub">
            <Github className={css.iconLinkIcon} aria-hidden="true" />
          </a>
        )}
        <a href={visit.href} target="_blank" rel="noopener noreferrer" className={css.visit} aria-label={`${visit.label} (opens in a new tab)`} title={visit.label}>
          <ArrowUpRight className={css.iconLinkIcon} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
