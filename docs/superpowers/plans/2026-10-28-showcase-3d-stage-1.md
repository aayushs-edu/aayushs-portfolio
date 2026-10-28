# Showcase stage 1 (scene, entrance, paintings and projects) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scrolling past the split hero at `/split` tears it open along its fluid line and flies the camera into a 3D scene holding the 7 portfolio paintings and the 9 hero-gallery projects, with captions, a detail view, keyboard/screen-reader access, a calm fallback and two layouts (`split`, `chapters`).

**Architecture:** One tall scroll section with one sticky viewport. Layers, back to front: the R3F canvas (lazy), DOM overlays (captions, chapter titles), the split hero (until it has opened). One smoothed scroll progress feeds a pure scroll map (entrance amount, path parameter, continuous beat index). Pure layout modules turn the typed works list plus the viewport into placements, a camera path, stops, titles and passages. The hero's seam shader gains `uOpen` and tears itself; the wall halves slide apart with CSS transforms.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, three 0.172 + @react-three/fiber 9 (no drei), CSS modules, raw WebGL2 for the hero seam.

**Spec:** `docs/superpowers/specs/2026-10-28-showcase-3d-design.md` (stage 1). Hero background: `docs/superpowers/specs/2026-10-27-split-hero-seam-design.md`.

## Global Constraints

- Branch `hero-split`. The home page and the gallery hero are not touched; everything lives at `/split`.
- Scene background `#0d0d0d`; colour only from the works and the six seam pigments (`VIVID` in `splitConfig.ts`). No glows, particles or gradients.
- All text is DOM over the canvas (captions, titles, panel, semantic list).
- Layout chosen with `/split?layout=chapters`; default `split`.
- Tiers come from `useHeroTier`: `full` (relief, DPR ≤ 1.5, spine effects), `lite` (flat canvases, DPR 1, no spine effects, no look-around), `static` (no 3D, no tear: fallback grid).
- Look-around at most ±5° yaw/pitch, damped; none on touch/lite.
- Detail flight about 0.8 s eased; the work fills about 60% of the free part of the viewport.
- URL of an open work: `#work/<slug>`.
- Don't run `next build` while `next dev` is running.
- Never hand-edit `gallery.generated.json`.

## Review Focus

1. Loading `/split#work/<slug>` directly: the page should land at that work's stop with its panel open (3D), or the panel open over the grid (fallback); an unknown slug is ignored.
2. Resizing or rotating while scrolled deep into the path: the layout is rebuilt for the new viewport; the camera should stay at the same beat, not jump.
3. Browser Back while a panel is open closes it (and doesn't reload the page or leave the scroll frozen); Back again leaves the page normally.
4. WebGL context loss mid-scroll: the page should drop to the fallback grid with scrolling unfrozen and the hero intact.
5. Reduced motion toggled live (OS setting) while on the page: switches to the fallback without a broken half-torn hero.

Each is exercised in Task 7's Playwright pass (items 1–3 and 5 directly; item 4 with `WEBGL_lose_context`).

---

## File structure

| File | Responsibility |
|---|---|
| `src/components/showcase/works.ts` | `Work` types and `WORKS` (paintings + projects from the hero gallery, stories/links from the old pages) |
| `src/components/showcase/showcaseConfig.ts` | Tunables (scroll units, dwell, fog, flight, panel sizes, tiers) |
| `src/components/showcase/scrollMap.ts` | Pure: beats → scroll map; progress → `{ entrance, t, beat }`; beat → progress |
| `src/components/showcase/cameraPath.ts` | Pure: Catmull-Rom position/target curves through the layout's control points |
| `src/components/showcase/layouts/types.ts` | Layout types and shared geometry helpers (work sizes, presentation distance) |
| `src/components/showcase/layouts/split.ts` | Split layout |
| `src/components/showcase/layouts/chapters.ts` | Chapters layout |
| `src/components/showcase/layouts/index.ts` | `LAYOUTS`, `LayoutName`, `parseLayout`, `beatsFor` |
| `scripts/showcase/checks.ts`, `scripts/showcase/check.mjs`, `scripts/showcase/tsconfig.json` | Node unit-checks of the pure modules (`npm run showcase:check`) |
| `src/components/showcase/Showcase.tsx` + `Showcase.module.css` | Scroll section, sticky viewport, smoothing loop, tier, lazy scene, hero wiring, detail state, hash, scroll freeze |
| `src/components/showcase/Scene.tsx` | R3F canvas: fog, lights, floor, passages, works, rig (path, entrance dolly, look-around, flight), picking, texture streaming, overlay projection |
| `src/components/showcase/Floor.tsx` | Floor shader: linen / dot grid split, spine line, spine effects; passage gates |
| `src/components/showcase/PaintingMesh.tsx`, `ScreenMesh.tsx` | One work each |
| `src/components/showcase/Captions.tsx`, `DetailPanel.tsx`, `WorkList.tsx` | DOM overlays, detail view, semantic list / fallback grid |
| Hero: `seamShader.ts`, `nameGL.ts`, `SeamCanvas.tsx`, `SplitWall.tsx`, `SplitHero.tsx`, `SplitHero.module.css` | `uOpen` tear, wall halves slide, tagline lifts, touch off during entrance, pause when hidden |
| `src/app/split/page.tsx` | Renders `<Showcase layout=… />` |

## Interfaces (shared names)

```ts
// works.ts
export type WorkKind = "painting" | "project" | "game" | "animation" | "hackathon";
export type WorkSide = "art" | "code" | "both";
export interface WorkLink { label: string; href: string }
export interface WorkMedia { image: string; depth?: string; video?: string; aspect: number; avgColor: string }
export interface Work { slug: string; kind: WorkKind; side: WorkSide; title: string; year?: string; line: string; story: string[]; links: WorkLink[]; media: WorkMedia }
export const WORKS: Work[];
export const isExternal: (href: string) => boolean;

// layouts/types.ts
export type Vec3 = [number, number, number];
export interface Viewport { width: number; height: number }
export interface Placement { slug: string; position: Vec3; rotationY: number; width: number; height: number }
export interface PathPoint { position: Vec3; target: Vec3 }
export interface Stop { slug: string; t: number }
export interface Title { key: string; text: string; t: number; position: Vec3 }
export interface Passage { key: string; t: number; position: Vec3; rotationY: number }
export interface FloorPlan { spine: boolean; planes: [number, number, number, number][]; sides: ("art" | "code")[]; bounds: [number, number, number, number] }
export interface SceneLayout { placements: Placement[]; cameraPath: PathPoint[]; stops: Stop[]; titles: Title[]; passages: Passage[]; floor: FloorPlan; groups: { title: string; slugs: string[] }[] }
export type LayoutFn = (works: readonly Work[], viewport: Viewport) => SceneLayout;
export const FOV_Y: number; export const EYE: number;
export function sizeOf(work: Work): { width: number; height: number };
export function presentDistance(width: number, height: number, viewport: Viewport): number;

// scrollMap.ts
export interface Beat { key: string; t: number; units: number }
export interface ScrollMap { units: number; entranceUnits: number; beats: Beat[]; /* … */ }
export interface ScrollSample { entrance: number; t: number; beat: number }
export function createScrollMap(beats: Beat[], entranceUnits: number, dwell: number): ScrollMap;
export function sampleScroll(map: ScrollMap, progress: number, out?: ScrollSample): ScrollSample;
export function progressForBeat(map: ScrollMap, index: number): number;

// cameraPath.ts
export interface CameraPath { at(t: number, position: THREE.Vector3, target: THREE.Vector3): void; pointCount: number }
export function createCameraPath(points: PathPoint[]): CameraPath;

// layouts/index.ts
export type LayoutName = "split" | "chapters";
export const LAYOUTS: Record<LayoutName, LayoutFn>;
export function parseLayout(value: string | string[] | undefined): LayoutName;
export function beatsFor(layout: SceneLayout): Beat[]; // titles + stops by t, keys "title:<key>" / "work:<slug>"

// hero
SplitHero props: { entrance?: { readonly current: number }; paused?: boolean }
SeamCanvas props: + entrance, paused   (sets --open px and --entrance on the stage each frame)
```

---

### Task 1: Works list

**Files:** Create `src/components/showcase/works.ts`.

- [ ] Build `WORKS` from `GALLERY` (heroConfig): art items → `kind: "painting"`, `side: "art"`, `line` = gallery detail (medium), story = the painting's manifest description, link "All paintings" → `/paintings`. Code items → `kind: "project"`, `side: "code"` (Paintwise `both`), `line` = stack, stories and links from `/hackathons`, `/games`, `/paintwise` and the home page. `media` = `{ image: assets.color, depth: assets.depth, aspect, avgColor }`.
- [ ] `npx tsc --noEmit` passes. Commit.

### Task 2: Scroll map (test first)

**Files:** Create `scrollMap.ts`, `scripts/showcase/{checks.ts,check.mjs,tsconfig.json}`; add `"showcase:check"` to `package.json`.

Checks (in `checks.ts`): for a map of beats at t = 0.1, 0.3, 0.32, 0.8 with units 1, 0.8, 1, 1 and entrance 1:
- progress 0 → entrance 0, t 0, beat −1; progress at the end of the entrance → entrance 1, t 0, beat −0.5; progress 1 → t 1.
- sampling progress 0..1 in 4000 steps: entrance and t never decrease; beat never decreases.
- `progressForBeat(map, i)` → t equals beat i's t (±1e-6) and beat equals i.
- dwell: around each beat, |dt/dprogress| at the beat is < 0.3 × the chunk's mean rate.

- [ ] Write checks, run `npm run showcase:check` → fails (module missing).
- [ ] Implement: chunk i spans scroll units `[start_i, start_i + units_i]` and t from `a_i` (0 or the midpoint to the previous beat) to `b_i` (1 or the midpoint to the next). Local x ∈ [0,1], `f(x) = x + dwell/(2π)·sin(2πx)` (slow at 0.5). First half maps `a_i → t_i` by `2f(x)`, second `t_i → b_i` by `2f(x) − 1`. `beat = i + x − 0.5`. Entrance: `entrance = s / entranceUnits`, `beat = −1 + 0.5·entrance`.
- [ ] Run → passes. Commit.

### Task 3: Layouts and camera path (test first)

**Files:** Create `cameraPath.ts`, `layouts/{types,split,chapters,index}.ts`; extend `checks.ts`.

Checks, for both layouts × viewports 1440×900, 1024×768, 390×844, with 16 fake works (7 paintings incl. a 0.74 portrait, 8 code incl. 2.2 and 0.79 aspects, 1 `both`):
- every work has exactly one placement and one stop; stops strictly increasing in t; titles/passages inside (0,1).
- the camera path at each stop's t equals that stop's control point; its target there is the work's centre (±1e-6).
- the camera path (2000 samples) never comes within 0.6 m of any work's rectangle, except the work it is presenting must be ≥ 1.0 m away at its stop.
- works are ≥ 1.2 m apart (centre to centre) and inside the floor bounds.
- the work at its stop fills ≤ 70% of the viewport height and width (pinhole projection with FOV_Y).
- chapters: one title per chapter, passages = chapters − 1, floor `sides` match chapter kinds.

Geometry:
- `split`: start (0, EYE, 0) looking down −z. `both` works sit on the spine (x = 0) facing +z; the path goes round them on the side away from the next work. Others alternate art (x = −1.95) / code (x = +1.95), each facing its camera stop; the camera stop is 0.15 m to the other side of the spine at `presentDistance` from the work. Spacing along z = max(4.6, max stop depth + 1.2). Mid points between stops look straight ahead.
- `chapters`: chapters by kind (Paintings, Projects); each: a title beat (title floats 6 m ahead), then an arc sweeping ≤ 100° (Paintings turn right with works on the left, Projects turn left with works on the right), camera on the inner radius looking outward at each work; between chapters a 7 m straight passage with a gate (the line opening) halfway; floor split at the gate plane.
- [ ] Write checks → fail. Implement → pass. Commit.

### Task 4: The hero tears

**Files:** Modify `seamShader.ts`, `nameGL.ts`, `SeamCanvas.tsx`, `SplitWall.tsx`, `SplitHero.tsx`, `SplitHero.module.css`.

- [ ] Shader: `uniform float uOpen;` In `main`, with `c = curveAt(p.y)`: `p.x < c − uOpen` → draw the left side at `p.x + uOpen`; `p.x > c + uOpen` → right side at `p.x − uOpen`, plus the bead's right half as a raw edge (off-white, faded in over the first 4 design px of opening); else transparent.
- [ ] Loose digits (`drawBits`) take `open` and shift right by it.
- [ ] `SeamCanvas`: props `entrance`, `paused`. Each frame: `open = smooth(e) × (max(seamX, w − seamX) + (CURVE.amp + 40)·u)`; uniform; stage vars `--open` (px) and `--entrance`. `paused` stops the loop without rebuilding (start/stop through a ref).
- [ ] CSS: stage background moves to the wall layers (`.wallFill`); `.artSide` translates by −open, `.codeSide` by +open; the tagline lifts and fades over the first third of the entrance.
- [ ] `SplitHero`: pass `entrance`/`paused` through; pointer handlers do nothing (and release the line) once entrance > 0.
- [ ] `npx tsc --noEmit`, lint. Commit.

### Task 5: Showcase shell, semantic list and fallback

**Files:** Create `showcaseConfig.ts`, `Showcase.tsx`, `Showcase.module.css`, `WorkList.tsx`, `DetailPanel.tsx`; modify `src/app/split/page.tsx`.

- [ ] Page reads `searchParams.layout` → `<Showcase layout={parseLayout(...)} />`.
- [ ] Tier `static`: hero (normal), then `WorkList mode="grid"` (chapter headings, grid of works), `DetailPanel` without flight.
- [ ] Otherwise: section of height `(units + 1) × 100svh`; sticky viewport with scene layer, overlay layer, hero layer (`data-hidden` when entrance ≥ 1, paused), `WorkList mode="hidden"` inside the sticky (so focusing never scrolls the page).
- [ ] Smoothing loop (rate 8/s) writes `scrollRef` and `entranceRef`; React state only on threshold changes (hero hidden, scene active, nearest beat).
- [ ] Scene chunk loads on idle after mount or first scroll.
- [ ] Detail state: open/close, `#work/<slug>` (pushState; Back closes; load opens), scroll freeze (`overflow: hidden` on `<html>`), wheel/touch outside the panel closes, Esc closes, focus trap, focus returns to the work's button.
- [ ] Focus on a work's button scrolls to its stop and shows its caption's focus ring.
- [ ] tsc, lint. Commit.

### Task 6: The scene

**Files:** Create `Scene.tsx`, `Floor.tsx`, `PaintingMesh.tsx`, `ScreenMesh.tsx`, `Captions.tsx`.

- [ ] Canvas: `flat`, DPR per tier, `frameloop` always while active else never; background + `FogExp2(#0d0d0d, 0.075)`; ambient + warm key light that rides with the camera from the upper left.
- [ ] Floor shader: linen (art) / dot grid (code) split by the spine (split) or gate planes (chapters); fluid off-white spine line; full tier: thin vivid strokes flowing left and bits flowing right off the spine. Fog matched by hand. Passage gates: a wall split on a fluid line that opens as the camera nears.
- [ ] PaintingMesh: stretched canvas (box sides) + face plane; full tier subdivided and displaced by the depth map with a bump from the colour map; lite flat. ScreenMesh: rounded bezel, unlit screenshot, slim stand. Placeholder colour until the texture streams in (within 3 beats).
- [ ] Rig: path pose (entrance dolly of 3.2 m), look-around, detail pose (fills ~60% of the free area, off-centre away from the panel) with a 0.8 s eased flight; hover lift; click opens.
- [ ] Captions/titles: projected each frame; fade by beat distance; hidden during the flight.
- [ ] Context loss → fallback.
- [ ] tsc, lint. Commit.

### Task 7: Verification

- [ ] `npm run showcase:check`, `npx tsc --noEmit`, `npm run lint`, `npm run build` (dev server stopped).
- [ ] Playwright (dev server): screenshots at each stop in both layouts; the tear mid-entrance; fly-in and panel; Tab through the works; reduced motion fallback; phone width; frame rate while scrolling; `#work/<slug>` load; Back closes the panel; context loss.
- [ ] Close the browser, delete temp files. Commit fixes.
