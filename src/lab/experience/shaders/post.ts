/* Post : bloom léger (2 niveaux) + composition finale (tonemap, vignette, grain, lettres). */

export const BRIGHT_FRAG = /* glsl */ `
  varying vec2 vUv; uniform sampler2D uTex;
  void main(){
    vec3 c = texture2D(uTex, vUv).rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    gl_FragColor = vec4(c * smoothstep(0.7, 1.8, l), 1.0);
  }
`;

export const BLUR_FRAG = /* glsl */ `
  varying vec2 vUv; uniform sampler2D uTex; uniform vec2 uDir;
  void main(){
    vec3 c = texture2D(uTex, vUv).rgb * 0.2270270;
    c += (texture2D(uTex, vUv + uDir * 1.3846154).rgb + texture2D(uTex, vUv - uDir * 1.3846154).rgb) * 0.3162162;
    c += (texture2D(uTex, vUv + uDir * 3.2307692).rgb + texture2D(uTex, vUv - uDir * 3.2307692).rgb) * 0.0702703;
    gl_FragColor = vec4(c, 1.0);
  }
`;

export const FINAL_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uScene, uB1, uB2, uStars, uLetters; uniform float uBloom, uGrain, uTime, uAspect; uniform vec2 uTexel;
  uniform vec3 uTextCol;
  // Entrées des effets de composition (registre, CompositeParams) : déclarées au lot V0, utilisées à partir de V1
  // (12 ondes gravitationnelles, 13 flou de mouvement + aberration chromatique, 14 reflets anamorphiques).
  uniform vec4 uWaves[4]; uniform vec2 uMotion; uniform float uChroma, uFlare;
  // Upscale bicubique Catmull-Rom en 9 lectures (net même à basse résolution interne)
  vec4 sampleCR(sampler2D tex, vec2 uv){
    vec2 sp = uv / uTexel, tc = floor(sp - 0.5) + 0.5, f = sp - tc;
    vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f)), w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
    vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f)), w3 = f * f * (-0.5 + 0.5 * f);
    vec2 w12 = w1 + w2, o12 = w2 / w12;
    vec2 t0 = (tc - 1.0) * uTexel, t3 = (tc + 2.0) * uTexel, t12 = (tc + o12) * uTexel;
    vec4 r = texture2D(tex, vec2(t0.x, t0.y)) * w0.x * w0.y + texture2D(tex, vec2(t12.x, t0.y)) * w12.x * w0.y + texture2D(tex, vec2(t3.x, t0.y)) * w3.x * w0.y
           + texture2D(tex, vec2(t0.x, t12.y)) * w0.x * w12.y + texture2D(tex, vec2(t12.x, t12.y)) * w12.x * w12.y + texture2D(tex, vec2(t3.x, t12.y)) * w3.x * w12.y
           + texture2D(tex, vec2(t0.x, t3.y)) * w0.x * w3.y + texture2D(tex, vec2(t12.x, t3.y)) * w12.x * w3.y + texture2D(tex, vec2(t3.x, t3.y)) * w3.x * w3.y;
    return max(r, 0.0);
  }
  vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
  float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  void main(){
    vec2 uv = vUv;
    vec2 q0 = (vUv - 0.5) * 2.0 * vec2(uAspect, 1.0);   // repère aspect-corrigé, unités NDC verticales
    // 12 · ondes gravitationnelles : anneaux de distorsion (déplacement radial de l'image)
    for (int i = 0; i < 4; i++){
      vec4 w = uWaves[i];
      if (w.w > 0.0){
        vec2 dq = q0 - w.xy * vec2(uAspect, 1.0);
        float d = length(dq);
        float x = (d - w.z) / (0.05 + 0.12 * w.z);       // l'anneau s'élargit en grandissant
        float prof = x * exp(-x * x);                    // dérivée de gaussienne : compression puis dilatation
        uv += dq / max(d, 1e-4) * prof * w.w * 0.05 / vec2(uAspect, 1.0) * 0.5;
      }
    }
    float mlen = length(uMotion);
    vec4 sc;
    vec3 st;
    if (mlen > 1e-4 || uChroma > 1e-4){
      // 13 · flou de mouvement (8 prises le long du déplacement apparent) + aberration chromatique (radiale)
      vec2 dir = mlen > 1e-4 ? uMotion * 0.5 : vec2(0.0);
      vec2 ca = (uv - 0.5) * uChroma;
      // le flou ne touche que les étoiles (traits) : flouter le trou noir dupliquait ses contours
      vec3 b = vec3(0.0);
      for (int i = 0; i < 8; i++){
        vec2 p = uv + dir * ((float(i) + 0.5) / 8.0 - 0.5);
        vec3 s1 = texture2D(uStars, p).rgb;
        s1.r = texture2D(uStars, p - ca).r; s1.b = texture2D(uStars, p + ca).b;
        b += s1;
      }
      st = b / 8.0;
      sc = sampleCR(uScene, uv);
      sc.r = texture2D(uScene, uv - ca * 0.5).r; sc.b = texture2D(uScene, uv + ca * 0.5).b;
    } else {
      sc = sampleCR(uScene, uv);
      st = texture2D(uStars, uv).rgb;
    }
    vec3 hdr = sc.rgb + st * clamp(sc.a, 0.0, 1.0);
    hdr += uBloom * (texture2D(uB1, uv).rgb * 0.55 + texture2D(uB2, uv).rgb * 0.9);
    if (uFlare > 0.0){
      // 14 · reflets anamorphiques : traînée horizontale à partir du bloom (zones très brillantes)
      vec3 fs = vec3(0.0);
      for (int i = 1; i <= 10; i++){
        float o = float(i) / 10.0;
        float wt = exp(-o * 2.6);
        vec2 off = vec2(o * 0.16, 0.0);
        fs += (texture2D(uB2, uv + off).rgb + texture2D(uB2, uv - off).rgb) * wt;
      }
      // masqué par l'ombre et le disque (transmission du trou noir) : la traînée ne voile pas l'intérieur de l'ombre
      hdr += fs * uFlare * 0.16 * vec3(1.0, 0.82, 0.62) * smoothstep(0.05, 0.7, clamp(sc.a, 0.0, 1.0));
    }
    vec3 c = aces(hdr * 0.95);
    vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
    c *= mix(1.0, smoothstep(1.25, 0.25, length(q)), 0.4);
    c = pow(c, vec3(1.0 / 2.2));
    float l = dot(c, vec3(0.333));
    float n = hash12(gl_FragCoord.xy + fract(uTime * 7.31) * 1000.0) - 0.5;
    c += n * uGrain * (0.25 + 0.75 * sqrt(l));
    // lettres détachées : r = couverture, g = couverture × absorption (prémultipliés)
    vec4 lt = texture2D(uLetters, uv);
    float cov = clamp(lt.a, 0.0, 1.0);
    float absorb = clamp(lt.g / max(lt.a, 1e-4), 0.0, 1.0);
    // plus une lettre est absorbée, plus elle passe derrière le disque et dans l'ombre
    float vis = mix(1.0, clamp(sc.a, 0.0, 1.0), absorb);
    c = mix(c, uTextCol, cov * vis);
    gl_FragColor = vec4(max(c, 0.0), 1.0);
  }
`;
