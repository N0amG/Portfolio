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
  // 2, 3 · traînées de lumière radiales (plongée, dézoom) : xy = centre (uv), z = longueur (0 = aucune), w = nombre de prises
  uniform vec4 uStreak;
  uniform float uRing;   // rayon de l'anneau de photons (NDC verticales) : départ des traits de lumière
  // traits de lumière : intensité de naissance sur les 1,2 dernières secondes (case k = il y a k × 0,1 s), allumés ?
  uniform float uRayHist[12]; uniform float uRayOn;
  uniform float uSharp;  // accentuation après l'upscale (0 en pleine résolution, voir la qualité automatique)
  uniform float uUpscale;  // 1 : trou noir plus petit que la sortie (bicubique) ; 0 : même taille, une lecture suffit
  // Upscale bicubique Catmull-Rom en 9 lectures (net même à basse résolution interne). À la même taille, aux centres des
  // pixels, il vaut exactement le texel : une seule lecture (hors ondes, où l'écart est invisible).
  vec4 sampleCR(sampler2D tex, vec2 uv){
    if (uUpscale < 0.5) return max(texture2D(tex, uv), 0.0);
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
    if (uSharp > 0.0){
      // accentuation légère quand la résolution interne baisse (après l'upscale bicubique) : multiplicative, sur la
      // luminance, bornée (sûre en HDR : pas de halo sombre autour du disque ni de l'anneau de photons)
      vec3 nb = (texture2D(uScene, uv + vec2(uTexel.x, 0.0)).rgb + texture2D(uScene, uv - vec2(uTexel.x, 0.0)).rgb
               + texture2D(uScene, uv + vec2(0.0, uTexel.y)).rgb + texture2D(uScene, uv - vec2(0.0, uTexel.y)).rgb) * 0.25;
      const vec3 LW = vec3(0.2126, 0.7152, 0.0722);
      float ls = dot(sc.rgb, LW), lb = dot(nb, LW);
      sc.rgb *= clamp(pow((ls + 0.02) / (lb + 0.02), uSharp), 0.8, 1.3);
    }
    vec3 hdr = sc.rgb + st * clamp(sc.a, 0.0, 1.0);
    hdr += uBloom * (texture2D(uB1, uv).rgb * 0.55 + texture2D(uB2, uv).rgb * 0.9);
    if (uStreak.z > 0.0){
      // 2, 3 · l'anneau de photons éclate en traînées : la lumière vive (bloom) est étirée vers l'extérieur, depuis le
      // centre du trou noir ; prises décalées au hasard par pixel (pas de marches visibles)
      vec2 dc = uv - uStreak.xy;
      float j = hash12(gl_FragCoord.xy + fract(uTime * 3.7) * 500.0);
      vec3 acc = vec3(0.0);
      float wsum = 0.0;
      for (int i = 0; i < 16; i++){
        if (float(i) >= uStreak.w) break;
        float k = (float(i) + j) / uStreak.w;
        vec2 p = uStreak.xy + dc * (1.0 - uStreak.z * k);
        float wt = 1.0 - 0.75 * k;
        acc += texture2D(uB1, p).rgb * wt;   // la lumière vive seulement (l'image entière donnerait un voile laiteux)
        wsum += wt;
      }
      hdr += acc / wsum * 0.9 * smoothstep(0.0, 0.25, uStreak.z);
    }
    if (uRayOn > 0.5){
      // 2 · traits de lumière : chacun naît sur l'anneau de photons, file vers l'extérieur en accélérant et en s'allongeant,
      // et ne disparaît qu'en sortant de l'écran (la caméra le dépasse). Un trait par colonne angulaire et par période
      // de 1,2 s ; il existe si l'intensité de naissance (historique uRayHist) le permettait : quand la plongée s'arrête,
      // il n'en naît plus, ceux qui sont partis finissent leur course.
      vec2 dq = (uv - uStreak.xy) * 2.0 * vec2(uAspect, 1.0);
      float d = length(dq);
      float an = atan(dq.y, dq.x) * 0.15915494 * 420.0;
      float ci = mod(floor(an), 420.0), fa = fract(an);
      float h0 = hash12(vec2(ci, 7.0)), h1 = hash12(vec2(ci, 19.0)), h2 = hash12(vec2(ci, 31.0));
      float age = fract(uTime / 1.2 + h0) * 1.2;
      int slot = int(clamp(floor(age / 0.1), 0.0, 11.0));
      float born = uRayHist[slot];
      if (h1 < born * 0.4){
        float a = age / 1.2;
        // départ sous le bord de l'ombre (son rayon estimé n'est qu'approché de près) : le trait est masqué tant qu'il est
        // dans le noir de l'ombre, il apparaît donc exactement sur l'anneau visible
        float r0 = uRing * 0.6;
        float rH = r0 + 3.8 * pow(a, 1.6);                     // tête : jusqu'au-delà des coins de l'écran
        float rT = max(r0, rH - (0.04 + 0.9 * a));             // queue
        float along = smoothstep(rT, rT + 0.02, d) * (1.0 - smoothstep(rH - 0.004, rH + 0.004, d));
        along *= mix(0.2, 1.0, clamp((d - rT) / max(rH - rT, 1e-3), 0.0, 1.0));   // plus brillant vers la tête
        float prof = exp(-pow((fa - 0.5) / 0.18, 2.0));
        float tr = clamp(sc.a, 0.0, 1.0);
        float shadowMask = 1.0 - (1.0 - smoothstep(0.0, 0.08, tr)) * (1.0 - smoothstep(0.02, 0.15, dot(sc.rgb, vec3(0.333))));
        hdr += along * prof * (0.5 + h2) * vec3(0.55, 0.8, 1.0) * 9.0 * shadowMask;
      }
    }
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
    // 3 · horizon du trou blanc (alpha négatif) : −1 = horizon, −2 = cœur en blanc pur
    float wa = -texture2D(uScene, uv).a;
    c *= mix(1.0, smoothstep(1.25, 0.25, length(q)), 0.4 * (1.0 - clamp(wa, 0.0, 1.0)));   // pas de vignette sur l'horizon blanc
    c = pow(c, vec3(1.0 / 2.2));
    float l = dot(c, vec3(0.333));
    float n = hash12(gl_FragCoord.xy + fract(uTime * 7.31) * 1000.0) - 0.5;
    c += n * uGrain * (0.25 + 0.75 * sqrt(l));
    // 3 · cœur de l'horizon du trou blanc : blanc pur (255), sans grain ni vignette (alpha négatif de l'image du trou noir)
    c = mix(c, vec3(1.0), clamp(wa - 1.0, 0.0, 1.0));
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

/* 2, 3 · Voile final (après la couche "front") : noir total, point blanc et écran blanc. Mélange prémultiplié :
   sortie = couleur + destination × (1 − alpha). Le point blanc est un disque de blanc pur (255), net, sans halo. */
export const VEIL_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform vec4 uVeil;   // x = noir, y = blanc, z = rayon du point blanc (NDC verticales), w = réservé
  uniform float uAspect, uPx;
  void main(){
    vec2 q = (vUv * 2.0 - 1.0) * vec2(uAspect, 1.0);
    float d = length(q), R = uVeil.z;
    float core = R > 0.0 ? 1.0 - smoothstep(R - uPx, R + uPx, d) : 0.0;   // bord net (anticrénelé sur un pixel)
    float W = max(uVeil.y, core);
    float A = 1.0 - (1.0 - uVeil.x) * (1.0 - W);
    gl_FragColor = vec4(vec3(W), A);
  }
`;
