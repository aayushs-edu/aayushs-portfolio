"use client";

import { useState } from "react";
import scenes from "./backgrounds.generated.json";
import { GAMES } from "./games";
import PixelTitle from "./PixelTitle";
import css from "./GamesSection.module.css";
import Handheld from "./Handheld";

/** The background: `canopy` (a night forest from above), or `pines` (rows of pines at night), kept to switch to. */
const BACKGROUND: keyof typeof scenes = "canopy";

/**
 * Games: the game-jam games, each playable in place (its itch.io build) or,
 * for one that only downloads, watched, in a big handheld with the
 * cartridges fanned out above it. All of it is pixel art: the title
 * (PixelTitle), the handheld and cartridges, and the night forest behind
 * (a plain background image, rendered at build time by scripts/showcase/games-backgrounds.mjs).
 */
export default function GamesSection() {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const map = scenes[BACKGROUND];

  return (
    <section id="games" className={css.section} aria-labelledby="games-title" style={{ "--accent": GAMES[selected].accent } as React.CSSProperties}>
      <div className={css.map} style={{ "--map": `url(${map.src})`, "--map-w": `${map.width * map.pixel}px`, "--map-h": `${map.height * map.pixel}px` } as React.CSSProperties} aria-hidden="true" />
      <div className={css.head}>
        <PixelTitle id="games-title" className={css.title} text="Games" />
        <p className={css.pitch}>
          Games I made for game jams, playable right here
        </p>
      </div>
      <Handheld
        games={GAMES}
        selected={selected}
        onSelect={(i) => {
          const next = ((i % GAMES.length) + GAMES.length) % GAMES.length;
          if (next === selected) return;
          setPlaying(false);
          setSelected(next);
        }}
        playing={playing}
        onPlay={() => setPlaying(true)}
        onStop={() => setPlaying(false)}
      />
    </section>
  );
}
