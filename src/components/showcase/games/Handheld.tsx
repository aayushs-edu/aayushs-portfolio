"use client";

import { type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GameInfo from "./GameInfo";
import GameScreen from "./GameScreen";
import { screenAspect, type Game } from "./games";
import css from "./Handheld.module.css";
import { useSwap } from "./useSwap";

interface HandheldProps {
  games: Game[];
  selected: number;
  onSelect: (i: number) => void;
  playing: boolean;
  onPlay: () => void;
  onStop: () => void;
  onStory: (slug: string) => void;
}

/**
 * The handheld. One big handheld (an original design) holds the
 * game: its cartridge sits in the slot on top, and the others fan out above
 * it, to the left. Its controls work: the d-pad's left and right and SELECT switch games,
 * A and START play, B stops. A switch pops the cartridge out and drops the
 * next one in, and the screen boots with the game's title. Its power light
 * takes the game's colour. Over it, the cartridges fan out on the left and
 * the game's words (its manual) sit on the right.
 */
export default function Handheld({ games, selected, onSelect, playing, onPlay, onStop, onStory }: HandheldProps) {
  const { shown, phase } = useSwap(selected, 420, 1000);
  const game = games[shown];
  const mid = (games.length - 1) / 2;

  const prompt = (
    <button type="button" className={css.prompt} onClick={onPlay}>
      Press <span className={css.promptKey}>A</span> to {game.build ? "play" : "watch"}
    </button>
  );

  return (
    <div className={css.layout} style={{ "--accent": game.accent } as CSSProperties}>
      <div className={css.top}>
        <div className={css.carts} role="group" aria-label="Games">
          {games.map((g, i) => (
            <button
              key={g.slug}
              type="button"
              className={css.cart}
              aria-pressed={i === selected}
              aria-label={g.work.title}
              onClick={() => onSelect(i)}
              style={{ "--accent": g.accent, "--tilt": `${(i - mid) * 7}deg`, "--drop": `${Math.abs(i - mid) * 9}px` } as CSSProperties}
            >
              <Cartridge src={g.work.media.image} title={g.work.title} />
            </button>
          ))}
        </div>
        {/* Every game's words in one cell, the shown one visible: the row is always the tallest's height. */}
        <div className={css.manual}>
          {games.map((g, i) => (
            <div key={g.slug} className={css.page} data-on={i === shown} aria-hidden={i !== shown} inert={i !== shown}>
              <GameInfo game={g} onStory={onStory} paragraphs={2} />
            </div>
          ))}
        </div>
      </div>

      <div className={css.device} data-phase={phase} data-playing={playing}>
        <div className={css.slotCart} aria-hidden="true">
          <Cartridge src={game.work.media.image} title={game.work.title} />
        </div>
        <div className={css.body}>
          <div className={css.left}>
            <div className={css.dpad}>
              <span className={css.arm} data-dir="v" aria-hidden="true" />
              <span className={css.arm} data-dir="h" aria-hidden="true" />
              <button type="button" className={css.dir} data-dir="left" onClick={() => onSelect(selected - 1)} aria-label="Previous game">
                <ChevronLeft size={14} strokeWidth={2.5} aria-hidden="true" />
              </button>
              <button type="button" className={css.dir} data-dir="right" onClick={() => onSelect(selected + 1)} aria-label="Next game">
                <ChevronRight size={14} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className={css.face}>
            <div className={css.bezel}>
              <span className={css.led} aria-hidden="true" />
              <div className={css.glass}>
                <GameScreen game={game} playing={playing} onPlay={onPlay} prompt={prompt} className={css.screen} style={{ aspectRatio: screenAspect(game) }} />
                <div className={css.boot} aria-hidden="true">
                  <span className={css.bootTitle}>{game.work.title}</span>
                </div>
              </div>
            </div>
            <div className={css.pills}>
              <button type="button" className={css.pill} onClick={() => onSelect(selected + 1)}>
                <span className={css.pillCap} aria-hidden="true" />
                Select
              </button>
              <button type="button" className={css.pill} onClick={playing ? onStop : onPlay}>
                <span className={css.pillCap} aria-hidden="true" />
                {playing ? "Stop" : "Start"}
              </button>
            </div>
          </div>

          <div className={css.right}>
            <div className={css.faceButtons}>
              <button type="button" className={css.round} data-key="b" onClick={onStop} disabled={!playing} aria-label="B: stop">
                <span className={css.roundCap} aria-hidden="true" />
                <span className={css.roundLabel}>B</span>
              </button>
              <button type="button" className={css.round} data-key="a" onClick={onPlay} disabled={playing} aria-label={game.build ? "A: play" : "A: watch"}>
                <span className={css.roundCap} aria-hidden="true" />
                <span className={css.roundLabel}>A</span>
              </button>
            </div>
            <span className={css.grille} aria-hidden="true" />
          </div>
        </div>
      </div>

    </div>
  );
}

/** A cartridge: a notched shell, the cover art on its label, grip ridges at the foot. */
function Cartridge({ src, title }: { src: string; title: string }) {
  return (
    <span className={css.shell}>
      <span className={css.label}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" loading="lazy" />
        <span className={css.labelTitle}>{title}</span>
      </span>
      <span className={css.ridges} aria-hidden="true" />
    </span>
  );
}
