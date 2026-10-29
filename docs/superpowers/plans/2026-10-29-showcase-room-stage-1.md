# Showcase room, stage 1: the ring room and Paintwise — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the corridor with one round room: Paintwise at the centre as a five-beat exploded painting, the existing works in their stations round it, an overview beat, a group bar with jumps across the room, and `#group/<id>` links.

**Architecture:**
- **Pure modules** decide all geometry, and `npm run showcase:check` checks them:
  - `room/ring.ts`: the ring, the camera path, beats, `locate`, `arcLerp`;
  - `stations/gallery.ts`: the salon core, and the arcs of screens;
  - `stations/paintwise/layout.ts`: panels, poses per beat, labels, cameras;
  - `panels/pose.ts`: pose interpolation and presence.
- **R3F components** read those layouts every frame.
- **DOM labels** are rendered by the showcase and positioned by the scene, the way captions already are.
- **Paintwise's media** is made by a Python asset script from images already in the repo, and described in a generated JSON.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, three 0.172, @react-three/fiber 9; Python 3.12 with Pillow, numpy, torch and transformers (Depth Anything V2 Small, as `scripts/hero/depth.py`).

**Spec:** `docs/superpowers/specs/2026-10-29-showcase-room-design.md` (§1, §2, §3.1, §4 Paintwise media, §5–§9; stage 1 of §8).

## Global Constraints

- **Tour order:** overview → Paintwise → Paintings → Animation → Hackathons → Games. Animation has no works in stage 1, so it is left out of the tour and the bar, but its slot on the ring is kept.
- **Sides:** art stations at x < 0 and code stations at x > 0. Paintwise is at the room's centre, on the spine.
- **Colour:** from the work and the six pigments only. No glows, particles or gradients.
- **Text:** all of it is DOM. Labels in the overlay are `aria-hidden`; the semantic list carries everything.
- **Kept from stage 1:** the tear, scroll with dwell, the look-around, the detail fly-in and panel, `#work/<slug>`, the tiers, and the static fallback.
- **Never edit by hand:** `paintwise.generated.json` (made by `npm run showcase:assets`).
- **Builds:** don't run `next build` while the user's dev server is up, because they share `.next`.

## Review Focus

1. **A `#work/<slug>` or `#group/<id>` link on a fresh load.** The camera starts at that beat with no flight across the room. For a work, its panel opens.
2. **A click on a work in another station.** It jumps there and doesn't open, and the camera arcs round the centre rather than through Paintwise. Pinned by the `arcLerp` clearance check in Task 2.
3. **A phone-sized viewport.** Every camera pose stays finite, and none passes through Paintwise or another station. Pinned by the ring checks at 390×844 in Task 2.
4. **A work opened from a Paintwise beat other than "arrive".** The panels glide back to the arrive pose, so the fly-in lands on the canvas. Pinned by the Paintwise pose check, which requires `detailPlacement` to equal the canvas at beat 0, in Task 3.
5. **Missing or unloaded textures.** Every panel shows its flat colour until its image arrives; nothing throws.

---

## File map

| File | Status | Responsibility |
|---|---|---|
| `scripts/showcase/grid.py` | create | Cut image panels out of matplotlib grids (moved from `paintwise-figure.py`). |
| `scripts/showcase/paintwise-figure.py` | modify | Import `panels` from `grid.py`. |
| `scripts/hero/depth.py` | modify | Expose `load_estimator()` and `estimate(estimator, image, long_side)`. `main()` uses them, and its behaviour is unchanged. |
| `scripts/showcase/sources/paintwise/jug-*.png` | create | The lossless jug stages, restored from `9ab1298^`. |
| `scripts/showcase/build-assets.py` | create | Paintwise media into `public/showcase/paintwise/`, plus the generated JSON. |
| `src/components/showcase/stations/paintwise/paintwise.generated.json` | generated | Layer, object, step, still-life and figure media. |
| `package.json` | modify | `"showcase:assets": "python3 scripts/showcase/build-assets.py"` |
| `src/components/showcase/room/types.ts` | create | `GroupId`, `PanelPose`, `StationBeat`, `StationLayout`, `StationPlacement`, `RoomStation`, `RoomLayout`, `LabelSpec`. |
| `src/components/showcase/room/ring.ts` | create | `ROOM`, `stationPlacement`, `toWorld`, `buildRoom`, `locate`, `arcLerp`. |
| `src/components/showcase/stations/gallery.ts` | create | `salonStation` (paintings) and `arcStation` (hackathons, games). |
| `src/components/showcase/panels/pose.ts` | create | `poseAt`, `presenceAt`, `easeBetween`. |
| `src/components/showcase/stations/paintwise/layout.ts` | create | `paintwiseStation(viewport)`: panels, poses, labels, beats, `detailPlacement`. |
| `src/components/showcase/layouts/split.ts`, `layouts/index.ts` | delete | Replaced by the room. |
| `src/components/showcase/works.ts` | modify | `group` on every work; `GROUP_TITLES`; `media.figure` for Paintwise. |
| `src/components/showcase/showcaseConfig.ts` | modify | Fog 0.028, jump timing, station light, `loadAllAfter`. |
| `src/components/showcase/Floor.tsx` | modify | A disc round the room's centre that fades into the dark. |
| `src/components/showcase/Scene.tsx` | modify | The room, stations, lights and streaming; the Rig follows the room's path and arcs on jumps. |
| `src/components/showcase/stations/GalleryStation.tsx` | create | Renders a gallery station's works (`PaintingMesh` / `ScreenMesh`). |
| `src/components/showcase/panels/ImagePanel.tsx` | create | A posed, textured, fading plane (optional atlas frame, alpha, canvas back). |
| `src/components/showcase/panels/labels.ts` | create | `placeLabel(el, world, camera, size, opacity)`. |
| `src/components/showcase/stations/paintwise/PaintwiseStation.tsx` | create | The Paintwise station in R3F: poses, drift, spin, flipbook, picking, labels. |
| `src/components/showcase/StationLabels.tsx` | create | DOM for Paintwise's labels (title with logo, tags, step, chips, figure caption, build-log link). |
| `src/components/showcase/GroupBar.tsx` + `GroupBar.module.css` | create | The station buttons. |
| `src/components/showcase/HandOff.tsx` + `HandOff.module.css` | create | The full-size figure, grown from the panel's on-screen rectangle. |
| `src/components/showcase/Showcase.tsx` | modify | Room, beats, current station, jumps, `#group`, click-to-jump, hand-off, bar, static groups. |
| `src/components/showcase/WorkList.tsx` + `.module.css` | modify | Show `media.figure` (full row) in the static grid. |
| `scripts/showcase/checks.ts` | modify | Drop the split checks; add ring, gallery, pose, Paintwise and asset checks. |
| `CLAUDE.md` | modify | Describe the room, stations and `showcase:assets`. |

---

### Task 1: Paintwise media

**Files:**
- Create: `grid.py`, `build-assets.py` and the sources folder.
- Modify: `depth.py`, `paintwise-figure.py`, `package.json`.

**Interfaces:**

Produces `paintwise.generated.json`:

```ts
{
  canvas: { width: number; height: number };              // source px of the jug layers (all the same size)
  layers: { id: "original"|"masks"|"depth"|"blockin"|"edges"|"sketch"; src: string }[];
  objects: { id: string; src: string; box: [x, y, w, h];  // fractions of the canvas
             depth: number; color: string }[];            // depth 0 far … 1 near; sorted far → near
  steps: { atlas: string; cols: number; rows: number; count: number; aspect: number;
           labels: string[]; phase: (1|2)[] };
  stillLifes: { src: string; aspect: number }[];          // 8
  figure: { src: string; aspect: number };
}
```

- [ ] **Step 1.** Restore the sources from history:

  ```bash
  for i in 1 2 3 4 5; do git show 9ab1298^:public/images/masterstroke-$i.png > /tmp/m$i.png; done
  # 1 original, 2 masks, 3 block-in, 4 PiDiNet edges, 5 pencil sketch
  mkdir -p scripts/showcase/sources/paintwise
  for pair in 1:original 2:masks 3:blockin 4:edges 5:sketch; do cp /tmp/m${pair%%:*}.png scripts/showcase/sources/paintwise/jug-${pair##*:}.png; done
  ```

- [ ] **Step 2.** Move `_spans` and `panels` from `paintwise-figure.py` into `scripts/showcase/grid.py`, and import them in the figure script with `sys.path.insert(0, str(Path(__file__).parent))`. Run the figure script and check that `public/showcase/paintwise/pipeline.svg` comes out byte-identical (`git diff --stat` shows no change to the published SVG).
- [ ] **Step 3.** In `depth.py`, extract `load_estimator()`, which returns the pipeline or calls `fail`, and `estimate(estimator, image, long_side=LONG_SIDE) -> PIL.Image` (the percentile normalisation plus the median filter). `main()` calls both. Run `python3 scripts/hero/depth.py`; it should print "unchanged, skipped" for every item.
- [ ] **Step 4.** Write `build-assets.py`:
  - **Layers:** resize every jug source to the original's size. Write the layers as WebP to `public/showcase/paintwise/layers/<id>.webp`, quality 90:
    - original, edges and sketch: ×2 with Lanczos;
    - masks and block-in: ×3 "flat" (a Lanczos upscale, then every pixel snapped to the source's ≤48-colour palette);
    - depth: from `estimate()` on the original, ×2.
  - **Objects:**
    - Snap the masks image (NEAREST to canvas size) to the matplotlib tab20 palette plus black.
    - Label 4-connected components with a numpy flood fill (scipy is not installed). Black counts as no object.
    - Keep components of 80 px or more, up to 28, largest first.
    - Each object gets: its bbox as fractions; its depth as the mean depth map over the component; and an RGBA crop ×3, coloured by its palette colour, with alpha from the Lanczos-upscaled mask passed through `clip((a − 96) · 2)`. Write it to `objects/o<NN>.webp`.
    - Sort the objects far → near.
  - **Steps:** take `panels(paintwise-gallery-4.png)[1:]` (23 frames). Resize them to a common size (the first frame's), upscale ×3 flat, and pack a 6×4 atlas `steps.webp`. Labels, in order: `"1 · background","2","3.1","3.2 · banana","3.3 · orange","3.4 · leaves","3.5 · plant","3.6 · fruit","3.7 · apple","3.8 · leaves","3.9 · leaves","3.10 · fruit","3.11 · fruit","3.12 · banana","3.13 · apple","3.14 · banana","3.15 · plant","3.16 · apple","3.17 · apple","3.18 · apple","4.1 · orange","4.2 · fruit","4.3 · fruit"`. Phase: 1 for the first 20, 2 for the last 3.
  - **Still lifes:** g2[0], g2[1], g2[3], g3[0], g3[1], g3[4], g5[0] and g6[1], from `panels()` of gallery-2/-3/-5/-6. Each ×2 Lanczos to `stills/s<N>.webp`.
  - **Figure:** reference the existing `pipeline.webp`, with its aspect read from the file.
  - **JSON:** write it with `indent=2`. Print a one-line summary.
- [ ] **Step 5.** Add `"showcase:assets"` to `package.json`. Run `npm run showcase:assets`, then view the layers, a few objects and the atlas as a contact sheet to make sure nothing is plainly broken.
- [ ] **Step 6.** Commit the sources, scripts, `public/showcase/paintwise/`, the generated JSON and `package.json`.

### Task 2: The ring, the gallery stations, and their checks

**Files:**
- Create: `room/types.ts`, `room/ring.ts`, `stations/gallery.ts`.
- Modify: `works.ts` (`group`), `checks.ts`.
- Delete: `layouts/split.ts`, `layouts/index.ts`.

**Interfaces:**

```ts
// room/types.ts
export type GroupId = "paintwise" | "paintings" | "animation" | "hackathons" | "games";
export interface PanelPose { position: Vec3; rotation: Vec3; scale: number; opacity: number }
export interface StationBeat { key: string; camera: PathPoint }          // camera station-local
export interface StationLayout { id: GroupId; title: string; beats: StationBeat[]; works: Placement[]; radius: number }
export interface StationPlacement { position: Vec3; yaw: number }
export interface RoomStation { id: GroupId; title: string; at: StationPlacement; layout: StationLayout; first: number; count: number }
export interface RoomLayout { stations: RoomStation[]; cameraPath: PathPoint[]; beats: Beat[]; placements: Placement[]; floor: { centre: Vec3; radius: number } }
export interface LabelSpec { id: string; panel?: string; point?: Vec3; anchor: [number, number]; align: "below" | "above" | "left" | "right";
  beats: [number, number]; kind: "title" | "tag" | "step" | "chips" | "figure" | "link"; title?: string; meta?: string; href?: string }

// room/ring.ts
export const ROOM: { centre: Vec3; radius: number; floorRadius: number; transit: number;
  angles: Record<Exclude<GroupId, "paintwise">, number>; tour: GroupId[]; overview: PathPoint };
export function stationPlacement(id: GroupId): StationPlacement;
export function toWorld(p: Vec3, at: StationPlacement): Vec3;
export function buildRoom(works: readonly Work[], viewport: Viewport, paintwise: StationLayout): RoomLayout;
export function locate(room: RoomLayout, beat: number): { station: RoomStation | null; local: number };
export function arcLerp(from: Vec3, to: Vec3, centre: Vec3, k: number, out?: Vec3): Vec3;

// stations/gallery.ts
export function salonStation(works: readonly Work[], viewport: Viewport): StationLayout;    // "paintings"
export function arcStation(id: GroupId, title: string, works: readonly Work[], viewport: Viewport): StationLayout;
```

**Geometry:**
- **Room:** centre `[0, 0, −13]`, radius 12, floor radius 16, transit 5.5.
- **Angles:** degrees clockwise from north (−z), as `dir = (sin θ, 0, −cos θ)`:
  - paintings −90;
  - animation −45;
  - hackathons 45;
  - games 90.
- **Placement:** a station stands at `centre + dir·radius`, with `yaw = atan2(−dir.x, −dir.z)`, so local +z faces the centre. Paintwise has `yaw = 0` (it faces the entrance).
- **`toWorld`:** `x' = x·cos + z·sin`, `z' = −x·sin + z·cos`, then translate.
- **Path:** entry → overview → per station: transit (except before Paintwise), then its beats → tail.
  - The **overview** is position `[0, 6.8, 7]`, target `[0, 0.6, −11]`.
  - The **entry** is the overview moved 3 m back along its view.
  - Each **transit** sits at `ROOM.transit` from the centre, at the angular midpoint (clockwise) between the previous camera and the next one, at eye height, looking at the next station.
  - The **tail** is `centre + dir(135°)·8.5` at y 3.5, looking at the centre.
- **Beats:** one per overview and per station beat, at control points (`t = index / (count − 1)`), `units` = `SHOWCASE.units.work`. Keys: `room:overview`, then each station's.
- **Salon:** columns of slugs:
  - left `snorkeling-hawaii, snowboarding`;
  - centre `soccer-penalty, childhood-toys, taj-mahal`;
  - right `safari-kid, red-dead-redemption`.

  Unknown slugs go to the shorter side. Paintings are 0.95 m tall, except Childhood Toys at 1.2. The columns are 0.35 m apart, and the side columns sit at z 0.35, turned 10° toward the middle. Every column is centred at y 1.9.

  One beat per painting: left top→bottom, then centre, then right. The camera stands at x·0.85, y clamped to 1.2–2.4, z + `presentDistance`.
- **Arc of screens:** `sizeOf` boxes 0.35 m apart, on a concave arc of radius 7 (each screen turned to face local `[0, y, 7]`). One beat per screen, `presentDistance` along its normal at eye height.

- [ ] **Step 1.** Add `group` to `Work` and the toWork mapping: art → paintings; paintwise → paintwise; exovision, lumina, medai, stockapp → hackathons; the four games → games. Add `GROUP_TITLES`: Paintwise, Paintings, Animation, Hackathons, Games.
- [ ] **Step 2.** Write the failing checks in `checks.ts`, replacing the split-layout block. Per viewport (1440×900, 1024×768, 390×844):
  - every work has exactly one world placement and one beat `work:<slug>`;
  - beats are in strictly increasing t, inside (0, 1), and each sits on a control point;
  - at a work's beat the camera looks at that work's placement;
  - stations sit on their halves (art x < 0, code x > 0) and face the centre;
  - neighbouring stations' footprints don't overlap (distance ≥ rA + rB + 0.5), including the empty animation slot at r 4;
  - along the whole path (2000 samples) the camera is finite, keeps ≥ 2.2 m horizontally from the centre, and stays ≥ 0.6 m from every work rectangle;
  - presented gallery works fill 0.35–0.7 of the view (landscape viewports);
  - `locate` returns null on the overview and `{station, local}` with integer local at each station beat;
  - `arcLerp` between any two stations' first cameras keeps ≥ 2.2 m from the centre at 50 samples, and returns `from` at k = 0 and `to` at k = 1.

  Run `npm run showcase:check`. **Expected:** the compile fails, because `room/ring` doesn't exist yet.
- [ ] **Step 3.** Implement `room/types.ts`, `room/ring.ts` and `stations/gallery.ts`, and delete `layouts/split.ts` and `layouts/index.ts`. For now, give `buildRoom` a stub Paintwise layout in the checks (`radius 3`, beats `[work:paintwise]` with a camera at `[0, 1.6, 4.8]`) until Task 3.
- [ ] **Step 4.** Run `npm run showcase:check`. **Expected:** every check passes.
- [ ] **Step 5.** Commit.

### Task 3: Poses and the Paintwise layout

**Files:**
- Create: `panels/pose.ts`, `stations/paintwise/layout.ts`.
- Modify: `checks.ts`.

**Interfaces:**

```ts
// panels/pose.ts
export const easeBetween: (u: number) => number;                 // smoothstep(0.25, 0.75, frac) between beats
export function presenceAt(u: number, count: number): number;    // smoothstep(-1,-0.35,u)·(1 - smoothstep(count-0.65, count, u))
export function poseAt(poses: PanelPose[], idle: PanelPose, u: number, presence: number, out: PanelPose): PanelPose;

// stations/paintwise/layout.ts
export interface PaintwisePanel { id: string; src: string | null; width: number; height: number; poses: PanelPose[]; idle: PanelPose;
  kind: "canvas" | "layer" | "object" | "flipbook" | "figure" | "still"; color: string }
export interface PaintwiseLayout extends StationLayout { panels: PaintwisePanel[]; labels: LabelSpec[];
  detailPlacement: Placement; flipbook: PaintwiseMedia["steps"] }
export function paintwiseStation(viewport: Viewport): PaintwiseLayout;
```

**Poses (local; +z toward the entrance):**
- The canvas is 1.9 m wide, `CH = 1.9 · h/w`, centred at y `Y0 = 1.75`.
- **Beat 0, arrive:**
  - the canvas at the origin;
  - layers 1–5 behind it, at z −0.01k, opacity 0;
  - objects at their spot in the canvas, opacity 0;
  - the figure at `(2.25, Y0 − 0.1, −0.5)`, yaw −0.45, 1.5 m wide;
  - the flipbook at `(−2.5, Y0, −1.2)`, scale 0.6, opacity 0;
  - the still lifes hidden behind.
- **Beat 1, explode:** layer k (0 = canvas) at `(0.32k, Y0 + 0.06k, −0.75k)`, all opaque; the figure hidden.
- **Beat 2, masks:**
  - layers move back 1.2 m and 0.6 m left, at opacity 0.25, with the masks layer at 0;
  - each object at `x·1.15`, its canvas y, `z = (depth − 0.5)·2.4 + 0.3`, opaque.
- **Beat 3, in action:**
  - the flipbook at `(0, Y0, 0.4)`, 2.3 m wide;
  - the stack collapsed at `(−2.9, Y0 − 0.1, −1.0)`, yaw 0.55, scale 0.55, with only the canvas visible;
  - the objects flown back to it, at opacity 0.
- **Beat 4, the whole pipeline:**
  - the figure at `(0, Y0, 0.7)`, 3.1 m wide;
  - the flipbook at `(−3.0, Y0, −0.8)`, yaw 0.5, scale 0.55;
  - the stack at `(2.9, Y0, −1.0)`, yaw −0.5, scale 0.55;
  - the still lifes on an ellipse (rx 2.9, ry 1.35, z −1.2) at 30°, 70°, 110°, 150°, 210°, 250°, 290° and 330°, each 0.8 m on its long side.
- **Idle:** layer k at `(0.18k − 0.45, Y0, 1.0 − 0.4k)`; everything else hidden.

**Cameras:** each is the subject's centre + `normalize(dir)` · min(8, `presentDistance(subject)`).

| Beat | Subject centre | Subject size | Direction |
|---|---|---|---|
| 0 | `(0.55, Y0, −0.1)` | 3.8 × CH+0.2 | `(0.1, 0, 1)` |
| 1 | `(0.8, Y0 + 0.15, −1.9)` | 3.4 × 2.2 | `(0.75, 0.12, 0.65)` |
| 2 | `(0, Y0, 0)` | 2.6 × 2.1 | `(−0.68, 0.1, 0.73)` |
| 3 | `(−0.35, Y0, 0.4)` | 3.2 × 1.7 | `(0, 0, 1)` |
| 4 | `(0, Y0, 0.7)` | 3.4 × 1.8 | `(0, 0, 1)` |

**Beat keys:** `work:paintwise`, `paintwise:explode`, `paintwise:masks`, `paintwise:steps`, `paintwise:pipeline`.

**`detailPlacement`:** the canvas at beat 0.

**Labels:**

| Id | Kind | Pinned to | Beat | Content |
|---|---|---|---|---|
| `pw:title` | title | canvas top-left, above | 0 | logo, "Paintwise", pitch |
| `pw:tag:<layer>` × 6 | tag | right edge of each layer | 1 | model and one line |
| `pw:tag:objects` | tag | point `(0, Y0 + CH/2 + 0.35, 0.6)` | 2 | — |
| `pw:step` | step | flipbook, below | 3 | dynamic |
| `pw:chips` | chips | flipbook, left | 3 | — |
| `pw:figure` | figure | figure, below | 4 | — |
| `pw:buildlog` | link | figure, below right | 4 | `/paintwise` |

**Layer copy:**

| Layer | Title | Line |
|---|---|---|
| original | Reference | the still life to learn from |
| masks | SAM 2.1 | segments every object |
| depth | Depth Anything V2 | how far away each part is |
| blockin | Value block-in | one flat value per region |
| edges | PiDiNet | where the edges are |
| sketch | Pencil sketch | the drawing underneath, from the edges |

- [ ] **Step 1.** Write the failing checks. Per viewport:
  - every panel pose and idle pose is finite, with opacity in [0, 1] and scale > 0;
  - `poseAt` at an integer u equals that beat's pose, and at presence 0 equals idle;
  - `presenceAt` is 0 at u ≤ −1, 1 on [−0.35, count − 0.65], and 0 at u ≥ count;
  - on landscape viewports, every camera is ≥ 2.5 m from every visible panel centre at its beat;
  - `detailPlacement` equals the canvas at beat 0;
  - the generated JSON has 6 layers, 8–28 objects, 23 step labels, 8 still lifes, and every `src` file exists under `public/`.

  Then run `buildRoom` with the real Paintwise layout and rerun Task 2's ring checks.
- [ ] **Step 2.** Implement `pose.ts` and `layout.ts`. Run the checks. **Expected:** all pass.
- [ ] **Step 3.** Commit.

### Task 4: The scene (room, gallery stations, Rig)

**Files:**
- Modify: `Scene.tsx`, `Floor.tsx`, `showcaseConfig.ts`.
- Create: `GalleryStation.tsx`.

- [ ] **Step 1.** Config: `fog: 0.028`, `jump: { seconds: 1.1 }`, `stationLight: { intensity: 10, height: 3, ahead: 3.5 }`, `loadAllAfter: 1.5` (seconds after the hero is gone).
- [ ] **Step 2.** Floor: the plan becomes `{ centre, radius }`. The plane is a square of side 2·radius round the centre, and the fragment shader mixes toward the fog colour by `smoothstep(radius − 3.5, radius, length(p − centre.xz))`. The spine and the effects are unchanged.
- [ ] **Step 3.** `GalleryStation`: render each placement's work with `PaintingMesh` or `ScreenMesh`, exactly as `SceneContents` does now. Its props are `{ placements, works, wanted(slug), relief }`.
- [ ] **Step 4.** Scene:
  - the props `layout` → `room: RoomLayout` and `paintwise: PaintwiseLayout`, plus `jump: RefObject<number>`;
  - the Rig's path comes from `room.cameraPath` and its placements from `room.placements` (captions unchanged; Paintwise has no caption element);
  - a point light per station at `toWorld([0, height, ahead])`, on the full tier only;
  - **jump:** when `jump.current` changes, keep last frame's camera pose as `from` and set `blend = 1`. While `blend > 0`, with `e = easeInOutCubic(1 − blend)`: `pos = arcLerp(from.pos, pathPos, centre, e)` and `tgt = lerp(from.tgt, pathTgt, e)`. `blend -= dt / SHOWCASE.jump.seconds`.
- [ ] **Step 5.** Streaming: `wanted = |beat − near| ≤ streamBeats || loadAll`. `loadAll` turns true `loadAllAfter` seconds after the hero is gone (a prop from Showcase).
- [ ] **Step 6.** `npx tsc --noEmit`; this compiles once Task 6 wires Showcase, so Tasks 4–6 land together and commit after Task 6.

### Task 5: The Paintwise station

**Files:**
- Create: `ImagePanel.tsx`, `labels.ts`, `PaintwiseStation.tsx`, `StationLabels.tsx`.
- Modify: `Showcase.module.css` (label styles).

- [ ] **Step 1. `ImagePanel`** (`forwardRef<THREE.Group>`).
  - **Props:** `{ src, width, height, color, wanted, transparent, doubleSided, atlas?: { cols, rows } , canvasBack?: boolean, onClick?, onPointerOver/Out? }`.
  - A plane with `MeshStandardMaterial` (roughness 0.85), using `useWorkTexture` for the map.
  - `setOpacity(o)` is exposed on `group.userData` and writes `material.opacity`. Set `visible = o > 0.002`.
  - An atlas sets `map.repeat` to `(1/cols, 1/rows)`; `userData.setFrame(k)` sets the offset.
- [ ] **Step 2. `placeLabel(el, world, camera, w, h, opacity, align)`**: project the point; if it's behind the camera, opacity 0. Write the transform `translate3d(x, y, 0)` plus an alignment translate, and the same opacity, visibility and pointer-events handling as `Rig.set`.
- [ ] **Step 3. `PaintwiseStation`.**
  - **Structure:** a root group at the station's placement, holding a spin group with one `ImagePanel` per panel.
  - **Every frame:** `u = s.beat − first`. If `openSlug === "paintwise"`, lerp u toward 0 by the fly blend. Then:
    - `presence = presenceAt(u, count)`;
    - `poseAt` per panel → group position, rotation, scale, opacity;
    - drift on the full tier: `y += 0.025·sin(0.6t + i)`, `rotation.z += 0.01·sin(0.4t + i)`;
    - **spin:** `angle += dt·0.12·(1 − presence)`; when presence > 0, ease the angle to the nearest multiple of 2π;
    - **flipbook:** while presence > 0.5 and u is in [2.5, 3.5], advance one frame every 0.4 s, holding the last frame for 1.6 s and then looping; otherwise show the last frame;
    - **labels:** query `[data-label]` under the overlay once. Opacity = fade over |u − beat range| (fully in within 0.3, gone by 0.5) × presence × (1 − fly). Set the step label's `[data-text]` to `labels[frame] · Phase N`.
  - **Picking:** the figure calls `interaction.figure(rect)`, where rect is the panel's four projected corners. Every other panel calls `interaction.open("paintwise")`. Hover shows a pointer cursor.
- [ ] **Step 4. `StationLabels`.** Render each `LabelSpec` as an absolutely placed element with `data-label`:
  - **title:** the logo `<img src="/images/paintwise-logo.png">` (44 px), the title in Poppins 800, and the pitch: "Teaches you to paint a picture the way an artist would, one step at a time.";
  - **tag:** the title in Geist Mono 12 px, uppercase, at 0.85 opacity, and the meta at 13 px, 0.6;
  - **step:** `<span data-text>`;
  - **chips:** an ordered list of 6 chips;
  - **figure:** a button "Figure 1 · the Paintwise pipeline", with the meta "Click to enlarge";
  - **link:** an `<a href="/paintwise">` reading "Read the build log →".

  The overlay keeps `aria-hidden`, and its elements have `tabIndex = −1`.

### Task 6: Showcase wiring: group bar, jumps, `#group`, hand-off, static groups

**Files:**
- Create: `GroupBar.tsx`, `GroupBar.module.css`, `HandOff.tsx`, `HandOff.module.css`.
- Modify: `Showcase.tsx`, `WorkList.tsx`, `WorkList.module.css`, `works.ts`, `Captions.tsx`.

- [ ] **Step 1. Room and scroll.**
  - `paintwise = useMemo(() => paintwiseStation(viewport))` and `room = useMemo(() => buildRoom(WORKS, viewport, paintwise))`.
  - `map` is built from `room.beats`.
  - `groups` = `room.stations` → `{ title, works }` (keyed by the works' group, in path order).
  - The static `KIND_GROUPS` becomes groups by `GROUP_TITLES` in tour order.
- [ ] **Step 2. Current station.** In `apply()`, compute `locate(room, s.beat).station?.id ?? null`. Store it in a ref and in state (set only when it changes).
- [ ] **Step 3. Jumps.**
  - `jumpToBeat(index)`: `jumpRef.current(progressForBeat(map, index), true)` and `jumpCount.current++`.
  - `jumpToStation(id)` = `jumpToBeat(station.first)`.
  - `openWork(slug)`: in 3D, if the work's station isn't the current one, call `jumpToBeat(beatOf("work:" + slug))` and return. Otherwise open as now.
- [ ] **Step 4. `#group/<id>`.** In the existing linked-hash effect, a `#group/<id>` naming a present station calls `jumpRef.current(progressForBeat(map, first), true)` with no `jumpCount` bump.
- [ ] **Step 5. `GroupBar`.**
  - A `nav` (`aria-label="Sections"`) with a button per room station. The current one gets `aria-current="true"`.
  - **Shown:** `heroGone && !openSlug && !handOff`, or on `:focus-within`.
  - **Style:** fixed at bottom centre, inside the sticky viewport. Geist Mono 12 px; a row on `rgb(13 13 13 / 0.72)` with a 1 px `rgb(255 255 255 / 0.1)` border and 999px radius. Buttons at `rgb(255 255 255 / 0.55)`; the current one white with a 1 px `#ece4d4` underline. Focus ring `#ece4d4`.
  - On phones, a horizontal scroll row.
- [ ] **Step 6. `HandOff`.**
  - **Props:** `{ item: { src, alt, aspect, from: DOMRect | null } | null, onClose }`.
  - **Layout:** a fixed overlay on `rgb(13 13 13 / 0.94)`. The image fits 94vw × 86vh, on a white "paper" background. A close button sits top right.
  - **Opening:** FLIP from `from` (measure the final rect in `useLayoutEffect`, set the inverse transform, then transition 0.45 s ease to none).
  - **Closing:** Esc, the button, or a backdrop click. Scroll is frozen while open (generalise the `openSlug` freeze effect to `openSlug || handOff`). Focus goes to the close button, and returns to the Paintwise list button on close.
- [ ] **Step 7. `WorkList`.** In grid mode, a work with `media.figure` shows the figure image in a full-row cell (`grid-column: 1 / -1`, `aspect-ratio` from the figure, `object-fit: contain`, on a white background).
- [ ] **Step 8.** Pass `room`, `paintwise`, `jump` and `loadAll` to `Scene`. Render `StationLabels` (Paintwise labels) inside the overlay, next to `Captions`. Captions skip Paintwise.
- [ ] **Step 9.** Run `npx tsc --noEmit && npm run lint && npm run showcase:check`. **Expected:** clean. Commit Tasks 4–6.

### Task 7: Verify and document

- [ ] **Step 1.** Run `npm run showcase:check`, `npx tsc --noEmit` and `npm run lint`. Skip `npm run build` while the user's dev server is up, and say so.
- [ ] **Step 2.** Take two screenshots in the dev server (the overview, and Paintwise's explode beat) to catch anything plainly broken. Close the browser and delete the files.
- [ ] **Step 3.** Update `CLAUDE.md`'s showcase section (the room, stations, `showcase:assets`, the generated JSON). Commit.
- [ ] **Step 4.** Hand over with a short list of what to try.
