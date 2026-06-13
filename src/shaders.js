// ============================================================
// Shader GLSL code for Cyber Zen Notes
// ============================================================

export const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Rainy Mode - Simplified & Fixed
 */
export const rainFragmentShader = `
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform float uRainAmount;
uniform float uBlur;
uniform float uOpacity;
uniform sampler2D uTexture1;
uniform bool uUseCustomBg;
uniform vec2 uMouse;
uniform float uImageAspect;

varying vec2 vUv;

vec2 coverUv(vec2 uv, vec2 res) {
  float imageAspect = uImageAspect;
  float screenAspect = res.x / res.y;
  
  // Object-fit: cover logic
  vec2 scale = vec2(1.0);
  if (imageAspect > screenAspect) {
    scale.x = screenAspect / imageAspect;
  } else {
    scale.y = imageAspect / screenAspect;
  }
  
  // Scale UVs from center and add a small buffer (0.9 zoom) to prevent edge stretching from distortion
  return (uv - 0.5) * scale * 0.9 + 0.5;
}

vec3 blur2D(sampler2D tex, vec2 uv, vec2 res, float amount) {
  if (amount < 0.005) return texture2D(tex, uv).rgb;
  vec2 texel = 1.0 / res;
  float radius = amount * 6.0;
  vec3 color = vec3(0.0);
  float total = 0.0;
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      vec2 off = vec2(float(x), float(y)) * texel * radius;
      float w = exp(-float(x * x + y * y) * 0.3);
      color += texture2D(tex, uv + off).rgb * w;
      total += w;
    }
  }
  return color / total;
}

#define S(a, b, t) smoothstep(a, b, t)

vec3 N13(float p) {
   vec3 p3 = fract(vec3(p) * vec3(.1031,.11369,.13787));
   p3 += dot(p3, p3.yzx + 19.19);
   return fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
}

float N(float t) {
    return fract(sin(t*12345.564)*7658.76);
}

float Saw(float b, float t) {
  return S(0., b, t)*S(1., b, t);
}

vec2 DropLayer2(vec2 uv, float t) {
    vec2 UV = uv;
    uv.y += t*0.75;
    vec2 a = vec2(6., 1.);
    vec2 grid = a*2.;
    vec2 id = floor(uv*grid);
    float colShift = N(id.x);
    uv.y += colShift;
    id = floor(uv*grid);
    vec3 n = N13(id.x*35.2+id.y*2376.1);
    vec2 st = fract(uv*grid)-vec2(.5, 0);
    float x = n.x-.5;
    float y = UV.y*20.;
    float wiggle = sin(y+sin(y));
    x += wiggle*(.5-abs(x))*(n.z-.5);
    x *= .7;
    float ti = fract(t+n.z);
    y = (Saw(.85, ti)-.5)*.9+.5;
    vec2 p = vec2(x, y);
    float d = length((st-p)*a.yx);
    float vertFade = S(0.01, 0.15, st.y) * S(0.01, 0.15, 1.0-st.y);
    float mainDrop = S(.4, .0, d) * vertFade;
    float r = sqrt(S(1., y, st.y));
    float cd = abs(st.x-x);
    float trail = S(.23*r, .15*r*r, cd);
    float trailFront = S(-.02, .02, st.y-y);
    trail *= trailFront*r*r;
    y = UV.y;
    float trail2 = S(.2*r, .0, cd);
    float droplets = max(0., (sin(y*(1.-y)*120.)-st.y))*trail2*trailFront*n.z;
    y = fract(y*10.)+(st.y-.5);
    float dd = length(st-vec2(x, y));
    droplets = S(.3, 0., dd);
    float m = mainDrop+droplets*r*trailFront;
    return vec2(m, trail);
}

float StaticDrops(vec2 uv, float t) {
  uv *= 40.;
    vec2 id = floor(uv);
    uv = fract(uv)-.5;
    vec3 n = N13(id.x*107.45+id.y*3543.654);
    vec2 p = (n.xy-.5)*.7;
    float d = length(uv-p);
    float fade = Saw(.025, fract(t+n.z));
    float c = S(.3, 0., d)*(0.3+0.7*fract(n.z*10.))*fade;
    return c;
}

vec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {
    float s = StaticDrops(uv, t)*l0;
    vec2 m1 = DropLayer2(uv, t)*l1;
    vec2 m2 = DropLayer2(uv*1.85, t)*l2;
    float c = s+m1.x+m2.x;
    c = S(.3, 1., c);
    return vec2(c, max(m1.y*l0, m2.y*l1));
}

void main() {
    vec2 UV = vUv;
    vec2 uv = (vUv - 0.5) * (uResolution / uResolution.y);
    float t = uTime * 0.2;

    float rainAmount = uRainAmount;
    float staticDrops = S(-.5, 1., rainAmount) * 2.0;
    float layer1 = S(.25, .75, rainAmount);
    float layer2 = S(.0, .5, rainAmount);
    
    vec2 c = Drops(uv, t, staticDrops, layer1, layer2);
    
    vec2 e = vec2(.001, 0.);
    float cx = Drops(uv+e, t, staticDrops, layer1, layer2).x;
    float cy = Drops(uv+e.yx, t, staticDrops, layer1, layer2).x;
    vec2 n = vec2(cx-c.x, cy-c.x);

    vec2 bgUv = coverUv(UV + n, uResolution);
    vec3 col = blur2D(uTexture1, bgUv, uResolution, uBlur);
    
    // Simple color correction & Vignette
    col *= mix(vec3(0.9, 0.95, 1.0), vec3(1.0), uOpacity);
    vec2 vigUv = UV - 0.5;
    col *= 1.0 - dot(vigUv, vigUv) * 0.35;
    
    col *= uOpacity;
    col = max(col, vec3(0.08));

    gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Snow Mode - Shadertoy inspired snowfall
 */
export const snowFragmentShader = `
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform float uOpacity;
uniform float uSnowAmount;
uniform sampler2D uTexture1;
uniform bool uUseCustomBg;
uniform float uImageAspect;
uniform vec2 uMouse;
uniform float uBlur;

varying vec2 vUv;

vec2 coverUv(vec2 uv, vec2 res) {
  float imageAspect = uImageAspect;
  float screenAspect = res.x / res.y;
  vec2 scale = vec2(1.0);
  if (imageAspect > screenAspect) {
    scale.x = screenAspect / imageAspect;
  } else {
    scale.y = imageAspect / screenAspect;
  }
  return (uv - 0.5) * scale + 0.5;
}

vec3 blur2D_snow(sampler2D tex, vec2 uv, vec2 res, float amount) {
  if (amount < 0.005) return texture2D(tex, uv).rgb;
  vec2 texel = 1.0 / res;
  float radius = amount * 6.0;
  vec3 color = vec3(0.0);
  float total = 0.0;
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      vec2 off = vec2(float(x), float(y)) * texel * radius;
      float w = exp(-float(x * x + y * y) * 0.3);
      color += texture2D(tex, uv + off).rgb * w;
      total += w;
    }
  }
  return color / total;
}

void main() {
  vec2 uv = vUv;
  vec2 bgUv = coverUv(uv, uResolution);
  vec3 col = blur2D_snow(uTexture1, bgUv, uResolution, uBlur);

  // Snow effect (Shadertoy inspired)
  float snow = 0.0;
  float gradient = (1.0 - uv.y) * 0.4;
  float random = fract(sin(dot(uv * uResolution, vec2(12.9898, 78.233))) * 43758.5453);

  for(int k = 0; k < 6; k++) {
    for(int i = 0; i < 12; i++) {
      float cellSize = 2.0 + (float(i) * 3.0);
      float downSpeed = 0.3 + (sin(uTime * 0.4 + float(k + i * 20)) + 1.0) * 0.00008;
      vec2 snowUv = uv + vec2(
        0.01 * sin((uTime + float(k * 6185)) * 0.6 + float(i)) * (5.0 / float(i)),
        downSpeed * (uTime + float(k * 1352)) * (1.0 / float(i))
      );
      vec2 uvStep = (ceil(snowUv * cellSize - vec2(0.5, 0.5)) / cellSize);
      float x = fract(sin(dot(uvStep.xy, vec2(12.9898 + float(k) * 12.0, 78.233 + float(k) * 315.156))) * 43758.5453 + float(k) * 12.0) - 0.5;
      float y = fract(sin(dot(uvStep.xy, vec2(62.2364 + float(k) * 23.0, 94.674 + float(k) * 95.0))) * 62159.8432 + float(k) * 12.0) - 0.5;

      float randomMagnitude1 = sin(uTime * 2.5) * 0.7 / cellSize;
      float randomMagnitude2 = cos(uTime * 2.5) * 0.7 / cellSize;

      float d = 5.0 * distance((uvStep.xy + vec2(x * sin(y), y) * randomMagnitude1 + vec2(y, x) * randomMagnitude2), snowUv.xy);

      float omiVal = fract(sin(dot(uvStep.xy, vec2(32.4691, 94.615))) * 31572.1684);
      if(omiVal < 0.08) {
        float newd = (x + 1.0) * 0.4 * clamp(1.9 - d * (15.0 + (x * 6.3)) * (cellSize / 1.4), 0.0, 1.0);
        snow += newd;
      }
    }
  }

  col += snow;
  col += gradient * vec3(0.4, 0.8, 1.0);
  col += random * 0.01;

  vec2 vigUv = uv - 0.5;
  col *= 1.0 - dot(vigUv, vigUv) * 0.4;
  col *= uOpacity;
  col = max(col, vec3(0.05));
  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Star Mode - Stable star field with slow drift
 */
export const starFragmentShader = `
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform float uOpacity;
uniform float uSnowAmount;
uniform sampler2D uTexture1;
uniform bool uUseCustomBg;
uniform float uImageAspect;
uniform vec2 uMouse;
uniform float uBlur;

varying vec2 vUv;

vec2 coverUv(vec2 uv, vec2 res) {
  float imageAspect = uImageAspect;
  float screenAspect = res.x / res.y;
  vec2 scale = vec2(1.0);
  if (imageAspect > screenAspect) {
    scale.x = screenAspect / imageAspect;
  } else {
    scale.y = imageAspect / screenAspect;
  }
  return (uv - 0.5) * scale + 0.5;
}

vec3 blur2D_star(sampler2D tex, vec2 uv, vec2 res, float amount) {
  if (amount < 0.005) return texture2D(tex, uv).rgb;
  vec2 texel = 1.0 / res;
  float radius = amount * 6.0;
  vec3 color = vec3(0.0);
  float total = 0.0;
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      vec2 off = vec2(float(x), float(y)) * texel * radius;
      float w = exp(-float(x * x + y * y) * 0.3);
      color += texture2D(tex, uv + off).rgb * w;
      total += w;
    }
  }
  return color / total;
}

// Return random noise in the range [0.0, 1.0], as a function of x.
float Noise2d(vec2 x) {
  float xhash = cos(x.x * 37.0);
  float yhash = cos(x.y * 57.0);
  return fract(415.92653 * (xhash + yhash));
}

// Convert Noise2d() into a "star field" by stomping everything below fThreshhold to zero.
float NoisyStarField(vec2 vSamplePos, float fThreshhold) {
  float StarVal = Noise2d(vSamplePos);
  if (StarVal >= fThreshhold)
    StarVal = pow((StarVal - fThreshhold) / (1.0 - fThreshhold), 6.0);
  else
    StarVal = 0.0;
  return StarVal;
}

// Stabilize NoisyStarField() by only sampling at integer values.
float StableStarField(vec2 vSamplePos, float fThreshhold) {
  float fractX = fract(vSamplePos.x);
  float fractY = fract(vSamplePos.y);
  vec2 floorSample = floor(vSamplePos);
  float v1 = NoisyStarField(floorSample, fThreshhold);
  float v2 = NoisyStarField(floorSample + vec2(0.0, 1.0), fThreshhold);
  float v3 = NoisyStarField(floorSample + vec2(1.0, 0.0), fThreshhold);
  float v4 = NoisyStarField(floorSample + vec2(1.0, 1.0), fThreshhold);

  float StarVal = v1 * (1.0 - fractX) * (1.0 - fractY)
                + v2 * (1.0 - fractX) * fractY
                + v3 * fractX * (1.0 - fractY)
                + v4 * fractX * fractY;
  return StarVal;
}

void main() {
  vec2 uv = vUv;
  vec2 bgUv = coverUv(uv, uResolution);
  vec3 col = blur2D_star(uTexture1, bgUv, uResolution, uBlur);

  // Sky overlay gradient
  vec3 skyColor = vec3(0.1, 0.2, 0.4) * uv.y;
  col += skyColor * (1.0 - uOpacity * 0.6);

  // Star threshold: higher = fewer stars. Map uSnowAmount (0-1) to threshold (0.94 - 0.999)
  float starThreshhold = 0.94 + uSnowAmount * 0.059;

  // Stars with a slow crawl
  float xRate = 0.2;
  float yRate = -0.06;
  vec2 vSamplePos = uv * uResolution + vec2(xRate * uTime * 60.0, yRate * uTime * 60.0);
  float StarVal = StableStarField(vSamplePos, starThreshhold);
  col += vec3(StarVal);

  vec2 vigUv = uv - 0.5;
  col *= 1.0 - dot(vigUv, vigUv) * 0.4;
  col *= uOpacity;
  col = max(col, vec3(0.05));
  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Pure Mode - Same config as rain mode, no shader effects
 */
export const pureFragmentShader = `
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform float uRainAmount;
uniform float uBlur;
uniform float uOpacity;
uniform float uSnowAmount;
uniform sampler2D uTexture1;
uniform bool uUseCustomBg;
uniform vec2 uMouse;
uniform float uImageAspect;

varying vec2 vUv;

vec2 coverUv(vec2 uv, vec2 res) {
  float imageAspect = uImageAspect;
  float screenAspect = res.x / res.y;
  vec2 scale = vec2(1.0);
  if (imageAspect > screenAspect) {
    scale.x = screenAspect / imageAspect;
  } else {
    scale.y = imageAspect / screenAspect;
  }
  return (uv - 0.5) * scale + 0.5;
}

vec3 blur2D_pure(sampler2D tex, vec2 uv, vec2 res, float amount) {
  if (amount < 0.005) return texture2D(tex, uv).rgb;
  vec2 texel = 1.0 / res;
  float radius = amount * 6.0;
  vec3 color = vec3(0.0);
  float total = 0.0;
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      vec2 off = vec2(float(x), float(y)) * texel * radius;
      float w = exp(-float(x * x + y * y) * 0.3);
      color += texture2D(tex, uv + off).rgb * w;
      total += w;
    }
  }
  return color / total;
}

void main() {
  vec2 uv = vUv;
  vec2 bgUv = coverUv(uv, uResolution);
  vec3 col = blur2D_pure(uTexture1, bgUv, uResolution, uBlur);
  col *= uOpacity;
  col = max(col, vec3(0.08));
  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Default Mode (fallback)
 */
export const defaultFragmentShader = `
precision highp float;
uniform vec2  uResolution;
uniform float uOpacity;
uniform sampler2D uTexture1;
uniform float uImageAspect;

vec2 coverUv(vec2 uv, vec2 res) {
  float imageAspect = uImageAspect;
  float screenAspect = res.x / res.y;
  vec2 scale = vec2(1.0);
  if (imageAspect > screenAspect) {
    scale.x = screenAspect / imageAspect;
  } else {
    scale.y = imageAspect / screenAspect;
  }
  return (uv - 0.5) * scale + 0.5;
}

void main() {
  vec2 uv = vUv;
  vec2 bgUv = coverUv(uv, uResolution);
  vec3 col = texture2D(uTexture1, bgUv).rgb;
  col *= uOpacity;
  col = max(col, vec3(0.08));
  gl_FragColor = vec4(col, 1.0);
}
`;
