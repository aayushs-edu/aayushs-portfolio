// A small stable-fluids simulation (velocity, pressure projection, so the flow
// swirls rather than smears). Alongside it runs a map from each point to where
// its paint came from: advected by the flow and relaxed back to "here" every
// frame, so pushed paint flows back into shape. It came from the hero's old
// fluid name; the Paintings heading draws through it (fluidTitle.ts).

/** A push on the fluid: where (CSS px) and how fast the pointer moved (CSS px/s). */
export interface Push {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Moving through the paint pushes it around; it flows back into shape. */
export const FLUID = {
  /** Simulation cells across the box. */
  resolution: 192,
  /** Push radius (design px) and strength (share of the pointer's speed). */
  radius: 24,
  force: 0.18,
  /** How fast the flow dies down, and how fast the paint flows back into shape (1/s). */
  settle: 4.5,
  reform: 3.5,
  pressureIterations: 16,
  /** Stop simulating this long after the last push (s), fading the flow out over the last `fadeOut` s (no snap). */
  idle: 6,
  fadeOut: 1.5,
} as const;

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
  vec2 from = texture(uSource, back).xy;
  // Ease back toward where it belongs, but always by at least a step the
  // half-float target can hold: a plain mix stalls a few pixels short of home.
  vec2 d = vUv - from;
  vec2 step = sign(d) * min(abs(d), max(abs(d * uReform), vec2(1.0 / 1024.0)));
  o = vec4(from + step, 0.0, 1.0);
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

/** The simulation over a box of the given aspect. */
export class Fluid {
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
    this.w = FLUID.resolution;
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
    const F = FLUID;
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

