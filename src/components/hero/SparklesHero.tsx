"use client";

import { useState } from "react";
import { GitHubMark, LinkedInMark, MailMark } from "../marks";
import Repainting, { PAINTINGS } from "../showcase/Repainting";
import { DESCRIPTION } from "./heroConfig";
import PaintingPicker from "./PaintingPicker";

const LINKS = [
  { label: "GitHub", href: "https://github.com/aayushs-edu", Mark: GitHubMark, size: "size-[26px]" },
  { label: "LinkedIn", href: "https://linkedin.com/in/aayush-sharma-1420bb311", Mark: LinkedInMark, size: "size-[23px]" },
  { label: "Email", href: "mailto:aayushs2008@gmail.com", Mark: MailMark, size: "h-[21px] w-[29px]" },
];

/**
 * The hero: the name, and a line about who this is under it, over one of the
 * paintings being painted again, coarse to fine (Repainting); the picker in
 * the corner chooses which.
 */
export default function SparklesHero() {
  // The repainting's painting: the one up now, and the last one asked for (the picker).
  const [painting, setPainting] = useState(0);
  const [request, setRequest] = useState<{ index: number; at: number } | null>(null);

  return (
    <section className="relative flex h-svh min-h-[420px] w-full flex-col items-center justify-center overflow-hidden bg-[#0d0d0d] px-4">
      {/* The background, fading into the page's black at the bottom. */}
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
