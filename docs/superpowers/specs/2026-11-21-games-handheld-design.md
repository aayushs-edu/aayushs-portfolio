# Games section: the handheld

Date: 2026-11-21. Status: built (a record, written after the build). Part of the home page under the hero; see `2026-11-03-home-unzip-design.md`.

## What the user asked for

- A section of its own for Games, inspired by the Hackathons trifold but not a copy.
- Playable in place (picked over "show, then link out").
- Skyball added (it wasn't on the site).
- "Try all three, but do your best on each": a game case, an arcade cabinet and a handheld were built as a trial. The user picked the handheld, then asked for a bigger screen and no full-screen or X buttons on it.

## Content

Five game-jam games, newest first (`games/games.ts`):

| Game | Jam | Plays |
|---|---|---|
| Skyball | ScoreJam #37, top 10 (in development) | itch build, fixed 960×600 canvas; "Mouse recommended" |
| Bounce Back | GMTK Game Jam 2025, top 20% | itch build that fills any window |
| Reign or Ruin | Player2 AI NPC Jam, $50 prize and a special mention | itch build, fixed 1920×1080 canvas |
| Biscuit Bandit | Brackeys Game Jam 2025.2 | itch build, fixed 960×600 canvas |
| Murphy's Rocket | Brackeys Game Jam 2025.1 | download only, so its YouTube video |

- **Skyball** is a `Work` written out in `works.ts`, like VRShop. Its text comes from its itch.io page, and its cover and screenshots are in `public/images/skyball-*.webp`. Its year (2026) is a guess: itch shows no publish date.
- **The builds** use itch.io's own embed, `https://itch.io/embed-upload/<upload id>`. The upload id is the number in the build's `html-classic.itch.zone/html/<id>/` address on the game's page. The raw itch.zone build shows a "You should be using itch.io" banner when framed from another site.
- **Canvas sizes** were measured from each build loaded on its own at two window sizes, not taken from itch's listed viewport. Skyball lists 1120×680 and Biscuit Bandit 1920×1080, but both draw a fixed 960×600 canvas, so Biscuit Bandit first showed tiny on the screen.
- **Each game** also carries a tagline, its jam and any award, its screenshots, and an accent colour from its cover.

## Design

`games/GamesSection.tsx` (+ `.module.css`) holds the heading, the background and the selected and playing state. Spacing was tightened at the user's ask (padding 96/80 px, 28 px under the heading): the section is about 1280 px tall at 1440×900. It sits after Animation in `Showcase.tsx`. Every group now has a section, so the WorkList grid no longer renders.

- **Title** (`ButtonTitle.tsx`): each letter of "Games" is an arcade button, a cream cap on a stacked base (text-shadows stepping into shade). It presses down under the pointer. While in view, a random letter presses on its own every 1.4–3 s. With reduced motion only the pointer presses.
- **Background** (`EarthBackdrop.tsx`): the user swapped in Earth Blaze from 21st.dev (`src/components/ui/earth-blaze.tsx`, copied in as given, with only lint fixes). It's a WebGL sunlit Earth horizon under a baked nebula and about 1800 twinkling stars.
  - **The light follows the mouse,** as on 21st.dev (the user's ask). The canvas sits behind the content, so the section passes its pointer moves and leaves on to the canvas as synthetic pointer events. Only mouse and pen moves are passed, never touches or presses, so clicks stay with the content. The aurora (a held press) is off (`auroraEnabled={false}`), and the canvas's tab stop is removed (`tabIndex = -1`).
  - **Placement:** sticky to the view (screen-sized canvas), and masked to fade in and out over the section's first and last 320 px so it blends into Paintings and Animation.
  - **The Earth texture:** NASA's Blue Marble, resized from 5400×2700 to 3072×1536 (363 KB) and served from `public/showcase/games/earth-blue-marble.jpg` instead of 21st.dev's CDN.
  - **Its own behaviour:** it pauses off screen, stills itself with reduced motion, and falls back to a CSS gradient without WebGL.
  - **The earlier background**, drifting controller inputs (`InputDrift.tsx`: three depths, presses and combos in the game's colour), is kept, unused.
- **The handheld** (`Handheld.tsx`): one big, original handheld holds the game. It's up to 1240 px wide, with a screen up to 800 px wide at 16:10.
  - **Layout:** a top row with the cartridge fan on the left (from the handheld's left edge) and the game's words on the right (left-aligned), then the handheld under it. On phones: cartridges, words, handheld.
  - **Cartridges:** they fan out above it, each a notched shell with the cover art and title on its label and grip ridges at the foot. Hovering lifts one. The cartridge in the handheld stands out of the slot on top, and its place in the fan shows as a faint outline.
  - **Controls that work:** the d-pad's left and right, and SELECT, switch games. A and START play, and B and STOP stop. The power light takes the game's colour, brighter while it plays.
  - **A switch** (`useSwap`: out 420 ms, in 1 s): the cartridge pops out of the slot and the screen goes dark. The next cartridge drops in, and the screen boots with the game's title before its screenshots.
  - **The screen** (`GameScreen.tsx`): the screenshots take turns every 3.2 s while in view. "Press A to play" sits at its foot, and the whole screen plays. Played, the itch embed loads into an iframe:
    - **A fixed canvas:** the frame is its canvas plus itch's 20 px bar (`EMBED_BAR`: its logo and a full-screen button, left visible as itch's credit), scaled to fit and sized from the ResizeObserver's layout size; the pointer still lands right through the scale.
    - **A `fill` build** (Bounce Back): the frame is the screen's own size, unscaled.
    - **The screen's shape** is the game's own (`screenAspect`): canvas plus bar, or 16:9 for a fill build or a video. The glass always keeps a 16:9 height, so a narrower game (the 960×600 ones) is narrower inside black bezel, never taller. Every game fills its screen and the handheld never changes size. Murphy's Rocket plays its video instead. There are no buttons on the screen: the handheld's own controls stop it.
  - **The game's words,** top right, like a manual (`GameInfo.tsx`). All five are stacked in one grid cell, with only the shown one visible (a cross-fade). The row is always the tallest's height, so switching games never moves the handheld: title, tagline, year, jam and award, two paragraphs of story, "Mouse recommended" where its page says so, and links to itch.io and to the full story (the detail view).
  - **Under 860 px:** the handheld turns portrait, with the screen on top and the d-pad and A/B in a row under it. The cartridges are a sideways-scrolling row.

## Not built

- No full-screen button, by the user's choice.
- Reign or Ruin's AI villagers use the Player2 service, which may need the Player2 app running; nothing on the site handles that.
- Playing in place was verified for the four builds (each loads and fills its screen). The trailer of Murphy's Rocket wasn't played in the check.
- The game case and arcade cabinet layouts from the trial were deleted, never committed.
