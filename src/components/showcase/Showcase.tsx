"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SparklesHero from "../hero/SparklesHero";
import { useHeroTier } from "../hero/useHeroTier";
import DetailPanel from "./DetailPanel";
import AnimationSection from "./animation/AnimationSection";
import HackathonsSection from "./hackathons/HackathonsSection";
import HandOff, { type HandOffItem } from "./HandOff";
import PaintingsSection from "./paintings/PaintingsSection";
import PaintwiseSection from "./paintwise/PaintwiseSection";
import css from "./Showcase.module.css";
import media from "./stations/paintwise/paintwise.generated.json";
import WorkDivider from "./WorkDivider";
import WorkList, { workButtonId, type WorkListGroup } from "./WorkList";
import { GROUP_ORDER, GROUP_TITLES, WORKS, type GroupId, type Work } from "./works";

const BY_SLUG = new Map(WORKS.map((work) => [work.slug, work]));

/** Paintwise, Hackathons, Paintings and Animation have sections of their own; every other group is a grid under them, in page order. */
const OWN_SECTION = new Set<GroupId>(["paintwise", "hackathons", "paintings", "animation"]);
const GROUPS: WorkListGroup[] = GROUP_ORDER.filter((id) => !OWN_SECTION.has(id))
  .map((id) => ({ title: GROUP_TITLES[id], works: WORKS.filter((w) => w.group === id) }))
  .filter((g) => g.works.length > 0);

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
 * page), then the work: the sections of their own, then a grid per group.
 * Every work's full story is one click away (`#work/<slug>`).
 */
export default function Showcase() {
  // Only "detected" (the client has mounted) is used for now: a #work link waits for it. The sparkles hero has no tiers.
  const [, , detected] = useHeroTier();

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
    if (!detected || linked.current) return;
    linked.current = true;
    const slug = slugFromHash();
    if (!slug) return;
    returnTo.current = slug;
    setOpenSlug(slug);
  }, [detected]);

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
      {/* Trial: the sparkles hero. The seam hero is <SplitHero tier={tier} onFail={demote} /> (take tier and demote from useHeroTier). */}
      <SparklesHero />
      <div className={css.work}>
        <WorkDivider target="paintwise" />
        <PaintwiseSection storyId={workButtonId("paintwise")} figureId={FIGURE_ID} onStory={() => openWork("paintwise")} onFigure={openFigure} />
        <HackathonsSection onOpen={openWork} />
        <PaintingsSection />
        <AnimationSection />
        <WorkList groups={GROUPS} onOpen={openWork} />
      </div>
      <DetailPanel work={openWorkObj} onClose={closeWork} />
      <HandOff item={handOff} onClose={closeFigure} />
    </div>
  );
}
