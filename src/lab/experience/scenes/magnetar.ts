import * as THREE from "three";
import { MAGNETAR_POS, S, TAN_HALF, cameraPose, makePose } from "../timeline";
import { LENS_FRAG, LENS_VERT, lensUniforms, updateLens, updateView } from "./lens";
import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   Magnétar (S6, arrivée de la traversée de la nébuleuse) : étoile à neutrons au champ magnétique extrême. Pas de
   faisceaux ni de jets (c'est ce qui le distingue du pulsar de S4) : on visualise sa magnétosphère.
   - Interaction : les lignes de champ sont déviées par la lentille du curseur (17 · même déviation que le fond dans le
     shader du trou noir, appliquée aux sommets) et s'éclairent un peu sous la souris.
   - Poussée élastique : la souris qui bouge dans la magnétosphère « accroche » les lignes autour du point de contact et
     les entraîne (déformation gaussienne à l'écran), avec une résistance croissante. Passé le point de rupture (ou si la
     souris s'arrête ou sort), elles se décrochent : ressort sous-amorti (léger rebond) + ondulations qui courent le long
     des lignes et s'éteignent, puis retour à la forme d'origine.
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
  uniform vec3 uP, uM, uB1, uB2;
  uniform float uR, uTwist, uTime, uSwell, uWidth;
  uniform vec4 uLensM;   // 17 · curseur gravitationnel (repère uv du shader du trou noir : x × aspect, y vers le haut)
  uniform vec4 uPush;    // poussée (même repère) : xy = point de contact, zw = déplacement
  uniform vec4 uRip;     // ondulations : xy = direction (unitaire), z = amplitude, w = rayon d'influence
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
    vec3 c = fieldPoint(aU.x, L, aL.y);
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
    vNear = 0.0;
    if (cp.w > 0.0){
      vec2 n = cp.xy / cp.w;
      vec2 nu = vec2(n.x * uAspect, n.y);
      // poussée élastique : la zone autour du point de contact suit le déplacement, + ondulations le long des lignes
      vec2 pa = nu - uPush.xy;
      float wgt = exp(-dot(pa, pa) / (uRip.w * uRip.w));
      nu += uPush.zw * wgt + uRip.xy * (uRip.z * wgt * sin(aU.x * 26.0 - uTime * 11.0 + aU.z * 6.283));
      vNear = wgt * min(1.0, length(uPush.zw) * 6.0);   // les lignes tendues s'éclairent
      if (uLensM.z > 0.0){
        // lentille du curseur : l'image d'un point s est en s + d(s), d = q·θE²/(|q|² + cœur²)·e^(−7|q|²)
        vec2 q = nu - uLensM.xy;
        float r2 = dot(q, q);
        nu += q * (uLensM.z / (r2 + uLensM.w * uLensM.w)) * exp(-r2 * 7.0);
        vNear = max(vNear, exp(-r2 * 14.0));
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
    // poussée élastique (unités : hauteur d'écran / 2)
    pushRange: 0.22, rupture: 0.16, spring: 2.2, damping: 0.16, ripple: 0.022,
  };
  let scene: THREE.Scene, lineMat: THREE.ShaderMaterial, starMat: THREE.ShaderMaterial;
  let lineGeo: THREE.BufferGeometry, starGeo: THREE.PlaneGeometry;
  let lu: ReturnType<typeof lensUniforms>;
  const pose = makePose();
  const pos = new THREE.Vector3(...MAGNETAR_POS);
  const w = new THREE.Vector3(), b1 = new THREE.Vector3(), b2 = new THREE.Vector3(), m = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), tmp = new THREE.Vector3(), view = new THREE.Vector3();
  let phase = 0, clock = 0;
  // poussée : état du ressort (repère uv du shader du trou noir : x × aspect, y vers le haut)
  const mouse = new THREE.Vector2(), anchor = new THREE.Vector2(), D = new THREE.Vector2(), V = new THREE.Vector2();
  const ripDir = new THREE.Vector2(), star = new THREE.Vector3(), tgt = new THREE.Vector2();
  let mode: "idle" | "push" | "spring" = "idle", moved = false, still = 0, ripple = 0, listening = false;
  const onMove = (e: PointerEvent) => {
    const a = window.innerWidth / window.innerHeight;
    mouse.set(((e.clientX / window.innerWidth) * 2 - 1) * a, 1 - (e.clientY / window.innerHeight) * 2);
    moved = true;
  };
  /** Décroche les lignes : ressort sous-amorti depuis la déformation courante, et ondulations. */
  const release = (amount: number) => {
    mode = "spring";
    V.set(0, 0);
    ripple = Math.max(ripple, amount);
    ripDir.set(-D.y, D.x);
    if (ripDir.lengthSq() < 1e-8) ripDir.set(0, 1);
    ripDir.normalize();
  };

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
      const U: number[] = [], A: number[] = [], idx: number[] = [];
      let seed = 0;
      for (const sh of SHELLS) {
        for (let k = 0; k < sh.n; k++) {
          const phi = (k / sh.n) * Math.PI * 2 + sh.L * 1.7;
          const sd = (seed = (seed * 9301 + 49297) % 233280) / 233280;
          const o = U.length / 3;
          for (let i = 0; i <= SEG; i++) {
            U.push(i / SEG, -1, sd, i / SEG, 1, sd);
            A.push(sh.L, phi, sh.L, phi);
            if (i < SEG) { const b = o + i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
          }
        }
      }
      lineGeo = new THREE.BufferGeometry();
      const a = new THREE.Float32BufferAttribute(U, 3);
      lineGeo.setAttribute("aU", a);
      lineGeo.setAttribute("aL", new THREE.Float32BufferAttribute(A, 2));
      lineGeo.setAttribute("position", a); // requis par three, non utilisé
      lineGeo.setIndex(idx);
      const common = { transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending };
      lineMat = new THREE.ShaderMaterial({
        uniforms: {
          ...lu, uP: { value: pos }, uM: { value: m }, uB1: { value: b1 }, uB2: { value: b2 },
          uR: { value: 0.35 }, uTwist: { value: 0.9 }, uTime: { value: 0 }, uSwell: { value: 1 }, uWidth: { value: 0.02 },
          uFade: { value: 0 }, uBright: { value: 1 }, uBurst: { value: 0 }, uFlow: { value: 0.35 },
          uLensM: { value: new THREE.Vector4() }, uPush: { value: new THREE.Vector4() }, uRip: { value: new THREE.Vector4() },
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
      if (active && !listening) window.addEventListener("pointermove", onMove);
      if (!active && listening) window.removeEventListener("pointermove", onMove);
      listening = active;
      if (!active) { mode = "idle"; D.set(0, 0); V.set(0, 0); ripple = 0; }
    },
    update(f: FrameParams) {
      // ---- poussée élastique des lignes de champ ----
      const dt = Math.min(f.dt, 0.05), asp = f.width / f.height;
      star.copy(pos).applyMatrix4(f.viewProj);
      const sx = star.x * asp, sy = star.y;
      const depth = tmp.copy(pos).sub(f.camPos).dot(f.camF);
      const fieldR = depth > 0 ? (LMAX * 1.05) / (depth * TAN_HALF) : 0; // rayon apparent de la magnétosphère
      const inField = Math.hypot(mouse.x - sx, mouse.y - sy) < fieldR;
      if (moved) still = 0; else still += dt;
      if (mode === "idle" && moved && inField && f.weight > 0.9) {
        mode = "push";
        anchor.copy(mouse);
        D.set(0, 0);
      } else if (mode === "push") {
        // la zone accrochée suit la souris, avec une résistance croissante (tanh) jusqu'au point de rupture
        tgt.copy(mouse).sub(anchor);
        const l = tgt.length(), cap = P.rupture;
        if (l > cap * 1.5) release(1);
        else if (still > 0.45 || !inField) release(0.45);
        else {
          if (l > 1e-6) tgt.multiplyScalar((cap * Math.tanh(l / cap)) / l);
          D.lerp(tgt, 1 - Math.exp(-dt * 22));
        }
      }
      if (mode === "spring") {
        const k = (2 * Math.PI * P.spring) ** 2, c = 2 * P.damping * 2 * Math.PI * P.spring;
        V.addScaledVector(D, -k * dt).addScaledVector(V, -c * dt);
        D.addScaledVector(V, dt);
        if (D.lengthSq() < 1e-8 && V.lengthSq() < 1e-6 && ripple < 0.01) { mode = "idle"; D.set(0, 0); }
      }
      ripple *= Math.exp(-dt * 1.6);
      moved = false;
      (lineMat.uniforms.uPush.value as THREE.Vector4).set(anchor.x, anchor.y, D.x, D.y);
      (lineMat.uniforms.uRip.value as THREE.Vector4).set(ripDir.x, ripDir.y, ripple * P.ripple, P.pushRange);

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
      updateLens(lu, f, P.lens);
      const lu2 = lineMat.uniforms, su = starMat.uniforms;
      lu2.uR.value = P.radius; lu2.uTwist.value = P.twist; lu2.uTime.value = f.time; lu2.uSwell.value = 1 + 0.08 * burst;
      lu2.uWidth.value = P.width; lu2.uFade.value = fade; lu2.uBright.value = P.bright; lu2.uBurst.value = burst;
      lu2.uFlow.value = P.flow;
      lu2.uLensM.value = f.bh.lensM; // même vecteur que le shader du trou noir, rempli par le curseur avant le rendu
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
      if (listening) window.removeEventListener("pointermove", onMove);
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
      folder.add(P, "pushRange", 0.05, 0.6, 0.01).name("Poussée : rayon d'influence");
      folder.add(P, "rupture", 0.02, 0.5, 0.01).name("Poussée : point de rupture");
      folder.add(P, "spring", 0.5, 6, 0.1).name("Rebond : fréquence (Hz)");
      folder.add(P, "damping", 0.02, 1, 0.01).name("Rebond : amortissement");
      folder.add(P, "ripple", 0, 0.08, 0.001).name("Ondulations : amplitude");
      folder.add(P, "lens").name("Lentille (partie derrière)");
      folder.add(P, "edge", 0, 1, 0.05).name("Fondu en bord de fenêtre");
    },
  };
}
