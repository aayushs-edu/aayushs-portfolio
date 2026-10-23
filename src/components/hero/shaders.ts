// GLSL for the hero canvas, as plain template literals (no loader config).
// three.js compiles these as GLSL ES 3.00 on WebGL2, so textureLod / fwidth are available.

const roundedRect = /* glsl */ `
  float heroRoundedRect(vec2 p, vec2 halfSize, float radius) {
    vec2 q = abs(p) - halfSize + radius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }
`;

// ---------------------------------------------------------------------------
// Relief plane: injected into MeshPhysicalMaterial via onBeforeCompile.

export const reliefVertexPars = /* glsl */ `
  varying vec2 vHeroUv;
`;

export const reliefVertexMain = /* glsl */ `
  vHeroUv = uv;
`;

export const reliefFragmentPars = /* glsl */ `
  uniform vec2 uSize;
  uniform float uRadius;
  uniform float uFlat;
  uniform float uAlpha;
  varying vec2 vHeroUv;
  ${roundedRect}
`;

/** Replaces #include <opaque_fragment>: neutral-light handoff plus the rounded clip. */
export const reliefFragmentOutput = /* glsl */ `
  outgoingLight = mix(outgoingLight, diffuseColor.rgb, uFlat);
  float heroSd = heroRoundedRect((vHeroUv - 0.5) * uSize, 0.5 * uSize, uRadius);
  float heroAa = max(fwidth(heroSd), 1e-3);
  diffuseColor.a *= (1.0 - smoothstep(-heroAa, heroAa, heroSd)) * uAlpha;
  #include <opaque_fragment>
`;

// ---------------------------------------------------------------------------
// Flat plane (screenshots): unlit image, soft screen sheen, same rounded clip.

export const flatVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const flatFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uSize;
  uniform float uRadius;
  uniform vec2 uSheen;
  uniform float uSheenAmount;
  uniform vec3 uSheenColor;
  uniform float uAlpha;
  varying vec2 vUv;
  ${roundedRect}
  void main() {
    vec4 tex = texture2D(uMap, vUv);
    vec2 d = (vUv - uSheen) * vec2(uSize.x / uSize.y, 1.0);
    float sheen = exp(-dot(d, d) / (2.0 * 0.22 * 0.22)) * uSheenAmount;
    vec3 color = tex.rgb + uSheenColor * sheen * 0.22;
    float sd = heroRoundedRect((vUv - 0.5) * uSize, 0.5 * uSize, uRadius);
    float aa = max(fwidth(sd), 1e-3);
    gl_FragColor = vec4(color, (1.0 - smoothstep(-aa, aa, sd)) * uAlpha);
    #include <colorspace_fragment>
  }
`;

// ---------------------------------------------------------------------------
// Points: every point is one grid cell of the image. All motion is here.

export const pointsVertex = /* glsl */ `
  uniform sampler2D uColor;
  uniform sampler2D uDepth;
  uniform vec4 uRect;        // centre xy, size zw (world px)
  uniform float uLod;        // colour mip level ~ one texel block per point
  uniform float uDepthT;     // 0..1 through the depth act
  uniform float uFlyT;       // 0..1 through the fly-through
  uniform float uLift;       // depthScale * plane height
  uniform float uScatter;    // extra depth spread for the fly-through (world px)
  uniform float uDelay;      // per-point delay share of the depth act
  uniform float uPointSize;  // device px at handoff
  uniform float uCamDist;    // camera distance at rest
  uniform float uShrink;
  uniform float uMaxSize;
  uniform vec2 uNearFade;    // dots fade between these view distances (world px)
  uniform vec3 uMouse;
  uniform vec2 uMouseVel;
  uniform float uPushSigma;
  uniform float uPushGain;

  attribute vec2 aUv;
  attribute float aRand;

  varying vec3 vColor;
  varying float vSize;
  varying float vFade;

  float ease(float t) { return t * t * (3.0 - 2.0 * t); }

  void main() {
    vec3 pos = vec3(uRect.xy + (aUv - 0.5) * uRect.zw, 0.0);

    // Depth act: lift along +z by the estimated depth, each dot a little late.
    float depth = textureLod(uDepth, aUv, 0.0).r;
    float dt = ease(clamp((uDepthT - aRand * uDelay) / (1.0 - uDelay), 0.0, 1.0));
    pos.z += depth * uLift * dt;

    // Fly-through: the layers loosen into a volume so dots stream past one by one.
    float spread = fract(aRand * 91.37 + 0.123) - 0.5;
    pos.z += spread * uScatter * ease(clamp(uFlyT * 2.0, 0.0, 1.0));

    // Cursor push: a gaussian brush through wet paint, gone when the cursor stops.
    vec2 toPoint = pos.xy - uMouse.xy;
    float fall = exp(-dot(toPoint, toPoint) / (2.0 * uPushSigma * uPushSigma));
    pos.xy += uMouseVel * uPushGain * fall;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float viewDist = -mv.z;
    float size = uPointSize * (uCamDist / max(viewDist, 1.0)) * (1.0 - uShrink * ease(clamp(uDepthT * 1.4, 0.0, 1.0)));
    gl_PointSize = min(size, uMaxSize);
    vSize = gl_PointSize;
    vFade = smoothstep(uNearFade.x, uNearFade.y, viewDist);
    vColor = textureLod(uColor, aUv, uLod).rgb;
  }
`;

export const pointsFragment = /* glsl */ `
  uniform float uRound;
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vSize;
  varying float vFade;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = mix(max(abs(c.x), abs(c.y)), length(c), uRound);
    float aa = mix(0.0, 1.0 / max(vSize, 1.0), uRound);
    float alpha = (1.0 - smoothstep(0.5 - aa, 0.5, d)) * vFade * uOpacity;
    if (alpha <= 0.0) discard;
    gl_FragColor = vec4(vColor, alpha);
    #include <colorspace_fragment>
  }
`;
