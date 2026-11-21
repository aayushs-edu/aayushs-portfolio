# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev               # dev server at http://localhost:3000
npm run build             # production build (also type-checks)
npm run lint              # next lint (eslint: next/core-web-vitals + next/typescript)
npx tsc --noEmit          # type-check without building
npm run optimize:images   # convert JPG/PNG in public/images and public/paintings to WebP (sharp, quality 85)
npm run showcase:check    # Node checks of the home page's pure modules (the hero's seam, Paintwise's exploded still life), the works, and the generated media
npm run showcase:assets   # rebuild the groups' media (paintwise, paintings, animation; or name one) into public/showcase + each one's *.generated.json; needs Python with torch + torchvision + transformers + opencv-python-headless, ffmpeg, curl, Blender
```

There is no test suite beyond `npm run showcase:check`. Verify changes with it, `npm run build` / `npm run lint`, and by viewing the page in the dev server.

`npm run analyze` sets `ANALYZE=true` but `@next/bundle-analyzer` and `cross-env` are not installed or wired into `next.config.ts`, so it does nothing extra right now.

## Architecture

Personal art × code portfolio: Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS v4, Framer Motion, shadcn/ui (new-york style) on Radix. Path alias `@/*` → `src/*`.

- **The home page (`src/app/page.tsx`) is the one-page site:** `<Showcase />`, the hero, followed by the work (see "Home page" below). It is being built a group at a time. Once it carries everything, the separate pages retire.
- **The older pages are one self-contained file each.** Each route (`/paintings`, `/animation`, `/games`, `/hackathons`, `/paintwise`) is a single large `"use client"` `page.tsx` (600–1600 lines). It holds its own TypeScript interfaces, hardcoded content arrays (projects, games, videos, blog posts), and section subcomponents. The showcase keeps its **own copy** of each work's story and links (`src/components/showcase/works.ts`), so if you update an item, check both places.
- **Shared shell:** `src/app/layout.tsx` wraps every page with `Footer` only. The navbar was removed site-wide because the site is moving to a single page. `src/components/Navigation.tsx` still exists but isn't rendered. The layout loads fonts (Geist, Geist Mono, Kalam, Sniglet, Poppins 800 as CSS variables) and mounts Vercel Analytics plus Google Analytics (`NEXT_PUBLIC_GA_ID` env var). The site is dark-only: `dark` class is hardcoded on `<html>`/`<body>`.
- **Styling:** Tailwind v4 config lives in CSS (`src/app/globals.css`, using `@theme inline` and oklch shadcn tokens). There is no `tailwind.config.js` (the README is outdated on this). Pages mostly use raw Tailwind utilities (e.g. `text-white/70`, violet accents) rather than the semantic tokens. Use `cn()` from `src/lib/utils.ts` to merge classes. Add shadcn components into `src/components/ui/`.

### Home page: the hero, then the work

The hero was simplified on 2026-11-15: the seam now shows only through the name, on a tilted line, with no unzip, no touch effects and a plain wall (spec `docs/superpowers/specs/2026-11-15-hero-seam-in-name-design.md`). The page under it was redesigned on 2026-11-03: the 3D room was dropped for plain sections (it is in git history up to `6307a3f`; its specs are marked superseded). The earlier fluid-line hero with the zip is in git history before this change; the gallery hero is on the `hero-art-x-code` branch.

- **Trial (2026-11-16 on):** the page currently shows `hero/SparklesHero.tsx`. It has the name, the description (`DESCRIPTION` in `heroConfig.ts`, in sans) and GitHub / LinkedIn / Email links over a background picked by its `BACKGROUND` switch.
  - **Backgrounds:** the default is `"repainting"`. The others are `"swirls"` (PaintSwirls), the dawn video or still, and the wave shader (`HeroWave.tsx`).
  - **The repainting** (`showcase/Repainting.tsx`): one of nine paintings is painted again stroke by stroke, coarse to fine.
    - A soft underpainting wash goes down first, then three passes (`PASSES`).
    - The first painting is random, the rest come in a shuffled order, and each crossfades into the next.
    - Its tunables are constants at the top of the file.
  - **The picker** (`hero/PaintingPicker.tsx`, top right): it opens on hover (tap or keys on touch), with a handwritten "Choose the painting" note while it's closed.
  - **Under the hero:** `showcase/WorkDivider.tsx` holds "My Work" and an arrow. They slide down from the hero's bottom with scroll and settle between two lines.
  - **Unused leftovers** (ask before deleting): `ui/sparkles.tsx` (with tsparticles), `ui/living-origami-bg.tsx` (its styles at the end of `globals.css`), the Instrument Serif font and the dawn media.
  - The seam hero below is kept; `Showcase.tsx` has the one-line switch back.
- **The hero (`src/components/hero/`):** "Aayush Sharma", outlined, on a plain wall, with "Art x Code" over it and a short description in grey under it (`DESCRIPTION` in `SplitTitle.tsx`). A straight line tilted 20° like `/` crosses the name. Through the letters left of it, paint ribbons float out of it; through those right of it, bits pop out of it, both square to the line. Outside the letters only the line itself shows, faintly, running a little past the name at each end. `SplitHero.tsx` measures the title box and lays out the stage; `SeamCanvas.tsx` with `seamShader.ts` (WebGL2) draws the paint and bits through the letter mask (`nameMask.ts` / `nameRaster.ts`); `SplitTitle.tsx` is the SVG outline and tagline (and the filled fallback without WebGL2). `seamField.ts` (pure) schedules the ribbons and pops in the seam's frame (turned with the line). Tunables are in `splitConfig.ts` (`SEAM`, `TILT`, `BITS`); the design grid and name are in `heroConfig.ts`. It's an ordinary first section: it scrolls away with the page and stops drawing off screen. No touch effects.
- **The work (`src/components/showcase/`):** `Showcase.tsx` is the page. It runs: the hero, the divider, then the sections `paintwise/PaintwiseSection.tsx`, `hackathons/HackathonsSection.tsx`, `paintings/PaintingsSection.tsx` and `animation/AnimationSection.tsx`, then `WorkList.tsx` (a grid for the groups without a section, in `GROUP_ORDER`). It also has `DetailPanel.tsx` (a work's story, `#work/<slug>`) and `HandOff.tsx` (the pipeline figure full size).
  - **Paintwise:** the pitch beside the pipeline figure, then the old room's two exploded views side by side, wider than the section. One shows the jug's six layers fanned out with their tags. The other shows Childhood Toys (the user's painting) cut into SAM 2.1's pieces, each pushed out to its Depth Anything V2 depth. Each is a CSS 3D stage of its own shape (`paintwise/explode.ts`, pure) that starts as the jug and comes apart once as it scrolls into view. The masks view stands on a faint grid floor (`FLOOR` in `explode.ts`), shown once it's apart. Each rig is fitted to its stage with the browser's own projection maths, so nothing is measured at runtime. No three.js on the page.
  - **Paintwise's background:** `paintwise/PaintToBinary.tsx` (canvas 2D, pixel art): swirling brush strokes in dulled vibrant colours, each turning into 0s and 1s halfway along and dissolving behind the brush, over a dim ground picked by its `GROUND` switch (`underpainting`, `binary` or `weave`; `?ground=` in the URL tries another). The old `PaintOrder.tsx` (SAM-like regions with step numbers) is kept unused. Each section's background must differ from the others and from every hero background option.
  - **Hackathons:** a trifold carousel per project.
    - **Panels:** the logo panel leans in on the left, the demo sits in a browser frame in the middle, and the name and blurb lean in on the right. Turning folds the side panels shut and open.
    - **Demos:** live sites load in an iframe at desktop width, scaled. VRShop (a Quest app) plays a loop from its YouTube demo instead.
    - **Focus mode:** clicking a demo enlarges it under the heading with the side panels behind, and locks the page scroll while it's in use.
    - **Per project:** keys hints are set per project (`keys`, ExoVision's). Media is in `public/showcase/hackathons/`.
    - **Demo sizing:** each live site is sized from its panel's layout size (the ResizeObserver's), never `getBoundingClientRect`: the fold and zoom transforms shrink that and left the site too small.
  - **Title and background:** the title scrambles (`ScrambleTitle.tsx`) over very faint falling letters (`RainingLetters.tsx`).
  - **Not built yet:** a section of its own for Games (for now it's the grid). Some media made for the old room is still unused: the salon depth maps and some GLB models (Draco; decoder kept in `public/draco/`).
- **Content:** `works.ts` builds the works from the hero gallery data and adds the stories, links and groups. VRShop isn't in the gallery: it's a `Work` written out in `works.ts`. Paintwise's media (the jug's layers and per-object masks; Childhood Toys cut into pieces by SAM 2.1 large with Paintwise's own segmenter settings (needs `torchvision`; about 3 minutes); the pipeline figure; and still lifes no longer shown) comes from `npm run showcase:assets` (`scripts/showcase/build-assets.py`, sources in `scripts/showcase/sources/`); the figure itself is `scripts/showcase/paintwise-figure.py` + `render-figure.sh`. The paintings and animation media come from the same command: the early works (+ depth) and held photos from `public/paintings`, the film loops and posters cut with ffmpeg from the release (cached in `scripts/showcase/.cache/`, git-ignored), and the models compressed by Blender (`scripts/showcase/compress-glb.py`) from raw GLBs in `scripts/showcase/sources/models/` (git-ignored, 17 MB; without them the committed models are kept). `public/showcase/**` is exempt from Git LFS so the loops ship with the site. The generated JSON lives in `src/components/showcase/stations/<group>/` (the folder name is from the room). Never hand-edit the `*.generated.json` files. Gallery content is `src/components/hero/gallery.json`. After editing it, run `npm run hero:assets`. That runs `scripts/hero/depth.py` (Depth Anything V2 via transformers + torch + Pillow) and `scripts/hero/build-hero-assets.mjs` (sharp + shiki), which write hashed files to `public/hero/` and `gallery.generated.json`. Commit both. Never hand-edit the generated JSON.
- **Tiers** (`useHeroTier`, owned by `Showcase.tsx`): `full`, `lite` (touch, small screens, ≤ 4 cores: fewer ribbons and bits, DPR 1), and `static` (reduced motion, no WebGL2, or a lost context: one still frame; without WebGL2 the letters are filled plain).

### Media and content

- **Paintings** are driven by `public/paintings/manifest.json` (`{ items: [{ src, title, description, year, wallPosition }] }`). The paintings page fetches it at runtime. `wallPosition` is `"portfolio"` or `"pre-portfolio"` (Early Work) and decides which gallery wall a painting appears on. Some paintings have a "held" photo variant, `<Name>_2.webp`. These are hardcoded by name in `usePaintings` in `src/app/paintings/page.tsx` (`RedDeadRedemption`, `Inhaler`, `Covid`), or can be set per item with `heldImageSrc`.
- **Images** go in `public/images` or `public/paintings` as `.webp`. Run `npm run optimize:images` after adding JPG/PNG.
- **Videos:** `.mp4` and other video files, plus everything in `public/videos/`, are tracked with **Git LFS** (`.gitattributes`). They're too large to serve from Vercel, so the pages load them from the GitHub release `videos-v1.0` (`https://github.com/aayushs-edu/aayushs-portfolio/releases/download/videos-v1.0/<file>.mp4`), referenced in `src/app/animation/page.tsx`. To add a video, upload it to that release, then reference the release URL. `FIX_VIDEOS_NOW.md`, `VIDEO_DEPLOYMENT_GUIDE.md`, and `ALTERNATIVE_VIDEO_HOSTING.md` describe the hosting options that were considered.
- **Paintwise blog** (`src/app/paintwise/page.tsx`): posts are a `blogPosts` array whose `content` is a markdown-like template string. A small custom renderer in that file (not a markdown library) parses it paragraph by paragraph. It handles `#` headings and lists, plus the custom embed markers `[IMAGE: /path]`, `[GIF: /path]`, `[IMAGE_PLACEHOLDER: description]`, and `[GIF_PLACEHOLDER: description]`, each on its own paragraph.
- **Games** link out to itch.io (`aayushs-edu.itch.io`). Hackathon and animation pages embed external content with `<iframe>`. `next.config.ts` sets permissive `Permissions-Policy` headers (sensors, XR, etc.) on `/animation` and globally for those embeds.

### Config notes

- `next.config.ts` sends `Cache-Control: public, max-age=31536000, immutable` on all routes, but only in production. Before that fix, browsers cached dev chunks too, so a browser that visited before then may still show old JS: hard-reload (Cmd+Shift+R).
- Don't run `next build` while `next dev` is running: they share `.next` and the dev server breaks until it is restarted.
- `types/` holds ambient declarations for `<model-viewer>` and three.js (included via `typeRoots`). `three` is no longer a direct dependency; npm still installs it as `@google/model-viewer`'s peer, but nothing imports it (no page uses model-viewer yet).
