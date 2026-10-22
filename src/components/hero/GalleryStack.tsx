"use client";

import Image from "next/image";
import Link from "next/link";
import { animate, AnimatePresence, motion, useMotionValue, type MotionStyle } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import styles from "./Hero.module.css";
import {
  BROWSE,
  CARD_SPRING,
  GALLERY,
  MODE_LABEL,
  SWITCH,
  circularOffset,
  collapsedSlot,
  itemLabel,
  slotFor,
  type GalleryItem,
  type Mode,
  type SlotTransform,
  type Tier,
} from "./heroConfig";

type Phase = "idle" | "gather" | "flip" | "spread";
type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

const SIZES = "(max-width: 639px) 90vw, (max-width: 1279px) 55vw, 48vw";

export interface GalleryStackProps {
  /** Requested mode; the stack flips to it. */
  mode: Mode;
  selected: Record<Mode, number>;
  onSelect: (mode: Mode, index: number) => void;
  tier: Tier;
  /** Browsing and switching only at rest (p < 0.03). */
  interactive: boolean;
  panelId: string;
  /** Receives horizontal wheel / trackpad input (the hero viewport). */
  wheelTarget: RefObject<HTMLElement | null>;
  /** The front card's inner image element, for WebGL alignment. */
  frontImageRef: RefObject<HTMLElement | null>;
  /** False while cards move or flip; true once everything has settled. */
  onSettledChange: (settled: boolean) => void;
  /** Mode actually on screen (lags `mode` during a flip). */
  onDisplayModeChange: (mode: Mode) => void;
  /** Scroll-driven CSS variables for the front card (zoom, frame fade). */
  frontStyle?: MotionStyle;
  /** Scroll-driven CSS variables for the placard text block. */
  placardStyle?: MotionStyle;
  placardTextRef: RefObject<HTMLDivElement | null>;
  detailSuffixRef: RefObject<HTMLSpanElement | null>;
  /** Tap on the front card (lite tier moves the light). */
  onFrontTap?: (clientX: number, clientY: number) => void;
}

function frameVars(item: GalleryItem): CSSVars {
  return { "--w": item.frame.w, "--h": item.frame.h, "--iw": item.frame.imgW, "--ih": item.frame.imgH };
}

// ---------------------------------------------------------------------------

interface CardProps {
  item: GalleryItem;
  d: number;
  phase: Phase;
  tier: Tier;
  interactive: boolean;
  mountedDuringSpread: boolean;
  priority: boolean;
  frontStyle?: MotionStyle;
  imageRef?: RefObject<HTMLElement | null>;
  onActivate: (d: number, event: { clientX: number; clientY: number }) => void;
  onSettled?: () => void;
  onFocusFront?: (el: HTMLButtonElement | null) => void;
}

function Card({ item, d, phase, tier, interactive, mountedDuringSpread, priority, frontStyle, imageRef, onActivate, onSettled, onFocusFront }: CardProps) {
  const gathering = phase === "gather";
  const target: SlotTransform = gathering ? collapsedSlot(d) : slotFor(d, item.frame);
  const initial = mountedDuringSpread && d !== 0 ? collapsedSlot(d) : target;

  const x = useMotionValue(initial.x);
  const y = useMotionValue(initial.y);
  const r = useMotionValue(initial.r);
  const s = useMotionValue(initial.s);
  const o = useMotionValue(initial.o);
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;

  useEffect(() => {
    const transition =
      tier === "static"
        ? { duration: 0 }
        : phase === "gather"
          ? { duration: SWITCH.gatherMs / 1000, ease: "easeIn" as const }
          : phase === "spread"
            ? { duration: SWITCH.spreadMs / 1000, ease: "easeOut" as const }
            : CARD_SPRING;
    const controls = [
      animate(x, target.x, transition),
      animate(y, target.y, transition),
      animate(r, target.r, transition),
      animate(s, target.s, transition),
      animate(o, target.o, { ...transition, ...(tier === "static" ? {} : { type: "tween", duration: 0.22, ease: "linear" }) }),
    ];
    let live = true;
    Promise.all(controls.map((c) => c.finished)).then(() => {
      if (live) settledRef.current?.();
    });
    return () => {
      live = false;
      controls.forEach((c) => c.stop());
    };
  }, [target.x, target.y, target.r, target.s, target.o, phase, tier, x, y, r, s, o]);

  const isFront = d === 0;
  const side = Math.sign(d);
  const style: MotionStyle = {
    ...(frameVars(item) as MotionStyle),
    "--x": x,
    "--y": y,
    "--r": r,
    "--s": s,
    "--o": o,
    "--z": target.z,
    "--side": side,
    "--side-abs": Math.abs(side),
    "--hover-r": side * 2,
    ...(isFront ? frontStyle : {}),
  } as MotionStyle;

  return (
    <motion.button
      type="button"
      className={styles.card}
      style={style}
      data-front={isFront}
      data-hoverable={interactive && Math.abs(d) <= 2 && !isFront}
      aria-label={itemLabel(item)}
      aria-current={isFront ? "true" : undefined}
      aria-hidden={Math.abs(d) > 2 ? true : undefined}
      tabIndex={isFront ? 0 : -1}
      ref={isFront ? onFocusFront : undefined}
      onClick={(event) => onActivate(d, event)}
    >
      <span className={styles.lift}>
        <span className={styles.frame} />
        <span className={styles.image} ref={imageRef}>
          <Image
            src={item.assets.color}
            alt=""
            fill
            sizes={SIZES}
            priority={priority}
            loading={priority || Math.abs(d) <= 2 ? "eager" : "lazy"}
            draggable={false}
          />
        </span>
      </span>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------

function Flipper({ from, to, onDone }: { from: GalleryItem; to: GalleryItem; onDone: () => void }) {
  const flip = useMotionValue(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    const controls = animate(flip, 180, { duration: SWITCH.flipMs / 1000, ease: SWITCH.flipEase });
    controls.finished.then(() => doneRef.current());
    return () => controls.stop();
  }, [flip]);
  const face = (item: GalleryItem, back: boolean) => (
    <span className={`${styles.face} ${back ? styles.faceBack : ""}`} style={frameVars(item)}>
      <span className={styles.frame} />
      <span className={styles.image}>
        <Image src={item.assets.color} alt="" fill sizes={SIZES} draggable={false} />
      </span>
    </span>
  );
  return (
    <motion.div className={styles.flipper} style={{ "--flip": flip } as MotionStyle} aria-hidden="true">
      {face(from, false)}
      {face(to, true)}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

export default function GalleryStack({
  mode,
  selected,
  onSelect,
  tier,
  interactive,
  panelId,
  wheelTarget,
  frontImageRef,
  onSettledChange,
  onDisplayModeChange,
  frontStyle,
  placardStyle,
  placardTextRef,
  detailSuffixRef,
  onFrontTap,
}: GalleryStackProps) {
  const [displayMode, setDisplayMode] = useState<Mode>(mode);
  const [phase, setPhase] = useState<Phase>("idle");
  const [flipFrom, setFlipFrom] = useState<GalleryItem | null>(null);
  const [moving, setMoving] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [staticKey, setStaticKey] = useState(0);
  const [prefetch, setPrefetch] = useState(false);
  const firstPaint = useRef(true);

  const items = GALLERY[displayMode];
  const sel = selected[displayMode];
  const front = items[sel];
  const n = items.length;
  const canBrowse = interactive && phase === "idle";

  const frontButton = useRef<HTMLButtonElement | null>(null);
  const areaRef = useRef<HTMLDivElement | null>(null);
  const dragX = useMotionValue(0);

  // ---- settle reporting ----------------------------------------------------
  const settled = phase === "idle" && !moving;
  useEffect(() => onSettledChange(settled), [settled, onSettledChange]);
  useEffect(() => onDisplayModeChange(displayMode), [displayMode, onDisplayModeChange]);

  // ---- mode switch ---------------------------------------------------------
  useEffect(() => {
    if (mode === displayMode || phase !== "idle") return;
    setAnnouncement(MODE_LABEL[mode].shown);
    if (tier === "static") {
      setDisplayMode(mode);
      setStaticKey((k) => k + 1);
      return;
    }
    setFlipFrom(GALLERY[displayMode][selected[displayMode]]);
    setPhase("gather");
  }, [mode, displayMode, phase, tier, selected]);

  useEffect(() => {
    if (phase === "gather") {
      const timer = window.setTimeout(() => setPhase("flip"), SWITCH.gatherMs);
      return () => window.clearTimeout(timer);
    }
    if (phase === "spread") {
      const timer = window.setTimeout(() => {
        setPhase("idle");
        setFlipFrom(null);
      }, SWITCH.spreadMs);
      return () => window.clearTimeout(timer);
    }
  }, [phase]);

  const onFlipDone = useCallback(() => {
    setDisplayMode(mode);
    setPhase("spread");
  }, [mode]);

  // ---- browsing ------------------------------------------------------------
  const step = useCallback(
    (delta: number) => {
      if (!canBrowse || n < 2) return;
      let next = sel + delta;
      if (n < 3) next = Math.min(n - 1, Math.max(0, next));
      else next = ((next % n) + n) % n;
      if (next === sel) return;
      setMoving(tier !== "static");
      onSelect(displayMode, next);
    },
    [canBrowse, n, sel, tier, onSelect, displayMode],
  );

  // Announce the selection after the first paint.
  useEffect(() => {
    if (firstPaint.current) {
      firstPaint.current = false;
      return;
    }
    setAnnouncement(itemLabel(GALLERY[displayMode][sel]));
  }, [sel, displayMode]);

  // Keep focus on the front card when browsing from the keyboard.
  const focusWithin = useRef(false);
  useEffect(() => {
    if (focusWithin.current) frontButton.current?.focus({ preventScroll: true });
  }, [sel, displayMode]);

  // Horizontal wheel / trackpad. preventDefault only on horizontal-dominant events.
  const stepRef = useRef(step);
  stepRef.current = step;
  const canBrowseRef = useRef(canBrowse);
  canBrowseRef.current = canBrowse;
  useEffect(() => {
    const target = wheelTarget.current;
    if (!target) return;
    let acc = 0;
    let lastWheel = 0;
    let cooldownUntil = 0;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      if (!canBrowseRef.current) return;
      event.preventDefault();
      const t = performance.now();
      if (t - lastWheel > 220) acc = 0;
      lastWheel = t;
      if (t < cooldownUntil) return;
      acc += event.deltaX;
      if (Math.abs(acc) >= BROWSE.wheelStepPx) {
        stepRef.current(Math.sign(acc));
        acc = 0;
        cooldownUntil = t + BROWSE.cooldownMs;
      }
    };
    target.addEventListener("wheel", onWheel, { passive: false });
    return () => target.removeEventListener("wheel", onWheel);
  }, [wheelTarget]);

  // Drag / swipe on the stack.
  const suppressClick = useRef(false);
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    let startX = 0;
    let startY = 0;
    let active = false;
    let dragging = false;
    let samples: { x: number; t: number }[] = [];

    const onMove = (event: PointerEvent) => {
      if (!active) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!dragging && Math.abs(dx) > BROWSE.clickSlopPx && Math.abs(dx) > Math.abs(dy)) dragging = true;
      if (!dragging) return;
      dragX.set(dx * BROWSE.dragFollow);
      samples.push({ x: event.clientX, t: performance.now() });
      if (samples.length > 6) samples.shift();
    };
    const onUp = (event: PointerEvent) => {
      if (!active) return;
      active = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      if (!dragging) return;
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 0);
      const dx = event.clientX - startX;
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = first && last ? (last.t - first.t) / 1000 : 0;
      const velocity = dt > 0 ? (last.x - first.x) / dt : 0;
      const cardWidth = frontButton.current?.getBoundingClientRect().width ?? 600;
      if (Math.abs(dx) > cardWidth * BROWSE.dragStepFraction || Math.abs(velocity) > BROWSE.dragVelocity) {
        stepRef.current(dx < 0 ? 1 : -1);
      }
      animate(dragX, 0, CARD_SPRING);
    };
    const onCancel = () => {
      active = false;
      dragging = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      animate(dragX, 0, CARD_SPRING);
    };
    const onDown = (event: PointerEvent) => {
      if (!canBrowseRef.current || !event.isPrimary || event.button !== 0) return;
      active = true;
      dragging = false;
      startX = event.clientX;
      startY = event.clientY;
      samples = [{ x: event.clientX, t: performance.now() }];
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
    };
    area.addEventListener("pointerdown", onDown);
    return () => {
      area.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [dragX]);

  const twiceTimer = useRef(0);
  const onActivate = (d: number, event?: { clientX: number; clientY: number }) => {
    if (suppressClick.current) return;
    if (d === 0) {
      if (event) onFrontTap?.(event.clientX, event.clientY);
      return;
    }
    if (Math.abs(d) > 2 || !canBrowse) return;
    step(Math.sign(d));
    if (Math.abs(d) === 2) {
      window.clearTimeout(twiceTimer.current);
      twiceTimer.current = window.setTimeout(() => stepRef.current(Math.sign(d)), 170);
    }
  };
  useEffect(() => () => window.clearTimeout(twiceTimer.current), []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
  };

  // Prefetch the other mode's selected card (the flip's back face) on idle.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = idle(() => setPrefetch(true));
    return () => cancel(id);
  }, []);

  const otherMode: Mode = displayMode === "art" ? "code" : "art";
  const otherItem = GALLERY[otherMode][selected[otherMode]];
  const label = MODE_LABEL[displayMode];

  // ---- render ----------------------------------------------------------------
  const showCards = phase !== "flip";
  return (
    <>
      <div
        ref={areaRef}
        id={panelId}
        role="tabpanel"
        aria-roledescription="carousel"
        aria-label={label.region}
        className={styles.stackArea}
        onKeyDown={onKeyDown}
        onFocus={() => (focusWithin.current = true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) focusWithin.current = false;
        }}
      >
        <motion.div
          key={tier === "static" ? staticKey : "stack"}
          className={`${styles.stackCenter} ${tier === "static" && staticKey > 0 ? styles.staticFade : ""}`}
          style={{ "--drag-x": dragX } as MotionStyle}
        >
          {showCards &&
            items.map((item, i) => {
              const d = circularOffset(i, sel, n);
              const isFront = d === 0;
              return (
                <Card
                  key={`${displayMode}-${item.slug}`}
                  item={item}
                  d={d}
                  phase={phase}
                  tier={tier}
                  interactive={canBrowse}
                  mountedDuringSpread={phase === "spread"}
                  priority={isFront && displayMode === mode && phase === "idle"}
                  frontStyle={frontStyle}
                  imageRef={isFront ? frontImageRef : undefined}
                  onActivate={onActivate}
                  onSettled={isFront ? () => setMoving(false) : undefined}
                  onFocusFront={
                    isFront
                      ? (el) => {
                          frontButton.current = el;
                        }
                      : undefined
                  }
                />
              );
            })}
          {phase === "flip" && flipFrom && <Flipper from={flipFrom} to={GALLERY[mode][selected[mode]]} onDone={onFlipDone} />}
        </motion.div>
        {prefetch && (
          <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }} aria-hidden="true">
            <span style={{ position: "relative", display: "block", width: 600, height: 400 }}>
              <Image src={otherItem.assets.color} alt="" fill sizes={SIZES} loading="eager" />
            </span>
          </span>
        )}
      </div>

      <div className={styles.placard}>
        <motion.div className={styles.placardText} ref={placardTextRef} style={placardStyle}>
          <AnimatePresence initial={false}>
            <motion.p
              key={`${displayMode}-${front.slug}`}
              className={styles.placardLine}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: tier === "static" ? 0 : 0.2, ease: "linear" }}
            >
              <cite>{front.title}</cite>
              {front.year ? `, ${front.year}` : ""} · {front.detail}
              <span ref={detailSuffixRef} />
            </motion.p>
          </AnimatePresence>
        </motion.div>
        <div className={styles.controls}>
          <button type="button" className={styles.ctrl} aria-label="Previous" onClick={() => step(-1)} disabled={!canBrowse || (n < 3 && sel === 0)}>
            ←
          </button>
          <span className={styles.count} aria-hidden="true">
            {sel + 1} / {n}
          </span>
          <button type="button" className={styles.ctrl} aria-label="Next" onClick={() => step(1)} disabled={!canBrowse || (n < 3 && sel === n - 1)}>
            →
          </button>
        </div>
        <div className={styles.linkCell}>
          <AnimatePresence initial={false}>
            <motion.span
              key={`${displayMode}-${front.href}`}
              style={{ gridArea: "1 / 1" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: tier === "static" ? 0 : 0.2, ease: "linear" }}
            >
              {front.external ? (
                <a className={styles.link} href={front.href} target="_blank" rel="noopener noreferrer">
                  {label.link} →
                </a>
              ) : (
                <Link className={styles.link} href={front.href}>
                  {label.link} →
                </Link>
              )}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </>
  );
}
