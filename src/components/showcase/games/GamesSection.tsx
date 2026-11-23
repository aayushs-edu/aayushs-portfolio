"use client";

import { useState } from "react";
import EarthBackdrop from "./EarthBackdrop";
import { GAMES } from "./games";
import PixelTitle from "./PixelTitle";
import css from "./GamesSection.module.css";
import Handheld from "./Handheld";

/**
 * Games: the game-jam games, each playable in place (its itch.io build) or,
 * for one that only downloads, watched, in a big handheld with the
 * cartridges fanned out above it. All of it is pixel art: the title
 * (PixelTitle), the handheld and cartridges, and the sunlit Earth horizon
 * behind (EarthBackdrop).
 */
export default function GamesSection() {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);

  return (
    <section id="games" className={css.section} aria-labelledby="games-title" style={{ "--accent": GAMES[selected].accent } as React.CSSProperties}>
      <EarthBackdrop />
      <div className={css.head}>
        <PixelTitle id="games-title" className={css.title} text="Games" />
        <p className={css.pitch}>Games I made for game jams, playable right here</p>
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
