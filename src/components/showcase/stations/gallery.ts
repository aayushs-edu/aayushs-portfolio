// Stations that show their works as they are: the paintings' salon, and an
// arc of screens (hackathons, games). Pure: works → placements and one beat
// per work, in the station's frame (it faces +z, toward the room's centre).

import { centreY, EYE, presentDistance, sizeOf, yawFacing, type Placement, type Vec3, type Viewport } from "../layouts/types";
import { GROUP_TITLES, type GroupId, type StationBeat, type StationLayout } from "../room/types";
import type { Work } from "../works";

/** The old /paintings wall: three columns, Childhood Toys at the heart of the middle one. */
const SALON_COLUMNS = [
  ["snorkeling-hawaii", "snowboarding"],
  ["soccer-penalty", "childhood-toys", "taj-mahal"],
  ["safari-kid", "red-dead-redemption"],
];
const SALON = {
  /** Painting heights (m): the heart of the wall is larger */
  height: 0.95,
  heart: { slug: "childhood-toys", height: 1.2 },
  /** Between columns and between paintings in a column (m) */
  gap: 0.35,
  rowGap: 0.3,
  /** Columns are centred at this height (m) */
  midY: 2.15,
  /** The side columns come forward and turn in a little */
  sideZ: 0.35,
  sideTurn: (10 * Math.PI) / 180,
  /** At a painting's beat the camera leans toward the middle, at a comfortable height */
  lean: 0.85,
  eyeY: [1.2, 2.4] as [number, number],
};

/** Between screens (m), and the radius of the arc they stand on (it bows toward the room's centre). */
const ARC = { gap: 0.35, radius: 7 };

const normalOf = (rotationY: number): Vec3 => [Math.sin(rotationY), 0, Math.cos(rotationY)];

function reach(placements: Placement[]): number {
  return Math.max(0, ...placements.map((p) => Math.hypot(p.position[0], p.position[2]) + p.width / 2)) + 0.2;
}

export function salonStation(works: readonly Work[], viewport: Viewport): StationLayout {
  const bySlug = new Map(works.map((w) => [w.slug, w]));
  const columns = SALON_COLUMNS.map((slugs) => slugs.flatMap((slug) => bySlug.get(slug) ?? []));
  const placed = new Set(columns.flat().map((w) => w.slug));
  for (const work of works) {
    if (placed.has(work.slug)) continue;
    (columns[0].length <= columns[2].length ? columns[0] : columns[2]).push(work);
  }

  const size = (work: Work) => {
    const height = work.slug === SALON.heart.slug ? SALON.heart.height : SALON.height;
    return { width: height * work.media.aspect, height };
  };
  const widths = columns.map((column) => Math.max(0, ...column.map((w) => size(w).width)));
  const xs = [-(widths[1] / 2 + SALON.gap + widths[0] / 2), 0, widths[1] / 2 + SALON.gap + widths[2] / 2];

  const placements: Placement[] = [];
  const beats: StationBeat[] = [];
  columns.forEach((column, c) => {
    const total = column.reduce((sum, w) => sum + size(w).height, 0) + SALON.rowGap * Math.max(0, column.length - 1);
    let top = SALON.midY + total / 2;
    const side = c === 1 ? 0 : c === 0 ? -1 : 1;
    for (const work of column) {
      const { width, height } = size(work);
      const position: Vec3 = [xs[c], top - height / 2, side === 0 ? 0 : SALON.sideZ];
      top -= height + SALON.rowGap;
      const rotationY = -side * SALON.sideTurn;
      placements.push({ slug: work.slug, position, rotationY, width, height });

      const normal = normalOf(rotationY);
      const distance = presentDistance(width, height, viewport);
      const y = Math.min(SALON.eyeY[1], Math.max(SALON.eyeY[0], position[1]));
      beats.push({
        key: `work:${work.slug}`,
        camera: { position: [position[0] * SALON.lean + normal[0] * distance, y, position[2] + normal[2] * distance], target: position },
      });
    }
  });

  return { id: "paintings", title: GROUP_TITLES.paintings, beats, works: placements, radius: reach(placements) };
}

export function arcStation(id: GroupId, title: string, works: readonly Work[], viewport: Viewport): StationLayout {
  const sizes = works.map(sizeOf);
  const total = sizes.reduce((sum, s) => sum + s.width, 0) + ARC.gap * Math.max(0, works.length - 1);
  let cursor = -total / 2;

  const placements: Placement[] = [];
  const beats: StationBeat[] = [];
  works.forEach((work, i) => {
    const { width, height } = sizes[i];
    const x = cursor + width / 2;
    cursor += width + ARC.gap;
    const y = centreY(work);
    const position: Vec3 = [x, y, (x * x) / (2 * ARC.radius)];
    const rotationY = yawFacing(position, [0, y, ARC.radius]);
    placements.push({ slug: work.slug, position, rotationY, width, height });

    const normal = normalOf(rotationY);
    const distance = presentDistance(width, height, viewport);
    beats.push({
      key: `work:${work.slug}`,
      camera: { position: [position[0] + normal[0] * distance, EYE, position[2] + normal[2] * distance], target: position },
    });
  });

  return { id, title, beats, works: placements, radius: reach(placements) };
}
