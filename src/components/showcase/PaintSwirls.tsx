"use client";

import { useEffect, useRef } from "react";
import { NAME } from "../hero/heroConfig";
import css from "./PaintSwirls.module.css";

/** The vivid paints (red, orange, yellow, green, blue, pink), once the seam hero's ribbons'. */
const VIVID = ["#ff3b2f", "#ff8f1f", "#ffd21f", "#12c48b", "#2f6bff", "#ff2f8e"] as const;

/** Drawn at this share of the CSS size (it's soft anyway), and this often (ms). */
const RES = 0.5;
const FRAME_MS = 33;
/** How strong the paint is at its thickest (it's a background). */
const STRENGTH = 0.22;

const rgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const PALETTE = [NAME.paint, ...VIVID].map(rgb);

const VS = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

// Marbled paint: domain-warped noise (noise fed through noise, twice) gives
// the swirls; thin veins run along its contours; the warp picks the colour.
const FS = /* glsl */ `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;
uniform float uPx;
uniform float uUnit;
uniform float uTime;
uniform float uStrength;
uniform vec3 uPalette[${PALETTE.length}];
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
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise2(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    a *= 0.5;
  }
  return v;
}
vec3 palette(float x) {
  float n = float(${PALETTE.length});
  float f = fract(x) * n;
  int i = int(floor(f));
  return mix(uPalette[i], uPalette[(i + 1) % ${PALETTE.length}], smoothstep(0.0, 1.0, fract(f)));
}
void main() {
  // CSS px (y down) → swirl units, uUnit CSS px to a unit.
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uPx / uUnit;
  float t = uTime;
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.03)), fbm(p + vec2(5.2, 1.3) - t * 0.02));
  vec2 r = vec2(fbm(p + 3.5 * q + vec2(1.7, 9.2) + t * 0.025), fbm(p + 3.5 * q + vec2(8.3, 2.8)));
  float v = fbm(p + 3.5 * r);
  vec3 colour = palette(r.x * 1.6 + q.y * 0.8);
  float body = smoothstep(0.45, 0.8, v);
  float vein = pow(1.0 - abs(fract(v * 5.0) - 0.5) * 2.0, 14.0) * smoothstep(0.3, 0.6, v);
  float a = clamp(body * 0.7 + vein * 0.6, 0.0, 1.0) * uStrength;
  o = vec4(colour * a, a);
}
`;

/** Without a unit, a swirl unit is this share of the canvas height. */
const UNIT_OF_HEIGHT = 1 / 1.4;

/**
 * Faint marbled paint drifting in the background (a WebGL2 canvas, behind
 * whatever it sits under). It draws only while on screen; with reduced motion
 * it's one still frame; without WebGL2 there's nothing (it's decoration).
 * `masked` fades it out at its top and bottom; `unit` is CSS px to a swirl.
 */
export default function PaintSwirls({
  className,
  masked = true,
  strength = STRENGTH,
  unit,
}: {
  className?: string;
  masked?: boolean;
  strength?: number;
  unit?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });
    if (!gl) return;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (
        !gl.getShaderParameter(s, gl.COMPILE_STATUS) &&
        process.env.NODE_ENV !== "production"
      )
        console.warn(gl.getShaderInfoLog(s));
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    const vao = gl.createVertexArray();
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform3fv(gl.getUniformLocation(program, "uPalette"), PALETTE.flat());
    gl.uniform1f(gl.getUniformLocation(program, "uStrength"), strength);
    gl.uniform1f(gl.getUniformLocation(program, "uPx"), RES);
    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uUnit = gl.getUniformLocation(program, "uUnit");

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0;
    let last = 0;
    let visible = false;

    const draw = (now: number) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uUnit, unit ?? (canvas.height / RES) * UNIT_OF_HEIGHT);
      gl.uniform1f(uTime, still ? 12 : (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const frame = (now: number) => {
      raf = visible && !still ? requestAnimationFrame(frame) : 0;
      if (now - last < FRAME_MS) return;
      last = now;
      draw(now);
    };
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(width * RES));
      canvas.height = Math.max(1, Math.round(height * RES));
      draw(performance.now());
    };
    const sizer = new ResizeObserver(resize);
    sizer.observe(canvas);
    resize();
    const seen = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf && !still) raf = requestAnimationFrame(frame);
    });
    seen.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      sizer.disconnect();
      seen.disconnect();
      gl.deleteProgram(program);
      gl.deleteVertexArray(vao);
    };
  }, [strength, unit]);

  return (
    <canvas
      ref={ref}
      className={`${css.swirls} ${className ?? ""}`}
      data-masked={masked}
      aria-hidden="true"
    />
  );
}
