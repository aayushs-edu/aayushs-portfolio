// Stations that show their works as they are: an arc of screens (hackathons,
// games). Pure: works → placements and one beat per work, in the station's
// frame (it faces +z, toward the room's centre).

import { centreY, EYE, presentDistance, sizeOf, yawFacing, type Placement, type Vec3, type Viewport } from "../layouts/types";
import type { GroupId, StationBeat, StationLayout } from "../room/types";
import type { Work } from "../works";

/** Between screens (m), and the radius of the arc they stand on (it bows toward the room's centre). */
const ARC = { gap: 0.35, radius: 7 };

const normalOf = (rotationY: number): Vec3 => [Math.sin(rotationY), 0, Math.cos(rotationY)];

function reach(placements: Placement[]): number {
  return Math.max(0, ...placements.map((p) => Math.hypot(p.position[0], p.position[2]) + p.width / 2)) + 0.2;
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
