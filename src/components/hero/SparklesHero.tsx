"use client";

import { useEffect, useRef, useState } from "react";
import PaintSwirls from "../showcase/PaintSwirls";
import Repainting, { PAINTINGS } from "../showcase/Repainting";
import HeroWave from "./HeroWave";
import PaintingPicker from "./PaintingPicker";
import { DESCRIPTION } from "./heroConfig";

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
/** The marks under the description: GitHub's and LinkedIn's own (Simple Icons), and a solid envelope drawn to sit with them. Each is sized so the three look the same size (a circle, a square, a wide envelope). */
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/** A solid envelope, its flap cut out of it (evenodd), to match the other two marks' weight. */
function MailMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M2.6 0h22.8A2.6 2.6 0 0 1 28 2.6v14.8a2.6 2.6 0 0 1-2.6 2.6H2.6A2.6 2.6 0 0 1 0 17.4V2.6A2.6 2.6 0 0 1 2.6 0Zm.9 3.2 10.5 8.1 10.5-8.1-1.3-1.6L14 8.8 4.8 1.6Z"
      />
    </svg>
  );
}

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
