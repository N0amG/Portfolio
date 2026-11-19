import * as THREE from "three";
import { MAGNETAR_POS, S, TAN_HALF, cameraPose, makePose } from "../timeline";
import { LENS_FRAG, LENS_VERT, lensUniforms, updateLens, updateView } from "./lens";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   Magnétar (S6, arrivée de la traversée de la nébuleuse) : étoile à neutrons au champ magnétique extrême. Pas de
   faisceaux ni de jets (c'est ce qui le distingue du pulsar de S4) : on visualise sa magnétosphère.
   - Interaction : chaque ligne est une CORDE simulée en 3D (JS, 81 points, sous-pas) : rappel vers sa forme de repos
     (qui tourne avec l'étoile), tension entre voisins (les ondulations se propagent le long du fil), amortissement ; les
     pieds sont fixés à l'étoile. La souris est un « doigt » à l'écran : tout point touché est repoussé hors du doigt,
     dans le plan perpendiculaire à la visée, quel que soit l'angle de rotation. Si un point dépasse le point de rupture,
     la ligne se décroche (elle ignore le doigt un instant) et revient avec rebond et ondulations. La lentille du curseur
     (17) ne dévie plus les lignes qu'à 7 %.
   - Lignes de champ dipolaires r = L·sin²θ autour de l'axe magnétique m, sur 5 couches (L) et plusieurs azimuts ;
     magnétosphère torsadée (l'azimut glisse le long de chaque ligne, la torsion respire). Rubans tournés vers la caméra,
     plus brillants près des pieds (champ fort), bouffées de plasma qui courent d'un pôle à l'autre.
   - Rotation lente (période ≈ 8 s) de m autour de l'axe de rotation ω (incliné de α).
   - Sursaut (« séisme stellaire ») toutes les ≈ 7 s : les lignes s'embrasent et gonflent un peu, flash de l'étoile.
   - Étoile : vrai petit disque blanc chaud (assombrissement centre-bord), points chauds aux pôles magnétiques, halo.
   - Les lignes situées derrière l'étoile sont cachées par son disque ; lentille et masquage par le trou noir (lens.ts).
   Couleurs : #fff4e0 (pieds, étoile) → ambre #ffb347 → orange plasma #ff5a1f (couches externes), teinte chaude de S6.
   ─────────────────────────────────────────────────────────── */

const SEG = 80;
const SHELLS: { L: number; n: number }[] = [
  { L: 1.15, n: 8 }, { L: 1.8, n: 10 }, { L: 2.8, n: 12 }, { L: 4.2, n: 12 }, { L: 6.3, n: 14 },
];
const LMAX = 6.3;

const LINE_VERT = /* glsl */ `
  ${LENS_VERT}
  attribute vec3 aU;   // x = position le long de la ligne (0..1), y = côté (-1..1), z = graine
  attribute vec2 aL;   // x = L (rayon équatorial de la ligne), y = azimut de départ
  attribute vec3 aD;   // déplacement du point (monde), calculé par la simulation de corde
  uniform vec3 uP, uM, uB1, uB2;
  uniform float uR, uTwist, uTime, uSwell, uWidth;
  uniform vec4 uLensM;   // 17 · curseur gravitationnel (repère uv du shader du trou noir : x × aspect, y vers le haut)
  uniform float uGlowK;  // 1 / déplacement de rupture (monde) : les lignes tendues s'éclairent
  uniform float uCursorK;  // part de la déviation optique du curseur appliquée aux lignes (0,07 : presque rien)
  varying vec3 vU;
  varying float vBehind, vOcc, vL, vNear;
  vec3 fieldPoint(float u, float L, float phi){
    float th0 = asin(sqrt(clamp(uR / L, 0.0, 1.0)));
    float th = mix(th0, 3.14159265 - th0, u);
    float s = sin(th);
    float r = L * s * s;
    float ph = phi + uTwist * (u - 0.5) * (1.0 + 0.35 * sin(uTime * 0.4 + phi * 3.0));   // torsion de la magnétosphère
    return uP + uB1 * (r * s * cos(ph)) + uM * (r * cos(th)) + uB2 * (r * s * sin(ph));
  }
  void main(){
    float L = aL.x * uSwell;
    vec3 c = fieldPoint(aU.x, L, aL.y) + aD;
    vec3 tg = fieldPoint(min(aU.x + 0.004, 1.0), L, aL.y) - fieldPoint(max(aU.x - 0.004, 0.0), L, aL.y);
    vec3 v = normalize(uCamPos - c);
    vec3 sd = cross(tg, v);
    float l = length(sd);
    sd = l > 1e-6 ? sd / l : vec3(1.0, 0.0, 0.0);
    // caché par le disque de l'étoile : derrière elle et à moins d'un rayon de son centre (vu de la caméra)
    vec3 cd = normalize(uCamPos - uP), rel = c - uP;
    float along = dot(rel, cd);
    float perp = length(rel - cd * along);
    vOcc = step(along, 0.0) * (1.0 - smoothstep(uR * 0.92, uR * 1.08, perp));
    vU = aU;
    vL = aL.x / ${LMAX.toFixed(2)};
    vec4 cp = lensProject(c + sd * aU.y * uWidth * (1.0 + 0.6 * vL) * 3.0, vBehind);   // ×3 : place pour la lueur
    vNear = min(1.0, length(aD) * uGlowK);   // les lignes tendues ou qui vibrent s'éclairent
    if (cp.w > 0.0){
      vec2 n = cp.xy / cp.w;
      vec2 nu = vec2(n.x * uAspect, n.y);
      if (uLensM.z > 0.0 && uCursorK > 0.0){
        // lentille du curseur : l'image d'un point s est en s + d(s), d = q·θE²/(|q|² + cœur²)·e^(−7|q|²)
        vec2 q = nu - uLensM.xy;
        float r2 = dot(q, q);
        nu += q * (uCursorK * uLensM.z / (r2 + uLensM.w * uLensM.w)) * exp(-r2 * 7.0);
      }
      cp.xy = vec2(nu.x / uAspect, nu.y) * cp.w;
    }
    gl_Position = cp;
  }
`;
const LINE_FRAG = /* glsl */ `
  ${LENS_FRAG}
  uniform float uTime, uFade, uBright, uBurst, uFlow;
  varying vec3 vU;
  varying float vBehind, vOcc, vL, vNear;
  void main(){
    float x = vU.y * 3.0;
    float core = exp(-x * x * 3.0);
    float glow = exp(-x * x * 0.45) * 0.22;
    float foot = pow(abs(vU.x - 0.5) * 2.0, 4.0);                              // pieds des lignes : champ fort
    float ph = fract(vU.x * 3.0 - uTime * uFlow * (0.6 + 0.5 * fract(vU.z * 7.1)) + vU.z);
    float flow = pow(max(0.0, 1.0 - abs(ph - 0.5) * 2.0), 10.0);               // bouffées de plasma qui courent le long
    float shell = 1.0 - 0.55 * vL;
    float I = (core * (0.28 + 0.9 * foot + 1.4 * flow) + glow * (0.5 + foot)) * shell * (1.0 + 2.2 * uBurst) * (1.0 + 0.8 * vNear) * uBright;
    vec3 col = mix(vec3(1.0, 0.702, 0.278), vec3(1.0, 0.353, 0.122), smoothstep(0.2, 0.9, vL));   // ambre -> orange plasma
    col = mix(col, vec3(1.0, 0.957, 0.878), clamp(foot * 0.7 + flow * 0.5, 0.0, 1.0));            // pieds et bouffées : #fff4e0
    gl_FragColor = vec4(1.0 - exp(-col * I), uFade * bhVis(vBehind) * (1.0 - vOcc));
  }
`;

const STAR_VERT = /* glsl */ `
  ${LENS_VERT}
  uniform vec3 uP;
  uniform float uSize;
  varying vec2 vQ;
  varying float vBehind;
  void main(){
    vec3 R = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 U = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vQ = position.xy;
    gl_Position = lensProject(uP + (R * position.x + U * position.y) * uSize, vBehind);
  }
`;
const STAR_FRAG = /* glsl */ `
  ${LENS_FRAG}
  uniform float uSize, uR, uFade, uBurst, uHalo;
  uniform vec3 uPole;   // pôle magnétique projeté (x, y : position sur le disque en rayons ; z : face visible > 0)
  varying vec2 vQ;
  varying float vBehind;
  void main(){
    vec2 p = vQ * uSize;
    float r = length(p) / uR;
    float disk = 1.0 - smoothstep(0.96, 1.04, r);
    float mu = sqrt(max(0.0, 1.0 - min(r * r, 1.0)));
    vec3 col = vec3(1.0, 0.96, 0.9) * (0.55 + 0.45 * mu) * 2.2 * disk;               // assombrissement centre-bord
    // points chauds aux deux pôles magnétiques
    vec2 q = p / uR;
    float hs = exp(-dot(q - uPole.xy, q - uPole.xy) * 18.0) * step(0.0, uPole.z)
             + exp(-dot(q + uPole.xy, q + uPole.xy) * 18.0) * step(0.0, -uPole.z);
    col += vec3(1.0, 0.85, 0.6) * hs * 2.5 * disk;
    // halo et flash du sursaut
    float h = max(r - 1.0, 0.0);
    col += vec3(1.0, 0.72, 0.4) * uHalo * (0.5 * exp(-h * 2.2) + 0.25 * exp(-h * 0.5)) * (1.0 - disk) * (1.0 + 3.0 * uBurst);
    col += vec3(1.0, 0.9, 0.8) * uBurst * 1.5 * exp(-h * 0.9);
    float edge = 1.0 - smoothstep(0.8, 1.0, length(vQ));
    gl_FragColor = vec4(1.0 - exp(-col * edge), uFade * bhVis(vBehind));
  }
`;

export function createMagnetar(): SceneElement {
  const P = {
    // réglages de Noam (19/11/2026)
    radius: 0.4, bright: 2.35, width: 0.019, twist: 0, flow: 1.3, incl: 0.57, period: 20.5,
    burstEvery: 5, burst: 0.95, halo: 1, edge: 1, lens: true,
    // cordes : doigt et rupture en unités d'écran (demi-hauteur), entre les premiers réglages et le maximum (retour de Noam)
    finger: 0.07, rupture: 0.25, hold: 0.6, spring: 1.3, damping: 0.11, tension: 1200, push: 30000,
    // forme de la déformation (retour de Noam : une grosse ondulation locale, comme un élastique ou un blob, pas des vaguelettes)
    blob: 6, blobGain: 2.4, smooth: 40,
    // retour de Noam : les petits arcs près de l'étoile doivent beaucoup plus résister (rigidité × (Lmax / L)^stiffPow),
    // et le doigt n'agit qu'une fois la caméra arrivée sur la slide (poids > arrive)
    stiffPow: 1.4, arrive: 0.998,
    lensK: 0.07,
  };
  let scene: THREE.Scene, lineMat: THREE.ShaderMaterial, starMat: THREE.ShaderMaterial;
  let lineGeo: THREE.BufferGeometry, starGeo: THREE.PlaneGeometry;
  let lu: ReturnType<typeof lensUniforms>;
  const pose = makePose();
  const pos = new THREE.Vector3(...MAGNETAR_POS);
  const w = new THREE.Vector3(), b1 = new THREE.Vector3(), b2 = new THREE.Vector3(), m = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), tmp = new THREE.Vector3(), view = new THREE.Vector3();
  let phase = 0, clock = 0;

  // ---- cordes : une par ligne de champ, SEG + 1 points (les deux pieds sont fixés)
  const NP = SEG + 1;
  let nLines = 0;
  let lineL: Float32Array, linePhi: Float32Array, cool: Float32Array;
  let rest: Float32Array, disp: Float32Array, vel: Float32Array, force: Float32Array, scr: Float32Array;
  let dAttr: THREE.BufferAttribute;
  const tmpF = new Float32Array((SEG + 1) * 3);
  let energy = 0;
  const mouse = new THREE.Vector2(), mouseV = new THREE.Vector2(), lastMouse = new THREE.Vector2();
  let mouseIn = false, listening = false;
  const onMove = (e: PointerEvent) => {
    const a = window.innerWidth / window.innerHeight;
    mouse.set(((e.clientX / window.innerWidth) * 2 - 1) * a, 1 - (e.clientY / window.innerHeight) * 2);
    mouseIn = true;
  };
  const onLeave = () => { mouseIn = false; };
  const resetStrings = () => { disp?.fill(0); vel?.fill(0); cool?.fill(0); energy = 0; };

  /** Position de repos d'un point (miroir exact de fieldPoint() du shader). */
  function restPoint(u: number, L: number, phi: number, time: number, out: Float32Array, o: number) {
    const th0 = Math.asin(Math.sqrt(Math.min(1, Math.max(0, P.radius / L))));
    const th = th0 + (Math.PI - 2 * th0) * u;
    const sn = Math.sin(th), r = L * sn * sn;
    const ph = phi + P.twist * (u - 0.5) * (1 + 0.35 * Math.sin(time * 0.4 + phi * 3));
    const x = r * sn * Math.cos(ph), y = r * Math.cos(th), z = r * sn * Math.sin(ph);
    out[o] = pos.x + b1.x * x + m.x * y + b2.x * z;
    out[o + 1] = pos.y + b1.y * x + m.y * y + b2.y * z;
    out[o + 2] = pos.z + b1.z * x + m.z * y + b2.z * z;
  }

  /** Une image de simulation : contact du doigt (écran), puis cordes amorties (sous-pas). */
  function simulate(f: FrameParams, swell: number, fade: number) {
    const dt = Math.min(f.dt, 1 / 30), asp = f.width / f.height, e = f.viewProj.elements;
    mouseV.copy(mouse).sub(lastMouse);
    lastMouse.copy(mouse);
    // le doigt n'agit que si la souris est dans la fenêtre et la caméra arrivée sur la slide (pendant l'approche, les lignes
    // défilent sous une souris immobile : sans ça, elles s'emballaient)
    const touching = mouseIn && fade > 0.5 && f.weight > P.arrive;
    if (!touching && energy < 1e-7) return false;
    const R = f.camR, U = f.camU;
    force.fill(0);
    for (let l = 0; l < nLines; l++) {
      if (cool[l] > 0) cool[l] -= dt;
      const L = lineL[l] * swell;
      let snapped = false, hit = false;
      for (let i = 0; i < NP; i++) {
        const k = l * NP + i, o = k * 3;
        restPoint(i / SEG, L, linePhi[l], f.time, rest, o);
        if (!touching || cool[l] > 0 || i === 0 || i === SEG) continue;
        const x = rest[o] + disp[o], y = rest[o + 1] + disp[o + 1], z = rest[o + 2] + disp[o + 2];
        const cw = e[3] * x + e[7] * y + e[11] * z + e[15];
        if (cw <= 0.1) continue;
        const ux = ((e[0] * x + e[4] * y + e[8] * z + e[12]) / cw) * asp, uy = (e[1] * x + e[5] * y + e[9] * z + e[13]) / cw;
        const wpu = cw * TAN_HALF; // unités monde par unité d'écran (demi-hauteur) à cette profondeur
        scr[k] = wpu;
        // rupture : point trop loin de sa forme de repos → la ligne se décroche
        const dl = Math.hypot(disp[o], disp[o + 1], disp[o + 2]) / wpu;
        if (dl > P.rupture) { snapped = true; break; }
        let dx = ux - mouse.x, dy = uy - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d >= P.finger) continue;
        if (d < 1e-5) { dx = mouseV.x || 1; dy = mouseV.y; } // pile sous le doigt : poussé dans le sens du geste
        hit = true;
        const n = Math.hypot(dx, dy) || 1, pen = (P.finger - d) * P.push * wpu / n;
        force[o] += (R.x * dx + U.x * dy) * pen;
        force[o + 1] += (R.y * dx + U.y * dy) * pen;
        force[o + 2] += (R.z * dx + U.z * dy) * pen;
      }
      if (snapped) {
        cool[l] = P.hold;
        for (let i = 0; i < NP; i++) { const o = (l * NP + i) * 3; force[o] = force[o + 1] = force[o + 2] = 0; }
      } else if (hit) {
        // la poussée est étalée le long de la corde (gaussienne de σ = blob points) : une bosse lisse, pas des coudes
        const base = l * NP * 3, sg = Math.max(0.5, P.blob), kr = Math.ceil(sg * 3);
        tmpF.set(force.subarray(base, base + NP * 3));
        let ksum = 0;
        for (let q = -kr; q <= kr; q++) ksum += Math.exp(-(q * q) / (2 * sg * sg));
        const g = P.blobGain / ksum;
        for (let i = 1; i < SEG; i++) {
          let fx = 0, fy = 0, fz = 0;
          for (let q = Math.max(0, i - kr); q <= Math.min(SEG, i + kr); q++) {
            const wq = Math.exp(-((q - i) * (q - i)) / (2 * sg * sg)), o = q * 3;
            fx += tmpF[o] * wq; fy += tmpF[o + 1] * wq; fz += tmpF[o + 2] * wq;
          }
          const o = base + i * 3;
          force[o] = fx * g; force[o + 1] = fy * g; force[o + 2] = fz * g;
        }
      }
    }
    // cordes : rappel vers le repos (k), tension entre voisins (T), amortissement (c) ; 4 sous-pas, pieds fixes
    // amortissement « visqueux » (Laplacien des vitesses, S = smooth) : il éteint les vaguelettes rapides et laisse la grosse
    // ondulation (le rebond de la bosse) ; 6 sous-pas pour rester stable
    const wk = 2 * Math.PI * P.spring, sub = 6, h = dt / sub;
    const Sv = Math.min(P.smooth, 0.45 / h);
    energy = 0;
    for (let st = 0; st < sub; st++) {
      for (let l = 0; l < nLines; l++) {
        const base = l * NP * 3;
        // rigidité propre à la ligne : les petits arcs (L petit, champ fort près de l'étoile) résistent bien plus
        const sL = Math.min(12, Math.pow(LMAX / lineL[l], P.stiffPow));
        const k = wk * wk * sL, c = 2 * P.damping * wk * Math.sqrt(sL), T = P.tension * sL;
        for (let i = 1; i < SEG; i++) {
          const o = base + i * 3;
          for (let a = 0; a < 3; a++) {
            const dd = disp[o + a];
            const vv = vel[o + a];
            const acc = -k * dd + T * (disp[o + a - 3] + disp[o + a + 3] - 2 * dd) - c * vv
              + Sv * (vel[o + a - 3] + vel[o + a + 3] - 2 * vv) + force[o + a];
            vel[o + a] += acc * h;
          }
        }
        for (let i = 1; i < SEG; i++) {
          const o = base + i * 3;
          disp[o] += vel[o] * h; disp[o + 1] += vel[o + 1] * h; disp[o + 2] += vel[o + 2] * h;
        }
      }
    }
    for (let j = 0; j < disp.length; j++) energy += disp[j] * disp[j] + vel[j] * vel[j] * 0.01;
    if (energy < 1e-7) resetStrings();
    // vers le GPU : deux sommets (côtés du ruban) par point
    const arr = dAttr.array as Float32Array;
    for (let k2 = 0; k2 < nLines * NP; k2++) {
      const o = k2 * 3, v = k2 * 6;
      arr[v] = arr[v + 3] = disp[o];
      arr[v + 1] = arr[v + 4] = disp[o + 1];
      arr[v + 2] = arr[v + 5] = disp[o + 2];
    }
    dAttr.needsUpdate = true;
    return true;
  }

  return {
    id: "magnetar",
    label: "Magnétar (S6)",
    slides: [S(6)],
    cost: "moyen",
    minTier: "moyenne",
    layers: ["front"],
    init(ctx: SceneContext) {
      cameraPose(S(6), 0, 0, pose);
      lu = lensUniforms(ctx);
      // axe de rotation : incliné vers la caméra de S6 (on voit la magnétosphère de trois quarts)
      tmp.copy(pose.pos).sub(pos).normalize();
      w.copy(pose.u).multiplyScalar(0.92).addScaledVector(pose.r, 0.25).addScaledVector(tmp, 0.3).normalize();
      e1.crossVectors(w, tmp).normalize();
      e2.crossVectors(w, e1);
      const U: number[] = [], A: number[] = [], idx: number[] = [], Ls: number[] = [], Ph: number[] = [];
      let seed = 0;
      for (const sh of SHELLS) {
        for (let k = 0; k < sh.n; k++) {
          const phi = (k / sh.n) * Math.PI * 2 + sh.L * 1.7;
          Ls.push(sh.L);
          Ph.push(phi);
          const sd = (seed = (seed * 9301 + 49297) % 233280) / 233280;
          const o = U.length / 3;
          for (let i = 0; i <= SEG; i++) {
            U.push(i / SEG, -1, sd, i / SEG, 1, sd);
            A.push(sh.L, phi, sh.L, phi);
            if (i < SEG) { const b = o + i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
          }
        }
      }
      nLines = Ls.length;
      lineL = new Float32Array(Ls);
      linePhi = new Float32Array(Ph);
      cool = new Float32Array(nLines);
      const n3 = nLines * NP * 3;
      rest = new Float32Array(n3); disp = new Float32Array(n3); vel = new Float32Array(n3); force = new Float32Array(n3);
      scr = new Float32Array(nLines * NP);
      lineGeo = new THREE.BufferGeometry();
      const a = new THREE.Float32BufferAttribute(U, 3);
      lineGeo.setAttribute("aU", a);
      lineGeo.setAttribute("aL", new THREE.Float32BufferAttribute(A, 2));
      dAttr = new THREE.BufferAttribute(new Float32Array(nLines * NP * 6), 3);
      dAttr.setUsage(THREE.DynamicDrawUsage);
      lineGeo.setAttribute("aD", dAttr);
      lineGeo.setAttribute("position", a); // requis par three, non utilisé
      lineGeo.setIndex(idx);
      const common = { transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending };
      lineMat = new THREE.ShaderMaterial({
        uniforms: {
          ...lu, uP: { value: pos }, uM: { value: m }, uB1: { value: b1 }, uB2: { value: b2 },
          uR: { value: 0.35 }, uTwist: { value: 0.9 }, uTime: { value: 0 }, uSwell: { value: 1 }, uWidth: { value: 0.02 },
          uFade: { value: 0 }, uBright: { value: 1 }, uBurst: { value: 0 }, uFlow: { value: 0.35 },
          uLensM: { value: new THREE.Vector4() }, uCursorK: { value: 0.07 }, uGlowK: { value: 0 },
        },
        vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, ...common,
      });
      starGeo = new THREE.PlaneGeometry(2, 2, 8, 8);
      starMat = new THREE.ShaderMaterial({
        uniforms: {
          ...lu, uP: { value: pos }, uSize: { value: 2 }, uR: { value: 0.35 }, uFade: { value: 0 }, uBurst: { value: 0 },
          uHalo: { value: 1 }, uPole: { value: new THREE.Vector3() },
        },
        vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, ...common,
      });
      const star = new THREE.Mesh(starGeo, starMat), lines = new THREE.Mesh(lineGeo, lineMat);
      star.frustumCulled = lines.frustumCulled = false;
      lines.renderOrder = 1; // les lignes passent devant le disque (celles de derrière sont cachées dans leur shader)
      scene = new THREE.Scene().add(star, lines);
    },
    setActive(active: boolean) {
      if (active && !listening) {
        window.addEventListener("pointermove", onMove);
        document.documentElement.addEventListener("pointerleave", onLeave);
      }
      if (!active && listening) {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
      }
      listening = active;
      if (!active) {
        resetStrings();
        if (dAttr) { (dAttr.array as Float32Array).fill(0); dAttr.needsUpdate = true; }
      }
    },
    update(f: FrameParams) {
      // rotation lente : l'axe magnétique m tourne autour de ω
      phase += (f.dt * Math.PI * 2) / Math.max(1, P.period);
      const c = Math.cos(phase), s = Math.sin(phase);
      b1.copy(e1).multiplyScalar(c).addScaledVector(e2, s);
      m.copy(w).multiplyScalar(Math.cos(P.incl)).addScaledVector(b1, Math.sin(P.incl));
      b1.copy(e1).multiplyScalar(-s).addScaledVector(e2, c); // repère (b1, b2) perpendiculaire à m
      b1.addScaledVector(m, -b1.dot(m)).normalize();
      b2.crossVectors(m, b1);
      // sursaut périodique : montée brève, retombée lente
      clock += f.dt;
      const age = clock % Math.max(2, P.burstEvery);
      const burst = P.burst * (age < 0.12 ? age / 0.12 : Math.exp(-(age - 0.12) * 1.6));
      const fade = THREE.MathUtils.smoothstep(f.weight, 0, P.edge);
      const swell = 1 + 0.08 * burst;
      // ---- cordes (physique 3D des lignes de champ, poussées par la souris) ----
      simulate(f, swell, fade);
      const depth = tmp.copy(pos).sub(f.camPos).dot(f.camF);
      updateLens(lu, f, P.lens);
      const lu2 = lineMat.uniforms, su = starMat.uniforms;
      lu2.uR.value = P.radius; lu2.uTwist.value = P.twist; lu2.uTime.value = f.time; lu2.uSwell.value = swell;
      lu2.uWidth.value = P.width; lu2.uFade.value = fade; lu2.uBright.value = P.bright; lu2.uBurst.value = burst;
      lu2.uFlow.value = P.flow;
      lu2.uLensM.value = f.bh.lensM; // même vecteur que le shader du trou noir, rempli par le curseur avant le rendu
      lu2.uCursorK.value = P.lensK;
      lu2.uGlowK.value = depth > 0 ? 1 / (P.rupture * depth * TAN_HALF) : 0;
      su.uR.value = P.radius; su.uSize.value = P.radius * 6; su.uFade.value = fade; su.uBurst.value = burst; su.uHalo.value = P.halo;
      // pôle magnétique projeté sur le disque (en rayons), et de quel côté il est visible
      view.copy(f.camPos).sub(pos).normalize();
      (su.uPole.value as THREE.Vector3).set(m.dot(f.camR) * 0.8, m.dot(f.camU) * 0.8, m.dot(view));
    },
    render(_layer, ctx: SceneContext) {
      updateView(lu, ctx);
      ctx.renderer.render(scene, ctx.camera);
    },
    dispose() {
      if (listening) {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
      }
      listening = false;
      lineGeo.dispose();
      starGeo.dispose();
      lineMat.dispose();
      starMat.dispose();
    },
    gui(folder) {
      folder.add(P, "bright", 0, 4, 0.05).name("Éclat des lignes de champ");
      folder.add(P, "width", 0.005, 0.08, 0.001).name("Épaisseur des lignes");
      folder.add(P, "twist", 0, 3, 0.05).name("Torsion de la magnétosphère");
      folder.add(P, "flow", 0, 2, 0.05).name("Vitesse des bouffées de plasma");
      folder.add(P, "incl", 0, 1.5, 0.01).name("Inclinaison de l'axe magnétique");
      folder.add(P, "period", 1, 30, 0.5).name("Période de rotation (s)");
      folder.add(P, "burstEvery", 2, 30, 0.5).name("Sursaut : toutes les (s)");
      folder.add(P, "burst", 0, 3, 0.05).name("Sursaut : intensité");
      folder.add(P, "radius", 0.1, 1, 0.01).name("Rayon de l'étoile");
      folder.add(P, "halo", 0, 3, 0.05).name("Halo");
      folder.add(P, "finger", 0.01, 0.2, 0.005).name("Cordes : taille du doigt (souris)");
      folder.add(P, "rupture", 0.05, 0.6, 0.01).name("Cordes : point de rupture");
      folder.add(P, "hold", 0, 2, 0.05).name("Cordes : décrochées pendant (s)");
      folder.add(P, "spring", 0.3, 5, 0.1).name("Rebond : fréquence (Hz)");
      folder.add(P, "damping", 0.01, 1, 0.01).name("Rebond : amortissement");
      folder.add(P, "tension", 200, 6000, 50).name("Ondulations : tension (vitesse des ondes)");
      folder.add(P, "push", 2000, 60000, 500).name("Cordes : force du doigt");
      folder.add(P, "blob", 1, 20, 0.5).name("Déformation : largeur de la bosse (points)");
      folder.add(P, "blobGain", 0.5, 10, 0.1).name("Déformation : force de la bosse");
      folder.add(P, "smooth", 0, 80, 1).name("Déformation : lissage des vaguelettes");
      folder.add(P, "stiffPow", 0, 3, 0.05).name("Petits arcs : rigidité (exposant)");
      folder.add(P, "lensK", 0, 1, 0.01).name("Lentille du curseur sur les lignes");
      folder.add(P, "lens").name("Lentille (partie derrière)");
      folder.add(P, "edge", 0, 1, 0.05).name("Fondu en bord de fenêtre");
    },
  };
}
