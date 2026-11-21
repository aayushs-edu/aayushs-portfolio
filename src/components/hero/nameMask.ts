// The name's mask as a texture, in the seam's WebGL2 context: the letterforms
// the paint and the bits show through.

import { DESIGN } from "./heroConfig";
import { letterMaskCanvas } from "./nameRaster";
import type { SplitLayout } from "./splitConfig";

/** Texture units the seam shader reads the mask from. */
export const MASK_UNITS = { letters: 1 } as const;

export class NameMask {
  ready = false;
  private lettersTex: WebGLTexture;
  private family: string | null = null;
  private scale = 0;

  constructor(private gl: WebGL2RenderingContext) {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    this.lettersTex = tex;
  }

  /** Builds (or rebuilds, when the scale changes) the mask. False if it couldn't. */
  setName(family: string, layout: SplitLayout, dpr: number): boolean {
    const { gl } = this;
    const scale = layout.u * dpr;
    if (family === this.family && Math.abs(scale - this.scale) < 1e-3 && this.ready) return true;
    const letters = letterMaskCanvas(family, scale);
    if (!letters) return false;
    this.family = family;
    this.scale = scale;
    gl.activeTexture(gl.TEXTURE0 + MASK_UNITS.letters);
    gl.bindTexture(gl.TEXTURE_2D, this.lettersTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, letters);
    this.ready = true;
    return true;
  }

  /** Where the title box is on the canvas (CSS px). */
  box(layout: SplitLayout) {
    const { titleBox } = DESIGN;
    return { x: layout.seamX - (DESIGN.cx - titleBox.x) * layout.u, y: layout.gridY, w: titleBox.w * layout.u, h: titleBox.h * layout.u };
  }

  /** Binds the mask to its unit. */
  bindTextures() {
    this.gl.activeTexture(this.gl.TEXTURE0 + MASK_UNITS.letters);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.lettersTex);
  }

  destroy() {
    this.gl.deleteTexture(this.lettersTex);
  }
}
