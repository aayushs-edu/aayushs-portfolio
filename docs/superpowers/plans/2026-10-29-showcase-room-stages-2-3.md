# Showcase room, stages 2–3: the paintings salon and the animation station — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the room's two art stations:
- **Paintings:** all 17 paintings in one salon, with the held photos and the "Where it all started" photo.
- **Animation:** three floating films that play, the storyboard, and the three native 3D models.

**Architecture:** the same pattern as Paintwise.
- **Pure layouts** (`stations/salon.ts`, `stations/animation.ts`) give every panel a pose per beat and an idle pose. `npm run showcase:check` checks them.
- **R3F stations** pose the panels every frame.
- **The asset script** gains `paintings` and `animation` steps that write hashed media and generated JSON.
- **`buildRoom`** lays out every station itself, and gains `workBeat` (work → the beat that presents it), because one beat can now present several works.

**Tech Stack:** as stage 1, plus ffmpeg (film loops), Blender 5.1 (Draco + WebP model compression), three's `GLTFLoader` and `DRACOLoader`, and `VideoTexture`.

**Spec:** `docs/superpowers/specs/2026-10-29-showcase-room-design.md` §3.2, §3.3, §4, §6, §7.

## Global Constraints

- **Ring radius 14 m** (was 12), with a floor radius of 18. The salon with its edges is about 10 m wide; neighbours need radius A + radius B + 0.5 m between them.
- **Loops:** `public/showcase/**` is exempt from Git LFS in `.gitattributes`, so they ship with the site. The full films stay on the `videos-v1.0` release.
- **Model sources:** the raw GLBs move to `scripts/showcase/sources/models/` (git-ignored, 17 MB). Only the compressed GLBs are committed. Without the sources, the asset step keeps the existing outputs.
- **Text:** all DOM. Film stories are short, factual drafts from what the films show; the user should rewrite them.

## Review Focus

1. **Opening a film from a beat where it isn't in front.** The fly-in lands on its presented pose, and the player sits exactly over it. *Pinned by:* the checks require each film's detail placement to equal its pose at its own beat.
2. **Models before they load, or failing to load.** Nothing throws, and the panel still shows its plinth.
3. **Autoplay with sound blocked** (a deep link with no click first). The player shows its controls, and you press play.
4. **Phones (390×844).** Cameras stay finite and clear of the centre and of every work. *Pinned by:* the ring checks.
5. **Reduced motion.** The grid lists all 17 paintings, the films (as posters that play in the detail panel) and the models (as thumbnails).

## Decisions (rulings against the spec, made here)

- **The salon has six beats, not five:** the whole wall, the left edge (Where it all started and the earliest works), the left column, the centre column, the right column, then the right edge. That makes one continuous pan from left to right; the spec's single "early-work edges" beat would have had to show both ends of a 10 m wall at once.
- **Paintings don't fly in from the spine.** Idle is a compact salon, readable from across the room, and arriving spreads it out (the early works a beat later than the portfolio). The spec's fly-in conflicts with its own idle rule, that stations stay readable from everywhere.
- **No zoom on an open model.** A scroll gesture closes an open work everywhere else. Dragging orbits the model, and the arrow keys turn it.

## Tasks

### Task 1: Media

- [ ] `.gitattributes`: add `public/showcase/** !filter !diff !merge -text` below the LFS rules. Check it with `git check-attr`.
- [ ] Copy `three/examples/jsm/libs/draco/gltf/{draco_decoder.js,draco_decoder.wasm,draco_wasm_wrapper.js}` to `public/draco/`.
- [ ] `build-assets.py` takes steps (`paintwise`, `paintings`, `animation`; all by default).
  - **paintings:** for the 10 early works in the manifest, write the colour image (long side ≤ 1600) and its depth (Depth Anything, long side 1024), plus the aspect and average colour. Also the three held photos (long side ≤ 1400), and the origin photo's aspect and average colour. Write `stations/paintings/paintings.generated.json`.
  - **animation:**
    - films: cached downloads, a 6 s loop each (1280 px, H.264, CRF 27, no audio, faststart) and a WebP poster;
    - the Sketchfab thumbnails (1280 px);
    - the models, compressed by `scripts/showcase/compress-glb.py` (Blender: textures ≤ 2048 px, WebP, Draco);
    - the storyboard stills `/images/view0–7.webp`, by aspect.

    Write `stations/animation/animation.generated.json`.
- [ ] Checks (written first): both JSONs exist; 10 early works, each with image and depth on disk, depth 0–1 aspect sanity; 3 held photos; 3 films, each with loop and poster on disk; 8 stills; 3 models, each with GLB and thumbnail on disk. Every model GLB must be under 4 MB, and every loop under 3 MB.

### Task 2: Layouts, the room, `workBeat`

- [ ] **Types:** `PosedPanel`; `StationBeat.slugs?`; `RoomLayout.workBeat`.
- [ ] **`works.ts`:**
  - paintings: the 10 early works and "Where it all started" (with its story from `/paintings`); `wall: "portfolio" | "early"`; `media.held`;
  - films (kind `animation`) with `media.loop`, `media.film`, `media.poster`;
  - models (new kind `model`) with `media.model` and a Sketchfab link.
- [ ] **`stations/salon.ts`:**
  - Core: three columns at 0.85 m tall, Childhood Toys at 1.05.
  - Edges: two clusters of two sub-columns at 0.58 m, set forward and turned 22°. The left edge holds Where it all started and five early works, the right edge the other five.
  - Six beats. Presented works step 0.4 m forward along their normal, and the rest ease back 0.08 m.
  - Idle is compact.
  - `works` = the presented poses.
- [ ] **`stations/animation.ts`:** films, stills and models with their poses over four beats (one per film, then the models), plus idle.
- [ ] **`ring.ts`:** radius 14 and floor 18. `buildRoom(works, viewport)` lays out every station, and builds `workBeat` and `stationOf`.
- [ ] **Checks** (written first):
  - the ring checks on the new room: every work is in `workBeat`;
  - in the salon, every work in a group beat is in view (landscape);
  - no two works' rectangles in a station overlap;
  - poses are finite;
  - films' and models' detail placements equal their presenting pose;
  - stations keep apart.

### Task 3: Scene, stations, DOM

- [ ] **`SalonStation.tsx`:**
  - posed `PaintingMesh`es, with drift on the full tier;
  - the held photo on the back;
  - a turn-over on hover, and on a loop while the painting is presented (2.5 s front, 3.5 s back);
  - an open painting glides to its presented pose.
- [ ] **`AnimationStation.tsx`:**
  - **`VideoPanel`:** a muted loop as a `VideoTexture`, playing only while the station is present (on the lite tier, only the presented film); the poster until it plays.
  - **`ModelPanel`:** loads with `GLTFLoader` and `DRACOLoader` (`/draco/`), is fitted to a 1.2 m box on a plinth, and turns. While open, dragging orbits it and the arrow keys turn it.
  - **Stills:** `ImagePanel`.
  - Writes the open film's on-screen rectangle to a ref.
- [ ] **`FilmPlayer.tsx`:** a DOM `<video controls autoplay>` with the full film, kept over the film panel's rectangle while the film is open (3D only).
- [ ] **`DetailPanel`:** shows the held photo. On the static page only, it plays the full film (the player covers 3D).
- [ ] **`Captions`:** a small size for small works (`data-size="small"`).
- [ ] **`Scene` / `Showcase`:** use `buildRoom(WORKS, viewport)`, `workBeat` for `beatOf`, render the new stations, and add the film player.
- [ ] `tsc`, lint, checks; screenshots of the salon beats, the animation beats, a film playing and an open model; then the reduced-motion grid.

### Task 4: Docs

- [ ] Update the spec's §3.2 and §3.3 with the rulings above, `CLAUDE.md`'s showcase section, and the project memory.
