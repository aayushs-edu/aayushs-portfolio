import { ArrowUpRight } from "lucide-react";
import { itchHref, type Game } from "./games";
import css from "./GameInfo.module.css";

/**
 * A game's words, shared by the three layouts: its title, tagline, year and
 * jam (with any award), its story, and links out (itch.io, and its full
 * story in the detail view). Each layout frames it its own way.
 */
export default function GameInfo({ game, onStory, paragraphs = 1, className }: { game: Game; onStory: (slug: string) => void; paragraphs?: number; className?: string }) {
  const { work } = game;
  return (
    <div className={`${css.info} ${className ?? ""}`}>
      <h3 className={css.title}>{work.title}</h3>
      <p className={css.tagline}>{game.tagline}</p>
      <p className={css.meta}>
        <span>{work.year}</span>
        <span>{game.jam}</span>
        {game.award && <span className={css.award}>{game.award}</span>}
      </p>
      {work.story.slice(0, paragraphs).map((p) => (
        <p key={p} className={css.story}>
          {p}
        </p>
      ))}
      {game.input && <p className={css.input}>{game.input}</p>}
      <p className={css.links}>
        <a href={itchHref(game)} target="_blank" rel="noopener noreferrer">
          itch.io
          <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
        </a>
        <button type="button" onClick={() => onStory(game.slug)}>
          Full story
        </button>
      </p>
    </div>
  );
}
