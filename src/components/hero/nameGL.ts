// The name in WebGL: its textures, the fluid it flows through, and the loose
// digits knocked off its binary letters. Shares the seam's WebGL2 context.
//
// The fluid is a small stable-fluids simulation over the title box (velocity,
// pressure projection, so the flow swirls rather than smears). Alongside it
// runs a map from each point to where its paint came from: advected by the
// flow and relaxed back to "here" every frame, so pushed letters flow back into
// shape. The seam shader draws the painted name through that map, and picks
// each binary cell's digit from the cell the map points at.

import { DESIGN, NAME } from "./heroConfig";
import type { NameTouch, Push } from "./nameTouch";
import { buildBinaryGrid, paintNameCanvas, type BinaryGrid } from "./nameRaster";
import { CURVE_GLSL } from "./seamShader";
import { TOUCH, type SplitLayout } from "./splitConfig";

const QUAD_VS = /* glsl */ `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

const HEAD = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
`;

// Velocities are CSS px/s; positions are uv over the title box.
const SPLAT = HEAD + /* glsl */ `
uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform vec2 uForce;
uniform vec2 uRadius;
void main() {
  vec2 d = (vUv - uPoint) / uRadius;
  o = vec4(texture(uTarget, vUv).xy + uForce * exp(-dot(d, d)), 0.0, 1.0);
}
`;

const ADVECT = HEAD + /* glsl */ `
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uBoxPx;
uniform float uDt;
uniform float uKeep;
void main() {
  vec2 back = vUv - uDt * texture(uVelocity, vUv).xy / uBoxPx;
  o = vec4(texture(uSource, back).xy * uKeep, 0.0, 1.0);
}
`;

// Where the paint here came from: carried by the flow, and drawn back home.
const ADVECT_MAP = HEAD + /* glsl */ `
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uBoxPx;
uniform float uDt;
uniform float uReform;
void main() {
  vec2 back = vUv - uDt * texture(uVelocity, vUv).xy / uBoxPx;
  o = vec4(mix(texture(uSource, back).xy, vUv, uReform), 0.0, 1.0);
}
`;

const DIVERGENCE = HEAD + /* glsl */ `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  o = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}
`;

const PRESSURE = HEAD + /* glsl */ `
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  o = vec4((l + r + b + t - texture(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0);
}
`;

const GRADIENT = HEAD + /* glsl */ `
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  o = vec4(texture(uVelocity, vUv).xy - 0.5 * vec2(r - l, t - b), 0.0, 1.0);
}
`;

const FILL = HEAD + /* glsl */ `
uniform float uIdentity;
void main() {
  o = vec4(vUv * uIdentity, 0.0, 1.0);
}
`;

// Loose digits: one instanced quad per digit.
const BITS_VS = /* glsl */ `#version 300 es
layout(location = 0) in vec4 aBit; // x, y (canvas CSS px, top-left), digit, opacity
uniform vec2 uRes;
uniform float uDpr;
uniform vec2 uCell;
out vec2 vLocal;
out vec2 vPos;
flat out float vDigit;
out float vAlpha;
void main() {
  int v = gl_VertexID;
  vec2 corner = vec2(v == 1 || v == 4 || v == 5 ? 1.0 : 0.0, v == 2 || v == 3 || v == 5 ? 1.0 : 0.0);
  vec2 pos = aBit.xy + corner * uCell;
  vPos = pos;
  vLocal = corner * uCell * uDpr;
  vDigit = aBit.z;
  vAlpha = aBit.w;
  gl_Position = vec4(pos.x * uDpr / uRes.x * 2.0 - 1.0, 1.0 - pos.y * uDpr / uRes.y * 2.0, 0.0, 1.0);
}
`;

const BITS_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vLocal;
in vec2 vPos;
flat in float vDigit;
in float vAlpha;
uniform sampler2D uGlyphs;
uniform vec2 uGlyphRes;
uniform float uGlyphSlot;
uniform float uSeam;
uniform vec3 uInk;
${CURVE_GLSL}
out vec4 o;
void main() {
  // Loose digits stay on the binary side of the line.
  if (vPos.x - uSeam < curveAt(vPos.y)) discard;
  float g = texture(uGlyphs, (vec2(vDigit * uGlyphSlot, 0.0) + vLocal) / uGlyphRes).a * vAlpha;
  o = vec4(uInk * g, g);
}
`;

type Program = { program: WebGLProgram; loc: (name: string) => WebGLUniformLocation | null };

function program(gl: WebGL2RenderingContext, vs: string, fs: string): Program {
  const compile = (type: number, src: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(`name shader: ${gl.getShaderInfoLog(shader)}`);
    return shader;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(`name program: ${gl.getProgramInfoLog(p)}`);
  const cache = new Map<string, WebGLUniformLocation | null>();
  return {
    program: p,
    loc: (name) => {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(p, name));
      return cache.get(name)!;
    },
  };
}

interface Target {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
}

function rgb(color: string): [number, number, number] {
  const n = parseInt(color.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** A small stable-fluids simulation over the title box. */
class Fluid {
  w: number;
  h: number;
  private velocity: [Target, Target];
  private map: [Target, Target];
  private pressure: [Target, Target];
  private divergence: Target;
  private p: Record<"splat" | "advect" | "advectMap" | "divergence" | "pressure" | "gradient" | "fill", Program>;

  constructor(
    private gl: WebGL2RenderingContext,
    private vao: WebGLVertexArrayObject,
    aspect: number,
  ) {
    this.w = TOUCH.fluid.resolution;
    this.h = Math.max(8, Math.round(this.w / aspect));
    const rg = () => this.target(gl.RG16F, gl.RG);
    const r = () => this.target(gl.R16F, gl.RED);
    this.velocity = [rg(), rg()];
    this.map = [rg(), rg()];
    this.pressure = [r(), r()];
    this.divergence = r();
    this.p = {
      splat: program(gl, QUAD_VS, SPLAT),
      advect: program(gl, QUAD_VS, ADVECT),
      advectMap: program(gl, QUAD_VS, ADVECT_MAP),
      divergence: program(gl, QUAD_VS, DIVERGENCE),
      pressure: program(gl, QUAD_VS, PRESSURE),
      gradient: program(gl, QUAD_VS, GRADIENT),
      fill: program(gl, QUAD_VS, FILL),
    };
    this.reset();
  }

  /** The map texture (where each point's paint came from). */
  get mapTexture() {
    return this.map[0].tex;
  }

  /** Still water, everything where it belongs. */
  reset() {
    const { gl } = this;
    this.begin();
    const fill = this.p.fill;
    gl.useProgram(fill.program);
    for (const [target, identity] of [
      [this.velocity[0], 0],
      [this.velocity[1], 0],
      [this.pressure[0], 0],
      [this.pressure[1], 0],
      [this.map[0], 1],
      [this.map[1], 1],
    ] as [Target, number][]) {
      gl.uniform1f(fill.loc("uIdentity"), identity);
      this.draw(target);
    }
  }

  /** One step: push, project (so it swirls), carry the flow and the paint, settle. */
  step(dt: number, pushes: Push[], box: { x: number; y: number; w: number; h: number }, u: number) {
    const { gl, p } = this;
    const F = TOUCH.fluid;
    const texel = [1 / this.w, 1 / this.h] as const;
    this.begin();

    const radius = F.radius * u;
    for (const push of pushes) {
      const speed = Math.hypot(push.vx, push.vy);
      const k = (F.force * Math.min(speed, 2400)) / Math.max(speed, 1);
      gl.useProgram(p.splat.program);
      this.bind(0, this.velocity[0].tex, p.splat.loc("uTarget"));
      gl.uniform2f(p.splat.loc("uPoint"), (push.x - box.x) / box.w, (push.y - box.y) / box.h);
      gl.uniform2f(p.splat.loc("uForce"), push.vx * k, push.vy * k);
      gl.uniform2f(p.splat.loc("uRadius"), radius / box.w, radius / box.h);
      this.draw(this.velocity[1]);
      this.velocity.reverse();
    }

    gl.useProgram(p.divergence.program);
    this.bind(0, this.velocity[0].tex, p.divergence.loc("uVelocity"));
    gl.uniform2f(p.divergence.loc("uTexel"), ...texel);
    this.draw(this.divergence);

    gl.useProgram(p.pressure.program);
    gl.uniform2f(p.pressure.loc("uTexel"), ...texel);
    this.bind(1, this.divergence.tex, p.pressure.loc("uDivergence"));
    for (let i = 0; i < F.pressureIterations; i++) {
      this.bind(0, this.pressure[0].tex, p.pressure.loc("uPressure"));
      this.draw(this.pressure[1]);
      this.pressure.reverse();
    }

    gl.useProgram(p.gradient.program);
    gl.uniform2f(p.gradient.loc("uTexel"), ...texel);
    this.bind(0, this.pressure[0].tex, p.gradient.loc("uPressure"));
    this.bind(1, this.velocity[0].tex, p.gradient.loc("uVelocity"));
    this.draw(this.velocity[1]);
    this.velocity.reverse();

    gl.useProgram(p.advect.program);
    gl.uniform2f(p.advect.loc("uBoxPx"), box.w, box.h);
    gl.uniform1f(p.advect.loc("uDt"), dt);
    gl.uniform1f(p.advect.loc("uKeep"), Math.exp(-dt * F.settle));
    this.bind(0, this.velocity[0].tex, p.advect.loc("uVelocity"));
    this.bind(1, this.velocity[0].tex, p.advect.loc("uSource"));
    this.draw(this.velocity[1]);
    this.velocity.reverse();

    gl.useProgram(p.advectMap.program);
    gl.uniform2f(p.advectMap.loc("uBoxPx"), box.w, box.h);
    gl.uniform1f(p.advectMap.loc("uDt"), dt);
    gl.uniform1f(p.advectMap.loc("uReform"), 1 - Math.exp(-dt * F.reform));
    this.bind(0, this.velocity[0].tex, p.advectMap.loc("uVelocity"));
    this.bind(1, this.map[0].tex, p.advectMap.loc("uSource"));
    this.draw(this.map[1]);
    this.map.reverse();
  }

  destroy() {
    const { gl } = this;
    for (const t of [...this.velocity, ...this.map, ...this.pressure, this.divergence]) {
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fbo);
    }
    for (const prog of Object.values(this.p)) gl.deleteProgram(prog.program);
  }

  private target(internal: number, format: number): Target {
    const { gl } = this;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, this.w, this.h, 0, format, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("fluid: framebuffer incomplete");
    return { tex, fbo };
  }

  private begin() {
    const { gl } = this;
    gl.disable(gl.BLEND);
    gl.viewport(0, 0, this.w, this.h);
    gl.bindVertexArray(this.vao);
  }

  private bind(unit: number, tex: WebGLTexture, loc: WebGLUniformLocation | null) {
    const { gl } = this;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(loc, unit);
  }

  private draw(target: Target) {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

/** Texture units the seam shader reads the name from. */
export const NAME_UNITS = { paint: 1, mask: 2, holes: 3, flow: 4 } as const;

export class NameGL {
  grid: BinaryGrid | null = null;
  ready = false;
  private paintTex: WebGLTexture;
  private maskTex: WebGLTexture;
  private holesTex: WebGLTexture;
  private vao: WebGLVertexArrayObject;
  private fluid: Fluid | null = null;
  private fluidFailed = false;
  private lastPush = -Infinity;
  private flowing = false;
  private family: string | null = null;
  private scale = 0;
  private bitsProgram: Program;
  private bitsVao: WebGLVertexArrayObject;
  private bitsBuffer: WebGLBuffer;

  constructor(private gl: WebGL2RenderingContext) {
    this.vao = gl.createVertexArray()!;
    this.paintTex = this.texture(gl.LINEAR);
    this.maskTex = this.texture(gl.NEAREST);
    this.holesTex = this.texture(gl.NEAREST);
    // Half-float render targets for the fluid; without them the name stays still.
    if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) this.fluidFailed = true;

    this.bitsProgram = program(gl, BITS_VS, BITS_FS);
    this.bitsVao = gl.createVertexArray()!;
    this.bitsBuffer = gl.createBuffer()!;
    gl.bindVertexArray(this.bitsVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bitsBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
    gl.vertexAttribDivisor(0, 1);
    gl.bindVertexArray(null);
  }

  /** Is the flow moving (so the shader should read it)? */
  get flowOn() {
    return this.flowing && !!this.fluid;
  }

  /** Builds (or rebuilds, when the scale changes) the name's textures and the fluid. Returns the binary grid. */
  setName(family: string, layout: SplitLayout, dpr: number): BinaryGrid | null {
    const { gl } = this;
    const scale = layout.u * dpr;
    if (family === this.family && Math.abs(scale - this.scale) < 1e-3 && this.ready) return this.grid;
    this.family = family;
    this.scale = scale;

    const paint = paintNameCanvas(family, scale);
    const grid = buildBinaryGrid(family);
    if (!paint || !grid) return null;
    gl.activeTexture(gl.TEXTURE0 + NAME_UNITS.paint);
    gl.bindTexture(gl.TEXTURE_2D, this.paintTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, paint);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    // Cells: 0 none, 127 a "0", 255 a "1".
    const mask = new Uint8Array(grid.cells.length);
    for (let i = 0; i < mask.length; i++) mask[i] = grid.cells[i] === 0 ? 0 : grid.cells[i] === 1 ? 127 : 255;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.activeTexture(gl.TEXTURE0 + NAME_UNITS.mask);
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, grid.cols, grid.rows, 0, gl.RED, gl.UNSIGNED_BYTE, mask);
    gl.activeTexture(gl.TEXTURE0 + NAME_UNITS.holes);
    gl.bindTexture(gl.TEXTURE_2D, this.holesTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, grid.cols, grid.rows, 0, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array(grid.cells.length));
    this.grid = grid;

    if (!this.fluid && !this.fluidFailed) {
      try {
        this.fluid = new Fluid(gl, this.vao, DESIGN.titleBox.w / DESIGN.titleBox.h);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") console.warn(error);
        this.fluidFailed = true;
      }
    }
    this.ready = true;
    return grid;
  }

  /** Runs the flow for this frame (and uploads knocked-out cells). Leaves the default framebuffer bound. */
  update(dt: number, t: number, touch: NameTouch | undefined, layout: SplitLayout) {
    const { gl } = this;
    if (touch?.holesDirty && this.grid && touch.holes.length === this.grid.cells.length) {
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.activeTexture(gl.TEXTURE0 + NAME_UNITS.holes);
      gl.bindTexture(gl.TEXTURE_2D, this.holesTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.grid.cols, this.grid.rows, gl.RED, gl.UNSIGNED_BYTE, touch.holes);
      touch.holesDirty = false;
    }
    const pushes = touch?.pushes ?? [];
    if (pushes.length) this.lastPush = t;
    this.flowing = t - this.lastPush < TOUCH.fluid.idle;
    if (this.fluid && this.flowing && dt > 0) this.fluid.step(dt, pushes, this.box(layout), layout.u);
    if (touch) touch.pushes.length = 0;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** Where the title box is on the canvas (CSS px). */
  box(layout: SplitLayout) {
    const { titleBox } = DESIGN;
    return { x: layout.seamX - (DESIGN.cx - titleBox.x) * layout.u, y: layout.gridY, w: titleBox.w * layout.u, h: titleBox.h * layout.u };
  }

  /** Binds the name's textures to their units. */
  bindTextures() {
    const { gl } = this;
    const pairs: [number, WebGLTexture][] = [
      [NAME_UNITS.paint, this.paintTex],
      [NAME_UNITS.mask, this.maskTex],
      [NAME_UNITS.holes, this.holesTex],
      [NAME_UNITS.flow, this.fluid?.mapTexture ?? this.maskTex],
    ];
    for (const [unit, tex] of pairs) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
    }
  }

  /** Draws the loose digits over the binary side (glyph atlas on unit 0). */
  drawBits(touch: NameTouch, curve: Float32Array, layout: SplitLayout, canvas: { width: number; height: number }, dpr: number, glyph: { w: number; h: number; slot: number }) {
    if (!touch.bitCount) return;
    const { gl } = this;
    const { program: prog, loc } = this.bitsProgram;
    gl.useProgram(prog);
    gl.uniform2f(loc("uRes"), canvas.width, canvas.height);
    gl.uniform1f(loc("uDpr"), dpr);
    gl.uniform2f(loc("uCell"), layout.cellW, layout.cellH);
    gl.uniform1f(loc("uSeam"), layout.seamX);
    gl.uniform1f(loc("uHeight"), layout.h);
    gl.uniform4fv(loc("uCurve"), curve);
    gl.uniform3f(loc("uInk"), ...rgb(NAME.paint));
    gl.uniform1i(loc("uGlyphs"), 0);
    gl.uniform2f(loc("uGlyphRes"), glyph.w, glyph.h);
    gl.uniform1f(loc("uGlyphSlot"), glyph.slot);
    gl.bindVertexArray(this.bitsVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bitsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, touch.bits.subarray(0, touch.bitCount * 4), gl.DYNAMIC_DRAW);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, touch.bitCount);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  destroy() {
    const { gl } = this;
    this.fluid?.destroy();
    for (const t of [this.paintTex, this.maskTex, this.holesTex]) gl.deleteTexture(t);
    gl.deleteVertexArray(this.vao);
    gl.deleteVertexArray(this.bitsVao);
    gl.deleteBuffer(this.bitsBuffer);
    gl.deleteProgram(this.bitsProgram.program);
  }

  private texture(filter: number): WebGLTexture {
    const { gl } = this;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    return tex;
  }
}
