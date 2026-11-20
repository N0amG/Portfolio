import * as THREE from "three";
import { gsap } from "gsap";
import { FS_VERT } from "./shaders/common";
import { STARS_FRAG, STARS_VERT } from "./shaders/stars";
import { BLACKHOLE_FRAG } from "./shaders/blackhole";
import { BLUR_FRAG, BRIGHT_FRAG, FINAL_FRAG, VEIL_FRAG } from "./shaders/post";
import { CAM_DIST, FIN_CAPTURE_S, LAST_SLIDE, TAN_HALF, cameraPose, createNavigation, finale, makeFinale, makePose, shadowNdc, transitionScale } from "./timeline";
import { createLetters } from "./text/letters";
import { createQuality, type TierName } from "./quality";
import { createRegistry } from "./scenes/registry";
import { createSceneElements } from "./scenes";
import { SKY_H, SKY_W, type BlackholeParams, type CompositeParams, type FrameParams, type Layer } from "./scenes/types";

/* ───────────────────────────────────────────────────────────
   Moteur : renderer, passes, boucle unique, qualité automatique.
   Ordre des passes : étoiles → lettres → trou noir → bloom → composition finale.
   Registre de scènes (scenes/) : couches "back" (après les étoiles), "sky" (fond du trou noir),
   "front" (après la composition) et paramètres de composition, voir scenes/types.ts.
   Port à l'identique du prototype phase 0 (prototypes/black-hole.html).
   ─────────────────────────────────────────────────────────── */

/** Réglages validés (prototype phase 0). */
export const DEFAULTS = {
  diskSpeed: 4.0,
  plasmaIntensity: 1.0,
  skyDrift: 0.02, // rotation lente du ciel (rad/s) : les étoiles défilent à travers la lentille
  plasmaColor: "#ff5a1f",
  suction: 0.46,
  starTrail: 1.0, // longueur de la traînée laissée par les étoiles pendant leur aspiration
  explosion: 0, // explosion des lettres avant l'aspiration (désactivée pour l'instant ; 1.93 = ancien réglage)
  absorbDur: 3.2, // durée (s) d'une transition
  resolution: 1.0,
  simGpu: 1, // multiplicateur de charge GPU (simulation d'une carte plus faible, outil de dev)
  auto: true, // qualité et résolution réglées automatiquement selon le matériel
  tier: "haute" as TierName,
  bloom: 0.6,
  grain: 0.11,
  doppler: 0.95,
  // raccord entre rayons raymarchés et rayons à déviation analytique (sans quoi un cercle net entoure le trou noir)
  bFar: 15, // paramètre d'impact de bascule
  bBlend: 4, // largeur du fondu (en b) juste avant la bascule
  defl2: 1, // poids du terme de 2e ordre dans la déviation analytique (1 = physique, 0 = ancien rendu)
  skySec: 0.25, // poids des images secondaires du ciel profond (1 = physique ; < 1 atténue l'anneau fin autour de l'ombre)
  skySecW: 0.15, // largeur du fondu de cette atténuation (rad, côté image secondaire)
};
export type Params = typeof DEFAULTS;

export interface EngineEls {
  canvas: HTMLCanvasElement;
  page: HTMLElement; // blocs de mesure (invisibles)
  letters: HTMLElement; // couche accessible (une lettre par span, opacité 0)
  hint: HTMLElement;
  count: HTMLElement;
  /** HUD de dev (fps, résolution, gpu, qualité) : absent en production. */
  hud?: { fps: HTMLElement; res: HTMLElement; gpu: HTMLElement; qual: HTMLElement };
}

/**
 * @param texts blocs de texte des premières slides (un par slide, dans l'ordre)
 * @param lastText bloc posé sur la dernière slide (contact, provisoire jusqu'au lot F3)
 */
export function createEngine(els: EngineEls, texts: readonly string[], lastText = "") {
  const P: Params = { ...DEFAULTS };
  const cam = { s: 0 };
  /** Fin du parcours (lot V7) : paramètres nommés lus par les éléments, le shader et (lot F1) le son. */
  const fin = makeFinale();
  let camDist = CAM_DIST,
    rhNdc = shadowNdc(CAM_DIST);

  // powerPreference 'high-performance' : demande le GPU dédié sur les machines à double GPU.
  const renderer = new THREE.WebGLRenderer({ canvas: els.canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 1);
  renderer.autoClear = true;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR);
  const gl = renderer.getContext();

  const orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Triangle plein écran
  const fsGeo = new THREE.BufferGeometry();
  fsGeo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  fsGeo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const fsMesh = new THREE.Mesh(fsGeo);
  fsMesh.frustumCulled = false;
  const fsScene = new THREE.Scene();
  fsScene.add(fsMesh);

  // -------------------------------------------------------------------------
  // 1) Étoiles aspirées : quads instanciés, trajectoire calculée dans le vertex shader
  // -------------------------------------------------------------------------
  const STAR_COUNT = 1100;
  // Chaque étoile est un ruban : une pointe arrondie devant la tête, puis TRAIL_SEG segments qui suivent
  // exactement la spirale sur les dernières secondes de trajet (traînée rémanente courbe).
  const TRAIL_SEG = 16;
  const starGeo = new THREE.InstancedBufferGeometry();
  {
    const pos: number[] = [], idx: number[] = [];
    const rows = [-1]; // -1 : pointe avant ; 0..1 : de la tête vers la queue
    for (let k = 0; k <= TRAIL_SEG; k++) rows.push(k / TRAIL_SEG);
    rows.forEach((x) => pos.push(x, -1, 0, x, 1, 0));
    for (let k = 0; k < rows.length - 1; k++) {
      const a = k * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, c, b, b, c, d);
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    starGeo.setIndex(idx);
  }
  const seeds = new Float32Array(STAR_COUNT * 4);
  for (let i = 0; i < STAR_COUNT; i++) {
    seeds[i * 4 + 0] = Math.random() * Math.PI * 2; // angle de départ
    seeds[i * 4 + 1] = 0.55 + Math.random() * 0.9; // vitesse
    seeds[i * 4 + 2] = Math.random(); // phase de vie
    seeds[i * 4 + 3] = Math.random(); // taille / éclat
  }
  starGeo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4));
  starGeo.instanceCount = STAR_COUNT;
  const starMat = new THREE.ShaderMaterial({
    uniforms: {
      uT: { value: 0 }, uAspect: { value: 1 }, uRh: { value: rhNdc }, uPx: { value: 0.002 }, uTrail: { value: 1 }, uDir: { value: 1 },
      uC: { value: new THREE.Vector2() },
    },
    vertexShader: STARS_VERT,
    fragmentShader: STARS_FRAG,
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const starMesh = new THREE.Mesh(starGeo, starMat);
  starMesh.frustumCulled = false;
  const starScene = new THREE.Scene();
  starScene.add(starMesh);

  // -------------------------------------------------------------------------
  // 2) Trou noir : raymarching plein écran
  // -------------------------------------------------------------------------
  const col = (hex: string) => new THREE.Color(hex); // conversion sRGB -> linéaire (ColorManagement actif)
  const bhMat = new THREE.ShaderMaterial({
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uCamPos: { value: new THREE.Vector3() },
      uCamR: { value: new THREE.Vector3() }, uCamU: { value: new THREE.Vector3() }, uCamF: { value: new THREE.Vector3() },
      uTanHalf: { value: TAN_HALF },
      uC0: { value: col("#8a1a05") }, uC1: { value: col(P.plasmaColor) },
      uC2: { value: col("#ffb347") }, uC3: { value: col("#fff4e0") },
      uIntensity: { value: 1 }, uDoppler: { value: 0.75 },
      uStepK: { value: 0.07 }, uOct: { value: 4 },
      uSkyRot: { value: new THREE.Matrix3() }, uClock: { value: 0 },
      uSkyTex: { value: null as THREE.Texture | null }, uSkyOn: { value: 0 },
      uErupt: { value: new THREE.Vector4() },
      uHot: { value: new THREE.Vector4() },
      uLensM: { value: new THREE.Vector4() },
      uTitleTex: { value: null as THREE.Texture | null }, uTitleO: { value: new THREE.Vector3() }, uTitleN: { value: new THREE.Vector3() },
      uTitleA1: { value: new THREE.Vector4() }, uTitleA2: { value: new THREE.Vector4() }, uTitleCol: { value: col("#f2efe8") },
      uNebTex: { value: null as THREE.Texture | null }, uNebC: { value: new THREE.Vector4() },
      uNebE1: { value: new THREE.Vector3() }, uNebE2: { value: new THREE.Vector3() }, uNebF: { value: 0 }, uNebFill: { value: 0 },
      uBFar: { value: new THREE.Vector3(15, 4, 1) }, uSkySec: { value: new THREE.Vector2(0.25, 0.15) },
      uDive: { value: new THREE.Vector4() }, uAberr: { value: new THREE.Vector2() }, uTunnel: { value: new THREE.Vector4() }, uTunBend: { value: new THREE.Vector4() },
      uWhite: { value: new THREE.Vector4() },
      uTunSpin: { value: 0 }, uCapTex: { value: null as THREE.Texture | null }, uCap: { value: new THREE.Vector4() },
      // 3 · palette du trou blanc (section 4) : bleu profond assombri au bord, #1b4dff, #7fd6ff, blanc au cœur
      uW0: { value: col("#1b4dff").multiplyScalar(0.3) }, uW1: { value: col("#1b4dff") }, uW2: { value: col("#7fd6ff") }, uW3: { value: col("#ffffff") },
    },
    vertexShader: FS_VERT,
    fragmentShader: BLACKHOLE_FRAG,
  });

  // -------------------------------------------------------------------------
  // 3) Post : bloom léger (2 niveaux) + composition finale
  // -------------------------------------------------------------------------
  const brightMat = new THREE.ShaderMaterial({ uniforms: { uTex: { value: null } }, vertexShader: FS_VERT, fragmentShader: BRIGHT_FRAG });
  const blurMat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: null }, uDir: { value: new THREE.Vector2() } },
    vertexShader: FS_VERT,
    fragmentShader: BLUR_FRAG,
  });
  const finalMat = new THREE.ShaderMaterial({
    uniforms: {
      uScene: { value: null }, uB1: { value: null }, uB2: { value: null }, uStars: { value: null }, uLetters: { value: null },
      uTextCol: { value: new THREE.Vector3(0.949, 0.937, 0.91) }, // #f2efe8 exact (composé après le tonemapping)
      uTexel: { value: new THREE.Vector2(1, 1) },
      uBloom: { value: 0.9 }, uGrain: { value: 0.045 }, uTime: { value: 0 }, uAspect: { value: 1 },
      uWaves: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) }, uMotion: { value: new THREE.Vector2() },
      uChroma: { value: 0 }, uFlare: { value: 0 }, uStreak: { value: new THREE.Vector4() }, uRing: { value: 1 },
      uRayHist: { value: new Array(12).fill(0) }, uRayOn: { value: 0 },
    },
    vertexShader: FS_VERT,
    fragmentShader: FINAL_FRAG,
  });
  // 2, 3 · voile final (noir, point blanc, blanc) : par-dessus tout, mélange prémultiplié
  const veilMat = new THREE.ShaderMaterial({
    uniforms: { uVeil: { value: new THREE.Vector4() }, uAspect: { value: 1 }, uPx: { value: 0.002 } },
    vertexShader: FS_VERT,
    fragmentShader: VEIL_FRAG,
    transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });

  // -------------------------------------------------------------------------
  // Render targets
  // -------------------------------------------------------------------------
  const rtOpts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
  const rt = {
    stars: new THREE.WebGLRenderTarget(1, 1, rtOpts),
    scene: new THREE.WebGLRenderTarget(1, 1, rtOpts),
    a1: new THREE.WebGLRenderTarget(1, 1, rtOpts), t1: new THREE.WebGLRenderTarget(1, 1, rtOpts),
    a2: new THREE.WebGLRenderTarget(1, 1, rtOpts), t2: new THREE.WebGLRenderTarget(1, 1, rtOpts),
    letters: new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false }),
    sky: new THREE.WebGLRenderTarget(SKY_W, SKY_H, rtOpts), // couche "sky" du registre (taille fixe)
    cap: new THREE.WebGLRenderTarget(1, 1, rtOpts), // 2 · vue de la chute à l'horizon, plaquée sur les parois du tunnel
  };
  bhMat.uniforms.uCapTex.value = rt.cap.texture;
  rt.sky.texture.wrapS = THREE.RepeatWrapping; // équirectangulaire : la longitude boucle (filtrage continu à la couture)
  bhMat.uniforms.uSkyTex.value = rt.sky.texture;
  let iw = 1, ih = 1;

  function resizeTargets() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    iw = Math.max(64, Math.round(w * DPR * P.resolution));
    ih = Math.max(64, Math.round(h * DPR * P.resolution));
    const fw = Math.round(w * DPR), fh = Math.round(h * DPR);
    rt.stars.setSize(fw, fh); rt.letters.setSize(fw, fh); rt.scene.setSize(iw, ih); rt.cap.setSize(iw, ih);
    finalMat.uniforms.uTexel.value.set(1 / iw, 1 / ih);
    rt.a1.setSize(iw >> 1, ih >> 1); rt.t1.setSize(iw >> 1, ih >> 1);
    rt.a2.setSize(iw >> 2, ih >> 2); rt.t2.setSize(iw >> 2, ih >> 2);
    bhMat.uniforms.uRes.value.set(iw, ih);
    starMat.uniforms.uAspect.value = w / h;
    starMat.uniforms.uPx.value = 2 / fh;
    finalMat.uniforms.uAspect.value = w / h;
    veilMat.uniforms.uAspect.value = w / h;
    veilMat.uniforms.uPx.value = 2 / fh;
    if (els.hud) els.hud.res.textContent = `interne ${iw}×${ih} (${Math.round(P.resolution * 100)} %) · écran ${fw}×${fh}`;
  }

  function pass(mat: THREE.Material, target: THREE.WebGLRenderTarget | null) {
    fsMesh.material = mat;
    renderer.setRenderTarget(target);
    renderer.render(fsScene, orthoCam);
  }

  // -------------------------------------------------------------------------
  // Texte
  // -------------------------------------------------------------------------
  // un bloc par slide : les premiers textes, des slides sans texte, puis le bloc de la dernière slide (contact)
  const slideTexts = Array.from({ length: LAST_SLIDE + 1 }, (_, i) => (i < texts.length ? texts[i] : i === LAST_SLIDE ? lastText : ""));
  const letters = createLetters(slideTexts, els.page, els.letters);
  const NS = letters.blocks.length;

  function updateNav(slide: number, busy: boolean) {
    const pad = (n: number) => String(n).padStart(2, "0");
    els.count.textContent = `${pad(slide + 1)} / ${pad(LAST_SLIDE + 1)}`;
    els.hint.textContent = slide === LAST_SLIDE ? "← revenir" : "Scroll →";
    els.hint.style.opacity = busy ? "0" : slide === 0 || slide === LAST_SLIDE ? "1" : "0";
    els.letters.setAttribute("aria-label", slide < NS ? letters.blocks[slide].text : "");
    if (!busy) scenes.decor.set(0); // nouvelle slide posée : les décors coupés ont de nouveau leur chance
  }
  const nav = createNavigation({ cam, last: LAST_SLIDE, duration: (a, b) => P.absorbDur * transitionScale(a, b), onChange: updateNav });

  // -------------------------------------------------------------------------
  // Caméra
  // -------------------------------------------------------------------------
  const pose = makePose();
  const camPos = pose.pos, camF = pose.f, camR = pose.r, camU = pose.u, camTarget = pose.target;
  const UP = new THREE.Vector3(0, 1, 0);
  const textCam = new THREE.PerspectiveCamera((2 * Math.atan(TAN_HALF) * 180) / Math.PI, 1, 0.1, 200);
  const viewProj = new THREE.Matrix4();
  const bhScreen = new THREE.Vector2(); // centre du trou noir à l'écran (px)
  const bhNdc = new THREE.Vector2();
  const vTmp = new THREE.Vector3();
  let mouseX = 0, mouseY = 0, parX = 0, parY = 0, tanHalf = TAN_HALF;

  function updateCamera(dt: number) {
    parX += (mouseX - parX) * (1 - Math.exp(-dt * 2));
    parY += (mouseY - parY) * (1 - Math.exp(-dt * 2));
    cameraPose(cam.s, parX * 0.05, parY * 0.025, pose);
    camF.copy(camTarget).sub(camPos).normalize();
    camR.crossVectors(camF, UP).normalize();
    camU.crossVectors(camR, camF);
    const cr = Math.cos(pose.roll || 0), sr = Math.sin(pose.roll || 0);
    vTmp.copy(camR).multiplyScalar(cr).addScaledVector(camU, sr);
    camU.multiplyScalar(cr).addScaledVector(camR, -sr);
    camR.copy(vTmp);
    camDist = camPos.length();
    tanHalf = pose.tanHalf;
    rhNdc = pose.shadow > 0 ? pose.shadow : shadowNdc(camDist, tanHalf, pose.beta);
    const W = window.innerWidth, H = window.innerHeight;
    textCam.aspect = W / H;
    textCam.fov = (2 * Math.atan(tanHalf) * 180) / Math.PI;
    textCam.updateProjectionMatrix();
    textCam.position.copy(camPos);
    textCam.up.copy(camU);
    textCam.lookAt(camTarget);
    textCam.updateMatrixWorld();
    viewProj.multiplyMatrices(textCam.projectionMatrix, textCam.matrixWorldInverse);
    vTmp.set(0, 0, 0).project(textCam);
    bhNdc.set(vTmp.x, vTmp.y);
    bhScreen.set(((vTmp.x + 1) / 2) * W, ((1 - vTmp.y) / 2) * H);
  }
  // -------------------------------------------------------------------------
  // Registre de scènes (éléments visuels du catalogue, section 5 bis)
  // -------------------------------------------------------------------------
  const scenes = createRegistry(createSceneElements(), { root: els.canvas.parentElement ?? document.body, renderer, camera: textCam, ortho: orthoCam, bhTex: rt.scene.texture });
  const composite: CompositeParams = {
    waves: finalMat.uniforms.uWaves.value as THREE.Vector4[],
    motion: finalMat.uniforms.uMotion.value as THREE.Vector2,
    chroma: 0,
    flare: 0,
    streak: 0,
    veil: veilMat.uniforms.uVeil.value as THREE.Vector4,
  };
  const bu = bhMat.uniforms;
  const bhParams: BlackholeParams = {
    erupt: bu.uErupt.value as THREE.Vector4,
    hot: bu.uHot.value as THREE.Vector4,
    lensM: bu.uLensM.value as THREE.Vector4,
    title: { tex: bu.uTitleTex, o: bu.uTitleO.value, n: bu.uTitleN.value, a1: bu.uTitleA1.value, a2: bu.uTitleA2.value },
    neb: { tex: bu.uNebTex, c: bu.uNebC.value, e1: bu.uNebE1.value, e2: bu.uNebE2.value, front: bu.uNebF, fill: bu.uNebFill },
    dive: bu.uDive.value as THREE.Vector4,
    tunnel: bu.uTunnel.value as THREE.Vector4,
    tunnelBend: bu.uTunBend.value as THREE.Vector4,
    white: bu.uWhite.value as THREE.Vector4,
    cap: bu.uCap.value as THREE.Vector4,
    tunnelSpin: bu.uTunSpin,
  };
  const frameParams: FrameParams = {
    s: 0, slide: 0, weight: 0, dt: 0, time: 0, camPos, camF, camR, camU, viewProj, bhScreen, bhNdc, rhNdc, tanHalf, fin,
    mouse: new THREE.Vector2(), width: 1, height: 1, dpr: DPR, reduced: false, tier: P.tier, res: P.resolution, composite, bh: bhParams,
  };
  function updateScenes(dt: number) {
    const f = frameParams;
    f.s = cam.s; f.dt = dt; f.time = clock.elapsed; f.rhNdc = rhNdc; f.tanHalf = tanHalf; f.tier = P.tier; f.res = P.resolution;
    f.mouse.set(parX, parY); f.width = window.innerWidth; f.height = window.innerHeight;
    for (const w of composite.waves) w.set(0, 0, 0, 0);
    composite.motion.set(0, 0); composite.chroma = 0; composite.flare = 0; composite.streak = 0; composite.veil.set(0, 0, 0, 0);
    bhParams.erupt.set(0, 0, 0, 0);
    bhParams.hot.w = 0;
    bhParams.lensM.z = 0;
    bhParams.title.a2.w = 0;
    bhParams.neb.c.w = 0;
    bhParams.dive.set(0, 0, 0, 0);
    bhParams.tunnel.x = 0;
    bhParams.white.x = 0;
    bhParams.cap.x = 0;
    scenes.update(f, P.tier);
  }
  /** Rend une couche du registre dans la cible donnée, par-dessus son contenu. */
  function renderLayer(layer: Layer, target: THREE.WebGLRenderTarget | null) {
    renderer.setRenderTarget(target);
    renderer.autoClear = false;
    scenes.render(layer);
    renderer.autoClear = true;
  }

  const onPointer = (e: PointerEvent) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  };

  // -------------------------------------------------------------------------
  // Rendu d'une image
  // -------------------------------------------------------------------------
  const clock = { disk: 0, suction: 0, elapsed: 0, sky: 0 };
  const SKY_AXIS = new THREE.Vector3(0.35, 1, 0.2).normalize();
  const skyM4 = new THREE.Matrix4();

  /**
   * 2 · traits de lumière de la plongée : historique de l'intensité de naissance (12 cases de 0,1 s). Un trait né ne
   * disparaît qu'en sortant de l'écran : la composition lit l'intensité au moment de sa naissance, pas l'actuelle.
   */
  const rays = { hist: finalMat.uniforms.uRayHist.value as number[], acc: 0, on: false };
  let betaLag = 0;
  function updateRays(dt: number) {
    betaLag += (pose.beta - betaLag) * (1 - Math.exp(-dt / 0.12));
    if (pose.beta === 0) betaLag = 0;
    const h = rays.hist;
    rays.acc += dt;
    while (rays.acc >= 0.1) {
      rays.acc -= 0.1;
      for (let k = h.length - 1; k > 0; k--) h[k] = h[k - 1];
      h[0] = 0;
    }
    h[0] = Math.max(h[0], composite.streak);
    rays.on = h.some((v) => v > 0.001);
  }
  /**
   * 2 · entrée dans le trou de ver : la vue de la chute, telle qu'à l'horizon (pose, champ, aberration, bleuissement de
   * s = FIN_CAPTURE_S), est rendue à chaque image dans rt.cap (le disque continue de tourner) ; le tunnel l'utilise
   * comme texture de ses parois. Au moment de la bascule, l'image est donc identique, dans les deux sens.
   */
  const capPose = makePose(), capFin = makeFinale();
  const capR = new THREE.Vector3(), capU = new THREE.Vector3(), capF = new THREE.Vector3(), capDive = new THREE.Vector4();
  function renderCapture() {
    const u = bhMat.uniforms;
    cameraPose(FIN_CAPTURE_S, parX * 0.05, parY * 0.025, capPose);
    finale(FIN_CAPTURE_S, capFin);
    capF.copy(capPose.target).sub(capPose.pos).normalize();
    capR.crossVectors(capF, UP).normalize();
    capU.crossVectors(capR, capF);
    const cr = Math.cos(capPose.roll), sr = Math.sin(capPose.roll);
    vTmp.copy(capR).multiplyScalar(cr).addScaledVector(capU, sr);
    capU.multiplyScalar(cr).addScaledVector(capR, -sr);
    capR.copy(vTmp);
    u.uCamPos.value.copy(capPose.pos); u.uCamF.value.copy(capF); u.uCamR.value.copy(capR); u.uCamU.value.copy(capU);
    u.uTanHalf.value = capPose.tanHalf;
    u.uAberr.value.set(capPose.beta, capPose.beta - Math.max(0, pose.beta - betaLag)); // traînées du ciel : même vitesse qu'en ce moment
    capDive.copy(bhParams.dive);
    bhParams.dive.set(capFin.blue, capFin.bright, capFin.diskFade, 0);
    const tx = bhParams.tunnel.x;
    bhParams.tunnel.x = 0;
    u.uIntensity.value = P.plasmaIntensity;
    u.uDoppler.value = P.doppler;
    u.uCapTex.value = null; // on dessine dans rt.cap : il ne doit pas être lié en entrée (boucle de rétroaction, rendu refusé)
    pass(bhMat, rt.cap);
    u.uCapTex.value = rt.cap.texture;
    bhParams.tunnel.x = tx;
    bhParams.dive.copy(capDive);
  }
  /** Nombre de prises des traînées radiales (2, 3) selon le niveau de qualité. */
  const STREAK_TAPS = { haute: 14, moyenne: 10, basse: 6 } as const;
  function render() {
    // voile opaque (noir total ou écran blanc, fin du parcours) : rien d'autre à rendre
    const veil = composite.veil;
    if (veil.x >= 0.999 || veil.y >= 0.999) {
      pass(veilMat, null);
      return;
    }
    // 1. étoiles aspirées
    starMat.uniforms.uT.value = clock.suction;
    starMat.uniforms.uDir.value = fin.whiteHole > 0.5 ? -1 : 1;
    starMat.uniforms.uRh.value = rhNdc;
    starMat.uniforms.uC.value.copy(bhNdc);
    starMat.uniforms.uTrail.value = P.starTrail * (fin.whiteHole > 0.5 ? 0.25 : 1); // éjectées : traînées courtes
    renderer.setRenderTarget(rt.stars);
    renderer.render(starScene, orthoCam);
    if (scenes.has("back")) renderLayer("back", rt.stars);

    // 2. lettres (maillages déformés : marée + lentille + parallaxe souris)
    const W = window.innerWidth, H = window.innerHeight;
    const gu = letters.mat.uniforms;
    gu.uView.value.set(W, H);
    gu.uCenter.value.copy(bhScreen);
    gu.uViewProj.value.copy(viewProj);
    gu.uThetaE.value = ((rhNdc * H) / 2) * 1.15;
    gu.uPar.value.set(parX * 0.06 * H, -parY * 0.03 * H);
    renderer.setRenderTarget(rt.letters);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(letters.scene, orthoCam);
    renderer.setClearColor(0x000000, 1);

    // 3. trou noir (+ couche "sky" du registre, échantillonnée à travers les rayons courbés)
    const u = bhMat.uniforms;
    u.uSkyOn.value = scenes.has("sky") ? 1 : 0;
    if (u.uSkyOn.value) {
      renderer.setRenderTarget(rt.sky);
      renderer.clear();
      renderLayer("sky", rt.sky);
    }
    u.uTime.value = clock.disk;
    if (bhParams.cap.x > 0) renderCapture();
    u.uTanHalf.value = tanHalf;
    // 2 · aberration de la plongée : suit la caméra (timeline), pas un réglage d'élément ; y = β d'il y a ≈ 0,12 s (traînées)
    u.uAberr.value.set(pose.beta, betaLag);
    u.uCamPos.value.copy(camPos); u.uCamF.value.copy(camF); u.uCamR.value.copy(camR); u.uCamU.value.copy(camU);
    u.uIntensity.value = P.plasmaIntensity;
    u.uDoppler.value = P.doppler;
    u.uBFar.value.set(P.bFar, Math.min(P.bBlend, P.bFar - 3), P.defl2);
    u.uSkySec.value.set(P.skySec, Math.max(P.skySecW, 1e-3));
    u.uSkyRot.value.setFromMatrix4(skyM4.makeRotationAxis(SKY_AXIS, clock.sky));
    u.uClock.value = clock.elapsed;
    pass(bhMat, rt.scene);

    // 4. bloom
    brightMat.uniforms.uTex.value = rt.scene.texture; pass(brightMat, rt.a1);
    blurMat.uniforms.uTex.value = rt.a1.texture; blurMat.uniforms.uDir.value.set(1 / rt.a1.width, 0); pass(blurMat, rt.t1);
    blurMat.uniforms.uTex.value = rt.t1.texture; blurMat.uniforms.uDir.value.set(0, 1 / rt.a1.height); pass(blurMat, rt.a1);
    blurMat.uniforms.uTex.value = rt.a1.texture; blurMat.uniforms.uDir.value.set(2 / rt.a1.width, 0); pass(blurMat, rt.t2);
    blurMat.uniforms.uTex.value = rt.t2.texture; blurMat.uniforms.uDir.value.set(0, 1 / rt.t2.height); pass(blurMat, rt.a2);

    // 5. composition finale à l'écran
    const f = finalMat.uniforms;
    f.uScene.value = rt.scene.texture; f.uStars.value = rt.stars.texture; f.uLetters.value = rt.letters.texture;
    f.uB1.value = rt.a1.texture; f.uB2.value = rt.a2.texture;
    f.uBloom.value = P.bloom; f.uGrain.value = P.grain; f.uTime.value = clock.elapsed;
    f.uChroma.value = composite.chroma; f.uFlare.value = composite.flare; // uWaves et uMotion partagent leurs vecteurs avec `composite`
    f.uStreak.value.set((bhNdc.x + 1) / 2, (bhNdc.y + 1) / 2, composite.streak, STREAK_TAPS[P.tier]);
    f.uRing.value = Math.min(rhNdc, 4);
    f.uRayOn.value = rays.on ? 1 : 0;
    pass(finalMat, null);

    // 6. couche "front" du registre, directement à l'écran
    if (scenes.has("front")) renderLayer("front", null);

    // 7. voile (fin du parcours) : noir, point blanc, blanc
    if (veil.x > 0 || veil.y > 0 || veil.z > 0) {
      renderer.autoClear = false;
      pass(veilMat, null);
      renderer.autoClear = true;
    }
  }

  // -------------------------------------------------------------------------
  // Qualité automatique
  // -------------------------------------------------------------------------
  const gpuName = (() => {
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const raw: string = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    const m = /ANGLE \([^,]+,\s*([^(]+?)\s*(\(|Direct3D|,)/.exec(raw);
    return (m ? m[1] : raw).trim();
  })();
  const listeners = { paramsChanged: () => {} };
  const quality = createQuality({
    P, gl, gpuName, render, resizeTargets,
    decor: scenes.decor,
    setTier: (t) => {
      bhMat.uniforms.uStepK.value = t.stepK;
      bhMat.uniforms.uOct.value = t.oct;
      starGeo.instanceCount = t.stars;
    },
    changed: () => {
      updateQualityLabel();
      listeners.paramsChanged();
    },
  });
  function updateQualityLabel() {
    if (els.hud) els.hud.qual.textContent = `qualité ${P.tier} · ${P.auto ? "auto" : "manuelle"}` + (P.auto && quality.info() ? ` · ${quality.info()}` : "");
  }
  function updateGpuLabel() {
    if (els.hud) els.hud.gpu.textContent = `gpu ${gpuName}` + (P.simGpu > 1 ? ` · simulation ×${P.simGpu}` : "");
  }

  // -------------------------------------------------------------------------
  // Boucle unique (ticker GSAP = un seul requestAnimationFrame, en pause quand l'onglet est caché)
  // -------------------------------------------------------------------------
  const stats = { fps: 0, ms: 0, samples: [] as number[] };
  let fpsFrames = 0, fpsAcc = 0;
  let last = -1;

  function frame() {
    const now = performance.now();
    if (last < 0) last = now;
    const rawMs = now - last;
    const dt = Math.min(0.05, rawMs / 1000);
    last = now;
    clock.elapsed += dt;

    fpsFrames++;
    fpsAcc += rawMs;
    if (fpsAcc >= 500) {
      const fps = (fpsFrames * 1000) / fpsAcc;
      if (els.hud) els.hud.fps.textContent = `${fps.toFixed(0)} · ${(fpsAcc / fpsFrames).toFixed(1)} ms`;
      stats.fps = fps;
      stats.ms = fpsAcc / fpsFrames;
      stats.samples.push(+fps.toFixed(1));
      if (stats.samples.length > 120) stats.samples.shift();
      fpsFrames = 0;
      fpsAcc = 0;
    }

    // Temps propres : la rotation du disque et l'aspiration s'accumulent (pas de saut quand on change un réglage)
    finale(cam.s, fin);
    clock.disk += dt * 1.6 * P.diskSpeed;
    // trou blanc : les étoiles sont éjectées au lieu d'être aspirées (le temps de l'aspiration s'inverse)
    clock.suction += dt * P.suction * (fin.whiteHole > 0.5 ? -1 : 1);
    clock.sky += dt * P.skyDrift;

    updateCamera(dt);
    letters.update({ camS: cam.s, explosion: P.explosion, bhScreen, rhNdc, textCam });
    updateScenes(dt);
    updateRays(dt);
    render();
    // Simulation d'un GPU plus faible (dev) : le rendu complet est refait N-1 fois de plus (charge GPU × N)
    for (let k = 1; k < P.simGpu; k++) render();
    quality.adapt(rawMs);
  }

  const onResize = () => {
    resizeTargets();
    letters.layout();
  };

  let disposed = false,
    started = false;

  return {
    P,
    cam,
    /** Dev : une image à la demande (pour tester quand le rAF est suspendu, ex. onglet en arrière-plan). */
    step: frame,
    stats,
    bhMat,
    nav,
    scenes,
    composite,
    bhParams,
    /** Fin du parcours : paramètres nommés (dont les crochets du son : silence, note). */
    fin,
    listeners,
    quality,
    resizeTargets,
    updateGpuLabel,
    updateQualityLabel,
    /** Banc d'essai GPU (indépendant du rAF) : bench(120) -> ms/frame. */
    bench(n = 120) {
      const px = new Uint8Array(4);
      render();
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const t0 = performance.now();
      for (let i = 0; i < n; i++) {
        clock.disk += 1.6 / 60;
        clock.suction += 1 / 60;
        render();
      }
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const ms = (performance.now() - t0) / n;
      return { msPerFrame: +ms.toFixed(2), fpsMax: +(1000 / ms).toFixed(0), internal: `${iw}x${ih}` };
    },
    /** Attend la police, mesure, calibre puis lance la boucle. */
    async start() {
      await document.fonts.load(letters.font()).catch(() => {});
      await document.fonts.ready;
      if (disposed) return;
      window.addEventListener("resize", onResize);
      window.addEventListener("pointermove", onPointer);
      scenes.init();
      cameraPose(FIN_CAPTURE_S, 0, 0, capPose); // précalcule le bord de l'ombre de la plongée (≈ 20 ms) au chargement, pas pendant la chute
      onResize();
      updateCamera(0);
      updateScenes(0);
      updateNav(0, false);
      updateGpuLabel();
      quality.applyTier(P.tier);
      if (P.auto) quality.calibrate();
      else updateQualityLabel();
      gsap.ticker.add(frame);
      started = true;
    },
    destroy() {
      disposed = true;
      if (started) gsap.ticker.remove(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      nav.destroy();
      letters.dispose();
      scenes.dispose();
      Object.values(rt).forEach((t) => t.dispose());
      [starMat, bhMat, brightMat, blurMat, finalMat, veilMat].forEach((m) => m.dispose());
      fsGeo.dispose();
      starGeo.dispose();
      renderer.dispose();
    },
  };
}

export type Engine = ReturnType<typeof createEngine>;
