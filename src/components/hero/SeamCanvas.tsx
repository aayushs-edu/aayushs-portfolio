"use client";

import { useEffect, useRef, useState } from "react";
import split from "./SplitHero.module.css";
import { NAME, type Tier } from "./heroConfig";
import { MASK_UNITS, NameMask } from "./nameMask";
import { lineSpan, SeamState, spans, tilt } from "./seamField";
import { SEAM_FRAGMENT, SEAM_VERTEX } from "./seamShader";
import { BITS, GRID, SEAM, type SplitLayout } from "./splitConfig";

function rgb(color: string): [number, number, number] {
  const n = parseInt(color.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const UNIFORMS = [
  "uRes", "uDpr", "uSeam", "uUnit", "uCell", "uFrame", "uTime", "uCount",
  "uA", "uB", "uC", "uPalette", "uBitPalette", "uBead", "uBeadSwell", "uBlend",
  "uGlyphs", "uGlyphRes", "uGlyphSlot", "uPopCount", "uPop", "uBitShape", "uBurst", "uBitTime", "uBitRows", "uLine",
  "uNameOn", "uBox", "uLetters",
] as const;
type UniformName = (typeof UNIFORMS)[number];

/** Raw WebGL2: the seam's program, a two-glyph atlas, and the name's masks. */
class SeamRenderer {
  /** Called whenever the masks are (re)built. */
  onName: (() => void) | null = null;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private atlas: WebGLTexture;
  private loc = {} as Record<UniformName, WebGLUniformLocation | null>;
  private layout: SplitLayout | null = null;
  private dpr = 1;
  private mono = "monospace";
  private poppins: string | null = null;
  private name: NameMask;
  private last: [number, SeamState] | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) throw new Error("no webgl2");
    this.gl = gl;
    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
        throw new Error(`seam shader: ${gl.getShaderInfoLog(shader)}`);
      }
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, SEAM_VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, SEAM_FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
      throw new Error(`seam program: ${gl.getProgramInfoLog(program)}`);
    }
    this.program = program;
    this.vao = gl.createVertexArray()!;
    this.atlas = gl.createTexture()!;
    for (const name of UNIFORMS) this.loc[name] = gl.getUniformLocation(program, name);

    gl.useProgram(program);
    gl.uniform3fv(this.loc.uPalette, SEAM.palette.flatMap(rgb));
    gl.uniform3fv(this.loc.uBitPalette, BITS.palette.flatMap(rgb));
    gl.uniform4f(this.loc.uBitShape, BITS.spread, BITS.rowChance, BITS.maxLength, BITS.flipRate);
    gl.uniform4f(this.loc.uBitTime, BITS.burstTime, BITS.life[0], BITS.life[1], BITS.cool);
    gl.uniform1i(this.loc.uGlyphs, 0);
    gl.uniform1i(this.loc.uLetters, MASK_UNITS.letters);
    this.name = new NameMask(gl);
  }

  setLayout(layout: SplitLayout, dpr: number) {
    this.layout = layout;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(layout.w * dpr));
    this.canvas.height = Math.max(1, Math.round(layout.h * dpr));
    const { gl, loc } = this;
    const line = tilt(layout);
    const rows = spans(layout).bits.map((y) => Math.floor(y / layout.cellH));
    gl.useProgram(this.program);
    gl.uniform2f(loc.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(loc.uDpr, dpr);
    gl.uniform1f(loc.uSeam, layout.seamX);
    gl.uniform1f(loc.uUnit, layout.u);
    gl.uniform2f(loc.uCell, layout.cellW, layout.cellH);
    gl.uniform3f(loc.uFrame, line.centreY, line.cos, line.sin);
    gl.uniform2f(loc.uBitRows, rows[0], rows[1]);
    const [lineStart, lineEnd] = lineSpan(layout);
    gl.uniform4f(loc.uLine, lineStart, lineEnd, Math.max(0.6, SEAM.line.width * layout.u), SEAM.line.alpha);
    gl.uniform4f(loc.uBurst, BITS.burst[0] * layout.u, BITS.burst[1] * layout.u, BITS.drift[0] * layout.u, BITS.drift[1] * layout.u);
    gl.uniform1f(loc.uBead, SEAM.bead * layout.u);
    gl.uniform1f(loc.uBeadSwell, SEAM.beadSwell * layout.u);
    gl.uniform1f(loc.uBlend, SEAM.blend * layout.u);
    this.buildAtlas();
    this.buildName();
  }

  setFont(mono: string) {
    this.mono = mono;
    this.buildAtlas();
    this.redraw();
  }

  /** Poppins is in: build the name's masks. */
  setPoppins(family: string) {
    this.poppins = family;
    this.buildName();
    this.redraw();
  }

  /** "0" and "1" in the grid's face, one cell each, at device resolution. */
  private buildAtlas() {
    const layout = this.layout;
    if (!layout) return;
    const { gl, dpr } = this;
    const slot = Math.ceil(layout.cellW * dpr) + 2;
    const height = Math.ceil(layout.cellH * dpr);
    const c = document.createElement("canvas");
    c.width = slot * 2;
    c.height = height;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const size = NAME.binaryFont * layout.u * dpr;
    ctx.font = `600 ${size}px ${this.mono}`;
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "alphabetic";
    const baseline = ((GRID.cellH - NAME.binaryFont) / 2 + NAME.binaryFont * 0.8) * layout.u * dpr;
    ctx.fillText("0", 0, baseline);
    ctx.fillText("1", slot, baseline);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.useProgram(this.program);
    gl.uniform2f(this.loc.uGlyphRes, c.width, c.height);
    gl.uniform1f(this.loc.uGlyphSlot, slot);
  }

  private buildName() {
    const { layout, poppins, name, gl, loc } = this;
    if (!layout || !poppins || !name.setName(poppins, layout, this.dpr)) return;
    const box = name.box(layout);
    gl.useProgram(this.program);
    gl.uniform4f(loc.uBox, box.x, box.y, box.w, box.h);
    this.onName?.();
  }

  private redraw() {
    if (this.last) this.render(...this.last);
  }

  /** Draws one frame (seam time `t`) from the seam's state. */
  render(t: number, state: SeamState) {
    const { gl, loc, layout, name } = this;
    if (!layout || gl.isContextLost()) return;
    this.last = [t, state];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    gl.uniform1f(loc.uTime, t);
    gl.uniform1i(loc.uCount, state.count);
    gl.uniform4fv(loc.uA, state.streams.a);
    gl.uniform4fv(loc.uB, state.streams.b);
    gl.uniform4fv(loc.uC, state.streams.c);
    gl.uniform1i(loc.uPopCount, state.pops.count);
    gl.uniform4fv(loc.uPop, state.pops.p);
    gl.uniform1f(loc.uNameOn, name.ready ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    name.bindTextures();
    gl.bindVertexArray(this.vao);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() {
    const { gl } = this;
    this.name.destroy();
    gl.deleteTexture(this.atlas);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
  }
}

interface SeamCanvasProps {
  tier: Tier;
  layout: SplitLayout | null;
  /** WebGL2 failed or its context was lost. */
  onFail?: () => void;
}

/**
 * The seam, seen through the name: paint floating out of the left of a tilted
 * line and bits out of its right, drawn only inside the letters. Loops
 * forever; pauses off screen; a single still frame with reduced motion. It
 * fades in once the name's masks are ready. Without WebGL2 it calls `onFail`
 * and draws nothing.
 */
export default function SeamCanvas({ tier, layout, onFail }: SeamCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<SeamRenderer | null>(null);
  const stateRef = useRef<SeamState | null>(null);
  const timeRef = useRef<number>(SEAM.stillTime);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  // The renderer lives as long as the canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: SeamRenderer;
    try {
      renderer = new SeamRenderer(canvas);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.warn(error);
      setFailed(true);
      return;
    }
    rendererRef.current = renderer;
    renderer.onName = () => setReady(true);
    const onLost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
    };
    canvas.addEventListener("webglcontextlost", onLost);
    const style = getComputedStyle(canvas);
    const mono = style.getPropertyValue("--font-geist-mono").trim() || "monospace";
    const poppins = style.getPropertyValue("--font-poppins").trim() || "sans-serif";
    let cancelled = false;
    document.fonts.load(`600 12px ${mono}`).finally(() => {
      if (!cancelled) renderer.setFont(mono);
    });
    Promise.all([document.fonts.load(`800 64px ${poppins}`), document.fonts.ready]).finally(() => {
      if (!cancelled) renderer.setPoppins(poppins);
    });
    return () => {
      cancelled = true;
      canvas.removeEventListener("webglcontextlost", onLost);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  // Size and frame loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;
    const renderer = failed ? null : rendererRef.current;
    if (!renderer) return;
    renderer.setLayout(layout, Math.min(SEAM.dpr[tier], window.devicePixelRatio || 1));
    const state = (stateRef.current ??= new SeamState());
    const ribbons = SEAM.ribbons[tier];
    const emitters = BITS.emitters[tier];
    const draw = () => {
      state.update(timeRef.current, ribbons, emitters, layout);
      renderer.render(timeRef.current, state);
    };
    draw();
    // Reduced motion (and the first client render): one still frame.
    if (tier === "static") return;

    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      timeRef.current += Math.min(dt, SEAM.maxStep);
      draw();
      raf = requestAnimationFrame(frame);
    };
    const observer = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (entry.isIntersecting) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [layout, tier, failed]);

  const failRef = useRef(onFail);
  failRef.current = onFail;
  useEffect(() => {
    if (failed) failRef.current?.();
  }, [failed]);

  return <canvas ref={canvasRef} className={split.seam} aria-hidden="true" data-on={!failed && ready} />;
}
