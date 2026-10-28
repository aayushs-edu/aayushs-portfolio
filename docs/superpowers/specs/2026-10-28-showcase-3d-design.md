# Showcase: scrolling from the split hero into a 3D scene of the work

Branch `hero-split`. Builds on the split hero (`docs/superpowers/specs/2026-10-27-split-hero-seam-design.md`), previewed at `/split`.

## Intent

After the split hero, the visitor scrolls down into a 3D scene that holds the whole portfolio: paintings, projects, games, animation, hackathons. It is the one-page site the redesign has been heading toward; the separate pages can retire once it carries everything. The audience is still admissions readers, recruiters and the creative community, so every piece must be readable in passing and have its full story one click away. The scene carries the hero's idea forward: art and code are two sides of one practice.

## Decisions (made with the user)

- **Role**: the whole portfolio, built in stages (below).
- **Organisation**: try two layouts on the same scene and compare: **split** (the hero's line continues as the spine; art on one side, code on the other) and **chapters** (one space per medium, one after another).
- **Movement**: scroll drives the camera along a path that lingers at each piece; the cursor turns the view slightly (look-around). On phones the camera simply follows the path.
- **Detail**: a short caption appears with each piece as you pass; clicking flies the camera in and opens a panel with the full story. Scroll or Esc returns.
- **Entrance**: "the line opens": scrolling tears the hero apart along its fluid line and the camera moves through the gap.
- **Approach**: React Three Fiber (three and @react-three/fiber are already dependencies), lazy-loaded; all text as DOM over the canvas.

## Stages

Each stage gets its own plan and build.

1. **Scene and entrance**, with **paintings** (the 7 portfolio paintings) and **projects** (the 9 from the hero gallery), captions, the detail view, keyboard and screen-reader access, the reduced-motion / no-WebGL fallback, performance tiers. Both layouts.
2. **Games** (itch.io links; clips where available).
3. **Animation** (videos from the GitHub release `videos-v1.0`).
4. **Hackathons**.
5. **Early work** (the 10 "pre-portfolio" paintings) and anything left on the old pages; then retire them.

This spec covers the whole design; stage 1 is what gets planned first.

## 1. Structure and the entrance

**Page.** `/split` renders `<SplitHero />` followed by `<Showcase />`. They share one tall scroll section with one pinned (CSS sticky) viewport. Layers, back to front: the 3D canvas; the hero (until it has opened); DOM overlays (captions, detail panel, chapter titles). One scroll progress value, exponentially smoothed (as the gallery hero did), drives everything in two segments: the **entrance** (about one viewport of scrolling) and the **path** (about one viewport per piece, plus chapter titles in the chapters layout).

**The line opens.** The tear is done in the seam shader, not by moving DOM:

- A new uniform `uOpen` (CSS px). A pixel left of the line (x < line(y) − open) draws what was at x + open; a pixel right of it (x > line(y) + open) draws what was at x − open; between them the canvas is transparent. The gap is shaped exactly like the fluid line. This moves the painted name, the binary name, the ribbons and the bits together.
- The wall layers (linen, dot grid) slide apart by the same amount with CSS transforms; their clip-paths move with them. The stage's own background moves onto the wall layers so the gap is truly open.
- The seam's wet bead becomes the two raw edges of the tear (drawn on both edges).
- "Art x Code" lifts and fades over the first part of the entrance.
- Name touch and line pulling are disabled once the entrance starts.
- Behind the hero, the 3D camera starts close and dollies forward through the gap as it widens. By the end of the entrance the halves are off-screen and the hero's canvas and layers are hidden (and its frame loop paused).

**Loading.** The showcase chunk (three, R3F, scene code) loads on idle after the hero is up, or at the first scroll, whichever comes first. Textures stream in by distance along the path.

**Layouts.** Scene, camera, pieces, captions and details are shared. A layout is a pure module: `(works, viewport) → { placements, cameraPath, stops, titles }`:

- `placements`: per work, position, rotation and scale in the scene.
- `cameraPath`: spline control points plus look targets.
- `stops`: the path parameter at which each work is presented, in order.
- `titles`: chapter titles and where they appear (chapters layout).

Two layouts: `split` and `chapters`, chosen with `/split?layout=chapters` (default `split`).

**Content.** One typed list of works (`src/components/showcase/works.ts`):

| Field | Notes |
|---|---|
| `slug` | URL-safe id |
| `kind` | `painting` / `project` / `game` / `animation` / `hackathon` |
| `side` | `art` / `code` / `both` (Paintwise is `both`) |
| `title`, `year` | |
| `line` | medium (art) or stack (code): one line |
| `story` | a few short paragraphs |
| `links` | label + href (itch.io, demo, existing page) |
| `media` | image, optional depth map, optional video |

Stage 1 builds it from `gallery.json` + `gallery.generated.json` (images and depth maps already exist in `public/hero/`), with stories and links taken from the existing pages.

## 2. The scene

**Look.**

- A dark space (`#0d0d0d`) with soft depth fog, so pieces emerge as they approach.
- The floor is linen on the art side and the dot grid on the code side.
- One warm key light from the upper left (the same light as the hero's paint).
- Colour comes from the work itself and the six seam pigments only. No glows, particles or gradients.

**Layout: split.**

- The hero's line continues as the spine: a fluid off-white seam down the middle of the floor; the camera travels along it.
- Paintings hang on the art side, projects stand on the code side. They alternate sides, angled toward the path, so about every scroll a piece comes alongside.
- Works that are `both` sit on the spine itself.
- (Full tier) thin paint strokes and bits flow off the spine on their sides, a light version of the hero effect.

**Layout: chapters.**

- One space per medium in order: Paintings, then Projects (later Games, Animation, Hackathons).
- Each opens with its title set large in Poppins, then arranges its works around a gentle curve the camera sweeps along.
- Between chapters, a short passage where the line opens again into the next space.

**Camera.**

- A Catmull-Rom spline through the layout's control points.
- Scroll maps to the path with dwell: around each stop, scroll moves the camera slower, so each piece holds centre for a beat.
- Look-around: up to ±5° yaw/pitch toward the cursor, damped. No look-around on touch.

**Works.**

- **Paintings**: real canvases. A subdivided plane displaced by the painting's depth map into low relief (full tier), so the brushwork catches the light as the camera passes; stretched-canvas sides, as in the hero.
- **Projects**: screens in a slim bezel showing the screenshot (later a muted loop where footage exists); lit like a screen.
- Hover lifts a work slightly toward the camera.

**Captions.** DOM, positioned each frame from the work's projected anchor point: the title in Poppins, the year and medium/stack in Geist Mono. A caption fades in as its work nears its stop and out as it passes.

## 3. Detail, access, fallback, performance

**Detail view.**

- Clicking a work (raycast) or its caption flies the camera in (about 0.8 s, eased) until the work fills about 60% of the viewport, slightly off-centre.
- A panel slides in on the free side: title, year, medium/stack, story, links, video where there is one.
- While it's open, page scroll is frozen.
- Closing: Esc, the close button, a scroll gesture, or browser Back. The camera flies back to the stop it came from.
- Each open work has a URL: `#work/<slug>`. Loading that URL opens it.

**Keyboard and screen readers.**

- All the works also exist as semantic DOM: a list with a heading per chapter, a heading and text per work, real links. Screen readers and search engines read that, not the canvas.
- Tab moves through the works in path order. Focusing one scrolls to its stop and shows its caption; Enter opens its detail.
- Visible focus rings. The panel traps focus while open; closing returns focus to the work.

**Fallback (reduced motion, or no WebGL2).**

- No 3D. The showcase renders as a calm page: chapter headings, each with a grid of its works (paintings as images, projects as screenshots), with the same detail panel (no flight).
- The hero does not tear; the page scrolls on.

**Performance.**

- The showcase chunk loads after the hero is up.
- Textures stream by distance along the path.
- **Full tier**: relief geometry, DPR ≤ 1.5, spine effects.
- **Lite tier** (touch, small screens, ≤ 4 cores): flat canvases (no relief), DPR 1, no spine effects.
- The frame loop pauses when the scene is off screen. Context loss falls back to the static page.
- Target: 60 fps on a 2020 laptop with integrated graphics.

## Units (stage 1)

| Unit | Role |
|---|---|
| `src/components/showcase/works.ts` | The typed list of works (stage 1: paintings, projects) |
| `src/components/showcase/layouts/split.ts`, `chapters.ts` | Pure: works → placements, camera path, stops, titles |
| `src/components/showcase/scrollMap.ts` | Pure: scroll progress → entrance amount and path position, with dwell at stops |
| `src/components/showcase/Showcase.tsx` | Scroll section, sticky viewport, tier, lazy scene, DOM overlays |
| `src/components/showcase/Scene.tsx` | The R3F canvas: environment, works, camera rig, look-around, picking |
| `src/components/showcase/PaintingMesh.tsx`, `ScreenMesh.tsx` | One work each |
| `src/components/showcase/Captions.tsx`, `DetailPanel.tsx`, `WorkList.tsx` | DOM: captions, the detail view, the semantic list / fallback grid |
| Seam shader (`seamShader.ts`, `SeamCanvas.tsx`, `SplitWall.tsx`, `SplitHero.tsx`) | `uOpen` and the tear; the hero reads the entrance amount |

## Verification

- Unit-check the pure modules (layouts, scroll map) by running them in Node: stops are ordered, every work has a placement, the camera path passes each stop.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` (with the dev server stopped).
- Playwright:
  - screenshots at each stop in both layouts
  - the tear mid-entrance
  - the fly-in and panel
  - Tab through the works
  - reduced motion (the fallback grid)
  - phone width
  - frame rate while scrolling
- Close the browser and delete temp files afterwards.
