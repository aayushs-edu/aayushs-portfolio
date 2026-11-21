# Hero redesign: "Art x Code"

You are rebuilding the landing-page hero of Aayush Sharma's portfolio (Next.js 15 App Router, React 19.2, TypeScript strict, Tailwind v4, Framer Motion 12). Read `CLAUDE.md` first for repo conventions. Work on a new branch `hero-art-x-code`. Do not restyle any other section of the site. This hero sets the visual direction those sections will follow later.

**Visual reference (Figma):** https://www.figma.com/design/DoX4LnCwXvBlWHwhkUUDWL/Portfolio-Redesign?node-id=0-1. Screenshot page `0:1` with the Figma MCP tools before you start, and compare against it at checkpoints. Layers: name `1:8`, tagline `2:9`, front card frame `1:7`, front painting `1:3`, background `1:6`, deeper cards `2:10`–`2:13`. The paintings in the Figma are examples only. Gallery content comes from `gallery.json` (below). Use local files from `public/`, never Figma image URLs.

## Intent

Aayush is a high-school oil painter who also builds games, AI tools, and 3D animation. The site serves admissions readers, recruiters, and the creative community equally, so the hero must land in about five seconds with any of them. It says one thing: **art and code are two sides of the same practice.** The hero must show *both* sides on the first screen.

The current hero (`HeroSection` in `src/app/page.tsx`: a photo on a painted brushstroke, five neon role labels, floating dots, gradient buttons) is **removed entirely**. Nothing carries over.

The new hero has three acts:
1. **Gallery (on load).** The Figma composition: a huge outlined "Aayush / Sharma" with "Art x Code" set through it, above a fanned stack of cards. **"Art" and "Code" are a two-way switch.**
   - **Art mode** (default): the cards are his oil paintings. Moving the cursor across the outlined letters paints the paintings into the letterforms with a ragged oil-brush stroke. The front painting is lit by a cursor-following gallery spotlight, so the brush texture shows in relief.
   - **Code mode**: the cards are his software projects (Paintwise, then hackathon builds, then games). Moving the cursor across the letters reveals syntax-colored source code inside them, cell by cell on a character grid, like a terminal printing. The syntax colors are taken from his paintings' palette.
   - Switching flips the front card over like a physical card: the other side of the same card is the other practice.
   - In either mode, visitors browse the stack sideways like a gallery.
2. **Zoom (scroll begins).** The rest of the stack and the title clear away, and the selected card's image zooms up to fill the screen.
3. **Data (scroll continues).** The computer "reads" the image. It lifts apart into depth layers as a cloud of colored points, then the points re-sort into an ordered field of that image's palette, by hue and lightness. A painting or a game, everything he makes becomes data, live, with whichever card the visitor picked.

### Success criteria
1. A first-time visitor understands "painter *and* engineer" from the first screen alone, without scrolling.
2. Matches the Figma composition on load, plus color and motion. Nothing reads as templated or AI-generated (see **Banned**).
3. The front card image is visible as the LCP element in under 1.5s on a fast connection, before any WebGL loads.
4. 60fps on a 2020+ laptop with integrated graphics. A modern phone gets a lighter version that still feels designed. Reduced-motion users get a calm, finished hero.
5. `npm run build` and `npm run lint` pass. No console errors or warnings from hero code.

## Banned (the "vibecoded" tells: none of these may appear in the hero)
- Gradient buttons, gradient text, neon glows, `text-shadow` or `drop-shadow` glows. Decorative colored blur halos are banned too. The *only* colored light is the physically motivated gallery spotlight and its tinted pool on the wall.
- ✨ Sparkles or other decorative lucide icons. Arrows are typed glyphs (← → ↓), not icon components.
- Random floating particles or dots, orbs, blobs, aurora or mesh gradients, decorative grain overlays
- "Matrix rain", scrolling green-on-black code, fake hacker terminals, blinking block cursors, typing sound effects. The code inside the letters is set like typography, not like a movie hacker screen.
- Elements popping in from `scale: 0`, staggered spring cascades, letter-by-letter text animation, infinite wiggle, bounce, or pulse loops, hover ripple rings, bouncing "scroll" mouse icons
- Uppercase, widely tracked "HUD" micro-labels, frame counters
- shadcn `Button` defaults in the hero
- Rainbow per-item UI color coding. Saturated color comes only from the gallery images and the painting-derived syntax palette.

## Visual system (from Figma)

Tokens: scope these to the hero (a `.hero` class or CSS variables on the section). Do not change global shadcn tokens.

| Token | Value | Use |
|---|---|---|
| `--wall` | `#0d0d0d` | Hero background (Figma `1:6`) |
| `--card` | `#1f1e1e` | Card frames (Figma `1:7`) |
| `--name-fill` | `#000000` | Unrevealed letter fill |
| `--ink` | `#ffffff` | Outlines, the active mode word, primary text |
| `--ink-muted` | `rgb(255 255 255 / 0.55)` | Placard and secondary text |

**Type**
- Add **Poppins** weight 800 via `next/font/google` in `src/app/layout.tsx` (`weight: ['800']`, `variable: '--font-poppins'`, `display: 'swap'`). The name and tagline use it.
- **Name** (`1:8`): "Aayush" / "Sharma" on two lines, centered, Poppins 800, `line-height: 1.108`, fill `--name-fill`, outline `--ink` at ~2.5 design px (it renders as a thin white outline, as in the Figma). It's the real `<h1>` text.
- **Tagline / mode switch** (`2:9`): "Art x Code", Poppins 800 at **half** the name's font size, `line-height: 1.108`, centered horizontally. It sits *on top of* the name, vertically centered on the boundary between "Aayush" and "Sharma" so it overlaps both lines, exactly as in the Figma. The **active** mode word is solid `--ink`, matching the Figma's solid tagline. The **inactive** word is outlined only (same 2.5 design px `--ink` stroke, `--name-fill` fill), in the name's outline vocabulary. The "x" is always solid.
- **Code text inside the letters**: Geist Mono (already loaded).
- **Placard and controls**: Geist Sans (already loaded), 13–14px, sentence case, `--ink-muted`, title in italic. Numbers (point count, gallery index) use Geist Mono with tabular figures.

**Composition and scale**: the Figma composition (name top to the bottom of the card stack, side cards included) is ≈ **1414 × 1271 design px**, with the front card frame at 1013 × 754. Lay it out in design px and scale it as one unit with a CSS variable:
`--u = min((100vw − 2 × gutter) / 1414, (heroViewportHeight − 64px) / 1271)` (in px per design px). Every dimension below is in design px × `--u`. At 1440×900 and 1280×720 the whole composition, placard included, must fit in the hero viewport without scrolling. Below 640px wide, compute `--u` from width against 1100 instead, and let the side cards bleed past the viewport edges, clipped by the section's `overflow: hidden`.

- Name font size: 256 design px. The tagline is 128.
- Gap from the bottom of "Sharma" to the top of the front card: ~45 design px. Match the Figma screenshot.
- **Card frame**: `--card`, radius 33, with the image inset 44 horizontal and 33 vertical (Figma: 926×689 image in a 1013×754 frame), image radius 33. The frame takes the image's aspect ratio. 1013 is the frame width for a landscape image. A portrait image keeps the frame *height* (754). The same frame is used in both modes.
- The hero fills the viewport below the existing sticky `Navigation`. Measure the nav height at runtime. Leave `Navigation.tsx` untouched.

**Copy**: there's no intro paragraph and no CTA buttons. Besides the name and tagline, the only text is the placard and controls under the stack:
```
Art:   Snorkeling Hawaii, 2024 · Oil on canvas               ←  1 / 7  →    All paintings →
Code:  Paintwise · Python, SAM 2.1, PidiNet                  ←  1 / 9  →    View project →
```
- Title, year, and the detail line come from the selected item: `medium` for art, `stack` for code. Omit the year segment if an item has none.
- ← and → are real `<button>`s ("Previous" / "Next" accessible names). The trailing link goes to `/paintings` in Art mode, and to the selected project's `href` in Code mode (external links open in a new tab with `rel="noopener noreferrer"`). All have a visible `:focus-visible` outline.
- During the scroll acts, the detail line evolves (see Choreography).

## The mode switch

- "Art" and "Code" are `role="tab"` buttons in a `role="tablist"` (`aria-label="Portfolio side"`) that controls the gallery region (`aria-controls`). ←/→ move between tabs, Enter/Space or click activates. "x" is not focusable. The hit area extends to the full glyph boxes (at least 44×44 CSS px).
- **Hover preview on the inactive word** (pointer devices): its outline fills from left to right over 350ms with a preview of the other side. "Art" fills with the selected painting (or the initial one when coming from Code). "Code" fills with syntax-colored code in Geist Mono. It reverts on leave. No glow, no scale.
- **Switch transition** (≈900ms total, one continuous sequence, not a stagger):
  1. The side cards slide in behind the front card (250ms, ease-in).
  2. The front card flips 180° around its Y axis (450ms, `cubic-bezier(0.6, 0, 0.2, 1)`, CSS 3D with `perspective: 2000px` on the stack). Its back face is the other mode's selected card, with frame and image. Swap the frame aspect at the 90° point so portrait and landscape cards morph cleanly.
  3. The new side cards slide back out to their slots (250ms, ease-out).

  The active and inactive styles of the mode words crossfade during step 2. Live letter reveals from the old mode fade out over 300ms. The placard crossfades. WebGL fades out at the start and returns after it settles (same rule as browsing).
- Each mode remembers its own selected index for the session (in component state; no storage).
- Default mode on load: **Art**.

## The gallery

`GalleryStack` shows the active mode's items as a looping card fan. For each card, `d` is its circular offset from the selected index. Convention: `d > 0` is to the right, and → / "next" selects `d = +1`.

| `d` | Placement (relative to the front card) |
|---|---|
| 0 | Front, centered, scale 1, rotation 0, on top. This is the only card rendered in WebGL. |
| ±1 | Behind, offset horizontally so ~25% of the card shows beyond the front frame. Rotation ±8° (left card counter-clockwise, right card clockwise), scale ~0.89, nudged up ~25 design px. Matches the Figma side cards. |
| ±2 | Further behind and out, rotation ±13°, scale ~0.80, mostly hidden behind ±1, a sliver visible (Figma `2:10`–`2:13`) |
| \|d\| ≥ 3 | Parked invisibly behind ±2, opacity 0, so the loop wraps without cards flying across the screen |

If a mode has fewer than 5 items, leave the unused slots empty (no duplicates). Fewer than 3 items disables looping.

**Browsing input** (vertical page scroll is reserved for the zoom, so browsing is sideways):
- **Trackpad / horizontal wheel**: if `|deltaX| > |deltaY|`, accumulate `deltaX` and step one card per ~80px. Call `preventDefault` **only** on horizontal-dominant events, so vertical scrolling is never blocked. Ignore input for 350ms after a step.
- **Drag / swipe** on the stack (pointer events, including touch): step if released past 18% of the card width or with velocity > 450 px/s. The stack has `touch-action: pan-y`.
- **Click or tap** a ±1 or ±2 card to select it. Selecting a ±2 card steps twice, animated through the middle.
- **Keyboard**: ← / → when focus is inside the gallery, plus the placard buttons.
- Browsing and mode switching are enabled only while the hero is at rest (`p < 0.03`).

**Card motion**: cards move between slots with a Framer Motion spring (`stiffness: 260, damping: 32`, so there's no visible overshoot). Rotation, scale, offset, and z-order animate together. The placard crossfades over 200ms. **Hover a side card**: it lifts 10 design px and rotates 2° toward upright over 200ms, with a pointer cursor. No glow, no shadow change.

**WebGL during browsing and switching**: the front-card WebGL layer only renders at rest. When a step or switch starts, the canvas fades out (120ms) and the DOM `next/image` posters move. When everything settles and the new item's textures are loaded, WebGL fades back in (300ms). Prefetch the ±1 neighbors in the active mode, and the other mode's selected item, on idle.

**Accessibility**: the gallery is a `role="tabpanel"` with `aria-roledescription="carousel"` and `aria-label` of "Paintings" or "Projects". Each card is a `<button aria-label="{title}, {year}">`, with `aria-current="true"` on the front card. A polite live region announces "{title}, {year}" on change, and "Showing paintings" / "Showing projects" on mode switch.

## The letters: paint (Art mode) and code (Code mode)

The `<h1>` is the real text, visually hidden in an accessible way (not `display: none`). The visual title is one inline SVG (`aria-hidden="true"`, one `viewBox` in design px, scaled by `--u`), so masks, text, and outlines share a coordinate system and nothing drifts.

SVG layers, bottom to top:
1. The name as `<text>`, `fill: --name-fill`.
2. **Reveal layers**, clipped to the name's letterforms (`<clipPath>` with the same `<text>`), each masked by its own reveal geometry (`<mask>`):
   - Art mode: `<image>` layers of paintings (the 800px `paint.webp` copies).
   - Code mode: one code layer. This is a block of syntax-colored Geist Mono text covering the title's bounds, rendered as `<text>`/`<tspan>` runs from the generated token JSON at ~11 design px font size, `line-height: 1.5`.
3. The name `<text>` again: `fill: none`, `stroke: --ink`, 2.5 design px, so the white outline stays crisp over everything.
4. The tagline / mode switch on top.

**Art mode: brush strokes** (`useBrushStrokes`; imperative SVG updates, **no React state per pointer move**):
- `pointermove` over the title area (any pointer type) appends points to the current stroke, smoothed with Catmull-Rom or a quadratic midpoint path. A new stroke starts after a 250ms pause or on `pointerleave`/`pointerenter`.
- Each stroke is a group of 4–6 parallel `<path>`s offset perpendicular to the stroke direction (bristles), with a core width of ~70 design px. The outer bristles are thinner with opacity 0.5–0.8, for a dry-brush, streaky edge rather than a uniform marker line. The mask group uses an SVG filter (`feTurbulence` with `baseFrequency ≈ 0.035`, 2 octaves, into `feDisplacementMap` with scale ~14) for ragged bristle edges. Taper the start and end of each stroke.
- Each new stroke paints the next painting in the cycle, starting with the selected one, so the name becomes a patchwork of his paintings. Keep at most 4 paint layers mounted and reuse the oldest.
- **Drying**: 6s after a stroke ends, it fades over 2.5s and is removed. Cap at 40 live strokes and drop points closer than 6 design px.
- **Intro stroke**: once fonts are loaded (`document.fonts.ready`), one scripted zig-zag sweeps across "Aayush" then back across "Sharma" over 1.4s (ease-in-out), painting the selected artwork. It doesn't dry until the visitor's first stroke, so the first impression is always full of color.

**Code mode: character-cell reveal** (`useCodeReveal`; same imperative rules):
- The title area is divided into a grid of character cells matching the code layer's monospace advance and line height. When the pointer passes, cells within ~3 cells of the path are revealed. Reveal order within each newly touched row is left to right, about 12ms per cell, so it reads like code being printed along the cursor's path. The mask is made of hard-edged `<rect>`s snapped to the grid, with no blur and no turbulence. The contrast with the organic brush is the point.
- Merge adjacent revealed cells in a row into a single `<rect>`, so the DOM stays small. Cap at 1,500 revealed cells.
- **Fading**: cells un-reveal 6s after being revealed, in the same left-to-right order, so code "clears" like a terminal scrolling away.
- **Intro reveal on first switch to Code**: a scripted pass prints about 40% of the letter area, line by line, over 1.2s. It persists until the visitor's first interaction in Code mode.
- **Which code**: decorative, generic code from a small pool of snippets that you write, not code from his actual projects. Put 6–8 files in `src/components/hero/code-snippets/` (for example `.cs`, `.py`, `.ts`, `.glsl`, `.dart`), each 30–50 lines of plausible, well-formatted, varied code (a physics step, a shader, an API handler, a small ML training loop, and so on). Each code item uses snippet `index % poolSize` by its position in the list, so neighboring projects show different code. Repeat lines to fill the area.

`touch-action: pan-y` on the title, so horizontal finger drags reveal and vertical ones scroll.

## Content: `gallery.json` (hard requirement: swappable)

**Changing which items appear in either gallery, their order, or the initial selection takes exactly two steps: edit `src/components/hero/gallery.json`, then run `npm run hero:assets`.** No code, CSS, or copy edits. Nothing in the components, shaders, or scripts may reference a specific painting, project, filename, dimension, or point count.

```json
{
  "initialMode": "art",
  "art": {
    "initial": "snorkeling-hawaii",
    "items": [
      { "slug": "snorkeling-hawaii", "src": "/paintings/SeaTurtle.webp" },
      { "slug": "snowboarding", "src": "/paintings/Snowboarder.webp" },
      { "slug": "taj-mahal", "src": "/paintings/TajMahal.webp" },
      { "slug": "safari-kid", "src": "/paintings/SafariKid.webp" },
      { "slug": "soccer-penalty", "src": "/paintings/PenaltyKick.webp" },
      { "slug": "red-dead-redemption", "src": "/paintings/RedDeadRedemption.webp" },
      { "slug": "childhood-toys", "src": "/paintings/StillLifeToys.webp" }
    ]
  },
  "code": {
    "initial": "paintwise",
    "items": [ "…see below…" ]
  }
}
```

**Art items**: `slug`, `src`. Title and year are **looked up by `src` from `public/paintings/manifest.json`**, so they're never duplicated. The script fails loudly if `src` isn't there. Optional: `medium` (default `"Oil on canvas"`) and `tuning`. With this order, *Snowboarding* (next) sits right of the front card and *Childhood Toys* (last, so `d = −1`) on the left, as in the Figma.

**Code items** have no shared manifest, so they carry their own data: `slug`, `title`, optional `year`, `stack` (a short phrase, ≤ 40 characters), `src` (image), `href`, and optional `tuning`. Seed the list from the project data that already exists in `src/app/games/page.tsx`, `src/app/hackathons/page.tsx`, and the home page sections. **Copy titles, years, tech, images, and links from those arrays exactly.** Don't invent awards, years, or stacks; leave a field out if the source doesn't have it. Starting set, in this order: **Paintwise first, then the hackathon projects, then the games.**
1. Paintwise (`href: "/paintwise"`). This is the initial card.
2. ExoVision, Lumina, MedAI (in the order they appear in `src/app/hackathons/page.tsx`), then StockApp (from the home page's Developer section, `href: "/hackathons"`)
3. Bounce Back, Reign or Ruin, Biscuit Bandit, Murphy's Rocket (in the order they appear in `src/app/games/page.tsx`)

Use the existing cover images in `public/images/` for now. Note that the hackathons page references `/images/lumina-cover.webp` and `/images/medai-cover.webp`, which don't exist; the real files are `lumina.webp` and `medai.webp`.

**`tuning`** (optional, any item): `depthScale`, `normalStrength`, `lightRest` (fractions of the image), `neutralChroma`, `relief` (boolean). Defaults live in `heroConfig.ts`:
- **Art**: `relief: true`, `depthScale: 0.35`.
- **Code**: `relief: false` (screenshots aren't impasto; the front card renders flat, with a ±3° cursor-parallax tilt, and the spotlight dimmed to a soft sheen), `depthScale: 0.2`.

**Generated data**: `gallery.generated.json` (written by the script, keyed by mode and slug, committed, never hand-edited) holds `width`, `height`, `aspect`, the grid dims and exact point count per tier, resolved `title` and `year`, `avgColor`, `maxZoom`, hashed asset URLs, the tokenized code-snippet pool, and the **syntax palette**. Components import it statically (`resolveJsonModule` is on), so every card's aspect ratio is known at SSR time and nothing shifts.
- **Point budget, not grid width**: per-tier budgets in `heroConfig.ts` (`full: 210_000`, `lite: 82_000`). Grid dims: `gw = round(sqrt(budget × aspect))`, `gh = round(gw / aspect)`. The point count is never more than the source image's pixel count; small images get proportionally fewer points.
- **`maxZoom`**: the largest on-screen size, in CSS px on the image's long side, at which the image still looks sharp: `sourceLongSide / 1.25`, assuming DPR 2. The zoom act clamps to it (see Choreography). Some current project covers are small, so they'll zoom less. That's expected, and higher-resolution screenshots will be swapped in later. Don't flag it.
- **Syntax palette**: k-means (k = 6) over the chroma-weighted pixels of *all art items*. Assign the colors to token classes by lightness and chroma: keyword, string, number, function/type, punctuation (low chroma), and comment (`--ink-muted`). Each color is clamped to at least 4.5:1 contrast against `#000`. The code literally takes its colors from his paintings. Store it in the generated JSON and expose it as CSS variables on the hero.
- **Cache-safe filenames**: `next.config.ts` serves everything with `Cache-Control: immutable, max-age=1y`, so a file overwritten at the same URL stays stale for returning visitors. Generated assets go to `public/hero/<mode>/<slug>/` with an 8-character content hash in each filename. The script deletes superseded hashed files.

### Asset pipeline (run per change to `gallery.json` or the snippet pool; commit outputs)

`scripts/hero/`:
1. `depth.py`: reads `gallery.json`. For each item (or only `--slug <slug>`), it runs Depth Anything V2 Small via Hugging Face `transformers` (`pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf")`; torch and transformers are installed locally). It writes an intermediate 8-bit grayscale depth image, 1024 px on the long side or the source size if smaller, near = white, normalized to 0–255, with a 2px median filter. It skips items whose source hash hasn't changed. If the model can't be downloaded, stop and tell the user. Never fake depth.
2. `build-hero-assets.mjs` (Node + `sharp`): for each item, writes hashed files into `public/hero/<mode>/<slug>/`, then writes `src/components/hero/gallery.generated.json`.
   - `color.<hash>.webp`: 1024 px long side (no upscaling), q88, sRGB
   - `paint.<hash>.webp` (art only): 800 px wide, q80, for the letter paint layers
   - `depth.<hash>.webp`: lossless
   - `normal.<hash>.webp` and `height.<hash>.webp` (only when `relief`): normals from a Sobel filter on the luminance high-pass (luma minus a 6px Gaussian blur of luma)
   - `avgColor` (mean in OKLCH, chroma clamped ≤ 0.06), `maxZoom`, the syntax palette
   - The `code-snippets/` pool tokenized with **`shiki`**, added as a **devDependency used only by this script** and never imported by app code, into compact token runs `{ text, cls }` mapped to the six palette classes.

   Budget: ≤ 650 KB per item. The browser downloads only the selected items' textures plus prefetches. npm script: `"hero:assets": "python3 scripts/hero/depth.py && node scripts/hero/build-hero-assets.mjs"`. Both scripts accept `--slug` and validate `gallery.json` (unknown `initial` or `initialMode`, duplicate slugs, missing files, art `src` not in the manifest, missing required code fields), exiting non-zero with a clear message.

## Architecture

`src/components/hero/`:

| File | Responsibility |
|---|---|
| `Hero.tsx` | `"use client"`. Orchestrator: section and sticky container, `--u` scaling, scroll progress (`useScroll`), mode and per-mode selected index (React state is fine; they change rarely), tier. Lazy-mounts `HeroCanvas` via `next/dynamic` with `ssr: false`. |
| `HeroTitle.tsx` | The hidden `<h1>` plus the SVG title: name, reveal layers, outline, and the tagline with the Art/Code tabs and hover previews |
| `useBrushStrokes.ts` | Art-mode strokes: bristles, drying, intro stroke, layer cycling. Imperative SVG updates. |
| `useCodeReveal.ts` | Code-mode cell reveal: row merging, fading, intro reveal. Imperative SVG updates. |
| `GalleryStack.tsx` | Cards (DOM, `next/image`), slot layout, browsing input, the card flip on mode switch, hover, a11y, placard and controls. Reports the front card's inner image rect for WebGL alignment. |
| `useHeroTier.ts` | `'full' \| 'lite' \| 'static'` (rules below). SSR-safe, defaults to `'static'` until mounted. |
| `HeroCanvas.tsx` | R3F `<Canvas>`: camera, frameloop pause, rect alignment, pointer tracking, texture loading and prefetch |
| `FrontCard.tsx` | The front image plane at rest and during the zoom: lit relief (`relief: true`) or a flat image with parallax tilt and sheen (`relief: false`), with rounded-corner clipping |
| `ImagePoints.tsx` | Point cloud with a custom `ShaderMaterial`. Geometry is rebuilt when the selected item changes. |
| `paletteTargets.ts` | Pure `computePaletteTargets(rgba: Uint8ClampedArray, w: number, h: number): Float32Array`. No three.js imports. |
| `shaders.ts` | GLSL strings as exported template literals. No GLSL loader config. |
| `heroConfig.ts` | Global tunables (phase breakpoints, budgets, slot transforms, springs, brush and cell settings, per-mode tuning defaults). Exposes typed gallery data merged from both JSON files. |
| `gallery.json` / `gallery.generated.json` | See above |

Replace `HeroSection` in `src/app/page.tsx` with `<Hero />` and delete the old component and any imports that become unused. Leave the other sections alone.

**Dependencies**: `three` (one deduped copy compatible with `@react-three/fiber` v9; `three@0.172` is already pulled in transitively by `@google/model-viewer`), `@react-three/fiber@^9` (needed for React 19), `@types/three` (already present), and `shiki` as a devDependency for the asset script only. Do **not** add drei, postprocessing, GSAP, Lenis, or a carousel library. Framer Motion covers the springs and scroll.

## Rendering details

**Alignment**: the DOM is the source of truth. At rest, `HeroCanvas` (absolute, covering the hero viewport, `pointer-events: none`, reading pointer data from window listeners) places the image plane at z=0 to overlap the front card's inner image rect pixel-for-pixel. Re-read on resize, on settle, and on scroll. Use a perspective camera with `fov: 30`. The canvas crossfades in over the poster only after its first frame has rendered.

**`FrontCard`, relief variant (art)**: `PlaneGeometry` with 256 segments on the long side, and `MeshPhysicalMaterial` with `map`, `normalMap` (normalScale ≈ `tuning.normalStrength`, default 1.2), a tiny `displacementMap` (~0.004 of plane width), `roughness: 0.5`, `clearcoat: 0.25`, `clearcoatRoughness: 0.4` (varnished oil). Clip to the card's image radius with an SDF alpha (in `onBeforeCompile`, or a custom shader with the same lighting model).
- **Spotlight**: follows the cursor across the painting at a grazing angle (z ≈ 0.35 × plane height, angle ~35°, penumbra 0.8, warm white `#fff4e6`), eased with `1 - exp(-dt*6)`, never snapping. Low hemisphere fill keeps unlit areas at ≈35% brightness.
- **Wall pool**: a large plane behind everything in `--wall` receives the spotlight, so a soft pool of light follows the cursor. It's lightly tinted toward the selected item's `avgColor` and crossfades over 600ms on change. This is the only colored light in the hero.
- With no pointer, the light rests at `tuning.lightRest` (default `[0.3, 0.25]`) and drifts on a slow Lissajous path (period ≥ 20s, amplitude ≤ 8%).
- On load, the spotlight intensity ramps from 0 to full over 1.2s once the canvas is ready.

**`FrontCard`, flat variant (code)**: an unlit textured plane with the same rounded clip. It tilts toward the cursor by up to ±3° (eased). The spotlight is dimmed to ~30% and renders only as a broad, soft sheen moving across the image, like light on a screen. The wall pool stays, tinted by `avgColor`.

**Points (`ImagePoints`)**: one point per grid cell. Per-point attributes: `aUv`, `aTarget` (from `computePaletteTargets`), and `aRand`. All motion happens in the vertex shader via uniforms. No per-frame buffer updates.
- Color is sampled from `color.webp` in the vertex shader. Handle the color space correctly: sRGB texture, output with `#include <colorspace_fragment>` (or the equivalent) so the points match the plane exactly. Washed-out or over-dark points are a bug.
- Fragment: a soft round dab (`discard` outside radius 0.5, 1px antialiased edge). Point size scales with the DPR and the plane's on-screen size, so the points tile the image with no gaps at handoff.
- `computePaletteTargets`: convert to OKLCH. Sort by hue into ~64 columns, and by lightness within each column. Map to a grid with the image's aspect in world space. Pixels with chroma below `tuning.neutralChroma` (default 0.03) form their own neutral column at one end. It must run in under 80ms for 210k points, or move to a Web Worker. Compute it on idle when the selection settles.

## Choreography (scroll progress `p` from 0 to 1)

The hero section is `300svh` tall (`220svh` on lite) with a sticky inner container of viewport height. This is native scroll with no hijacking, snapping, or smooth-scroll library. `p` comes from `useScroll({ target: heroRef, offset: ['start start', 'end end'] })` and is read in `useFrame` through a ref, smoothed with exponential damping (rate ~8). DOM elements are driven by `useTransform` motion values. **Never put `p` into React state.** Everything below applies to the selected item of the active mode.

| `p` | Act | What happens | Placard detail line |
|---|---|---|---|
| 0.00–0.03 | **Gallery** | At rest: browsing, switching, letter reveals, spotlight | {medium} or {stack} |
| 0.03–0.20 | **Zoom** | The ±1 and ±2 cards slide outward (±35% of viewport width) and fade out by 0.12. The name and tagline rise 60 design px and fade out by 0.14, and live reveals fade with them. The front card's frame fades out. The image grows from its card rect to the largest rect that fits 84% of the hero viewport (contain) **and** is no larger than `maxZoom`, centered, while its corner radius eases to 0. Art stays lit, so the zoom reveals brushwork up close. Drive the plane's world rect in WebGL by interpolating between the two rects. The DOM poster follows the same interpolation underneath. | unchanged |
| 0.20–0.26 | **Handoff** | The light's contribution eases to neutral so the plane renders ≈ flat. Then the plane fades out while the points fade in at identical positions and colors. **No visible pop.** Verify with screenshots on both sides. | unchanged |
| 0.26–0.52 | **Depth** | Points lift along +z by `depth × tuning.depthScale × planeHeight`, each with a per-point delay from `aRand` (≤ 15% of the phase). The camera yaws ~16° and dollies in ~6%. Foreground subjects clearly float in front of the background. Point size shrinks ~25% so gaps open and the wall shows through. | {medium or stack} · {count} points |
| 0.52–0.82 | **Palette** | Points travel to `aTarget` along a quadratic Bézier, with the control point lifted on z by `0.2 + aRand × 0.3`. Never a straight lerp. Stagger by target hue, so the palette sweeps in column by column. The camera eases back to frontal. | {medium or stack} · {count} points, sorted by hue |
| 0.82–1.00 | **Release** | The palette field holds, then dims to 0 over the last 8% as the Painter section scrolls in | unchanged |

- During the scroll acts, the placard (title, year, detail) moves to the bottom-left of the hero viewport, aligned with the 48px gutter. The controls and trailing link fade out with the side cards. `{count}` is the current tier's actual count for that item, formatted with `toLocaleString('en-US')`.
- Scrolling back up reverses everything exactly, restoring the same mode and selection. Interaction re-enables below `p < 0.03`.
- **Load sequence** (one sequence, no cascade): wall, cards, and the outlined title render immediately. The name and tagline fade in (opacity 0→1, 8px rise, 700ms, `cubic-bezier(0.2, 0.7, 0.2, 1)`). The intro stroke starts once fonts are ready. The spotlight ramps up once the canvas is ready.

**Cursor push in the point acts (full tier only)**: points within a ~90 CSS px screen-space radius of the cursor are pushed along the smoothed cursor velocity, with a gaussian falloff, like a brush through wet paint. They spring back as velocity decays (damping rate ~5). No push when the pointer is still. This lives in the vertex shader (`uMouse` on z=0, `uMouseVel`).

## Tiers (`useHeroTier`)
- **static**: if `prefers-reduced-motion: reduce`, or WebGL2 is unavailable, or `navigator.connection?.saveData`. Browsing and mode switching still work, but cards change instantly (no spring, and the flip becomes a 150ms crossfade). The letters show a fixed, pre-defined reveal: painted strokes in Art and a printed block in Code, with no animation and no fading. No canvas mounts, and the section is plain `100svh`, not pinned. It must still look finished.
- **lite**: if `(pointer: coarse)`, or viewport width < 1024, or `navigator.hardwareConcurrency <= 4`. 82k-point budget, DPR cap 1.5, no cursor push in the point acts. The light rests and drifts, and tapping the front card moves the light. Max 2 paint layers and 600 code cells. Section height `220svh`.
- **full**: everything else. DPR `[1, 1.75]`.
- Listen to the reduced-motion query live. Switching to `reduce` mid-session drops to static.

## Performance requirements
- The front card posters are the LCP. The canvas chunk loads only after the front poster has loaded and the browser is idle (`requestIdleCallback`, with a 1200ms timeout fallback).
- `gl={{ antialias: false, powerPreference: 'high-performance', alpha: true }}`.
- Pause rendering when the hero is fully off-screen (IntersectionObserver) or `document.hidden`.
- Dispose of geometries, materials, and textures on unmount and when resources are swapped. Keep at most 4 items' textures resident (selected ±1, plus the other mode's selected item). Fast Refresh must not leak WebGL contexts.
- `webglcontextlost` → fall back to the static tier, with no blank rectangle.
- No per-frame or per-pointer-move React re-renders. Check with React DevTools' "highlight updates" while painting, revealing code, browsing, switching, and scrolling.
- The brush SVG and the code-cell reveal must each hold 60fps during 10 seconds of continuous interaction on the full tier. Measure both. If the turbulence filter is the bottleneck, apply it once to a pre-rendered bristle texture used as a mask pattern instead of filtering live geometry.

## Build order: checkpoint after each phase with screenshots, and stop if a phase looks wrong

1. **Content and assets**: write `gallery.json`, with code items seeded from the existing page data. Install `shiki` as a devDependency and run `npm run hero:assets`. Open each item's depth map (and normal map for art) and check them. Show the generated syntax palette as swatches in a screenshot.
2. **Static composition**: Poppins, the SVG title (outline + tagline with the active/inactive word styles), the card fan in its Figma arrangement with `--u` scaling, the placard and controls, and the static tier. Remove the old `HeroSection`. Screenshot at 1440×900 and compare side by side with the Figma screenshot (proportions, tagline overlap, card rotations and offsets, frame color and radius). Then 1280×720 and 390×844.
3. **Gallery and mode switch**: every browsing input, springs, hover, looping, the card flip, tabs and their keyboard support, per-mode selection memory, a11y, placard updates
4. **Letters**: Art brush strokes (bristles, ragged filter, layer cycling, drying, intro) and Code cell reveal (grid alignment, row merging, fading, intro), plus hover previews on the inactive word
5. **Front card WebGL**: alignment, rounded clip, relief variant with spotlight, flat variant with tilt and sheen, tinted wall pool, light ramp, hide and restore around browsing and switching, prefetch
6. **Zoom, points, and choreography**: zoom with `maxZoom` clamping, handoff, depth, palette, release, placard evolution, cursor push, scroll reversal, in both modes
7. **Tiers, performance, and polish**: lite and static tiers, pause and resume, disposal, context loss, reduced motion, FPS measurements

## Verification (there is no test suite; do all of this)
- `npm run build`, `npm run lint`, and `npx tsc --noEmit` pass.
- Use Playwright (MCP browser tools) against `npm run dev`:
  - At 1440×900 in Art mode, screenshot:
    - `p` = 0, with the intro stroke visible
    - after a scripted pointer path across the name
    - `p` ≈ 0.10, 0.19, and 0.23 (handoff; compare to 0.19 to confirm no pop)
    - `p` ≈ 0.40, 0.70, and 0.92

    Look at each critically against the Figma, the **Banned** list, and the success criteria.
  - Switch to Code mode: screenshot mid-flip, after it settles, with the intro reveal visible, and after a scripted pointer path. Run the scroll pass again at `p` ≈ 0.19 and 0.70.
  - Browse with each input in both modes (horizontal wheel events, a pointer drag, a click on a side card, arrow keys). Confirm the placard, `aria-current`, and the live region update, and that vertical wheel events still scroll the page. Switch modes back and forth and confirm each mode keeps its selection.
  - Select *Red Dead Redemption* (portrait art) and a low-resolution project cover. Run the scroll pass at `p` ≈ 0.19 and 0.70, and confirm the zoom stops at `maxZoom` for the small image.
  - At 390×844, screenshot the lite tier in both modes at `p` = 0, 0.19, and 0.70, plus after a swipe and after a mode switch.
  - Emulate `prefers-reduced-motion: reduce` and screenshot both modes: static tier, no canvas in the DOM, letters revealed.
  - Read console messages. No errors or warnings from hero code.
- Measure FPS (a `requestAnimationFrame` sampler via `browser_evaluate`) during:
  - 10s of continuous painting
  - 10s of continuous code reveal
  - rapid browsing
  - repeated mode switches
  - a full scroll pass in each mode

  Report the numbers. Anything under 55fps on this machine must be fixed before declaring done.
- **Content swap test**: in `gallery.json`, change `art.initial` to `taj-mahal`, remove one code item, reorder two art items, and set `initialMode` to `"code"`. Run `npm run hero:assets` and reload. Confirm everything works with no other file touched. Then restore the original `gallery.json` and re-run. Finally run `git grep -n -i "SeaTurtle\|StillLifeToys\|Snowboarder\|Snorkeling\|reign-or-ruin\|Reign or Ruin\|210,432" -- src/components/hero scripts`. The only hits allowed are in `gallery.json` and `gallery.generated.json`.
- Report honestly at the end: what's done, deviations and why, the FPS numbers, and the screenshots taken.

## Out of scope
Navigation, Footer, every section below the hero, other pages, and global theme tokens. The only global change allowed is adding Poppins in `layout.tsx`. Don't fix the broken `-cover` image paths on the hackathons page; just mention them in your report. Note any other issues you spot elsewhere; don't fix them.
