"use client";

import { useState } from "react";
import ButtonTitle from "./ButtonTitle";
import EarthBackdrop from "./EarthBackdrop";
import { GAMES } from "./games";
import css from "./GamesSection.module.css";
import Handheld from "./Handheld";

/**
 * Games: the game-jam games, each playable in place (its itch.io build) or,
 * for one that only downloads, watched, in a big handheld with the
 * cartridges fanned out above it. The arcade-button title sits over a sunlit
 * Earth horizon (EarthBackdrop). The old drifting controller inputs
 * (InputDrift) are kept, unused.
 */
export default function GamesSection({ onOpen }: { onOpen: (slug: string) => void }) {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);

  return (
    <section id="games" className={css.section} aria-labelledby="games-title">
      <EarthBackdrop />
      <div className={css.head}>
        <ButtonTitle id="games-title" className={css.title} text="Games" />
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
        onStory={(slug) => {
          setPlaying(false);
          onOpen(slug);
        }}
      />
    </section>
  );
}
