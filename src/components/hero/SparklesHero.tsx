"use client";

import { useEffect, useRef, useState } from "react";
import PaintSwirls from "../showcase/PaintSwirls";
import Repainting, { PAINTINGS } from "../showcase/Repainting";
import HeroWave from "./HeroWave";
import PaintingPicker from "./PaintingPicker";
import { DESCRIPTION } from "./heroConfig";
import { GitHubMark, LinkedInMark, MailMark } from "../marks";

/**
 * Trial hero (2026-11-16): the name, and a line about who this is under it,
 * over a moving background. The seam hero (SplitHero) is kept beside it;
 * Showcase.tsx picks which one shows.
 */

/**
 * The hero's background: a painting being painted again, coarse to fine (as
 * behind Paintwise, stronger), the paint swirls from behind the paintings wall, the
 * pixel dawn moving (a seamless 9 s loop, its shooting stars clear of the
 * seam), the dawn still, or minhxthanh's waves (21st.dev; a shader).
 */
const BACKGROUND: "repainting" | "swirls" | "dawn-loop" | "dawn" | "wave" = "repainting";

const LINKS = [
  { label: "GitHub", href: "https://github.com/aayushs-edu", Mark: GitHubMark, size: "size-[26px]" },
  { label: "LinkedIn", href: "https://linkedin.com/in/aayush-sharma-1420bb311", Mark: LinkedInMark, size: "size-[23px]" },
  { label: "Email", href: "mailto:aayushs2008@gmail.com", Mark: MailMark, size: "h-[21px] w-[29px]" },
];

/** Fills the hero and fades into the page's black at the bottom. */
const FILL = "pointer-events-none absolute inset-0 h-full w-full object-cover object-[50%_60%] [image-rendering:pixelated] [mask-image:linear-gradient(to_bottom,black_60%,transparent)]";

/** The dawn loop: plays only while on screen; with reduced motion it stays on its first frame. */
function DawnLoop() {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seen = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    seen.observe(video);
    return () => seen.disconnect();
  }, []);
  return <video ref={ref} className={FILL} src="/showcase/hero/dawn.mp4" poster="/showcase/hero/dawn-poster.webp" muted loop playsInline preload="auto" aria-hidden="true" />;
}

export default function SparklesHero() {
  // The repainting's painting: the one up now, and the last one asked for (the picker).
  const [painting, setPainting] = useState(0);
  const [request, setRequest] = useState<{ index: number; at: number } | null>(null);

  return (
    <section className="relative flex h-svh min-h-[420px] w-full flex-col items-center justify-center overflow-hidden bg-[#0d0d0d] px-4">
      {/* The background, fading into the page's black at the bottom. */}
      {BACKGROUND === "repainting" ? (
        <>
          <Repainting variant="hero" request={request} onPainting={setPainting} />
          <PaintingPicker
            paintings={PAINTINGS}
            current={painting}
            onPick={(index) => {
              // The picker shows the choice at once; the painting follows once it has loaded.
              setPainting(index);
              setRequest({ index, at: Date.now() });
            }}
          />
        </>
      ) : BACKGROUND === "swirls" ? (
        // As on the paintings wall (PaintingsSection's SWIRL_UNIT and SWIRL_STRENGTH).
        <PaintSwirls className="absolute inset-0 h-full w-full [mask-image:linear-gradient(to_bottom,black_60%,transparent)]" masked={false} unit={260} strength={0.3} />
      ) : BACKGROUND === "dawn-loop" ? (
        <DawnLoop />
      ) : BACKGROUND === "dawn" ? (
        // eslint-disable-next-line @next/next/no-img-element -- a pre-sized background in public/images
        <img src="/images/hero-dawn.webp" alt="" aria-hidden="true" decoding="async" className={FILL} />
      ) : (
        <HeroWave className="pointer-events-none absolute inset-0 h-full w-full [mask-image:linear-gradient(to_bottom,black_50%,transparent)]" />
      )}

      <h1 className="relative z-20 text-center text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">Aayush Sharma</h1>

      <p className="relative z-20 mx-auto mt-5 max-w-xl text-center font-sans text-base leading-relaxed font-normal text-balance text-white/90 [text-shadow:0_1px_12px_rgb(20_16_48/0.55)] md:text-lg">
        {DESCRIPTION}
      </p>

      {/* Bare marks, no buttons round them. */}
      <ul className="relative z-20 mt-8 flex items-center gap-7">
        {LINKS.map(({ label, href, Mark, size }) => (
          <li key={label}>
            <a
              href={href}
              {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              aria-label={label}
              className="group grid size-11 place-items-center rounded-md text-white/70 transition-colors duration-200 ease-out [filter:drop-shadow(0_1px_10px_rgb(0_0_0/0.45))] hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
            >
              <Mark className={`${size} transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5`} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
