# Showcase: one room, a station per group

Branch `hero-split`. This replaces the **organisation and layout** of `2026-10-28-showcase-3d-design.md` (the straight corridor of alternating works). From that spec it keeps:

- the entrance (the hero tears open along its line);
- scroll with dwell;
- the look-around;
- the detail panel and `#work/<slug>`;
- the semantic list;
- the tiers and the static fallback.

## Intent

The scene is the whole portfolio on one page. Stage 1 showed every piece the same way: a canvas or a screen in a corridor. Now the works are split into **groups**. Each group gets its own **station** in **one room**, and each station **presents its work differently**. The room is built from floating, moving panels and should be a very visual experience. From any station you can see the others and go to them. The audience is unchanged: admissions readers, recruiters and the creative community.

## Decisions (made with the user, 2026-10-29)

- **One round room, a ring of stations round Paintwise.**
  - Paintwise is both art and code, so it floats on the spine at the centre.
  - Art stations stand on the left half: Paintings and Animation.
  - Code stations stand on the right half: Hackathons and Games.
  - All stations face in, toward the centre.
- **Navigation: scroll tours, click jumps.**
  - Scroll carries you through the groups in a fixed order, and through each group's beats.
  - Clicking a group's name in the group bar, or a distant station, flies the camera straight there.
- **Paintwise: the exploded painting**, plus a pipeline figure in the style of a research paper (already made, see §3.1).
- **Paintings: one big salon** of all 17.
- **Animation:**
  - The films float, and you pick one to watch.
  - The three 3D models are viewable inside the scene, as native models.
- **Games:** each game is a video panel with a vertical strip of its screenshots beside it.
- **Hackathons:** a placeholder until its own brainstorm.
- **Media:** use the best of what exists now. There is no recording of Paintwise running and no critique examples, and none are coming.

## 1. The room

**Plan.** The camera enters at the south of the room (6 o'clock) and looks north (−z). Art is on the left (x < 0) and code on the right (x > 0), as in the hero.

| Where | What |
|---|---|
| centre, on the spine | **Paintwise** |
| left, about 9 o'clock | **Paintings** |
| upper left, about 10:30 | **Animation** |
| upper right, about 1:30 | **Hackathons** |
| right, about 3 o'clock | **Games** |

- The ring is about 9–10 m in radius; the layout module sets the exact geometry.
- The floor stays: linen on the art half, dots on the code half, with the spine running straight through the centre.
- The floor fades to dark past the ring. There are no walls.

**Seeing across the room.**
- Fog gets much lighter than now (`FogExp2` 0.075), so the far side of the ring (about 20 m away) reads clearly.
- Each station has a soft light of its own.
- The rule still holds: colour comes from the work and the six pigments only, with no glows, particles or gradients.

**Entrance and overview.**
- The tear stays as it is.
- The first beat after it is a held view of the whole room, with every station visible.
- The **group bar** fades in at the bottom of the viewport: *Paintwise · Paintings · Animation · Hackathons · Games*.

**Tour (scroll).**
- The order is overview → Paintwise → Paintings → Animation → Hackathons → Games.
- Each station has its own beats, and each beat gets one viewport of scrolling, with dwell.
- Between stations the camera path swings back through the middle of the room, so every change of group shows the room again.

**Jumps.**
- Clicking a name in the group bar, or a distant station (a raycast on its idle cluster), flies the camera straight across the room to that station's first beat, in about 1 s, eased.
- The scroll position is set to that beat underneath, so scrolling carries on from there.
- The camera never travels the long way round through other groups.
- During the flight, a blend overrides the scroll-driven camera, the same way the detail fly-in does.
- The bar marks the current station. It hides while a detail panel or a hand-off is open.

**Links.** `#group/<id>` opens on that station's first beat. `#work/<slug>` opens the work's detail panel as now, and the camera goes to the beat that presents the work.

## 2. Floating panels, the shared building blocks

- **Panel:** a thin floating plane holding an image, a video loop, a painting (a real canvas, in relief on the full tier, as now) or a 3D model.
  - Every panel drifts slightly on its own phase: a few centimetres of bob and sway.
- **Poses per beat:**
  - A station gives each of its panels a pose at each of its beats: position, rotation, scale and opacity.
  - Panels glide between poses, eased by the continuous position within the station.
  - "The stack explodes" and "the salon assembles" are only poses changing.
- **Idle pose:** when the camera is elsewhere, a station settles into a compact arrangement that still reads from across the room.
- **Floating labels:**
  - All text stays DOM, so it's crisp, selectable and accessible.
  - Labels are pinned to anchor points on panels and positioned every frame from the projected point. This generalises today's captions.
- **Opening a work** is the same everywhere, as now: the camera flies in until the work fills the free part of the viewport, and the detail panel slides in. Two kinds of work add one thing while open:
  - a **film** plays;
  - a **model** can be orbited.
- **Hand-off:** the full film player and the full-size figure are DOM over a panel.
  - The panel turns square to the camera, and the element appears exactly over its projected rectangle.
  - Page scroll is frozen while it's open. Esc, the close button or browser Back return.
- **Video loops:**
  - Short, muted and same-origin, so they can be used as textures.
  - Only the station you're at plays them. Elsewhere they show posters.

## 3. The stations

### 3.1 Paintwise (centre)

**Idle.** The jug still life, half-exploded into its layers and turning slowly, reads as a sculpture from anywhere in the room.

**Beats.**

1. **Arrive.**
   - The jug still life hangs as a canvas.
   - Beside it: the Paintwise logo (`public/images/paintwise-logo.png`), the title and a one-line pitch.
   - The pipeline figure floats beside it, small and angled.
2. **Explode.**
   - The canvas separates into six layers spaced out in depth: original, SAM 2.1 masks, Depth Anything V2 depth, value block-in, PiDiNet edges, pencil sketch.
   - Each layer has a floating tag: the model's name and one line on what it sees.
   - The camera drifts round a little so the depth reads.
3. **What the models see.** The masks layer breaks into one floating shape per object, each pushed out to its own depth from the depth map. The still life becomes a diorama of masks.
4. **In action.**
   - The grapefruit still life's real 24-step sequence plays as a flipbook on a large panel.
   - Its step labels float with it ("1 · background", …, "3.18 · apple", "4.3 · fruit"). The labels for steps 2 and 3.1 are hidden in the source grid, so those two stay unnamed.
   - Phase 1 is block-in, phase 2 is detail matching.
   - The painting-order chips from the figure float beside the flipbook.
   - The jug has no step data, so this beat switches still life rather than inventing an order.
5. **The whole pipeline.**
   - The figure comes front and centre. Clicking it opens it full size (a hand-off).
   - The other still lifes run through the pipeline float round it, cut from `paintwise-gallery-2/-3/-5/-6`.
   - The build log link (`/paintwise`) floats with them.

**The figure** already exists:
- `public/showcase/paintwise/pipeline.svg`;
- `pipeline.webp`, 4000×1900, for the scene;
- built by `scripts/showcase/paintwise-figure.py` and rendered by `scripts/showcase/render-figure.sh`.

It shows (a) scene understanding, (b) artistic ordering, (c) step synthesis and (d) critique, using the grapefruit's real outputs. The user approved it.

**Detail.** `#work/paintwise` opens the story and links as now.

### 3.2 Paintings (left)

**Content.** All 17 paintings in `public/paintings/manifest.json`:

- **The 7 portfolio paintings.**
- **The 10 early works:** Snowy Cabin, Golden Songbird, Country Path, Forest Cottage, Hillside House, River Bend, Autumn Lake, Lone Boat, Covid, Asthma.
- **The three "held" photos** (`_2.webp`): Red Dead Redemption, Asthma, Covid.
- **The "Where it all started" photo** (`origin.webp`) and its story.

**The salon.** One big salon wall, with no wall mesh: the paintings float just off where a wall would be.

| Column | Paintings |
|---|---|
| left | Snorkeling Hawaii, Snowboarding |
| centre | Soccer Penalty, Childhood Toys (the largest), Taj Mahal |
| right | Safari Kid, Red Dead Redemption |

- **The core:** the old `/paintings` wall's three columns, hung large.
- **The edges:** the early works hang smaller round the edges, five a side, with the origin photo at the head of the left edge.
- **Canvases:**
  - Every painting is a real canvas, in relief on the full tier.
  - Depth maps for the 10 early works are made with the same Depth Anything script as the hero's.

**Arriving.** The paintings fly in from the spine and hang themselves: portfolio first, then early work.

**Beats.**
1. The whole salon.
2. The left column.
3. The centre column.
4. The right column.
5. The early-work edges.

In beats 2–5, the presented paintings step about 40 cm forward with their captions, and the rest ease back. Every painting can be clicked on its own.

**Held photos.** Red Dead, Asthma and Covid turn over to show the photo of the painting being held when their beat comes, or on hover. The detail panel shows both images.

**Detail.** Title, year, Portfolio or Early Work, and the manifest's description.

### 3.3 Animation (upper left)

**Films.** Wild West (2024), Soccer Star (2024) and Sanctuary (2023).
- Each floats as a large 16:9 panel at its own depth, playing a muted loop of 6–8 s.
- The Wild West stills (`view0`–`view7`) drift behind them as a storyboard.

**Watching.**
- Opening a film (`#work/<slug>`) flies in to it, the others drift back, and the detail panel opens beside it.
- The full film plays over the panel in a real `<video>` with sound and controls (a hand-off), from the GitHub release (`videos-v1.0`). It's DOM, so the release's missing CORS headers don't matter.
- Esc or close returns.

**Models.** Three native models, each turning slowly on its own floating panel:
- `public/models/wildwest-mc.glb` (Main Character);
- `banana_gun.glb`;
- `saloon.glb`.

**Inspecting a model.**
- Opening a model flies in to it and opens the detail panel, which links to the model on Sketchfab.
- While it's open, dragging orbits and zooms the model in the scene (limited orbit controls), and the arrow keys turn it.
- Esc returns.

**Beats.**
1. Wild West.
2. Soccer Star.
3. Sanctuary.
4. The models.

### 3.4 Games (right)

**Layout.** Bounce Back, Reign or Ruin, Biscuit Bandit and Murphy's Rocket stand in a shallow arc. Each game has:
- a 16:9 **video panel**;
- beside it, a tall **strip of its screenshots**, drifting slowly upward in a loop;
- floating text: the title, the jam result, the stack, and *Play on itch.io*.

**Playback.**
- Only the current game plays. The others show posters.
- There's no gameplay footage yet, so the video panel plays the game's screenshots as a slow push-in slideshow with crossfades.
- When a clip exists, it is set as the work's `video` and replaces the slideshow.
- Biscuit Bandit has only its cover, so its strip is thin until more screenshots exist.

**Beats.** One per game.

### 3.5 Hackathons (upper right)

A placeholder for now: ExoVision, Lumina, MedAI and StockApp stand as today's screens, one beat each. This station's presentation, and whether StockApp belongs here, get their own brainstorm.

## 4. Media

**Made from what exists** by the asset script, `npm run showcase:assets`, written to `public/showcase/`:

- **Paintwise, the jug layers:**
  - Sources are the lossless PNG originals (`public/images/masterstroke-1…5.png`, deleted in `9ab1298`). They're restored once from `9ab1298^` into `scripts/showcase/sources/paintwise/`.
  - Per-object masks are cut from the segmentation image by its flat colours.
  - The depth map comes from `scripts/hero/depth.py` (Depth Anything V2, the model Paintwise uses).
- **Paintwise, from the grids:**
  - The grapefruit's step frames and the other still lifes are cut from `paintwise-gallery-*.png`.
  - Flat-colour images (masks, block-in, steps) are enlarged cleanly: upscaled, then each pixel snapped back to the source's colours.
- **Paintings:** depth maps for the 10 early works.
- **Films:**
  - A loop of 6–8 s per film (H.264 MP4, 720p, about 1–2 MB) and a WebP poster, cut with ffmpeg from the release videos. The user may name the moments; otherwise they're picked.
  - The full films stay on the release.
- **Models:** compressed with Blender: Draco geometry, WebP textures at most 2K. `saloon.glb` is 14 MB now, mostly from oversized PNG textures.
  - The model tools are already in `scripts/showcase/`:
    - `fbx-to-glb.py` bakes bone-parented meshes, so the hat and eyes keep their place.
    - `glb-metalrough.py` converts Sketchfab's specular-glossiness materials, which three.js no longer reads.

**To get** (all optional; each one improves a station):

1. **Paintwise:** every stage at full resolution (1600 px or more) for its best still life: original, raw SAM masks, merged masks, the completed table, depth, block-in, edges, sketch.
2. **Paintwise:** that still life's per-object data: each merged mask as a transparent PNG, plus JSON with each object's label, depth, prominence score and step. With it, beat 3's masks fly back into the canvas in the real order and paint it.
3. **Paintwise:** all its generated steps, at full resolution and in order, with labels.
4. **Games:** a 10–20 s gameplay clip per game (a macOS screen recording is enough), and more screenshots of Biscuit Bandit.

## 5. Units

| Unit | Role |
|---|---|
| `room/ring.ts` | Pure: station placements on the ring, the camera path (overview, each station's beats, the swing through the centre), beat list. Replaces `layouts/split.ts`. |
| `stations/<group>/` | Each group's station. **Pure:** its beats, the camera pose for each, every panel's pose at each beat, and its idle pose. **R3F:** its panels, driven by the position within the station. |
| `panels/` | Panel (image, video, painting, model), drift, pose gliding, floating labels, hand-off overlay. |
| `scrollMap.ts` | Stays. The sample gains `station` and `local` (the continuous beat within the station). |
| `cameraPath.ts`, `cameraPose.ts` | Stay. Detail and hand-off poses come from the panel's pose. |
| `Showcase.tsx` | Scroll section, tiers, group bar, jumps, hash links, overlays. |
| `Scene.tsx` | Canvas, environment, room floor, the stations, camera rig, picking. |
| `works.ts` | Every piece, each with a `group`. The showcase keeps its own copy of stories and links, as now. |
| `WorkList.tsx`, `DetailPanel.tsx` | Grouped by station. The panel gains a second image for held photos and a Sketchfab link for models. |
| `GroupBar.tsx` | New: the station names, current one marked, jump on click. |
| `scripts/showcase/` | Asset script, figure, model tools, sources. |

## 6. Access and fallback

- **Semantic list:** grouped by station, with a heading per group. Tab follows the tour. Focusing a work moves to its beat, and Enter opens its detail.
- **Group bar:** real buttons inside a `nav`, with visible focus.
- **Open works and hand-offs:**
  - They trap focus, as the detail panel does now.
  - The film player uses native controls, and an open model turns with the arrow keys.
  - Closing returns focus to the work.
- **Static tier** (reduced motion, or no WebGL2):
  - No 3D and no tear.
  - The works are a grid grouped by station: films and models as posters, Paintwise as its figure plus the layer images.
  - The same detail panel opens, and films still play in the player.

## 7. Performance

- **Streaming:** a station loads its textures, video loops and models only once the camera is within a few beats of it. Further away it shows light posters.
- **Video:** only the current station plays video; at most two decoders run at once.
- **Models:** they load when the animation station is near. Draco decodes in a worker, with decoder files served from `public/`.
- **Full tier:** drift, relief and video loops.
- **Lite tier:**
  - no drift and no relief;
  - video only on the piece being presented;
  - models still until selected;
  - DPR 1.
- **Kept from stage 1:** the frame loop pauses off-screen, and losing the WebGL context falls back to the static page.
- **Target:** 60 fps on a 2020 laptop with integrated graphics.

## 8. Stages

Each stage gets its own plan and build.

1. **The room and Paintwise:**
   - the ring, the overview, the group bar and jumps;
   - `#group/` links;
   - the panel building blocks;
   - the Paintwise station complete, with its assets.

   The other works from stage 1 (the 7 portfolio paintings and the 8 other projects) move into their stations, looking roughly as they do now: paintings as canvases, the rest as screens. The early works, films and models arrive with their own stages.
2. **Paintings:** the salon with all 17, the held photos, the origin photo and the early-work depth maps.
3. **Animation:** loops, posters, the player, the models and the inspector.
4. **Games:** video panels, screenshot strips, the slideshow stand-in.
5. **Hackathons:** after their own brainstorm. Then the old pages retire.

## 9. Verification

- **`npm run showcase:check`** grows to cover:
  - the ring: every beat has a camera pose and the path passes through them;
  - jumps land on a station's first beat;
  - every station: every panel has a finite pose at every beat and in idle;
  - the scroll map's `station` and `local`.
- **Then:** `npx tsc --noEmit`, `npm run lint` and `npm run build`, with the dev server stopped.
- **Visual testing** is done by the user. At most a screenshot or two to catch something plainly broken. Close the browser and delete temporary files afterwards.
