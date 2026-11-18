import * as THREE from "three";
import { gsap } from "gsap";
import { FS_VERT } from "./shaders/common";
import { STARS_FRAG, STARS_VERT } from "./shaders/stars";
import { BLACKHOLE_FRAG } from "./shaders/blackhole";
import { BLUR_FRAG, BRIGHT_FRAG, FINAL_FRAG } from "./shaders/post";
import { CAM_DIST, TAN_HALF, cameraPose, createNavigation, makePose, shadowNdc } from "./timeline";
import { createLetters } from "./text/letters";
import { createQuality, type TierName } from "./quality";

/* ───────────────────────────────────────────────────────────
   Moteur : renderer, passes, boucle unique, qualité automatique.
   Ordre des passes : étoiles → lettres → trou noir → bloom → composition finale.
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

export function createEngine(els: EngineEls, texts: readonly string[]) {
  const P: Params = { ...DEFAULTS };
  const cam = { s: 0 };
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
      uT: { value: 0 }, uAspect: { value: 1 }, uRh: { value: rhNdc }, uPx: { value: 0.002 }, uTrail: { value: 1 },
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
    },
    vertexShader: FS_VERT,
    fragmentShader: FINAL_FRAG,
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
  };
  let iw = 1, ih = 1;

  function resizeTargets() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    iw = Math.max(64, Math.round(w * DPR * P.resolution));
    ih = Math.max(64, Math.round(h * DPR * P.resolution));
    const fw = Math.round(w * DPR), fh = Math.round(h * DPR);
    rt.stars.setSize(fw, fh); rt.letters.setSize(fw, fh); rt.scene.setSize(iw, ih);
    finalMat.uniforms.uTexel.value.set(1 / iw, 1 / ih);
    rt.a1.setSize(iw >> 1, ih >> 1); rt.t1.setSize(iw >> 1, ih >> 1);
    rt.a2.setSize(iw >> 2, ih >> 2); rt.t2.setSize(iw >> 2, ih >> 2);
    bhMat.uniforms.uRes.value.set(iw, ih);
    starMat.uniforms.uAspect.value = w / h;
    starMat.uniforms.uPx.value = 2 / fh;
    finalMat.uniforms.uAspect.value = w / h;
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
  const letters = createLetters(texts, els.page, els.letters);
  const NS = letters.blocks.length; // slides 0..NS-1 : un bloc chacune ; slide NS : le trou noir seul

  function updateNav(slide: number, busy: boolean) {
    const pad = (n: number) => String(n).padStart(2, "0");
    els.count.textContent = `${pad(slide + 1)} / ${pad(NS + 1)}`;
    els.hint.textContent = slide === NS ? "← revenir" : "Scroll →";
    els.hint.style.opacity = busy ? "0" : slide === 0 || slide === NS ? "1" : "0";
    els.letters.setAttribute("aria-label", slide < NS ? letters.blocks[slide].text : "");
  }
  const nav = createNavigation({ cam, last: NS, duration: () => P.absorbDur, onChange: updateNav });

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
  let mouseX = 0, mouseY = 0, parX = 0, parY = 0;

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
    rhNdc = shadowNdc(camDist);
    const W = window.innerWidth, H = window.innerHeight;
    textCam.aspect = W / H;
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

  function render() {
    // 1. étoiles aspirées
    starMat.uniforms.uT.value = clock.suction;
    starMat.uniforms.uRh.value = rhNdc;
    starMat.uniforms.uC.value.copy(bhNdc);
    starMat.uniforms.uTrail.value = P.starTrail;
    renderer.setRenderTarget(rt.stars);
    renderer.render(starScene, orthoCam);

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

    // 3. trou noir
    const u = bhMat.uniforms;
    u.uTime.value = clock.disk;
    u.uCamPos.value.copy(camPos); u.uCamF.value.copy(camF); u.uCamR.value.copy(camR); u.uCamU.value.copy(camU);
    u.uIntensity.value = P.plasmaIntensity;
    u.uDoppler.value = P.doppler;
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
    pass(finalMat, null);
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
    clock.disk += dt * 1.6 * P.diskSpeed;
    clock.suction += dt * P.suction;
    clock.sky += dt * P.skyDrift;

    updateCamera(dt);
    letters.update({ camS: cam.s, explosion: P.explosion, bhScreen, rhNdc, textCam });
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
    stats,
    bhMat,
    nav,
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
      onResize();
      updateCamera(0);
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
      Object.values(rt).forEach((t) => t.dispose());
      [starMat, bhMat, brightMat, blurMat, finalMat].forEach((m) => m.dispose());
      fsGeo.dispose();
      starGeo.dispose();
      renderer.dispose();
    },
  };
}

export type Engine = ReturnType<typeof createEngine>;
