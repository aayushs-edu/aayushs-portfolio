// Touching the name (pure state: fed by pointer events, stepped by the seam's
// frame loop, read by the line and the WebGL name).
//
// - Moving through the name pushes it like fluid: this collects the pushes;
//   the WebGL name runs the flow and draws the letters through it.
// - On the binary side, the cells under the moving cursor come loose: each
//   leaves a hole in its letter and flies off as a white digit; the hole is
//   retyped a moment later.
// - Press and drag on the name to pull the line through it: the line bends
//   toward the pointer on a spring and wobbles back when let go.

import type { BinaryGrid } from "./nameRaster";
import { TOUCH, type SplitLayout } from "./splitConfig";

/** A push on the fluid name: where (canvas CSS px) and how fast the pointer moved (CSS px/s). */
export interface Push {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export class NameTouch {
  /** Pushes since the last frame (the WebGL name drains these). */
  pushes: Push[] = [];
  /** Loose digits for the shader: x, y (canvas CSS px, cell top-left), digit, opacity. */
  bits = new Float32Array(TOUCH.knock.max * 4);
  bitCount = 0;
  /** Per grid cell: 255 knocked out, 128 being retyped, 0 in place. */
  holes = new Uint8Array(0);
  holesDirty = false;

  private grid: BinaryGrid | null = null;
  private layout: SplitLayout | null = null;
  private pointer = { x: 0, y: 0, vx: 0, vy: 0, inside: false, touch: false, at: 0, moved: false };
  private press: { x: number; y: number } | null = null;
  private dragging = false;
  private amp = 0;
  private ampV = 0;
  private centre = 0;
  private refillAt = new Float64Array(0);
  private loose = new Set<number>();
  private flying: { x: number; y: number; vx: number; vy: number; bit: number; age: number; life: number }[] = [];

  setGrid(grid: BinaryGrid) {
    this.grid = grid;
    this.holes = new Uint8Array(grid.cols * grid.rows);
    this.refillAt = new Float64Array(grid.cols * grid.rows);
    this.loose.clear();
    this.holesDirty = true;
  }

  setLayout(layout: SplitLayout) {
    this.layout = layout;
  }

  /** True while the line is held (for the cursor). */
  get holding() {
    return this.dragging;
  }

  /** Is (x, y) (hero px) over the name? */
  overName(x: number, y: number): boolean {
    const g = this.grid;
    const l = this.layout;
    if (!g || !l) return false;
    const c = (x - l.seamX) / l.cellW;
    const r = (y - l.gridY) / l.cellH;
    return c > g.bounds.c0 - 3 && c < g.bounds.c1 + 4 && r > g.bounds.r0 - 2 && r < g.bounds.r1 + 3;
  }

  // ---- pointer input (hero px) ----------------------------------------------

  move(x: number, y: number, touch: boolean) {
    const now = performance.now();
    const dt = Math.max(1, now - this.pointer.at) / 1000;
    const k = Math.min(1, dt * 14);
    if (this.pointer.inside && dt < 0.2) {
      this.pointer.vx += ((x - this.pointer.x) / dt - this.pointer.vx) * k;
      this.pointer.vy += ((y - this.pointer.y) / dt - this.pointer.vy) * k;
    } else {
      this.pointer.vx = this.pointer.vy = 0;
    }
    Object.assign(this.pointer, { x, y, inside: true, touch, at: now, moved: true });
    if (this.press && !this.dragging && Math.abs(x - this.press.x) > TOUCH.dragSlop) {
      this.dragging = true;
      this.centre = y;
    }
  }

  down(x: number, y: number, touch: boolean) {
    this.move(x, y, touch);
    if (!this.overName(x, y)) return;
    this.press = { x, y };
    // A mouse grabs the line at once; a finger only once it moves sideways.
    if (!touch) {
      this.dragging = true;
      this.centre = y;
    }
  }

  up() {
    this.press = null;
    this.dragging = false;
  }

  leave() {
    this.pointer.inside = false;
    this.press = null;
    this.dragging = false;
  }

  // ---- the line -----------------------------------------------------------------

  /** How far the held (or wobbling) line is pulled at height y (CSS px). */
  bulgeAt(y: number): number {
    if (Math.abs(this.amp) < 0.05 || !this.layout) return 0;
    const dy = (y - this.centre) / (TOUCH.bulge * this.layout.u);
    return this.amp * Math.exp(-dy * dy);
  }

  /**
   * Advances everything by dt at seam time t. `lineAt(y)` is where the line is
   * (x from the centre) as of the last frame, including the current pull.
   */
  step(dt: number, t: number, lineAt: (y: number) => number) {
    const layout = this.layout;
    if (!layout) return;
    const p = this.pointer;
    const rel = p.x - layout.seamX;

    // The line follows a held pointer on a spring, and wobbles back on release;
    // its bent part never goes further than `reach` from the middle of the screen.
    if (this.dragging) this.centre += (p.y - this.centre) * (1 - Math.exp(-dt * 20));
    const reach = TOUCH.reach * layout.w;
    const base = lineAt(this.centre) - this.bulgeAt(this.centre);
    const target = this.dragging ? Math.max(-reach, Math.min(reach, rel)) - base : 0;
    const damping = this.dragging ? TOUCH.holdDamping : TOUCH.releaseDamping;
    this.ampV += (TOUCH.spring * (target - this.amp) - damping * this.ampV) * dt;
    this.amp += this.ampV * dt;
    if (this.amp > reach - base) {
      this.amp = reach - base;
      this.ampV = Math.min(0, this.ampV);
    } else if (this.amp < -reach - base) {
      this.amp = -reach - base;
      this.ampV = Math.max(0, this.ampV);
    }

    // Moving through the name pushes it (not while holding the line).
    const speed = Math.hypot(p.vx, p.vy);
    if (p.moved && p.inside && !p.touch && !this.dragging && this.overName(p.x, p.y) && speed > 1) {
      this.pushes.push({ x: p.x, y: p.y, vx: p.vx, vy: p.vy });
      if (rel >= lineAt(p.y) && speed > TOUCH.knock.minSpeed) this.knock(rel, p.y, t, lineAt);
    }
    p.moved = false;

    this.refill(t);
    this.fly(dt, layout);
  }

  // ---- loose digits ------------------------------------------------------------

  /** Knocks loose the binary cells around the cursor that are still in place. */
  private knock(rel: number, y: number, t: number, lineAt: (y: number) => number) {
    const g = this.grid;
    const l = this.layout;
    if (!g || !l) return;
    const K = TOUCH.knock;
    const pc = rel / l.cellW;
    const pr = (y - l.gridY) / l.cellH;
    const p = this.pointer;
    for (let r = Math.floor(pr - K.rows); r <= Math.ceil(pr + K.rows); r++) {
      if (r < 0 || r >= g.rows) continue;
      for (let c = Math.floor(pc - K.cols); c <= Math.ceil(pc + K.cols); c++) {
        const i = c - g.c0;
        if (i < 0 || i >= g.cols) continue;
        const idx = r * g.cols + i;
        if (!g.cells[idx] || this.holes[idx]) continue;
        const dx = (c + 0.5 - pc) / K.cols;
        const dy = (r + 0.5 - pr) / K.rows;
        if (dx * dx + dy * dy > 1) continue;
        const x = c * l.cellW;
        const top = l.gridY + r * l.cellH;
        // Only cells on the binary side of the line are binary.
        if (x < lineAt(top + l.cellH / 2)) continue;
        this.holes[idx] = 255;
        this.refillAt[idx] = t + rand(K.refill[0], K.refill[1]);
        this.loose.add(idx);
        this.holesDirty = true;
        if (this.flying.length >= K.max) this.flying.shift();
        // Thrown away from the cursor, carrying some of its motion.
        const ax = c + 0.5 - pc;
        const ay = (r + 0.5 - pr) * (l.cellH / l.cellW);
        const len = Math.hypot(ax, ay) || 1;
        const burst = rand(K.burst[0], K.burst[1]) * l.u;
        this.flying.push({
          x: l.seamX + x,
          y: top,
          vx: (ax / len) * burst + p.vx * K.carry,
          vy: (ay / len) * burst + p.vy * K.carry,
          bit: g.cells[idx] === 2 ? 1 : 0,
          age: 0,
          life: rand(K.life[0], K.life[1]),
        });
      }
    }
  }

  /** Knocked-out cells are retyped after a while (flickering briefly first). */
  private refill(t: number) {
    for (const idx of this.loose) {
      const at = this.refillAt[idx];
      if (t >= at + TOUCH.knock.retype) {
        this.holes[idx] = 0;
        this.loose.delete(idx);
        this.holesDirty = true;
      } else if (t >= at && this.holes[idx] !== 128) {
        this.holes[idx] = 128;
        this.holesDirty = true;
      }
    }
  }

  private fly(dt: number, l: SplitLayout) {
    const K = TOUCH.knock;
    const drag = Math.exp(-dt * 1.8);
    let n = 0;
    const out = this.flying.filter((b) => (b.age += dt) < b.life);
    for (const b of out) {
      b.vx = b.vx * drag + K.drift * l.u * (1 - drag);
      b.vy *= drag;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      this.bits.set([b.x, b.y, b.bit, 1 - smooth(0.45 * b.life, b.life, b.age)], n * 4);
      n++;
    }
    this.flying = out;
    this.bitCount = n;
  }
}
