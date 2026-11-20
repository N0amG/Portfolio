import * as THREE from "three";
import { S, TAN_HALF } from "../timeline";
import { LENS_FRAG, LENS_VERT, lensNdc, lensUniforms, updateLens, updateView } from "./lens";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   5 · Étoile compagne dévorée (S2, dessous à gauche).
   Une étoile bleu-blanc, vraie géométrie fixe dans le monde (repère du trou noir), déformée en goutte vers le trou
   noir (elle déborde de son lobe de Roche). Depuis sa pointe (L1), sa matière est arrachée en un filament de plasma
   qui spirale dans le sens de rotation du disque, descend dans son plan et le rejoint tangentiellement.
   - Jamais de fondu : l'étoile est là dès qu'elle entre dans le cadre (hors champ sur S1).
   - Le corps de l'étoile est posé SUR la courbe du filament : son axe (vers le trou noir) suit la spirale (texture de
     la courbe, repère transporté le long du fil). Au repos, c'est la goutte ; pendant la dévoration, la même forme
     est étirée le long du filament (front devant, queue qui suit), et s'amincit jusqu'à la largeur du filament.
   - Sur S2, posée : la surface coule vers la pointe, la goutte respire, et l'arrière-plan autour d'elle ondule et
     tourbillonne (effet d'optique : copie de l'image autour de l'étoile, rééchantillonnée en lentille + remous).
   - S1 → S2 : le filament pousse progressivement de la pointe de l'étoile jusqu'au disque (front lumineux), et le
     point chaud ne s'allume qu'à son arrivée.
   - S2 → S3 : l'étoile est réellement dévorée, pilotée par s (donc réversible), dès le premier instant de la
     transition (l'ease de la navigation est défait : temps réel). Elle s'étire le long du filament et sa surface
     prend progressivement la texture du filament (mêmes paquets qui coulent, mêmes couleurs), puis devient
     transparente sur le filament qu'elle recouvre : le front fond d'abord, la queue en dernier. La matière plonge
     dans le disque (éclair du point chaud), puis la traînée s'y vide. Au retour S3 → S2, l'exact inverse.
   - Étoile, halo et filament : couche "front" ; la partie située derrière le trou noir est courbée par la lentille et
     cachée par l'ombre et le disque (scenes/lens.ts).
   - Point chaud : dans le shader du trou noir (uniform uHot) : vraie lentille, bloom, queue entraînée par le disque.
   ─────────────────────────────────────────────────────────── */

const N = 240; // échantillons du filament
const M = 256; // échantillons de la courbe (uniformes en abscisse curviligne) lus par le corps de l'étoile
const COPY = 1024; // côté (px) de la copie de l'image autour de l'étoile pour l'effet d'optique

const NOISE = /* glsl */ `
  float h3(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float vn(vec3 p){
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float h1(float x){ return fract(sin(x * 127.1) * 43758.5453); }
  float n1(float x){ float i = floor(x), f = fract(x); return mix(h1(i), h1(i + 1.0), f * f * (3.0 - 2.0 * f)); }
`;

const STAR_VERT = /* glsl */ `
  ${LENS_VERT}
  uniform sampler2D uCurve;   // ligne 0 : point, 1 : tangente, 2 : normale (repère transporté), M échantillons
  uniform float uLen, uSC, uAx, uW, uElong, uTime;
  varying vec3 vP, vN, vW;
  varying float vBehind, vTip, vA, vU;
  void curveAt(float a, out vec3 P, out vec3 T, out vec3 Nn){
    float x = clamp(a / uLen, 0.0, 1.0) * ${M - 1}.0;
    int i = min(int(x), ${M - 2});
    float f = x - float(i);
    P = mix(texelFetch(uCurve, ivec2(i, 0), 0).xyz, texelFetch(uCurve, ivec2(i + 1, 0), 0).xyz, f);
    T = normalize(mix(texelFetch(uCurve, ivec2(i, 1), 0).xyz, texelFetch(uCurve, ivec2(i + 1, 1), 0).xyz, f));
    Nn = normalize(mix(texelFetch(uCurve, ivec2(i, 2), 0).xyz, texelFetch(uCurve, ivec2(i + 1, 2), 0).xyz, f));
    P += T * (min(a, 0.0) + max(a - uLen, 0.0));   // prolongée en ligne droite au-delà des bouts
  }
  void main(){
    vec3 p = normalize(position);   // repère local : y = axe vers le trou noir (le long du filament)
    float c = p.y, k = max(c, 0.0);
    float el = uElong * (1.0 + 0.07 * sin(uTime * 1.7) + 0.04 * sin(uTime * 4.3 + p.x * 5.0));
    // goutte : allongée vers le trou noir et pincée en pointe (lobe de Roche rempli) ; la face arrière s'étire un peu
    float pinch = 0.4 * smoothstep(0.5, 1.0, k) * min(el, 1.0);
    float qa = c * (1.0 + el * k * k) - 0.18 * el * pow(max(-c, 0.0), 2.0);
    vec2 ql = p.xz * (1.0 - pinch);
    float qmin = -1.0 - 0.18 * el, qmax = 1.0 + el;
    // axe posé sur le filament : abscisse curviligne a, section dans le repère transporté
    float a = uSC + uAx * qa;
    vec3 P, T, Nn;
    curveAt(a, P, T, Nn);
    vec3 B = cross(Nn, T);   // (x, y, z) -> (Nn, T, B) direct : faces avant conservées
    vec3 w = P + uW * (ql.x * Nn + ql.y * B);
    vN = T * c * uW / max(uAx, 1e-4) + Nn * p.x + B * p.z;   // normale de l'ellipsoïde étiré
    vP = p; vW = w; vTip = k; vA = a; vU = (qa - qmin) / (qmax - qmin);
    gl_Position = lensProject(w, vBehind);
  }
`;

const STAR_FRAG = /* glsl */ `
  ${LENS_FRAG}
  uniform vec3 uCamPos;
  uniform float uTime, uEat, uBright, uSurfSpeed, uSurfAmt, uMelt, uMeltNoise, uMeltGrad, uLen, uFlow, uStreamB, uW, uWS, uFeed;
  varying vec3 vP, vN, vW;
  varying float vBehind, vTip, vA, vU;
  ${NOISE}
  void main(){
    vec3 n = normalize(vP);
    float mu = clamp(dot(normalize(vN), normalize(uCamPos - vW)), 0.0, 1.0);
    const vec3 ax = vec3(0.0, 1.0, 0.0);
    float c = n.y;
    vec3 lat = n - c * ax;
    // la matière glisse sur la surface vers la pointe : granulation advectée + coulées étirées
    float t = uTime * uSurfSpeed;
    float gran = vn(n * 9.0 - ax * t * 0.7) * 0.6 + vn(n * 23.0 - ax * t * 1.4) * 0.4;
    float streak = vn(lat * 13.0 + ax * (c * 3.0 - t * 1.1)) * smoothstep(-0.2, 0.9, c);
    vec3 col = mix(vec3(0.50, 0.78, 1.0), vec3(0.93, 0.97, 1.0), pow(mu, 0.6));   // bord #7fd6ff -> cœur blanc bleuté
    // contraste centré sur la luminosité moyenne : uSurfAmt = 1 redonne le rendu d'origine
    float tex = 0.3 * (gran - 0.5) + 0.35 * (streak - 0.25);
    col *= (0.55 + 0.45 * pow(mu, 0.5)) * max(1.04 + uSurfAmt * tex, 0.2);
    // face tournée vers le trou noir éclairée par le disque, pointe arrachée qui chauffe
    col += vec3(1.0, 0.70, 0.28) * 0.35 * pow(max(c, 0.0), 2.0);
    col = mix(col, vec3(1.0, 0.957, 0.878), smoothstep(0.7, 1.0, vTip) * 0.6);
    col = min(col * uBright, vec3(1.0));

    // texture du filament (même calcul que STREAM_FRAG) : même abscisse curviligne, mêmes paquets qui coulent, mêmes
    // couleurs, même profil en travers (distance à l'axe ramenée à la largeur du cœur du ruban à cet endroit)
    float s = vA - uTime * uFlow;
    float tl = clamp(vA / uLen, 0.0, 1.0);
    float v = sqrt(max(1.0 - mu * mu, 0.0)) * uW / (uWS * (0.55 + 0.9 * tl));
    float clump = mix(0.55 + 0.9 * n1(s * 1.6) * n1(s * 0.47 + 9.0), 0.45 + 1.3 * n1(s * 1.05) * n1(s * 0.31 + 4.0), uFeed);
    float core = exp(-pow(v * 2.4, 2.0));
    float halo = exp(-pow(v * 0.9, 2.0)) * (0.22 + 0.2 * uFeed);
    vec3 sc = mix(vec3(0.80, 0.90, 1.0), vec3(1.0, 0.957, 0.878), smoothstep(0.0, 0.3, tl));
    sc = mix(sc, vec3(1.0, 0.702, 0.278), smoothstep(0.25, 0.65, tl));
    sc = mix(sc, vec3(1.0, 0.353, 0.122), smoothstep(0.6, 1.0, tl) * 0.75);
    sc = mix(sc, mix(vec3(0.78, 0.90, 1.0), vec3(1.0, 0.86, 0.62), smoothstep(0.55, 1.0, tl)), uFeed * 0.75);
    sc = mix(sc, vec3(1.0, 0.96, 0.9), core * clump * 0.35);
    float I = (core * clump * (1.0 + 1.2 * uFeed) + halo) * mix(0.4 + 0.8 * tl * tl, 1.0, uFeed) * (1.0 - smoothstep(0.86, 1.0, tl)) * uStreamB;
    vec3 strm = 1.0 - exp(-sc * I * 1.6);

    // fonte : le front d'abord, la queue en dernier, en mèches qui suivent les paquets
    float wisp = vn(vec3(n.x * 2.5, n.z * 2.5, s * 0.45)) + 0.5 * clump - 0.8;
    // dégradé le long du corps : l'avant (vU = 1) a déjà la texture du filament, l'arrière garde celle de l'étoile ;
    // uMeltGrad = 1 : le dégradé couvre tout le corps, plus grand : transition plus courte
    float m = uMelt * (1.0 + uMeltGrad) - (1.0 - vU) * uMeltGrad + uMeltNoise * wisp * min(uMelt * 8.0, 1.0);
    m = smoothstep(0.0, 1.0, clamp(m, 0.0, 1.0));
    vec3 look = mix(col, strm, smoothstep(0.0, 0.7, m));
    look = mix(look, look * vec3(1.0, 0.85, 0.65), smoothstep(0.3, 0.9, uEat) * 0.35 * (1.0 - m));   // elle chauffe
    float vis = bhVis(vBehind);
    // prémultiplié : opaque au repos, puis transparente sur le filament qu'elle recouvre
    gl_FragColor = vec4(look * (1.0 - smoothstep(0.45, 1.0, m)) * vis, (1.0 - m) * vis);
  }
`;

// Billboard autour de l'étoile (halo additif, et effet d'optique)
const QUAD_VERT = /* glsl */ `
  ${LENS_VERT}
  uniform vec3 uStar, uR, uU;
  uniform float uSize;
  varying vec2 vQ;
  varying float vBehind;
  void main(){
    vQ = position.xy;
    gl_Position = lensProject(uStar + (uR * position.x + uU * position.y) * uSize, vBehind);
  }
`;

const HALO_FRAG = /* glsl */ `
  ${LENS_FRAG}
  uniform float uHalo;
  varying vec2 vQ;
  varying float vBehind;
  void main(){
    float d = length(vQ);
    float g = (exp(-d * d * 9.0) * 0.55 + exp(-d * 4.5) * 0.25) * (1.0 - smoothstep(0.8, 1.0, d));
    gl_FragColor = vec4(vec3(0.62, 0.84, 1.0) * g * uHalo, bhVis(vBehind));
  }
`;

// Effet d'optique : l'image déjà rendue autour de l'étoile est rééchantillonnée (lentille, remous, tourbillon).
const OPTIC_FRAG = /* glsl */ `
  uniform sampler2D uCopy;
  uniform vec2 uPos, uC;
  uniform float uRpx, uTime, uAmt, uCopySize, uLensE;
  varying vec2 vQ;
  void main(){
    vec2 d = gl_FragCoord.xy - uC;
    float r = length(d) / uRpx;   // en rayons de l'étoile
    float a = atan(d.y, d.x);
    float near = exp(-max(r - 1.0, 0.0) * 0.8);
    float sw = 0.45 * near * (0.65 + 0.35 * sin(uTime * 1.1 + r * 2.5));                          // tourbillon
    float rip = 0.09 * near * sin(r * 6.5 - uTime * 2.6 + 1.5 * sin(a * 3.0 + uTime * 0.8));     // ondes de chaleur
    float rs = max(r - uLensE * uLensE / max(r, 0.4), 0.0) + rip;                                  // lentille : θ − θE²/θ
    vec2 sp = uC + vec2(cos(a + sw), sin(a + sw)) * rs * uRpx;
    vec3 col = texture2D(uCopy, clamp((sp - uPos) / uCopySize, 0.0, 1.0)).rgb;
    float m = (1.0 - smoothstep(2.0, 3.0, r)) * smoothstep(0.0, 0.05, 1.0 - max(abs(vQ.x), abs(vQ.y)));
    gl_FragColor = vec4(col, m * uAmt);
  }
`;

const STREAM_VERT = /* glsl */ `
  ${LENS_VERT}
  attribute vec3 aC, aTan;
  attribute vec3 aU;   // x = t le long du filament (0 = centre de l'étoile au repos, 1 = disque), y = côté (-1..1), z = abscisse curviligne
  uniform float uWidth;
  varying vec3 vU;
  varying float vBehind, vNear;
  void main(){
    vec3 v = normalize(uCamPos - aC);
    vNear = smoothstep(5.0, 13.0, distance(uCamPos, aC));   // la caméra frôle le filament pendant certaines boucles
    vec3 sd = cross(aTan, v);
    float l = length(sd);
    sd = l > 1e-4 ? sd / l : vec3(0.0, 1.0, 0.0);
    float w = uWidth * (0.55 + 0.9 * aU.x) * (1.0 + 0.6 * smoothstep(0.85, 1.0, aU.x));   // s'élargit en arrivant
    vU = aU;
    gl_Position = lensProject(aC + sd * aU.y * w * 3.0, vBehind);   // ×3 : place pour le halo
  }
`;

const STREAM_FRAG = /* glsl */ `
  ${LENS_FRAG}
  uniform float uTime, uFlow, uBright, uAbsorb, uStart, uReach, uHeadW, uGrown, uFeed;
  varying vec3 vU;
  varying float vBehind, vNear;
  float h1(float x){ return fract(sin(x * 127.1) * 43758.5453); }
  float n1(float x){ float i = floor(x), f = fract(x); return mix(h1(i), h1(i + 1.0), f * f * (3.0 - 2.0 * f)); }
  void main(){
    float t = vU.x, v = vU.y * 3.0, sa = vU.z;   // v : largeur du cœur = 1
    float s = sa - uTime * uFlow;               // la matière descend vers le disque
    float o = 0.32 * sin(s * 1.3 + 1.7);        // deux brins tressés
    float c1 = exp(-pow((v - o) * 2.4, 2.0)), c2 = exp(-pow((v + o * 0.8) * 2.6, 2.0));
    float core = max(c1, c2 * 0.8);
    float clump = 0.55 + 0.9 * n1(s * 1.6) * n1(s * 0.47 + 9.0);
    // étoile en cours de dévoration (uFeed) : sa matière remplit tout le filament, en gros paquets qui coulent
    clump = mix(clump, 0.45 + 1.3 * n1(s * 1.05) * n1(s * 0.31 + 4.0), uFeed);
    float halo = exp(-pow(v * 0.9, 2.0)) * (0.22 + 0.2 * uFeed);
    // naît à la pointe de l'étoile (uStart), chauffe, se fond dans le point chaud
    float along = smoothstep(uStart, uStart + 0.5, sa) * mix(0.4 + 0.8 * t * t, 1.0, uFeed) * (1.0 - smoothstep(0.86, 1.0, t));
    // pousse depuis l'étoile vers le disque pendant l'approche de la caméra (uReach), front doux et plus brillant
    float head = 1.0 - smoothstep(uReach - uHeadW, uReach, sa);
    float front = exp(-pow((sa - uReach + uHeadW * 0.6) / (uHeadW * 0.35), 2.0)) * (1.0 - uGrown);
    along *= head;
    vec3 col = mix(vec3(0.80, 0.90, 1.0), vec3(1.0, 0.957, 0.878), smoothstep(0.0, 0.3, t));   // bleu-blanc -> #fff4e0
    col = mix(col, vec3(1.0, 0.702, 0.278), smoothstep(0.25, 0.65, t));                       // -> ambre #ffb347
    col = mix(col, vec3(1.0, 0.353, 0.122), smoothstep(0.6, 1.0, t) * 0.75);                   // -> orange plasma #ff5a1f
    // matière de l'étoile : bleu-blanc sur toute la longueur, qui ne chauffe qu'en approchant du disque
    vec3 starCol = mix(vec3(0.78, 0.90, 1.0), vec3(1.0, 0.86, 0.62), smoothstep(0.55, 1.0, t));
    col = mix(col, starCol, uFeed * 0.75);
    col = mix(col, vec3(1.0, 0.96, 0.9), core * clump * 0.35);
    float I = (along * (core * clump * (1.0 + 1.2 * uFeed) + halo) + front * core * 1.5) * uBright;
    // bords plus froids : ils absorbent un peu la lumière du disque derrière (contraste)
    float ab = uAbsorb * exp(-pow(v * 0.75, 2.0)) * smoothstep(uStart, uStart + 0.5, sa) * head * (1.0 - smoothstep(0.8, 1.0, t));
    float k = bhVis(vBehind) * vNear;
    gl_FragColor = vec4((1.0 - exp(-col * I * 1.6)) * k, ab * k);   // prémultiplié, saturation douce
  }
`;

const sstep = THREE.MathUtils.smoothstep, clamp01 = (x: number) => THREE.MathUtils.clamp(x, 0, 1);

export function createCompanion(): SceneElement {
  const P = {
    orbitR: 19, phi: 0.65, height: 7, radius: 1.35, elong: 0.6,
    spiral: 2.4, joinR: 9.0, width: 0.2, flow: 2.2, stream: 1.9, absorb: 0,
    star: 1.0, halo: 0.5, hot: 0.75, flash: 8, optic: 0.25, opticLens: 0.23, eatStart: 1.0, eatEnd: 2.0, lens: true,
    surfSpeed: 2.5, surfAmt: 2.0, // matière qui coule à la surface de l'étoile : vitesse et contraste
    growFrom: 0.3, growTo: 0.95, // le filament pousse de l'étoile au disque pendant l'approche S1 → S2 (position caméra)
    // dévoration (progression e = temps réel de la transition S2 → S3, de 0 à 1)
    eatAccel: 0.35, // 0 = vitesse constante dès le départ, 1 = départ doux qui accélère (chute)
    headEnd: 0.55, headPow: 1.3, // le front de l'étoile atteint le disque à e = headEnd (courbe d'accélération headPow)
    tailFrom: 0.3, tailPow: 2.2, // la queue se met en route à e = tailFrom et atteint le disque à e = 1 (plus tard = corps plus long)
    thinFrom: 0.25, thinTo: 0.85, meltW: 0.5, // amincissement jusqu'à meltW × la largeur du filament
    meltFrom: 0.0, meltTo: 0.95, meltGrad: 1.0, meltNoise: 0, // fonte dans le filament : dégradé avant → arrière, mèches
    volume: 0.7, // épaisseur pendant l'étirement (1 = volume conservé, moins = plus fin, plus long à l'œil)
    flashAt: 0.85, // éclair du point chaud quand le gros de la matière plonge
  };
  let scene: THREE.Scene, opticScene: THREE.Scene;
  let starMat: THREE.ShaderMaterial, haloMat: THREE.ShaderMaterial, opticMat: THREE.ShaderMaterial, streamMat: THREE.ShaderMaterial;
  let starGeo: THREE.BufferGeometry, quadGeo: THREE.BufferGeometry, streamGeo: THREE.BufferGeometry;
  let body: THREE.Mesh;
  let copyTex: THREE.FramebufferTexture;
  let curveTex: THREE.DataTexture;
  const curveData = new Float32Array(M * 3 * 4);
  let lu: ReturnType<typeof lensUniforms>;
  const rest = new THREE.Vector3(); // centre de l'étoile au repos
  const center = new THREE.Vector3(), dir = new THREE.Vector3(), ndc = new THREE.Vector3();
  const pts: THREE.Vector3[] = [];
  const cum: number[] = [];
  let joinPhi = 0, len = 1;
  const optic = { on: false, x: 0, y: 0, rNdc: 0 };
  const buf = new THREE.Vector2(), copyPos = new THREE.Vector2();

  /** Trajectoire du filament (CPU, recalculée quand un réglage change) : du centre de l'étoile au disque, en spirale. */
  function build() {
    rest.set(P.orbitR * Math.cos(P.phi), P.height, P.orbitR * Math.sin(P.phi));
    const rc = Math.hypot(rest.x, rest.z), phiS = Math.atan2(rest.z, rest.x);
    joinPhi = phiS - P.spiral;
    pts.length = cum.length = 0;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      // départ quasi radial (chute), arrivée tangentielle dans le sens de rotation du disque (azimut décroissant)
      const r = rc + (P.joinR - rc) * (1 - (1 - t) * (1 - t));
      const a = phiS - P.spiral * Math.pow(t, 1.4);
      pts.push(new THREE.Vector3(r * Math.cos(a), P.height * (1 - t) * (1 - t), r * Math.sin(a)));
      cum.push(i ? cum[i - 1] + pts[i].distanceTo(pts[i - 1]) : 0);
    }
    len = cum[N];
    const C = new Float32Array((N + 1) * 6), T = new Float32Array((N + 1) * 6), U = new Float32Array((N + 1) * 6);
    const tan = new THREE.Vector3();
    for (let i = 0; i <= N; i++) {
      tan.subVectors(pts[Math.min(i + 1, N)], pts[Math.max(i - 1, 0)]).normalize();
      for (let k = 0; k < 2; k++) {
        const j = (i * 2 + k) * 3;
        C.set([pts[i].x, pts[i].y, pts[i].z], j);
        T.set([tan.x, tan.y, tan.z], j);
        U.set([i / N, k ? 1 : -1, cum[i]], j);
      }
    }
    streamGeo.setAttribute("aC", new THREE.BufferAttribute(C, 3));
    streamGeo.setAttribute("aTan", new THREE.BufferAttribute(T, 3));
    streamGeo.setAttribute("aU", new THREE.BufferAttribute(U, 3));
    streamGeo.setAttribute("position", new THREE.BufferAttribute(C, 3)); // requis par three, non utilisé
    // courbe pour le corps de l'étoile : rééchantillonnée en abscisse curviligne, repère transporté le long du fil
    const cp = new THREE.Vector3(), ct = new THREE.Vector3(), cn = new THREE.Vector3();
    for (let j = 0; j < M; j++) {
      along((j / (M - 1)) * len, cp, ct);
      if (j === 0) cn.crossVectors(ct, THREE.Object3D.DEFAULT_UP).normalize();
      else cn.addScaledVector(ct, -cn.dot(ct)).normalize();
      curveData.set([cp.x, cp.y, cp.z, 1], j * 4);
      curveData.set([ct.x, ct.y, ct.z, 0], (M + j) * 4);
      curveData.set([cn.x, cn.y, cn.z, 0], (2 * M + j) * 4);
    }
    if (curveTex) curveTex.needsUpdate = true;
  }

  /** Point et tangente du filament à l'abscisse curviligne sa. */
  function along(sa: number, outP: THREE.Vector3, outT: THREE.Vector3) {
    let i = 0;
    while (i < N - 1 && cum[i + 1] < sa) i++;
    const u = THREE.MathUtils.clamp((sa - cum[i]) / Math.max(cum[i + 1] - cum[i], 1e-6), 0, 1);
    outP.lerpVectors(pts[i], pts[i + 1], u);
    outT.subVectors(pts[Math.min(i + 2, N)], pts[Math.max(i - 1, 0)]).normalize();
  }

  return {
    id: "compagne",
    label: "5 · Étoile compagne dévorée",
    slides: [S(2)],
    cost: "moyen",
    minTier: "moyenne",
    layers: ["front"],
    init(ctx: SceneContext) {
      lu = lensUniforms(ctx);
      const common = { ...lu, uTime: { value: 0 }, uStar: { value: center } };
      curveTex = new THREE.DataTexture(curveData, M, 3, THREE.RGBAFormat, THREE.FloatType);
      curveTex.minFilter = curveTex.magFilter = THREE.NearestFilter;
      starGeo = new THREE.SphereGeometry(1, 64, 96); // pôles = axe du filament : beaucoup d'anneaux pour l'étirement
      starMat = new THREE.ShaderMaterial({
        uniforms: {
          ...common, uCurve: { value: curveTex }, uLen: { value: 1 }, uSC: { value: 0 }, uAx: { value: 1 }, uW: { value: 1 },
          uElong: { value: 0 }, uBright: { value: 1 }, uEat: { value: 0 }, uSurfSpeed: { value: 1 }, uSurfAmt: { value: 1 },
          uMelt: { value: 0 }, uMeltNoise: { value: 0 }, uMeltGrad: { value: 1 }, uFlow: { value: 1 }, uStreamB: { value: 1 }, uWS: { value: 1 }, uFeed: { value: 0 },
        },
        vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
        transparent: true, depthTest: true, depthWrite: true,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      });
      quadGeo = new THREE.PlaneGeometry(2, 2);
      const quadU = { uR: { value: new THREE.Vector3() }, uU: { value: new THREE.Vector3() } };
      haloMat = new THREE.ShaderMaterial({
        uniforms: { ...common, ...quadU, uSize: { value: 1 }, uHalo: { value: 1 } },
        vertexShader: QUAD_VERT, fragmentShader: HALO_FRAG,
        transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      copyTex = new THREE.FramebufferTexture(COPY, COPY);
      opticMat = new THREE.ShaderMaterial({
        uniforms: {
          ...common, ...quadU, uSize: { value: 1 }, uCopy: { value: copyTex }, uPos: { value: copyPos }, uC: { value: new THREE.Vector2() },
          uRpx: { value: 1 }, uAmt: { value: 1 }, uCopySize: { value: COPY }, uLensE: { value: 0.75 },
        },
        vertexShader: QUAD_VERT, fragmentShader: OPTIC_FRAG,
        transparent: true, depthTest: false, depthWrite: false,
      });
      streamGeo = new THREE.BufferGeometry();
      const idx: number[] = [];
      for (let i = 0; i < N; i++) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      streamGeo.setIndex(idx);
      build();
      curveTex.needsUpdate = true;
      streamMat = new THREE.ShaderMaterial({
        uniforms: { ...common, uWidth: { value: 1 }, uFlow: { value: 1 }, uBright: { value: 1 }, uAbsorb: { value: 0 }, uStart: { value: 0 },
          uReach: { value: 0 }, uHeadW: { value: 1 }, uGrown: { value: 0 }, uFeed: { value: 0 } },
        vertexShader: STREAM_VERT, fragmentShader: STREAM_FRAG,
        transparent: true, side: THREE.DoubleSide, depthTest: true, depthWrite: false,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      });
      const opt = new THREE.Mesh(quadGeo, opticMat);
      opt.frustumCulled = false;
      opticScene = new THREE.Scene().add(opt);
      const halo = new THREE.Mesh(quadGeo, haloMat), stream = new THREE.Mesh(streamGeo, streamMat);
      body = new THREE.Mesh(starGeo, starMat);
      // le filament d'abord : l'étoile le recouvre (opaque) puis le laisse voir en fondant dedans
      halo.renderOrder = 0; stream.renderOrder = 1; body.renderOrder = 2;
      for (const m of [halo, body, stream]) m.frustumCulled = false;
      scene = new THREE.Scene().add(halo, body, stream);
    },
    update(f: FrameParams) {
      updateLens(lu, f, P.lens);
      // progression de la dévoration, pilotée par la position de la caméra (réversible) : 0 sur S2, 1 sur S3.
      // L'ease sine.inOut de la navigation est défait (temps réel τ) : le mouvement part dès le début de la transition.
      const p = clamp01((f.s - P.eatStart) / Math.max(P.eatEnd - P.eatStart, 1e-3));
      const tau = Math.acos(1 - 2 * p) / Math.PI;
      const e = tau + P.eatAccel * (tau * tau - tau);
      // dès le début, l'étoile se vide dans tout le filament (feed)
      const feed = sstep(e, 0, 0.3) * (1 - sstep(e, 0.9, 1));

      // corps posé sur le filament : front (sF) et queue (sB) en abscisse curviligne, section uW
      const el = P.elong, qmin = -1 - 0.18 * el, qmax = 1 + el;
      const sF0 = P.radius * qmax, sB0 = P.radius * qmin, L0 = sF0 - sB0;
      const sFfree = sF0 + (len - sF0) * Math.pow(e / Math.max(P.headEnd, 0.05), P.headPow);
      const sF = Math.min(sFfree, len);
      const sB = Math.min(sB0 + (len - sB0) * Math.pow(clamp01((e - P.tailFrom) / Math.max(1 - P.tailFrom, 0.05)), P.tailPow), sF);
      const wEnd = P.width * (1 + 1.8 * feed) * P.meltW;
      const wVol = Math.max(P.radius * Math.pow(L0 / Math.max(sFfree - sB, 1e-3), 0.5 / Math.max(P.volume, 0.1)), wEnd); // volume (≈ conservé si 1)
      const W = THREE.MathUtils.lerp(wVol, wEnd, sstep(e, P.thinFrom, P.thinTo));
      const ax = (sF - sB) / (qmax - qmin), sc = sB - qmin * ax;
      const melt = sstep(e, P.meltFrom, P.meltTo);
      along(THREE.MathUtils.clamp(sc, sB, sF), center, dir);

      // le filament part de la queue de l'étoile (recouvert par elle tant qu'elle est opaque), puis se vide dans le disque
      const restTip = sF0 * 0.85;
      const start = Math.max(sB, restTip * (1 - feed));
      // apparition : le filament pousse de la pointe de l'étoile jusqu'au disque pendant l'approche de la caméra
      const grow = sstep(f.s, P.growFrom, P.growTo);
      const headW = len * 0.08;
      const reach = restTip + (len + headW - restTip) * grow;

      const su = starMat.uniforms;
      su.uTime.value = f.time;
      su.uLen.value = len; su.uSC.value = sc; su.uAx.value = ax; su.uW.value = W; su.uElong.value = el;
      su.uBright.value = P.star; su.uEat.value = e; su.uSurfSpeed.value = P.surfSpeed; su.uSurfAmt.value = P.surfAmt;
      su.uMelt.value = melt; su.uMeltNoise.value = P.meltNoise; su.uMeltGrad.value = P.meltGrad;
      body.visible = melt < 0.999;
      const hu = haloMat.uniforms, ou = opticMat.uniforms;
      hu.uR.value.copy(f.camR); hu.uU.value.copy(f.camU);
      hu.uSize.value = Math.max(W, 0.01) * 4.5; hu.uHalo.value = P.halo * (1 - melt);
      const u = streamMat.uniforms;
      u.uWidth.value = P.width * (1 + 1.8 * feed);
      u.uFlow.value = P.flow * (1 + 1.5 * e); u.uBright.value = P.stream * (1 + 1.2 * feed);
      su.uFlow.value = u.uFlow.value; su.uStreamB.value = u.uBright.value; su.uWS.value = u.uWidth.value; su.uFeed.value = feed;
      u.uAbsorb.value = P.absorb; u.uStart.value = start;
      u.uReach.value = reach; u.uHeadW.value = headW; u.uGrown.value = grow; u.uFeed.value = feed;

      // effet d'optique : centre et rayon apparents de l'étoile (même lentille que les shaders)
      lensNdc(center, f, ndc);
      const rNdc = ndc.z > 0.5 ? W / ndc.z / TAN_HALF : 0;
      const opticAmt = P.optic * (1 - sstep(e, 0, 0.6));
      optic.on = opticAmt > 0 && rNdc > 0.004 && Math.abs(ndc.x) < 1.6 && Math.abs(ndc.y) < 1.6;
      optic.x = ndc.x; optic.y = ndc.y; optic.rNdc = rNdc;
      ou.uAmt.value = opticAmt; ou.uLensE.value = P.opticLens;

      // point chaud : ravivé quand on quitte S1, éclair quand le gros de l'étoile plonge, puis il s'éteint avant S3
      const flash = P.flash * Math.exp(-Math.pow((e - P.flashAt) / 0.08, 2));
      const hot = P.hot * sstep(grow, 0.85, 1) * (1 - sstep(e, 0.88, 1)) + flash * (1 - sstep(e, 0.92, 1));
      const fl = P.flash > 0 ? flash / P.flash : 0;
      f.bh.hot.set(joinPhi, P.joinR, 1.1 + 1.2 * fl, hot * (0.85 + 0.15 * Math.sin(f.time * 5.3) * Math.sin(f.time * 2.1)));
    },
    render(_layer, ctx: SceneContext) {
      updateView(lu, ctx);
      const r = ctx.renderer;
      if (optic.on) {
        // copie de l'image autour de l'étoile (avant de la dessiner), puis rééchantillonnage déformé
        r.getDrawingBufferSize(buf);
        const cx = (optic.x * 0.5 + 0.5) * buf.x, cy = (optic.y * 0.5 + 0.5) * buf.y;
        const rpx = optic.rNdc * 0.5 * buf.y;
        copyPos.set(
          Math.round(THREE.MathUtils.clamp(cx - COPY / 2, 0, Math.max(0, buf.x - COPY))),
          Math.round(THREE.MathUtils.clamp(cy - COPY / 2, 0, Math.max(0, buf.y - COPY))),
        );
        r.copyFramebufferToTexture(copyTex, copyPos);
        const ou = opticMat.uniforms;
        ou.uC.value.set(cx, cy);
        ou.uRpx.value = Math.min(rpx, (COPY / 2 - 4) / 3); // l'effet tient dans la copie (rayon d'action : 3 rayons d'étoile)
        ou.uSize.value = haloMat.uniforms.uSize.value * (3 / 4.5) * (ou.uRpx.value / rpx);
        r.render(opticScene, ctx.camera);
      }
      r.clearDepth();
      r.render(scene, ctx.camera);
    },
    dispose() {
      starGeo.dispose(); quadGeo.dispose(); streamGeo.dispose(); copyTex.dispose(); curveTex.dispose();
      starMat.dispose(); haloMat.dispose(); opticMat.dispose(); streamMat.dispose();
    },
    gui(folder) {
      const geo = folder.addFolder("Position et forme");
      geo.add(P, "orbitR", 13, 30, 0.1).name("Distance au trou noir").onChange(build);
      geo.add(P, "phi", -3.14, 3.14, 0.01).name("Azimut").onChange(build);
      geo.add(P, "height", -9, 9, 0.05).name("Hauteur / disque").onChange(build);
      geo.add(P, "radius", 0.5, 3, 0.05).name("Rayon de l'étoile");
      geo.add(P, "elong", 0, 1.5, 0.01).name("Goutte (lobe de Roche)");
      geo.add(P, "spiral", 0.5, 4.5, 0.01).name("Enroulement du filament (rad)").onChange(build);
      geo.add(P, "joinR", 4, 12, 0.1).name("Rayon d'impact sur le disque").onChange(build);
      geo.close();
      const eat = folder.addFolder("Dévoration (S2 → S3)");
      eat.add(P, "eatAccel", 0, 1, 0.01).name("Départ doux (0 = vitesse constante)");
      eat.add(P, "headEnd", 0.2, 1, 0.01).name("Front au disque à (e)");
      eat.add(P, "headPow", 0.6, 3, 0.05).name("Front : accélération");
      eat.add(P, "tailFrom", 0, 0.8, 0.01).name("Queue : départ (e)");
      eat.add(P, "tailPow", 0.6, 3, 0.05).name("Queue : accélération");
      eat.add(P, "thinFrom", 0, 1, 0.01).name("Amincissement : début (e)");
      eat.add(P, "thinTo", 0, 1, 0.01).name("Amincissement : fin (e)");
      eat.add(P, "meltW", 0.1, 2, 0.05).name("Largeur finale (× filament)");
      eat.add(P, "meltFrom", 0, 1, 0.01).name("Fonte : début (e)");
      eat.add(P, "meltTo", 0, 1, 0.01).name("Fonte : fin (e)");
      eat.add(P, "meltGrad", 0.3, 4, 0.05).name("Fonte : dégradé (1 = tout le corps)");
      eat.add(P, "meltNoise", 0, 1, 0.01).name("Fonte : mèches");
      eat.add(P, "volume", 0.2, 1.5, 0.05).name("Épaisseur pendant l'étirement");
      eat.add(P, "flashAt", 0.3, 1, 0.01).name("Éclair à (e)");
      eat.add(P, "eatStart", 1, 1.5, 0.01).name("Début (s)");
      eat.add(P, "eatEnd", 1.5, 2, 0.01).name("Fin (s)");
      folder.add(P, "star", 0, 2, 0.05).name("Éclat de l'étoile");
      folder.add(P, "surfSpeed", 0, 6, 0.1).name("Surface : vitesse");
      folder.add(P, "surfAmt", 0, 4, 0.1).name("Surface : contraste");
      folder.add(P, "halo", 0, 2, 0.05).name("Halo");
      folder.add(P, "optic", 0, 1, 0.05).name("Effet d'optique autour");
      folder.add(P, "opticLens", 0, 1.2, 0.01).name("Effet d'optique : lentille");
      folder.add(P, "stream", 0, 3, 0.05).name("Éclat du filament");
      folder.add(P, "absorb", 0, 1, 0.05).name("Absorption (bords sombres)");
      folder.add(P, "width", 0.04, 0.6, 0.01).name("Largeur du filament");
      folder.add(P, "flow", 0, 5, 0.05).name("Vitesse de la matière");
      folder.add(P, "hot", 0, 3, 0.05).name("Point chaud");
      folder.add(P, "flash", 0, 8, 0.1).name("Éclair à l'impact");
      folder.add(P, "growFrom", 0, 1, 0.01).name("Filament : apparition début (s)");
      folder.add(P, "growTo", 0, 1, 0.01).name("Filament : apparition fin (s)");
      folder.add(P, "lens").name("Lentille (partie derrière)");
    },
  };
}
