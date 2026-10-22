precision highp float;

uniform sampler2D uAlbedo;
uniform sampler2D uHeight;
uniform vec2 uTexel;
uniform vec3 uLightPos;
uniform float uStrength;

varying vec2 vUv;
varying vec3 vWorld;

// Reconstruct a normal from the height field with a Sobel kernel.
vec3 surfaceNormal(vec2 uv) {
  float tl = texture2D(uHeight, uv + uTexel * vec2(-1.0, 1.0)).r;
  float t  = texture2D(uHeight, uv + uTexel * vec2(0.0, 1.0)).r;
  float tr = texture2D(uHeight, uv + uTexel * vec2(1.0, 1.0)).r;
  float l  = texture2D(uHeight, uv + uTexel * vec2(-1.0, 0.0)).r;
  float r  = texture2D(uHeight, uv + uTexel * vec2(1.0, 0.0)).r;
  float bl = texture2D(uHeight, uv + uTexel * vec2(-1.0, -1.0)).r;
  float b  = texture2D(uHeight, uv + uTexel * vec2(0.0, -1.0)).r;
  float br = texture2D(uHeight, uv + uTexel * vec2(1.0, -1.0)).r;

  float dx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
  float dy = (tl + 2.0 * t + tr) - (bl + 2.0 * b + br);
  return normalize(vec3(-dx * uStrength, -dy * uStrength, 1.0));
}

float raking(vec3 n, vec3 toLight) {
  float diffuse = max(dot(n, toLight), 0.0);
  return 0.35 + 0.65 * diffuse;
}

void main() {
  vec3 albedo = texture2D(uAlbedo, vUv).rgb;
  vec3 n = surfaceNormal(vUv);
  vec3 toLight = normalize(uLightPos - vWorld);
  float shade = raking(n, toLight);

  vec3 halfway = normalize(toLight + vec3(0.0, 0.0, 1.0));
  float gloss = pow(max(dot(n, halfway), 0.0), 48.0) * 0.18;

  gl_FragColor = vec4(albedo * shade + gloss, 1.0);
}
