// Touching the name (pure state: fed by pointer events, stepped by the seam's
// frame loop, read by the line and the WebGL name).
//
// - Moving through the painted name pushes it like fluid: this collects the
//   pushes; the WebGL name runs the flow and draws the letters through it.
// - On the binary side, the cells under the cursor flicker, and settle a moment
//   after it leaves.
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

export class NameTouch {
  /** Pushes since the last frame (the WebGL name drains these). */
  pushes: Push[] = [];
  /** Per grid cell: 255 flickering, 0 settled. */
  flicker = new Uint8Array(0);
  flickerDirty = false;

  private grid: BinaryGrid | null = null;
  private layout: SplitLayout | null = null;
  private pointer = { x: 0, y: 0, vx: 0, vy: 0, inside: false, touch: false, at: 0, moved: false };
  private press: { x: number; y: number } | null = null;
  private dragging = false;
  private amp = 0;
  private ampV = 0;
  private centre = 0;
  private settleAt = new Float64Array(0);
  private flickering = new Set<number>();

  setGrid(grid: BinaryGrid) {
    this.grid = grid;
    this.flicker = new Uint8Array(grid.cols * grid.rows);
    this.settleAt = new Float64Array(grid.cols * grid.rows);
    this.flickering.clear();
    this.flickerDirty = true;
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

    // On the name (not while holding the line): the cursor pushes the paint and
    // flickers the binary.
    if (p.inside && !p.touch && !this.dragging && this.overName(p.x, p.y)) {
      if (rel >= lineAt(p.y)) this.hover(rel, p.y, t);
      else if (p.moved && Math.hypot(p.vx, p.vy) > 1) this.pushes.push({ x: p.x, y: p.y, vx: p.vx, vy: p.vy });
    }
    p.moved = false;

    this.settle(t);
  }

  // ---- flickering digits ---------------------------------------------------------

  /** Sets the binary cells around the cursor flickering. */
  private hover(rel: number, y: number, t: number) {
    const g = this.grid;
    const l = this.layout;
    if (!g || !l) return;
    const H = TOUCH.hover;
    const pc = rel / l.cellW;
    const pr = (y - l.gridY) / l.cellH;
    for (let r = Math.floor(pr - H.rows); r <= Math.ceil(pr + H.rows); r++) {
      if (r < 0 || r >= g.rows) continue;
      for (let c = Math.floor(pc - H.cols); c <= Math.ceil(pc + H.cols); c++) {
        const i = c - g.c0;
        if (i < 0 || i >= g.cols) continue;
        const idx = r * g.cols + i;
        if (!g.cells[idx]) continue;
        const dx = (c + 0.5 - pc) / H.cols;
        const dy = (r + 0.5 - pr) / H.rows;
        if (dx * dx + dy * dy > 1) continue;
        this.settleAt[idx] = t + H.linger;
        if (!this.flicker[idx]) {
          this.flicker[idx] = 255;
          this.flickering.add(idx);
          this.flickerDirty = true;
        }
      }
    }
  }

  /** Cells the cursor has left settle back to their own digit. */
  private settle(t: number) {
    for (const idx of this.flickering) {
      if (t >= this.settleAt[idx]) {
        this.flicker[idx] = 0;
        this.flickering.delete(idx);
        this.flickerDirty = true;
      }
    }
  }
}
