"use client";

import { useEffect, useRef } from "react";

/** Drawn at this share of the CSS size (it's soft), and this often (ms). */
const RES = 0.5;
const FRAME_MS = 33;

const VS = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

// minhxthanh's "Dynamic Wave Canvas Background" (21st.dev), per pixel on the
// GPU instead of the CPU: four rounds of cosines feeding sines make the
// waves; deep blues and purples over grey, dark.
const FS = /* glsl */ `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;
uniform float uTime;
void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 uv = (2.0 * px - uRes) / uRes.y;
  float t = uTime;
  float a = 0.0;
  float d = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    a += cos(fi - d + t * 0.5 - a * uv.x);
    d += sin(fi * uv.y + a);
  }
  float wave = (sin(a) + cos(d)) * 0.5;
  float intensity = 0.3 + 0.4 * wave;
  float base = 0.1 + 0.15 * cos(uv.x + uv.y + t * 0.3);
  float blue = 0.2 * sin(a * 1.5 + t * 0.2);
  float purple = 0.15 * cos(d * 2.0 + t * 0.1);
  vec3 c = clamp(vec3(base + purple * 0.8, base + blue * 0.6, base + blue * 1.2 + purple * 0.4), 0.0, 1.0) * intensity;
  o = vec4(c, 1.0);
}
`;

/**
 * The hero's background, being tried in place of the plain wall: slow
 * coloured waves on a WebGL2 canvas filling its parent. It draws only while
 * on screen; `still` (reduced motion, the static tier) keeps one frame; without
 * WebGL2 it draws nothing and the wall shows.
 */
export default function HeroWave({ className, still = false }: { className?: string; still?: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false });
    if (!gl) return;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && process.env.NODE_ENV !== "production") console.warn(gl.getShaderInfoLog(s));
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
    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");

    const frozen = still || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0;
    let last = 0;
    let visible = false;

    const draw = (now: number) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, frozen ? 8 : (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const frame = (now: number) => {
      raf = visible && !frozen ? requestAnimationFrame(frame) : 0;
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
      if (visible && !raf && !frozen) raf = requestAnimationFrame(frame);
    });
    seen.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      sizer.disconnect();
      seen.disconnect();
      gl.deleteProgram(program);
      gl.deleteVertexArray(vao);
    };
  }, [still]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
