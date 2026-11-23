"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startPerf } from "@/lib/perf";
import SparklesHero from "../hero/SparklesHero";
import AnimationSection from "./animation/AnimationSection";
import DetailPanel from "./DetailPanel";
import GamesSection from "./games/GamesSection";
import HackathonsSection from "./hackathons/HackathonsSection";
import HandOff, { type HandOffItem } from "./HandOff";
import PaintingsSection from "./paintings/PaintingsSection";
import PaintwiseSection from "./paintwise/PaintwiseSection";
import css from "./Showcase.module.css";
import media from "./stations/paintwise/paintwise.generated.json";
import WorkDivider from "./WorkDivider";
import { workButtonId, WORKS, type Work } from "./works";

const BY_SLUG = new Map(WORKS.map((work) => [work.slug, work]));

const FIGURE_ID = "paintwise-figure";

/** `#work/<slug>` → slug, if it names a work. */
function slugFromHash(): string | null {
  const match = /^#work\/([\w-]+)$/.exec(window.location.hash);
  return match && BY_SLUG.has(match[1]) ? match[1] : null;
}

/** While a dialog is open the page doesn't scroll. */
function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const html = document.documentElement;
    const before = { overflow: html.style.overflow, gutter: html.style.scrollbarGutter };
    html.style.overflow = "hidden";
    html.style.scrollbarGutter = "stable";
    return () => {
      html.style.overflow = before.overflow;
      html.style.scrollbarGutter = before.gutter;
    };
  }, [locked]);
}

/**
 * The one-page site: the hero (the first section; it scrolls away with the
 * page), then the work, a section per group. Every work's full story is one
 * click away (`#work/<slug>`).
 */
export default function Showcase() {
  // A #work link opens its work once the client has mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Watch whether this machine keeps up; on one that doesn't, the heaviest effects ease off (src/lib/perf.ts).
  useEffect(() => startPerf(), []);

  // ---- the detail view ---------------------------------------------------------
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const pushed = useRef(false);
  const returnTo = useRef<string | null>(null);

  const openWork = useCallback((slug: string) => {
    if (!BY_SLUG.has(slug)) return;
    returnTo.current = slug;
    setOpenSlug(slug);
    window.history.pushState(null, "", `#work/${slug}`);
    pushed.current = true;
  }, []);

  const closeWork = useCallback(() => {
    if (pushed.current && slugFromHash()) {
      // Back out of the entry we pushed; popstate closes the panel.
      pushed.current = false;
      window.history.back();
      return;
    }
    pushed.current = false;
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setOpenSlug(null);
  }, []);

  useEffect(() => {
    const onPop = () => {
      pushed.current = false;
      setOpenSlug(slugFromHash());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // A #work/<slug> link opens that work.
  const linked = useRef(false);
  useEffect(() => {
    if (!mounted || linked.current) return;
    linked.current = true;
    const slug = slugFromHash();
    if (!slug) return;
    returnTo.current = slug;
    setOpenSlug(slug);
  }, [mounted]);

  // Closing returns focus to the work.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (openSlug) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const slug = returnTo.current;
    if (slug) document.getElementById(workButtonId(slug))?.focus({ preventScroll: true });
  }, [openSlug]);

  // ---- the figure, full size --------------------------------------------------------
  const [handOff, setHandOff] = useState<HandOffItem | null>(null);
  const openFigure = useCallback((from: DOMRect | null) => {
    setHandOff({ src: media.figure.src, alt: "Figure 1: the Paintwise pipeline, from scene understanding to critique", aspect: media.figure.aspect, from });
  }, []);
  const closeFigure = useCallback(() => {
    setHandOff(null);
    document.getElementById(FIGURE_ID)?.focus({ preventScroll: true });
  }, []);

  useScrollLock(!!openSlug || !!handOff);

  const openWorkObj: Work | null = openSlug ? (BY_SLUG.get(openSlug) ?? null) : null;

  return (
    <div className={css.page}>
      <SparklesHero />
      <div className={css.work}>
        <WorkDivider target="paintwise" />
        <PaintwiseSection storyId={workButtonId("paintwise")} figureId={FIGURE_ID} onStory={() => openWork("paintwise")} onFigure={openFigure} />
        <HackathonsSection onOpen={openWork} />
        <PaintingsSection />
        <GamesSection />
        <AnimationSection />
      </div>
      <DetailPanel work={openWorkObj} onClose={closeWork} />
      <HandOff item={handOff} onClose={closeFigure} />
    </div>
  );
}
