"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import media from "../stations/animation/animation.generated.json";
import { WORKS } from "../works";
import css from "./AnimationSection.module.css";

const FILMS = media.films.map((f) => ({ ...f, work: WORKS.find((w) => w.slug === f.slug)! }));
const MODELS = media.models.map((m) => ({ ...m, work: WORKS.find((w) => w.slug === m.slug)! }));
/** The storyboard stills, all from Wild West, named as the /animation page names them. */
const STILL_TITLES = ["Opening Shot", "Character Introduction", "Environment Design", "Action Sequence", "Action Sequence", "Action Sequence", "Cowboy Shot", "Final Blow"];
const STILLS = media.stills.map((s, i) => ({ ...s, title: STILL_TITLES[i] ?? `Still ${i + 1}` }));
/** Only Wild West has props (its models and stills). */
const PROPS_FOR = "wild-west";

/** The glow behind the screen: a tiny copy of the picture, blurred up by CSS, redrawn this often (ms). */
const GLOW_W = 32;
const GLOW_H = 18;
const GLOW_MS = 120;

type Prop = { kind: "model"; i: number } | { kind: "still"; i: number };

/** Loads <model-viewer> once, with the Draco decoder served from the site. */
let modelViewer: Promise<unknown> | null = null;
function loadModelViewer() {
  if (!modelViewer) {
    const w = window as unknown as { ModelViewerElement?: { dracoDecoderLocation?: string } };
    w.ModelViewerElement = { ...w.ModelViewerElement, dracoDecoderLocation: "/draco/" };
    modelViewer = import("@google/model-viewer");
  }
  return modelViewer;
}

/**
 * Animation: a theatre. The film is on a big screen in a dark band, lit from
 * behind by a glow sampled from the picture. Its silent loop plays while the
 * screen is in view; clicking the screen plays the full film there, with
 * sound. Wild West's props (its three models, which you can turn, and its
 * storyboard stills) sit in a rail beside the screen, to handle while it
 * plays; for the other films the rail folds away.
 */
export default function AnimationSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const glowRef = useRef<HTMLCanvasElement | null>(null);

  const [filmIndex, setFilmIndex] = useState(0);
  const [full, setFull] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [near, setNear] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const [prop, setProp] = useState<Prop>({ kind: "model", i: 0 });

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
    const seen = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    const nearing = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "800px 0px" });
    seen.observe(screen);
    nearing.observe(section);
    return () => {
      seen.disconnect();
      nearing.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!near || !hasProps || viewerReady) return;
    let live = true;
    loadModelViewer()
      .then(() => live && setViewerReady(true))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [near, hasProps, viewerReady]);

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
    drawPoster(film.poster);
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
  };

  const model = prop.kind === "model" ? MODELS[prop.i] : null;
  const still = prop.kind === "still" ? STILLS[prop.i] : null;

  return (
    <section ref={sectionRef} id="animation" className={css.section} data-full={full} aria-labelledby="animation-title">
      <div className={css.head}>
        <h2 id="animation-title" className={css.title}>
          Animation
        </h2>
        <p className={css.pitch}>Short films I modelled, rigged and animated in Autodesk Maya, rendered with Arnold. Pick one, and watch it with the lights down.</p>
      </div>

      <div className={css.theatre}>
        <div className={css.programme} role="group" aria-label="Now showing">
          <span className={css.marquee}>Now showing</span>
          {FILMS.map((f, i) => (
            <button key={f.slug} type="button" className={css.programmeItem} aria-pressed={i === filmIndex} onClick={() => pickFilm(i)}>
              <span className={css.programmeTitle}>{f.work.title}</span>
              <span className={css.programmeYear}>{f.work.year}</span>
            </button>
          ))}
        </div>

        <div className={css.house} data-props={hasProps}>
          <div className={css.screenCol}>
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
                      ✕
                    </button>
                  </>
                ) : (
                  <button type="button" className={css.loopButton} onClick={() => setFull(true)} aria-label={`Watch ${film.work.title}, with sound`}>
                    <video key={`${film.slug}-loop`} ref={videoRef} className={css.video} src={film.loop} poster={film.poster} muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />
                    <span className={css.play}>
                      <span className={css.playIcon} aria-hidden="true" />
                      Watch with sound
                    </span>
                  </button>
                )}
              </div>
            </div>
            <div className={css.caption}>
              <p className={css.captionLine}>{film.work.line}</p>
              {film.work.story.map((p) => (
                <p key={p} className={css.captionStory}>
                  {p}
                </p>
              ))}
            </div>
          </div>

          <aside className={css.rail} aria-label="From the making of Wild West" aria-hidden={!hasProps} inert={!hasProps}>
            <div className={css.railInner}>
              <p className={css.railLabel}>From the making of Wild West</p>
              <div className={css.stage}>
                {model && viewerReady ? (
                  <model-viewer
                    key="viewer"
                    className={css.viewer}
                    src={model.glb}
                    poster={model.thumb}
                    alt={`${model.work.title}, a 3D model from Wild West`}
                    camera-controls
                    auto-rotate
                    interaction-prompt="none"
                    shadow-intensity="1"
                    exposure="1.05"
                  />
                ) : model ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={css.stageImg} src={model.thumb} alt={`${model.work.title}, a 3D model from Wild West`} />
                ) : still ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={css.stageImg} src={still.src} alt={`Wild West storyboard: ${still.title}`} />
                ) : null}
              </div>
              <div className={css.stageCaption}>
                {model ? (
                  <>
                    <span>
                      <strong>{model.work.title}</strong> · drag to turn
                    </span>
                    <a href={model.work.links[0].href} target="_blank" rel="noopener noreferrer">
                      Sketchfab ↗
                    </a>
                  </>
                ) : still ? (
                  <>
                    <span>
                      <strong>{still.title}</strong>
                    </span>
                    <span className={css.count}>
                      {prop.i + 1} / {STILLS.length}
                    </span>
                  </>
                ) : null}
              </div>

              <p className={css.pickLabel}>Models</p>
              <div className={css.picks} data-kind="model">
                {MODELS.map((m, i) => (
                  <button key={m.slug} type="button" className={css.pick} aria-pressed={prop.kind === "model" && prop.i === i} onClick={() => setProp({ kind: "model", i })} title={m.work.title}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.thumb} alt={m.work.title} loading="lazy" />
                  </button>
                ))}
              </div>
              <p className={css.pickLabel}>Snapshots</p>
              <div className={css.picks} data-kind="still">
                {STILLS.map((s, i) => (
                  <button key={s.src} type="button" className={css.pick} aria-pressed={prop.kind === "still" && prop.i === i} onClick={() => setProp({ kind: "still", i })} title={s.title}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.src} alt={s.title} loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
