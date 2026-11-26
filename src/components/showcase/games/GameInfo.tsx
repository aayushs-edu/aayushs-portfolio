import { itchHref, type Game } from "./games";
import css from "./GameInfo.module.css";

/**
 * A game's page of the handheld's manual: its title with a pixel button to its
 * itch.io page beside it, its tagline and story, then the facts set out as in
 * an instruction booklet (a ruled table of the jam, how it placed and its
 * controls), not as chips and icons.
 */
export default function GameInfo({ game, paragraphs = 1, className }: { game: Game; paragraphs?: number; className?: string }) {
  const { work } = game;
  const facts: [string, React.ReactNode][] = [
    ["Jam", `${game.jam}, ${work.year}`],
    ...(game.award ? [["Result", game.award] as [string, string]] : []),
    ...(game.input ? [["Controls", game.input.replace(/\s+recommended$/i, "")] as [string, string]] : []),
  ];

  return (
    <div className={`${css.info} ${className ?? ""}`}>
      <div className={css.head}>
        <h3 className={css.title}>{work.title}</h3>
        <a className={css.itch} href={itchHref(game)} target="_blank" rel="noopener noreferrer" aria-label={`${work.title} on itch.io (opens in a new tab)`}>
          itch.io
          <span className={css.arrow} aria-hidden="true" />
        </a>
      </div>
      <p className={css.tagline}>{game.tagline}</p>
      {work.story.slice(0, paragraphs).map((p) => (
        <p key={p} className={css.story}>
          {p}
        </p>
      ))}
      <dl className={css.facts}>
        {facts.map(([label, value]) => (
          <div key={label} className={css.fact}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
