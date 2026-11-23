"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Play, X } from "lucide-react";
import { responsive, sized } from "@/lib/images";
import { usePerfLite } from "@/lib/perf";
import type { StumpScene } from "./stumpScene";
import media from "../stations/animation/animation.generated.json";
import { WORKS } from "../works";
import css from "./AnimationSection.module.css";
import FilmGrain from "./FilmGrain";
import HandDrawnTitle from "./HandDrawnTitle";

const FILMS = media.films.map((f) => ({ ...f, work: WORKS.find((w) => w.slug === f.slug)! }));
const MODELS = media.models.map((m) => ({ ...m, work: WORKS.find((w) => w.slug === m.slug)! }));
/** The storyboard stills, all from Wild West, named as the old /animation page named them. */
const STILL_TITLES = ["Opening Shot", "Character Introduction", "Environment Design", "Action Sequence", "Action Sequence", "Action Sequence", "Cowboy Shot", "Final Blow"];
const STILLS = media.stills.map((s, i) => ({ ...s, title: STILL_TITLES[i] ?? `Still ${i + 1}` }));
/** Only Wild West has props (its models and stills). */
const PROPS_FOR = "wild-west";

/** The glow behind the screen: a tiny copy of the picture, blurred up by CSS, redrawn this often (ms). */
const GLOW_W = 32;
const GLOW_H = 18;
const GLOW_MS = 120;

/**
 * The models stand on stumps, all drawn the same size and on one floor line.
 * Each viewer is as wide as its slot, and all are as tall as the widest one's
 * STAGE_TALL × its width (span × STAGE_TALL of a normal slot's width): the saloon's slot is `span` times the
 * others', so its model can be much bigger while its stump stays the same.
 * The stump is STUMP_W of a normal slot wide, its bottom on the floor; the
 * camera is fitted to the model's bounding box so the feet land on the
 * stump's top and the footprint fills `fill` of that top.
 */
const STUMP_W = 0.7;
const STAGE_TALL = 0.66;
const PROP_ORDER = ["main-character", "saloon", "banana-gun"];
const PROP_FIT: Record<string, { span: number; fill: number }> = {
  saloon: { span: 1.8, fill: 2.9 },
};
const PROP_DEFAULT = { span: 1, fill: 1.5 };
const MAX_SPAN = Math.max(PROP_DEFAULT.span, ...Object.values(PROP_FIT).map((f) => f.span));
const PROPS = [...MODELS]
  .sort((a, b) => PROP_ORDER.indexOf(a.slug) - PROP_ORDER.indexOf(b.slug))
  .map((m) => {
    const { span, fill } = PROP_FIT[m.slug] ?? PROP_DEFAULT;
    const stumpW = STUMP_W / span;
    const aspect = span / (MAX_SPAN * STAGE_TALL);
    return {
      ...m,
      span,
      fill,
      stumpW,
      aspect,
      // The stump SVG (200×110, its top's centre 20 down) stands 1% above the
      // viewer's foot; this is where that top lands, as a share of the height.
      feet: 0.99 - (90 / 110) * stumpW * (110 / 200) * aspect,
      stumpTop: stumpW * 0.8,
    };
  });

/**
 * Animation: a theatre, under faint film grain and flicker (FilmGrain), its
 * title a hand-drawn line that boils (HandDrawnTitle). The programme (the film titles, outlined like the
 * hero's name until picked) sits over a big screen in a dark house, lit from
 * behind by a glow sampled from the picture. Each film opens on a title card.
 * Its silent loop plays while the screen is in view; clicking the screen
 * plays the full film there, with sound. Under Wild West, its making: the
 * three models standing on stumps (drag one to turn it), then its storyboard
 * running past on a film strip. For the other films that folds away.
 */
export default function AnimationSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const glowRef = useRef<HTMLCanvasElement | null>(null);
  const modelsRef = useRef<HTMLCanvasElement | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sceneRef = useRef<StumpScene | null>(null);
  const lite = usePerfLite();
  const liteRef = useRef(lite);
  liteRef.current = lite;

  const [filmIndex, setFilmIndex] = useState(0);
  const [full, setFull] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [near, setNear] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  /** Bumped to run the title card: when the screen first comes into view, then on each switch. */
  const [card, setCard] = useState(0);

  const film = FILMS[filmIndex];
  const hasProps = film.slug === PROPS_FOR;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(motion.matches);
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  // The loop plays only while the screen is in view; the models load as the section nears.
  useEffect(() => {
    const screen = screenRef.current;
    const section = sectionRef.current;
    if (!screen || !section) return;
    // A busy page can deliver several entries at once (say, the first "out" and a fast scroll's "in"): the last is current.
    const seen = new IntersectionObserver((es) => setInView(es[es.length - 1].isIntersecting), { threshold: 0.25 });
    const nearing = new IntersectionObserver((es) => es[es.length - 1].isIntersecting && setNear(true), { rootMargin: "800px 0px" });
    seen.observe(screen);
    nearing.observe(section);
    return () => {
      seen.disconnect();
      nearing.disconnect();
    };
  }, []);

  // The models load (and warm up) once Wild West's section nears, into one canvas over their stumps.
  useEffect(() => {
    if (near && hasProps) setModelsLoading(true);
  }, [near, hasProps]);

  useEffect(() => {
    const canvas = modelsRef.current;
    if (!modelsLoading || !canvas) return;
    let live = true;
    const specs = PROPS.map((m, i) => ({ glb: m.glb, fit: m, slot: slotRefs.current[i]! }));
    import("./stumpScene")
      .then(({ createStumpScene }) => createStumpScene(canvas, specs, { turning: !liteRef.current, onReady: () => live && setModelsReady(true) }))
      .then((scene) => {
        if (live) sceneRef.current = scene;
        else scene.dispose();
      })
      .catch(() => {});
    return () => {
      live = false;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [modelsLoading]);

  // In lite mode the models stand still (a drag still turns them).
  useEffect(() => {
    sceneRef.current?.setTurning(!lite);
  }, [lite]);

  useEffect(() => {
    if (inView) setCard((c) => c || 1);
  }, [inView]);

  // The loop: muted, playing while in view (never on its own with reduced motion).
  useEffect(() => {
    const video = videoRef.current;
    if (!video || full) return;
    video.muted = true;
    if (inView && !reduced) video.play().catch(() => {});
    else video.pause();
  }, [inView, reduced, full, filmIndex]);

  // The full film starts as soon as it's on the screen (the click allows sound).
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !full) return;
    video.muted = false;
    video.play().catch(() => {});
    video.focus({ preventScroll: true });
  }, [full, filmIndex]);

  // ---- the glow ---------------------------------------------------------------------
  const drawPoster = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => glowRef.current?.getContext("2d")?.drawImage(img, 0, 0, GLOW_W, GLOW_H);
    img.src = src;
  }, []);

  useEffect(() => {
    drawPoster(sized(film.poster, 320));
    if (reduced || !inView) return;
    const id = window.setInterval(() => {
      const video = videoRef.current;
      const ctx = glowRef.current?.getContext("2d");
      if (!video || !ctx || video.paused || video.readyState < 2) return;
      // A cross-origin film taints the canvas, which only stops reading it back: it still shows.
      ctx.drawImage(video, 0, 0, GLOW_W, GLOW_H);
    }, GLOW_MS);
    return () => window.clearInterval(id);
  }, [film.poster, reduced, inView, full, drawPoster]);

  const pickFilm = (i: number) => {
    if (i === filmIndex) return;
    setFull(false);
    setFilmIndex(i);
    setCard((c) => c + 1);
  };

  return (
    <section ref={sectionRef} id="animation" className={css.section} data-full={full} aria-labelledby="animation-title">
      <FilmGrain />
      <div className={css.head}>
        <HandDrawnTitle id="animation-title" className={css.title} text="Animation" />
        <p className={css.pitch}>Short films I modelled, rigged and animated in Autodesk Maya, rendered with Arnold</p>
      </div>

      <div className={css.house}>
        <div className={css.programme} role="group" aria-label="Films">
          {FILMS.map((f, i) => (
            <button key={f.slug} type="button" className={css.programmeItem} aria-pressed={i === filmIndex} onClick={() => pickFilm(i)}>
              <span className={css.programmeTitle}>{f.work.title}</span>
              <span className={css.programmeYear}>{f.work.year}</span>
            </button>
          ))}
        </div>

        <div ref={screenRef} className={css.screenWrap}>
          <canvas ref={glowRef} className={css.glow} width={GLOW_W} height={GLOW_H} aria-hidden="true" />
          <div className={css.screen}>
            {full ? (
              <>
                <video
                  key={`${film.slug}-film`}
                  ref={videoRef}
                  className={css.video}
                  src={film.film}
                  poster={film.poster}
                  controls
                  playsInline
                  preload="auto"
                  onEnded={() => setFull(false)}
                />
                <button type="button" className={css.exit} onClick={() => setFull(false)} aria-label="Stop the film">
                  <X size={18} strokeWidth={2} aria-hidden="true" />
                </button>
              </>
            ) : (
              <button type="button" className={css.loopButton} onClick={() => setFull(true)} aria-label={`Watch ${film.work.title}, with sound`}>
                <video key={`${film.slug}-loop`} ref={videoRef} className={css.video} src={film.loop} poster={film.poster} muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />
                <span className={css.play}>
                  <span className={css.playDisc} aria-hidden="true">
                    <Play size={18} strokeWidth={0} fill="currentColor" />
                  </span>
                  Watch with sound
                </span>
              </button>
            )}
            {card > 0 && !reduced && (
              <div key={card} className={css.card} aria-hidden="true">
                <span className={css.cardTitle}>{film.work.title}</span>
                <span className={css.cardYear}>{film.work.year}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={css.making} data-open={hasProps} aria-hidden={!hasProps} inert={!hasProps}>
        <div className={css.makingInner}>
          <div className={css.makingHead}>
            <h3 className={css.makingTitle}>The Models</h3>
          </div>

          <div className={css.stumpRow}>
          <ul className={css.stumps} style={{ "--cols": PROPS.map((m) => `minmax(0, ${m.span}fr)`).join(" ") } as React.CSSProperties}>
            {PROPS.map((m, i) => (
              <li key={m.slug} className={css.prop} style={{ "--span": m.span, "--aspect": m.aspect, "--stump-w": `${m.stumpW * 100}%` } as React.CSSProperties}>
                {/* The slot its model is drawn into (by the canvas over the row); drag it, or use the arrow keys, to turn it. */}
                <div
                  ref={(el) => {
                    slotRefs.current[i] = el;
                  }}
                  className={css.propStage}
                  role="img"
                  tabIndex={0}
                  aria-label={`${m.work.title}, a 3D model from Wild West. Drag, or use the arrow keys, to turn it.`}
                >
                  <Stump />
                </div>
                <p className={css.propLabel}>
                  <strong>{m.work.title}</strong>
                  <a href={m.work.links[0].href} target="_blank" rel="noopener noreferrer">
                    Sketchfab
                    <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
                  </a>
                </p>
              </li>
            ))}
          </ul>
          <canvas ref={modelsRef} className={css.models} data-ready={modelsReady} aria-hidden="true" />
          </div>

          <div className={css.belt} data-moving={!reduced}>
            <div className={css.beltTrack}>
              {[0, 1].map((copy) => (
                <ol key={copy} className={css.beltSet} aria-hidden={copy === 1} aria-label={copy === 0 ? "Storyboard" : undefined}>
                  {STILLS.map((s, i) => (
                    <li key={s.src} className={css.frame}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.src} {...responsive(s.src, "240px")} alt={copy === 0 ? `Shot ${i + 1}: ${s.title}` : ""} loading="lazy" decoding="async" />
                    </li>
                  ))}
                </ol>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/**
 * A tree stump, drawn: bark sides with grooves and roots, the cut top with its
 * rings. Its top ellipse (centre 100,20; 160 wide) is where the model stands;
 * the CSS stands it on the floor, `--stump-w` of its slot wide.
 */
function Stump() {
  return (
    <svg className={css.stump} viewBox="0 0 200 110" aria-hidden="true">
      <defs>
        <radialGradient id="stump-ground" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.7" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="stump-bark" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#21170f" />
          <stop offset="0.38" stopColor="#4d3726" />
          <stop offset="0.62" stopColor="#3b2a1c" />
          <stop offset="1" stopColor="#170f09" />
        </linearGradient>
        <linearGradient id="stump-shade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0.15" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="stump-cut" cx="0.46" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#a98760" />
          <stop offset="0.7" stopColor="#86664a" />
          <stop offset="1" stopColor="#5e4632" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="99" rx="98" ry="10" fill="url(#stump-ground)" />
      <path
        d="M20 20 C20 48 18 68 9 85 C4 94 20 97 33 92 C44 99 60 100 76 96 C90 101 111 101 126 96 C142 100 158 99 168 92 C181 97 197 93 191 85 C182 68 180 48 180 20 Z"
        fill="url(#stump-bark)"
      />
      <g fill="none" stroke="#120b06" strokeOpacity="0.65" strokeWidth="1.3" strokeLinecap="round">
        <path d="M37 32 C35 50 39 66 31 89" />
        <path d="M58 35 C56 56 61 74 57 97" />
        <path d="M82 36 C84 58 80 78 84 99" />
        <path d="M107 37 C105 58 109 79 106 99" />
        <path d="M132 36 C134 56 130 76 135 97" />
        <path d="M156 34 C154 52 158 68 154 91" />
        <path d="M171 30 C170 46 173 60 175 82" />
      </g>
      <path
        d="M20 20 C20 48 18 68 9 85 C4 94 20 97 33 92 C44 99 60 100 76 96 C90 101 111 101 126 96 C142 100 158 99 168 92 C181 97 197 93 191 85 C182 68 180 48 180 20 Z"
        fill="url(#stump-shade)"
      />
      <ellipse cx="100" cy="20" rx="80" ry="16" fill="url(#stump-cut)" stroke="#2c1f14" strokeWidth="3" />
      <g fill="none" stroke="#6b4c33" strokeOpacity="0.6" strokeWidth="0.8">
        <ellipse cx="97" cy="20" rx="62" ry="12.2" />
        <ellipse cx="96" cy="20.3" rx="46" ry="9" />
        <ellipse cx="95" cy="20.5" rx="31" ry="6" />
        <ellipse cx="94" cy="20.6" rx="17" ry="3.3" />
        <ellipse cx="94" cy="20.7" rx="5" ry="1" />
      </g>
      <path d="M95 21 L118 26.5 L131 26" fill="none" stroke="#4a3321" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
