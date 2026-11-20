import { createGpuTimer } from "./gputimer";

/* ───────────────────────────────────────────────────────────
   Qualité automatique (refaite le 20/11/2026, passe perfs ; voir SPEC section 6, « Qualité automatique ») :
   1. Calibration au chargement, sur des shaders déjà compilés (precompile() du moteur) : 3 images de chauffe puis
      médiane de 9 images, en temps GPU réel (requêtes de temps) si possible, sinon en images synchronisées.
   2. Ajustement continu sur des fenêtres de 2 s : médiane du temps GPU par image (indépendante de la synchro
      verticale : sur un écran 60 Hz, le temps entre images ne dit rien de la marge). Pics isolés ignorés, baisse
      après deux fenêtres chargées, remontée quand le cran supérieur tient avec marge ; pas de verrou définitif,
      mais un délai avant de retenter un état qui a décroché (15 s, doublé à chaque nouvel échec, 2 min au plus).
   3. Ordre de dégradation : décors moyens coupés → moins de pas de raymarching (moyenne) → décors légers réduits →
      résolution jusqu'à ≈ 0,75 px interne par px CSS → basse → résolution minimale. On pixelise en dernier.
      La remontée suit l'ordre inverse.
   ─────────────────────────────────────────────────────────── */

export const TIERS = {
  haute: { stepK: 0.07, oct: 4, stars: 1100 },
  moyenne: { stepK: 0.095, oct: 3, stars: 800 },
  basse: { stepK: 0.13, oct: 2, stars: 500 },
} as const;
export type TierName = keyof typeof TIERS;
export type Tier = (typeof TIERS)[TierName];
export const TIER_ORDER: TierName[] = ["haute", "moyenne", "basse"];

const RES_MIN = 0.3;
/** Calibration (sur S1) : temps GPU visé par image. S7 coûte ≈ 1,35 × S1 et la plongée ≈ 1,7 × : marge sous DOWN_MS. */
const CAL_GPU_MS = 9;
/** Sans requêtes de temps GPU : image complète synchronisée (processeur et GPU en série, donc plus lente). */
const CAL_SYNC_MS = 11;
/** Choix du niveau à la calibration, en pixels internes par pixel CSS (résolution × devicePixelRatio). */
const EFF_HAUTE = 0.85;
const EFF_MOYENNE = 0.7;
/** Sous ce rapport (px interne par px CSS), on préfère passer en basse plutôt que de pixeliser davantage. */
const EFF_FLOOR = 0.75;
/** Ajustement continu. */
const WINDOW_MS = 2000;
const DOWN_MS = 14; // médiane GPU au-dessus, deux fenêtres de suite : un cran plus bas (marge sous 16,7 ms)
const PANIC_MS = 24; // au-dessus : un cran plus bas dès la première fenêtre
const UP_MS = 10; // coût prévu du cran supérieur sous ce seuil, deux fenêtres de suite : un cran plus haut
const DOWN_FRAME_MS = 20; // sans requêtes GPU : intervalle médian entre images (≈ 50 fps)
const UP_FRAME_MS = 13; // sans requêtes GPU : marge visible seulement sur un écran > 60 Hz
const BACKOFF_MS = 15000;
const BACKOFF_MAX_MS = 120000;
/** Coût relatif estimé d'un cran vers le haut (la résolution, elle, coûte (r'/r)²). */
const UP_COST = { tier: 1.35, tierLow: 1.3, decorMedium: 1.3, decorLight: 1.15 };

/** Dernière calibration (diagnostic ?diag=1). */
export interface CalibInfo {
  tier: TierName;
  res: number;
  hints: { software: boolean; integrated: boolean; cores: number; mem: number };
  ms: number;
  /** true : mesures en temps GPU réel ; false : images synchronisées (processeur + GPU). */
  gpuTimed: boolean;
  why: string;
  /** Mesures par niveau essayé : ms par image à 0,6 et 0,35 de résolution, résolution max pour le budget. */
  tried: { tier: TierName; msAt060: number; msAt035: number; resMax: number }[];
}

interface QualityParams {
  resolution: number;
  simGpu: number;
  auto: boolean;
  tier: TierName;
}

interface QualityDeps {
  P: QualityParams;
  gl: WebGL2RenderingContext;
  gpuName: string;
  /** Pixels de l'écran par pixel CSS (plafonné par le moteur). */
  dpr: number;
  render: () => void;
  resizeTargets: () => void;
  setTier: (t: Tier) => void;
  /** Niveau de décor du registre de scènes : 0 = tout, 1 = moyens coupés, 2 = légers réduits. */
  decor?: { level: () => number; set: (n: number) => void; useful: (n: number) => boolean };
  /** Appelé quand la qualité ou la résolution change (libellés, panneau de dev). */
  changed: () => void;
}

const round20 = (x: number) => Math.round(x * 20) / 20;
const pct = (r: number) => `${Math.round(r * 100)} %`;
function median(a: Float32Array, n: number) {
  const s = a.subarray(0, n).sort();
  return n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

export function createQuality({ P, gl, gpuName, dpr, render, resizeTargets, setTier, decor, changed }: QualityDeps) {
  let autoInfo = "";
  let calibrating = false;
  const frameTimer = createGpuTimer(gl);
  const calTimer = createGpuTimer(gl);

  // Diagnostic (?diag=1) : dernière calibration, dernière mesure et journal des changements
  let lastCalib: CalibInfo | null = null;
  const events: string[] = [];
  const born = performance.now();
  function log(msg: string) {
    events.push(`${((performance.now() - born) / 1000).toFixed(1)} s · ${msg}`);
    if (events.length > 8) events.shift();
  }

  function applyTier(name: TierName) {
    P.tier = name;
    setTier(TIERS[name]);
  }

  function hardwareHints() {
    const g = gpuName.toLowerCase();
    const software = /swiftshader|llvmpipe|basic render|software/.test(g);
    const integrated = /intel|uhd|iris|hd graphics|mali|adreno|powervr|radeon\(tm\) graphics|vega \d+ graphics/.test(g);
    const cores = navigator.hardwareConcurrency || 4;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8; // Chrome uniquement, plafonné à 8
    return { software, integrated, cores, mem };
  }

  // -------------------------------------------------------------------------
  // Calibration
  // -------------------------------------------------------------------------
  const syncPx = new Uint8Array(4);
  const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, syncPx);
  const renderN = () => { for (let k = 0; k < P.simGpu; k++) render(); };
  const CAL_N = 9;
  const calCpu = new Float32Array(CAL_N), calGpu = new Float32Array(CAL_N);

  /** Médiane d'une image complète (simulation de GPU comprise) à une résolution donnée, sur des shaders compilés. */
  async function measure(res: number) {
    P.resolution = res;
    resizeTargets();
    for (let k = 0; k < 3; k++) { renderN(); sync(); } // chauffe (cibles réallouées, caches)
    for (let i = 0; i < CAL_N; i++) {
      const t = performance.now();
      calTimer.begin();
      renderN();
      calTimer.end();
      sync();
      calCpu[i] = performance.now() - t;
    }
    if (calTimer.available) {
      // les résultats des requêtes n'arrivent qu'après un retour à la boucle d'événements
      let n = 0;
      const t0 = performance.now();
      while (n < CAL_N && performance.now() - t0 < 600) {
        await new Promise((r) => setTimeout(r, 0));
        calTimer.poll((ms) => { if (n < CAL_N) calGpu[n++] = ms; });
      }
      if (n >= 5) return { ms: median(calGpu, n), gpu: true };
    }
    return { ms: median(calCpu, CAL_N), gpu: false };
  }

  async function calibrate() {
    calibrating = true;
    const t0 = performance.now();
    const h = hardwareHints();
    const tried: CalibInfo["tried"] = [];
    let gpuTimed = true;
    // montée en fréquence : au repos, le GPU tourne au ralenti (économie d'énergie) et les premières images sont lentes
    // (mesuré : ×18 jugé 1,6 fois plus lent que ×9 × 2 sans cette chauffe)
    P.resolution = 0.6;
    resizeTargets();
    for (const tr = performance.now(); performance.now() - tr < 250; ) { renderN(); sync(); }
    // modèle : coût = fixe + k × résolution² (deux mesures) → résolution max pour le budget
    const fit = async (tier: TierName) => {
      applyTier(tier);
      const ra = 0.6, rb = 0.35;
      const a = await measure(ra), b = await measure(rb);
      gpuTimed = a.gpu && b.gpu;
      const budget = gpuTimed ? CAL_GPU_MS : CAL_SYNC_MS;
      const k = Math.max(1e-3, (a.ms - b.ms) / (ra * ra - rb * rb));
      const fixed = Math.max(0, a.ms - k * ra * ra);
      const r = Math.min(1, Math.floor(Math.sqrt(Math.max(0, (budget - fixed) / k)) * 20) / 20);
      tried.push({ tier, msAt060: +a.ms.toFixed(2), msAt035: +b.ms.toFixed(2), resMax: r });
      return r;
    };
    // le niveau le plus haut qui tient sans trop pixeliser (en px interne par px CSS) ; une résolution de 100 %
    // suffit toujours (écran à faible densité)
    const enough = (r: number, eff: number) => r >= 0.999 || r * dpr >= eff - 1e-6;
    let tier: TierName, res: number, why: string;
    if (h.software) {
      tier = "basse";
      res = Math.max(RES_MIN, await fit("basse"));
      why = "rendu logiciel";
    } else {
      const rh = await fit("haute");
      if (enough(rh, EFF_HAUTE)) { tier = "haute"; res = rh; why = "haute tient"; }
      else {
        const rm = await fit("moyenne");
        if (enough(rm, EFF_MOYENNE)) { tier = "moyenne"; res = rm; why = `haute → ${pct(rh)} seulement`; }
        else { tier = "basse"; res = Math.max(RES_MIN, await fit("basse")); why = `moyenne → ${pct(rm)} seulement`; }
      }
    }
    if (h.integrated) why += " · gpu intégré détecté";
    applyTier(tier);
    P.resolution = res;
    resizeTargets();
    const ms = Math.round(performance.now() - t0);
    autoInfo = `calibré en ${ms} ms` + (h.integrated ? " · gpu intégré" : h.software ? " · rendu logiciel" : "");
    decor?.set(0);
    resetWindow();
    win.cool = 1000;
    backoff.clear();
    calib = { tier, res };
    lastCalib = { tier, res, hints: h, ms, gpuTimed, why, tried };
    log(`calibration : ${tier} ${pct(res)} (${gpuTimed ? "temps GPU" : "images synchronisées"})`);
    calibrating = false;
    changed();
    return lastCalib;
  }

  // -------------------------------------------------------------------------
  // Crans de qualité (ordre de dégradation) et délais avant de retenter un état qui a décroché
  // -------------------------------------------------------------------------
  let calib: { tier: TierName; res: number } = { tier: "haute", res: 1 };
  const backoff = new Map<string, { until: number; wait: number }>();
  const stateKey = (tier = P.tier, res = P.resolution, dl = decor?.level() ?? 0) => `${tier}|${round20(res)}|${dl}`;
  const blocked = (key: string) => (backoff.get(key)?.until ?? 0) > performance.now();
  function block(key: string) {
    const b = backoff.get(key);
    const wait = b ? Math.min(BACKOFF_MAX_MS, b.wait * 2) : BACKOFF_MS;
    backoff.set(key, { until: performance.now() + wait, wait });
  }
  /** Résolution sous laquelle on préfère passer en basse plutôt que de pixeliser. */
  const resFloor = () => Math.min(1, Math.max(RES_MIN, Math.ceil((EFF_FLOOR / dpr) * 20) / 20));

  function stepDown(): string | null {
    const dl = decor?.level() ?? 2;
    const fl = resFloor();
    if (decor && dl < 1 && decor.useful(1)) { decor.set(1); return "décors moyens coupés"; }
    if (P.tier === "haute") { applyTier("moyenne"); return "moins de pas de raymarching (moyenne)"; }
    if (decor && dl < 2 && decor.useful(2)) { decor.set(2); return "décors légers réduits"; }
    if (P.resolution > fl + 0.001) { P.resolution = Math.max(fl, round20(P.resolution - 0.1)); return `résolution ${pct(P.resolution)}`; }
    if (P.tier === "moyenne") { applyTier("basse"); return "basse"; }
    if (P.resolution > RES_MIN + 0.001) { P.resolution = Math.max(RES_MIN, round20(P.resolution - 0.1)); return `résolution ${pct(P.resolution)}`; }
    return null;
  }

  /** Cran supérieur (ordre inverse), sans l'appliquer : son état, son coût relatif estimé, et s'il reste sous la calibration. */
  function nextUp(): { key: string; cost: number; desc: string; withinCalib: boolean; apply: () => void } | null {
    const dl = decor?.level() ?? 0;
    const fl = resFloor();
    const ti = TIER_ORDER.indexOf(P.tier), ci = TIER_ORDER.indexOf(calib.tier);
    const res = (r: number) => ({
      key: stateKey(P.tier, r, dl), cost: (r / P.resolution) ** 2, desc: `résolution ${pct(r)}`,
      withinCalib: ti >= ci && r <= calib.res + 0.001, apply: () => { P.resolution = r; },
    });
    const tier = (t: TierName, cost: number) => ({
      key: stateKey(t, P.resolution, dl), cost, desc: t, withinCalib: TIER_ORDER.indexOf(t) >= ci && P.resolution <= calib.res + 0.001,
      apply: () => applyTier(t),
    });
    const dec = (n: number, cost: number) => ({
      key: stateKey(P.tier, P.resolution, n), cost, desc: n ? "décors légers rétablis" : "décors moyens rétablis",
      withinCalib: true, apply: () => decor!.set(n),
    });
    if (P.tier === "basse" && P.resolution < fl - 0.001) return res(Math.min(fl, round20(P.resolution + 0.05)));
    if (P.tier === "basse") return tier("moyenne", UP_COST.tierLow);
    if (P.resolution < 0.999) return res(Math.min(1, round20(P.resolution + 0.05)));
    if (decor && dl >= 2) return dec(1, UP_COST.decorLight);
    if (P.tier === "moyenne") return tier("haute", UP_COST.tier);
    if (decor && dl >= 1) return dec(0, UP_COST.decorMedium);
    return null;
  }

  /** Nouvelle slide posée : les décors coupés ont de nouveau leur chance (sauf si cet état vient de décrocher). */
  function slidePosed() {
    if (!decor || decor.level() === 0) return;
    if (!P.auto || !blocked(stateKey(P.tier, P.resolution, 0))) decor.set(0);
  }

  // -------------------------------------------------------------------------
  // Ajustement continu (fenêtres de 2 s)
  // -------------------------------------------------------------------------
  const CAP = 1024;
  const win = { gpu: new Float32Array(CAP), ng: 0, frm: new Float32Array(CAP), nf: 0, acc: 0, cool: 0, strikes: 0, ups: 0 };
  /** Dernière fenêtre : médiane (ms) et sa source (diagnostic). */
  const last = { ms: 0, gpu: false, frames: 0 };
  function resetWindow() { win.ng = 0; win.nf = 0; win.acc = 0; win.strikes = 0; win.ups = 0; }
  const onGpu = (ms: number) => { if (win.cool <= 0 && win.ng < CAP) win.gpu[win.ng++] = ms; };

  function evaluate() {
    const useGpu = frameTimer.available && win.ng >= Math.max(10, win.nf * 0.5);
    const load = useGpu ? median(win.gpu, win.ng) : median(win.frm, win.nf);
    last.ms = load; last.gpu = useGpu; last.frames = win.nf;
    win.ng = 0; win.nf = 0; win.acc = 0;
    if (!P.auto || calibrating) return;
    const down = useGpu ? DOWN_MS : DOWN_FRAME_MS, panic = useGpu ? PANIC_MS : DOWN_FRAME_MS * 1.6;
    if (load > down) {
      win.ups = 0;
      if (++win.strikes < 2 && load <= panic) return;
      win.strikes = 0;
      const from = stateKey();
      const what = stepDown();
      if (!what) return;
      block(from);
      log(`baisse (${load.toFixed(1)} ms ${useGpu ? "GPU" : "/image"}) → ${what}`);
      resizeTargets();
      win.cool = 800;
      changed();
      return;
    }
    win.strikes = 0;
    const up = nextUp();
    const ok = up && !blocked(up.key) && (useGpu ? load * up.cost < UP_MS : load * up.cost < UP_FRAME_MS || up.withinCalib);
    if (!ok) { win.ups = 0; return; }
    // marge large (coût prévu < 60 % du seuil) : une fenêtre suffit ; sinon deux de suite
    if (++win.ups < (useGpu && load * up.cost < UP_MS * 0.6 ? 1 : 2)) return;
    win.ups = 0;
    up.apply();
    log(`remontée (${load.toFixed(1)} ms ${useGpu ? "GPU" : "/image"}) → ${up.desc}`);
    resizeTargets();
    win.cool = 800;
    changed();
  }

  /** Avant le rendu de l'image (mesure du temps GPU). */
  function beginFrame() { frameTimer.begin(); }

  /** Après le rendu de l'image : relève les temps GPU disponibles et l'intervalle depuis l'image précédente. */
  function endFrame(rawMs: number) {
    frameTimer.end();
    frameTimer.poll(onGpu);
    if (calibrating) return;
    // page cachée (onglet, fenêtre couverte : ~1–5 images/s imposées par le navigateur) ou longue pause (onglet revenu
    // au premier plan…) : ce n'est pas la machine qui décroche
    if (rawMs > 250 || document.hidden) { resetWindow(); win.cool = 500; return; }
    if (win.cool > 0) { win.cool -= rawMs; win.ng = 0; return; }
    if (win.nf < CAP) win.frm[win.nf++] = rawMs;
    win.acc += rawMs;
    if (win.acc >= WINDOW_MS) evaluate();
  }

  return {
    applyTier,
    calibrate,
    beginFrame,
    endFrame,
    slidePosed,
    info: () => autoInfo,
    /** Diagnostic (?diag=1). */
    diag: () => ({
      calib: lastCalib,
      events,
      timer: frameTimer.available,
      last,
      floor: resFloor(),
      blocked: [...backoff.values()].filter((b) => b.until > performance.now()).length,
    }),
    dispose() { frameTimer.dispose(); calTimer.dispose(); },
  };
}
