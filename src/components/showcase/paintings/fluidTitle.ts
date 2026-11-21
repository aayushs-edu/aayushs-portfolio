// A painted heading made fluid: a small fluid simulation (fluid.ts) runs
// over the heading, and the painted word is
// drawn through its map, with the name's brushed edges. Moving through the
// word pushes the paint; it flows back into shape. Draws only while it flows.

import { FLUID, Fluid, type Push } from "./fluid";

const VS = /* glsl */ `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

// As the seam shader's paintedName: the paint carried by the flow, its edges a
// soft two-octave waver plus a fine grain (design px).
const FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPaint;
uniform sampler2D uFlow;
uniform float uFlowOn;
uniform vec2 uBox;
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  if (uFlowOn > 0.0) uv = mix(uv, texture(uFlow, uv).xy, uFlowOn);
  vec2 d = uv * uBox;
  vec2 waver = vec2(noise2(d * 0.016) + 0.5 * noise2(d * 0.032 + 9.1), noise2(d * 0.016 + 31.7) + 0.5 * noise2(d * 0.032 + 47.3)) / 1.5 - 0.5;
  vec2 grain = vec2(noise2(d * 0.11 + 7.3), noise2(d * 0.11 + 53.1)) - 0.5;
  o = texture(uPaint, uv + (waver * 10.0 + grain * 4.0) / uBox);
}
`;

export interface FluidTitleOptions {
  /** The heading's box in design px (the paint canvas covers exactly this). */
  box: { w: number; h: number };
  /** Paints the word into a 2D context already scaled and translated to design px. */
  paint: (ctx: CanvasRenderingContext2D) => void;
}

export class FluidTitle {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject;
  private program: WebGLProgram;
  private paintTex: WebGLTexture;
  private fluid: Fluid;
  private loc: Record<"paint" | "flow" | "flowOn" | "box", WebGLUniformLocation | null>;
  private css = { w: 0, h: 0 };
  private pushes: Push[] = [];
  private pointer = { x: 0, y: 0, vx: 0, vy: 0, at: 0, inside: false };
  private lastPush = -Infinity;
  private raf = 0;
  private last = 0;

  /** Throws if WebGL2 or float render targets aren't available (the caller keeps the SVG). */
  constructor(
    private canvas: HTMLCanvasElement,
    private opts: FluidTitleOptions,
  ) {
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) throw new Error("fluid title: no WebGL2");
    if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) throw new Error("fluid title: no float targets");
    this.gl = gl;
    this.vao = gl.createVertexArray()!;
    this.program = link(gl);
    this.loc = {
      paint: gl.getUniformLocation(this.program, "uPaint"),
      flow: gl.getUniformLocation(this.program, "uFlow"),
      flowOn: gl.getUniformLocation(this.program, "uFlowOn"),
      box: gl.getUniformLocation(this.program, "uBox"),
    };
    this.paintTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.paintTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.fluid = new Fluid(gl, this.vao, opts.box.w / opts.box.h);
  }

  /** Sizes the canvas to its CSS box and repaints the word at that scale. */
  resize(cssW: number, cssH: number, dpr: number) {
    const { gl, canvas, opts } = this;
    if (cssW < 1 || cssH < 1) return;
    this.css = { w: cssW, h: cssH };
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const paint = document.createElement("canvas");
    paint.width = canvas.width;
    paint.height = canvas.height;
    const ctx = paint.getContext("2d");
    if (!ctx) return;
    ctx.scale(paint.width / opts.box.w, paint.height / opts.box.h);
    opts.paint(ctx);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.paintTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, paint);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    this.draw(0);
  }

  /** The pointer moved over the canvas (CSS px from its top left), as the hero's NameTouch tracks it. */
  move(x: number, y: number) {
    const now = performance.now();
    const p = this.pointer;
    const dt = Math.max(1, now - p.at) / 1000;
    const k = Math.min(1, dt * 14);
    if (p.inside && dt < 0.2) {
      p.vx += ((x - p.x) / dt - p.vx) * k;
      p.vy += ((y - p.y) / dt - p.vy) * k;
    } else {
      p.vx = p.vy = 0;
    }
    Object.assign(p, { x, y, at: now, inside: true });
    if (Math.hypot(p.vx, p.vy) > 1) {
      this.pushes.push({ x, y, vx: p.vx, vy: p.vy });
      this.lastPush = now / 1000;
      if (!this.raf) {
        this.last = now;
        this.raf = requestAnimationFrame(this.frame);
      }
    }
  }

  leave() {
    this.pointer.inside = false;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    const { gl } = this;
    this.fluid.destroy();
    gl.deleteTexture(this.paintTex);
    gl.deleteProgram(this.program);
    gl.deleteVertexArray(this.vao);
  }

  private frame = (now: number) => {
    const { idle, fadeOut } = FLUID;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const flow = Math.min(1, Math.max(0, (idle - (now / 1000 - this.lastPush)) / fadeOut));
    if (flow > 0 && dt > 0) {
      const u = this.css.w / this.opts.box.w;
      this.fluid.step(dt, this.pushes, { x: 0, y: 0, w: this.css.w, h: this.css.h }, u);
    }
    this.pushes.length = 0;
    this.draw(flow);
    this.raf = flow > 0 ? requestAnimationFrame(this.frame) : 0;
  };

  private draw(flow: number) {
    const { gl, canvas, opts, loc } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.disable(gl.BLEND);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.paintTex);
    gl.uniform1i(loc.paint, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fluid.mapTexture);
    gl.uniform1i(loc.flow, 1);
    gl.uniform1f(loc.flowOn, flow);
    gl.uniform2f(loc.box, opts.box.w, opts.box.h);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

function link(gl: WebGL2RenderingContext): WebGLProgram {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`fluid title shader: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl.VERTEX_SHADER, VS));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`fluid title program: ${gl.getProgramInfoLog(p)}`);
  return p;
}
