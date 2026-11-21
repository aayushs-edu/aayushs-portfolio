# Hero: the seam inside the name

**Date:** 2026-11-15 · **Status:** built (a record, written after the build at the user's "do it")
**Supersedes, for the hero:** `2026-10-27-split-hero-seam-design.md` (the fluid line across the whole screen) and the zip in `2026-11-03-home-unzip-design.md`.

## Why

The user wanted to simplify the hero. They didn't mean fewer effects all round. They wanted the seam redone so it lives only inside the name: the letters are the mask the paint and bits are seen through, and the line is tilted.

## What the user decided

- **The seam only inside the name.** The letterforms are the mask: paint left of the line and bits right of it show only through "Aayush Sharma".
- **Empty windows.** No base fill: where nothing is passing, a letter is empty, so parts of the name come and go. After seeing it, the user asked for **an outline on the letters**, and that keeps the name readable.
- **One plain wall** behind the name. The linen weave and the dot grid are gone.
- **No unzip.** The hero scrolls away like an ordinary first section.
- **The line: straight, tilted 20° like `/`** (its top leans right). It isn't fluid.
- **Out at an angle** (asked after the first look): the paint and the bits leave the line square to it. Paint goes left and slightly up, and bits go right and slightly down, so the digits are tilted too.
- **The line visible** (asked after the second look): "The seam should be somewhat visible, also make it extend a bit outside the name (not the stuff it emits tho)". It's a thin off-white stroke at half opacity over the wall, running 80 design px past the name's ink at each end and fading out over that stretch (`SEAM.line`). The paint and bits stay inside the letters.
- **No touch effects.** The fluid letters, the binary flicker and dragging the line are all gone.

## Choices I made (on technical or small visible forks)

- I kept the one WebGL2 shader and changed what it draws. Everything is laid out in the **seam's frame**: turned with the line, x across it (negative on the paint side), y along it. So the line is x = 0, and "square to the line" is just the frame's x.
- **The paint** is masked per pixel by the letterforms, with crisp edges to match the outline (the old brushed waver is dropped). The line's thin bead shows only inside the letters.
- **The bits** are masked a whole digit at a time: a digit shows while its middle is on a letter, so digits pop in and out at letter edges rather than being cut.
- **Ribbons and pops** start only along the stretch of the line where a square path out of it crosses the name (`spans()`). Density went up so the letters stay busy: 32 ribbons (radius 14–24 design px) and 36 bit emitters, with longer packets. The uniform arrays (3 × 32 + 96 vec4) stay inside WebGL2's minimum of 224 fragment vectors.
- **The outline** is SVG over the canvas: Poppins 800, off-white `NAME.paint`, 2.5 design px at 0.8 opacity, with the tagline's gap cut out. It shows from the first frame; the canvas fades in once the mask is ready.
- **Without WebGL2**, the same SVG name is filled with plain paint. With reduced motion, one still frame.
- **The fluid simulation** isn't used by the hero any more. It moved to `showcase/paintings/fluid.ts` (with `Push` and its tunables as `FLUID`), because the Paintings heading (`fluidTitle.ts`) uses it.

## Files

- Rewritten: `seamField.ts` (tilt, `toSeam`, `spans`, ribbons and pops in the seam's frame), `seamShader.ts`, `SeamCanvas.tsx`, `SplitHero.tsx`, `SplitTitle.tsx`, `SplitHero.module.css`, `splitConfig.ts` (`TILT` added; `CURVE`, `ZIP`, `TOUCH` gone), `nameRaster.ts` (just the letter mask, plus the `hash`/`tint` helpers the Paintings title uses).
- New: `nameMask.ts` (the mask texture).
- Deleted: `zipper.ts`, `nameTouch.ts`, `nameGL.ts`, `SplitWall.tsx`, `Hero.module.css` (its few live rules moved into `SplitHero.module.css`).
- `Showcase.tsx` / `.module.css`: no fixed hero, no spacer, no gone or paused state.
- `scripts/showcase/checks.ts`: the zip checks are replaced by checks that the line is straight and leans like `/`, that the frame is turned with it, that ribbons are rooted on the line within the paint's span, and that pops stay on rows crossing the name.

## Not done

- `heroConfig.ts` still has the old gallery hero's tunables (cards, wall painting, code cells, budgets). Nothing on the page uses most of them; pruning them was left out of this change.
- I took a desktop screenshot (1440 × 900) only. I didn't look at the lite tier or a phone width in the browser.
