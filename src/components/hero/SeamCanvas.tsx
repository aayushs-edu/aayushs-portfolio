"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import split from "./SplitHero.module.css";
import { NAME, type Tier } from "./heroConfig";
import { NAME_UNITS, NameGL } from "./nameGL";
import type { BinaryGrid } from "./nameRaster";
import type { NameTouch } from "./nameTouch";
import { clipPaths, curveAt, openFor, SeamState } from "./seamField";
import { SEAM_FRAGMENT, SEAM_VERTEX } from "./seamShader";
import { BITS, GRID, SEAM, type SplitLayout } from "./splitConfig";

function rgb(color: string): [number, number, number] {
  const n = parseInt(color.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** The binary name's cell colour (matches .binaryBacking in Hero.module.css). */
const NAME_BACKING = "#191817";

const UNIFORMS = [
  "uRes", "uDpr", "uSeam", "uUnit", "uCell", "uGridY", "uTime", "uCount", "uCurve", "uHeight",
  "uA", "uB", "uC", "uPalette", "uBead", "uBeadSwell", "uBlend",
  "uGlyphs", "uGlyphRes", "uGlyphSlot", "uPopCount", "uPop", "uBitShape", "uBurst", "uBitTime", "uOpen",
  "uNameOn", "uFlowOn", "uBox", "uGridInfo", "uNameInk", "uNameBacking", "uNamePaint", "uNameMask", "uNameHoles", "uFlow",
] as const;
type UniformName = (typeof UNIFORMS)[number];

/** Raw WebGL2: the seam's program, a two-glyph atlas, and the name (textures, fluid, loose digits). */
class SeamRenderer {
  /** Called with the binary grid whenever the name is (re)built. */
  onName: ((grid: BinaryGrid) => void) | null = null;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private atlas: WebGLTexture;
  private atlasSize = { w: 1, h: 1, slot: 1 };
  private loc = {} as Record<UniformName, WebGLUniformLocation | null>;
  private layout: SplitLayout | null = null;
  private dpr = 1;
  private mono = "monospace";
  private poppins: string | null = null;
  private name: NameGL | null = null;
  private last: [number, SeamState, NameTouch | undefined, number] | null = null;

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
    gl.uniform4f(this.loc.uBitShape, BITS.spread, BITS.rowChance, BITS.maxLength, BITS.flipRate);
    gl.uniform4f(this.loc.uBitTime, BITS.burstTime, BITS.life[0], BITS.life[1], BITS.cool);
    gl.uniform1i(this.loc.uGlyphs, 0);
    gl.uniform1i(this.loc.uNamePaint, NAME_UNITS.paint);
    gl.uniform1i(this.loc.uNameMask, NAME_UNITS.mask);
    gl.uniform1i(this.loc.uNameHoles, NAME_UNITS.holes);
    gl.uniform1i(this.loc.uFlow, NAME_UNITS.flow);
    gl.uniform3f(this.loc.uNameInk, ...rgb(NAME.paint));
    gl.uniform3f(this.loc.uNameBacking, ...rgb(NAME_BACKING));

    try {
      this.name = new NameGL(gl);
    } catch (error) {
      // The seam still runs; the DOM name stays.
      if (process.env.NODE_ENV !== "production") console.warn(error);
    }
  }

  setLayout(layout: SplitLayout, dpr: number) {
    this.layout = layout;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(layout.w * dpr));
    this.canvas.height = Math.max(1, Math.round(layout.h * dpr));
    const { gl, loc } = this;
    gl.useProgram(this.program);
    gl.uniform2f(loc.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(loc.uDpr, dpr);
    gl.uniform1f(loc.uSeam, layout.seamX);
    gl.uniform1f(loc.uUnit, layout.u);
    gl.uniform2f(loc.uCell, layout.cellW, layout.cellH);
    gl.uniform1f(loc.uGridY, layout.gridY);
    gl.uniform1f(loc.uHeight, layout.h);
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

  /** Poppins is in: build the name's textures. */
  setPoppins(family: string) {
    this.poppins = family;
    this.buildName();
    this.redraw();
  }

  /** "0" and "1" in the binary name's face, one cell each, at device resolution. */
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
    this.atlasSize = { w: c.width, h: c.height, slot };
    gl.useProgram(this.program);
    gl.uniform2f(this.loc.uGlyphRes, c.width, c.height);
    gl.uniform1f(this.loc.uGlyphSlot, slot);
  }

  private buildName() {
    const { layout, poppins, name, gl, loc } = this;
    if (!layout || !poppins || !name) return;
    const grid = name.setName(poppins, layout, this.dpr);
    if (!grid) return;
    const box = name.box(layout);
    gl.useProgram(this.program);
    gl.uniform4f(loc.uBox, box.x, box.y, box.w, box.h);
    gl.uniform3f(loc.uGridInfo, grid.c0, grid.cols, grid.rows);
    this.onName?.(grid);
  }

  private redraw() {
    if (this.last) this.render(this.last[0], 0, this.last[1], this.last[2], this.last[3]);
  }

  /**
   * Draws one frame (seam time `t`, `dt` since the last) from the seam's state
   * and the name's touch, with the halves `open` CSS px apart from the line.
   */
  render(t: number, dt: number, state: SeamState, touch?: NameTouch, open = 0) {
    const { gl, loc, layout, name } = this;
    if (!layout || gl.isContextLost()) return;
    this.last = [t, state, touch, open];
    const nameOn = !!name?.ready;
    if (nameOn) name!.update(dt, t, touch, layout);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    gl.uniform1f(loc.uTime, t);
    gl.uniform1i(loc.uCount, state.count);
    gl.uniform4fv(loc.uCurve, state.curve);
    gl.uniform4fv(loc.uA, state.streams.a);
    gl.uniform4fv(loc.uB, state.streams.b);
    gl.uniform4fv(loc.uC, state.streams.c);
    gl.uniform1f(loc.uOpen, open);
    gl.uniform1i(loc.uPopCount, state.pops.count);
    gl.uniform4fv(loc.uPop, state.pops.p);
    gl.uniform1f(loc.uNameOn, nameOn ? 1 : 0);
    gl.uniform1f(loc.uFlowOn, nameOn ? name!.flowAmount : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    if (nameOn) name!.bindTextures();
    gl.bindVertexArray(this.vao);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (nameOn && touch) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.atlas);
      name!.drawBits(touch, state.curve, layout, this.canvas, this.dpr, this.atlasSize, open);
    }
  }

  destroy() {
    const { gl } = this;
    this.name?.destroy();
    gl.deleteTexture(this.atlas);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
  }
}

interface SeamCanvasProps {
  tier: Tier;
  layout: SplitLayout | null;
  /** Gets --seam-left / --seam-right: clip-paths for each side of the line, every frame. */
  clipRef: RefObject<HTMLElement | null>;
  /** Touching the name: it bends the line, flows, and its binary cells come loose. */
  touch?: NameTouch;
  /** Called once the canvas draws the name itself (the DOM name can hide). */
  onNameReady?: () => void;
  /** How far the hero has torn open, 0..1 (read every frame). The stage also gets --open (px) and --entrance. */
  entrance?: { readonly current: number };
  /** Stop the frame loop (the hero is hidden). */
  paused?: boolean;
}

/**
 * The living seam: a fluid line with paint floating out of its left side and
 * bits out of its right, and the name drawn over both halves, fluid to the
 * touch. It also drives the clip-paths that split the wall on the same line.
 * Loops forever; pauses off screen; a single still frame with reduced motion.
 * Without WebGL2 the line still moves and the DOM name stays; only the paint,
 * the bits and the touch effects are missing.
 */
export default function SeamCanvas({ tier, layout, clipRef, touch: touchState, onNameReady, entrance, paused = false }: SeamCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<SeamRenderer | null>(null);
  const stateRef = useRef<SeamState | null>(null);
  const timeRef = useRef<number>(SEAM.stillTime);
  const [failed, setFailed] = useState(false);
  const readyRef = useRef(onNameReady);
  readyRef.current = onNameReady;
  const entranceRef = useRef(entrance);
  entranceRef.current = entrance;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  /** Restarts the frame loop (set by the loop's effect). */
  const resumeRef = useRef<(() => void) | null>(null);

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
    renderer.onName = (grid) => {
      touchState?.setGrid(grid);
      readyRef.current?.();
    };
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
  }, [touchState]);

  // Size and frame loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const target = clipRef.current;
    if (!canvas || !target || !layout) return;
    const renderer = failed ? null : rendererRef.current;
    // Reduced motion: no loop, so no touching either.
    const touch = tier === "static" ? undefined : touchState;
    touch?.setLayout(layout);
    renderer?.setLayout(layout, Math.min(SEAM.dpr[tier], window.devicePixelRatio || 1));
    const state = (stateRef.current ??= new SeamState());
    const ribbons = SEAM.ribbons[tier];
    const emitters = BITS.emitters[tier];
    const draw = (dt = 0) => {
      const t = timeRef.current;
      const e = entranceRef.current?.current ?? 0;
      const open = openFor(e, layout);
      touch?.step(dt, t, (y) => curveAt(state.curve, y, layout.h));
      state.update(t, ribbons, emitters, layout, touch);
      renderer?.render(t, dt, state, touch, open);
      const clip = clipPaths(state.curve, layout);
      target.style.setProperty("--seam-left", clip.left);
      target.style.setProperty("--seam-right", clip.right);
      target.style.setProperty("--open", `${open.toFixed(2)}px`);
      target.style.setProperty("--entrance", e.toFixed(4));
    };
    draw();
    // Reduced motion (and the first client render): one still frame.
    if (tier === "static") return;

    let raf = 0;
    let last = 0;
    let visible = true;
    const frame = (now: number) => {
      if (pausedRef.current) {
        raf = 0;
        return;
      }
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      const step = Math.min(dt, SEAM.maxStep);
      timeRef.current += step;
      draw(step);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf || !visible || pausedRef.current) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    observer.observe(canvas);
    resumeRef.current = start;
    start();
    return () => {
      resumeRef.current = null;
      observer.disconnect();
      stop();
    };
  }, [layout, tier, failed, clipRef, touchState]);

  // Unpausing restarts the loop where it left off.
  useEffect(() => {
    if (!paused) resumeRef.current?.();
  }, [paused]);

  return <canvas ref={canvasRef} className={split.seam} aria-hidden="true" data-on={!failed && !!layout} />;
}
