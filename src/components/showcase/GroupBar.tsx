"use client";

import css from "./GroupBar.module.css";
import type { GroupId } from "./room/types";

interface GroupBarProps {
  stations: { id: GroupId; title: string }[];
  /** The station the camera is at (null on the overview) */
  current: GroupId | null;
  /** Once the hero has opened, and while nothing is open over the scene (it also shows when it has focus) */
  shown: boolean;
  onJump: (id: GroupId) => void;
}

/** The room's stations by name: the current one marked, any other one a jump across the room. */
export default function GroupBar({ stations, current, shown, onJump }: GroupBarProps) {
  return (
    <nav className={css.bar} aria-label="Sections" data-shown={shown}>
      <ul className={css.list}>
        {stations.map((station) => (
          <li key={station.id}>
            <button type="button" className={css.item} aria-current={station.id === current ? "true" : undefined} onClick={() => onJump(station.id)}>
              {station.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
