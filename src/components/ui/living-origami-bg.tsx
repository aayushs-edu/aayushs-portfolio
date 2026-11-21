import React, { type CSSProperties } from "react";

// This is a self-contained React component that creates a "Living Origami" effect.
// An evolution of procedural animation, this simulates a flock of glowing origami
// birds flying across the screen. The effect is achieved with CSS 3D transforms
// and a procedurally generated set of layered animations (the classes and
// keyframes are in globals.css).

/** A seeded random in [min, max): the same on the server and the client, so the flock hydrates cleanly. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return (min: number, max: number) => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (max - min) + min;
  };
}

const random = seeded(7);

// Procedurally generate multiple drifters (once, at load).
const FLOCK = [...Array(15)].map(() => ({
  drifter: {
    "--y-start": `${random(-30, 30)}vh`,
    "--y-end": `${random(-30, 30)}vh`,
    "--r-start": `${random(-30, 30)}deg`,
    "--r-end": `${random(-30, 30)}deg`,
    animationDuration: `${random(20, 40)}s`,
    animationDelay: `${random(-40, 0)}s`,
  } as CSSProperties,
  crane: {
    // `scale`, not `transform: scale()`: the crane's bob animates transform, which would override it.
    scale: `${random(0.2, 0.8)}`,
    animationDelay: `${random(-4, 0)}s`,
  } as CSSProperties,
}));

export const Component = () => {
  return (
    <div className="hero-section w-full h-screen" aria-hidden="true">
      {FLOCK.map((bird, i) => (
        <div key={i} className="drifter-container" style={bird.drifter}>
          <div className="origami-crane" style={bird.crane}>
            <div className="crane-part body"></div>
            <div className="crane-part wing-left"></div>
            <div className="crane-part wing-right"></div>
            <div className="crane-part tail"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
