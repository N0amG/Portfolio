import { createGpuTimer } from "./gputimer";

/* ───────────────────────────────────────────────────────────
   Qualité automatique (SPEC section 6, « Qualité automatique »). Depuis le 20/11/2026 (demande de Noam : graphismes
   au plus près de 100 %, AUCUN élément retiré) :
   - aucun décor n'est jamais coupé ni réduit, et le niveau ne retire aucun élément (tous dès « basse ») ;
   - le premier levier est la RÉSOLUTION DE SORTIE de toute l'image (écran → 1440p → 1080p → 900p → 720p),
     agrandie en douceur par le navigateur : moins choquant qu'un trou noir pixelisé, et les passes plein écran
     (étoiles, lettres, composition) coûtent moins aussi ;
   - échelle des crans (du meilleur au plus léger) : haute à la résolution de l'écran, puis 1440p et 1080p (si l'écran
     est plus grand) → moyenne (moins de pas de raymarching, 3 octaves) → 900p, 720p → basse → dernier recours :
     trou noir seul sous la résolution de sortie (85, 70, 60, 50 %, accentuation de l'upscale).
   1. Calibration au chargement, sur des shaders déjà compilés : montée en charge, puis médianes de 9 images en temps
      GPU réel (requêtes de temps) si possible ; modèle coût = fixe + k × pixels ; premier cran qui tient le budget.
   2. Ajustement continu sur des fenêtres de 2 s (médiane du temps GPU par image) : baisse d'un cran après deux
      fenêtres chargées, remontée quand le cran supérieur tient avec marge ; délai avant de retenter un état qui a
      décroché (15 s, doublé à chaque nouvel échec, 2 min au plus).
   ─────────────────────────────────────────────────────────── */

// Le nombre d'étoiles aspirées ne dépend plus du niveau (rien n'est retiré ; leur coût est négligeable).
export const TIERS = {
  haute: { stepK: 0.07, oct: 4, stars: 1100 },
  moyenne: { stepK: 0.095, oct: 3, stars: 1100 },
  basse: { stepK: 0.13, oct: 2, stars: 1100 },
} as const;
export type TierName = keyof typeof TIERS;
export type Tier = (typeof TIERS)[TierName];
export const TIER_ORDER: TierName[] = ["haute", "moyenne", "basse"];

/** Résolutions de sortie proposées (lignes), prises seulement si l'écran est plus grand. */
const OUTPUT_LINES = [1440, 1080, 900, 720];
/** Dernier recours : trou noir seul sous la résolution de sortie. */
const LAST_RES = [0.85, 0.7, 0.6, 0.5];
/** Calibration (sur S1) : temps GPU visé par image. S7 coûte ≈ 1,35 × S1 (sous DOWN_MS) ; la plongée ≈ 1,7 ×. */
const CAL_GPU_MS = 10.5;
/** Sans requêtes de temps GPU : image complète synchronisée (processeur et GPU en série, donc plus lente). */
const CAL_SYNC_MS = 12;
/** Ajustement continu. */
const WINDOW_MS = 2000;
const DOWN_MS = 15; // médiane GPU au-dessus, deux fenêtres de suite : un cran plus bas (60 images/s tenues)
const PANIC_MS = 24; // au-dessus : un cran plus bas dès la première fenêtre
const UP_MS = 11.5; // coût prévu du cran supérieur sous ce seuil, deux fenêtres de suite : un cran plus haut
const DOWN_FRAME_MS = 20; // sans requêtes GPU : intervalle médian entre images (≈ 50 images/s)
const UP_FRAME_MS = 13; // sans requêtes GPU : marge visible seulement sur un écran > 60 Hz
const BACKOFF_MS = 15000;
const BACKOFF_MAX_MS = 120000;
/** Coût relatif d'un niveau par rapport au suivant (estimation tant qu'il n'a pas été mesuré). */
const TIER_COST = { haute: 1.35, moyenne: 1.3, basse: 1 } as const;

/** Un cran de qualité : niveau, résolution de sortie (lignes, 0 = écran), résolution du trou noir (relative). */
export interface QState { tier: TierName; lines: number; res: number }

/** Dernière calibration (diagnostic ?diag=1). */
export interface CalibInfo {
  tier: TierName;
  lines: number;
  res: number;
  hints: { software: boolean; integrated: boolean; cores: number; mem: number };
  ms: number;
  /** true : mesures en temps GPU réel ; false : images synchronisées (processeur + GPU). */
  gpuTimed: boolean;
  why: string;
  /** Mesures par niveau : ms par image à la résolution de l'écran et à la plus petite sortie (ou trou noir à 60 %). */
  tried: { tier: TierName; msFull: number; msSmall: number; small: string }[];
}

interface QualityParams {
  resolution: number;
  output: number;
  simGpu: number;
  auto: boolean;
  tier: TierName;
}

interface QualityDeps {
  P: QualityParams;
  gl: WebGL2RenderingContext;
  gpuName: string;
  /** Hauteur de l'écran en pixels réels (DPR plafonné par le moteur). */
  nativeLines: () => number;
  render: () => void;
  resizeTargets: () => void;
  setTier: (t: Tier) => void;
  /** Appelé quand la qualité ou la résolution change (libellés, panneau de dev). */
  changed: () => void;
}

const pct = (r: number) => `${Math.round(r * 100)} %`;
const linesName = (l: number) => (l ? `${l}p` : "écran");
const stateName = (s: QState) => `${s.tier} ${linesName(s.lines)}${s.res < 0.999 ? ` · trou noir ${pct(s.res)}` : ""}`;
function median(a: Float32Array, n: number) {
  const s = a.subarray(0, n).sort();
  return n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

export function createQuality({ P, gl, gpuName, nativeLines, render, resizeTargets, setTier, changed }: QualityDeps) {
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
  // Échelle des crans
  // -------------------------------------------------------------------------
  /** Lignes réellement rendues pour une résolution de sortie (0 ou plus grande que l'écran = l'écran). */
  const effLines = (lines: number) => { const nh = nativeLines(); return lines > 0 && lines < nh ? lines : nh; };
  /** Fraction de pixels de l'écran rendus dans un état (modèle de coût). */
  const pixels = (s: QState) => (effLines(s.lines) / nativeLines()) ** 2;

  function ladder(): QState[] {
    const nh = nativeLines();
    const lines = [0, ...OUTPUT_LINES.filter((l) => l < nh * 0.95)];
    const hi = lines.filter((l) => l === 0 || l >= 1080);
    const lo = lines.filter((l) => l !== 0 && l < 1080);
    const out: QState[] = hi.map((l) => ({ tier: "haute" as TierName, lines: l, res: 1 }));
    const mid = hi[hi.length - 1];
    out.push({ tier: "moyenne", lines: mid, res: 1 });
    for (const l of lo) out.push({ tier: "moyenne", lines: l, res: 1 });
    const last = out[out.length - 1].lines;
    out.push({ tier: "basse", lines: last, res: 1 });
    for (const r of LAST_RES) out.push({ tier: "basse", lines: last, res: r });
    return out;
  }
  const keyOf = (s: QState) => `${s.tier}|${Math.round(effLines(s.lines))}|${s.res.toFixed(2)}`;
  const current = (): QState => ({ tier: P.tier, lines: P.output, res: P.resolution });
  /** Position de l'état courant dans l'échelle (le plus proche en lignes rendues, à niveau et résolution égaux). */
  function locate(L = ladder()) {
    const c = current(), ce = effLines(c.lines);
    let best = -1, bd = Infinity;
    L.forEach((s, i) => {
      if (s.tier !== c.tier || Math.abs(s.res - c.res) > 0.01) return;
      const d = Math.abs(effLines(s.lines) - ce);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  function applyState(s: QState) {
    applyTier(s.tier);
    P.output = s.lines;
    P.resolution = s.res;
    resizeTargets();
  }

  /** Modèle de coût par niveau (mesuré à la calibration) : coût = fixe + k × fraction de pixels × res². */
  const fits: Partial<Record<TierName, { fixed: number; k: number }>> = {};
  function predict(s: QState) {
    const f = fits[s.tier];
    if (!f) return NaN;
    return f.fixed + f.k * pixels(s) * s.res * s.res;
  }
  /** Coût relatif de b par rapport à a : modèle mesuré si possible, sinon estimation. */
  function ratio(a: QState, b: QState) {
    const pa = predict(a), pb = predict(b);
    if (pa > 0 && pb > 0) return pb / pa;
    let r = (pixels(b) * b.res * b.res) / Math.max(1e-3, pixels(a) * a.res * a.res);
    const ta = TIER_ORDER.indexOf(a.tier), tb = TIER_ORDER.indexOf(b.tier);
    if (tb < ta) for (let i = tb; i < ta; i++) r *= TIER_COST[TIER_ORDER[i]];
    if (tb > ta) for (let i = ta; i < tb; i++) r /= TIER_COST[TIER_ORDER[i]];
    return r;
  }

  // -------------------------------------------------------------------------
  // Calibration
  // -------------------------------------------------------------------------
  const syncPx = new Uint8Array(4);
  const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, syncPx);
  const renderN = () => { for (let k = 0; k < P.simGpu; k++) render(); };
  const CAL_N = 9;
  const calCpu = new Float32Array(CAL_N), calGpu = new Float32Array(CAL_N);

  /** Médiane d'une image complète (simulation de GPU comprise) dans un état donné, sur des shaders compilés. */
  async function measure(s: QState) {
    P.output = s.lines;
    P.resolution = s.res;
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
    for (const t of TIER_ORDER) delete fits[t];
    // montée en fréquence : au repos, le GPU tourne au ralenti (économie d'énergie) et les premières images sont lentes
    P.output = 0;
    P.resolution = 1;
    resizeTargets();
    for (const tr = performance.now(); performance.now() - tr < 250; ) { renderN(); sync(); }
    // deux mesures par niveau : écran entier, et la plus petite sortie (ou le trou noir à 60 % sur un petit écran)
    const nh = nativeLines();
    const small: QState = nh * 0.95 > 720 ? { tier: "haute", lines: 720, res: 1 } : { tier: "haute", lines: 0, res: 0.6 };
    const fit = async (tier: TierName) => {
      applyTier(tier);
      const a = await measure({ tier, lines: 0, res: 1 });
      const sb = { ...small, tier };
      const b = await measure(sb);
      gpuTimed = a.gpu && b.gpu;
      const xa = 1, xb = pixels(sb) * sb.res * sb.res;
      const k = Math.max(1e-3, (a.ms - b.ms) / (xa - xb));
      fits[tier] = { fixed: Math.max(0, a.ms - k * xa), k };
      tried.push({ tier, msFull: +a.ms.toFixed(2), msSmall: +b.ms.toFixed(2), small: stateName(sb) });
    };
    const L = ladder();
    let pick = L.length - 1;
    if (h.software) pick = L.findIndex((s) => s.tier === "basse");
    for (let i = 0; i < L.length && !h.software; i++) {
      if (!fits[L[i].tier]) await fit(L[i].tier);
      if (predict(L[i]) <= (gpuTimed ? CAL_GPU_MS : CAL_SYNC_MS)) { pick = i; break; }
    }
    const chosen = L[pick];
    applyState(chosen);
    const ms = Math.round(performance.now() - t0);
    const why = h.software ? "rendu logiciel" : pick === 0 ? "pleine qualité tient" : `prévu ${predict(chosen).toFixed(1)} ms (budget ${gpuTimed ? CAL_GPU_MS : CAL_SYNC_MS})`;
    autoInfo = `calibré en ${ms} ms` + (h.integrated ? " · gpu intégré" : h.software ? " · rendu logiciel" : "");
    resetWindow();
    win.cool = 1000;
    backoff.clear();
    calibIdx = pick;
    lastCalib = { tier: chosen.tier, lines: chosen.lines, res: chosen.res, hints: h, ms, gpuTimed, why: why + (h.integrated ? " · gpu intégré détecté" : ""), tried };
    log(`calibration : ${stateName(chosen)} (${gpuTimed ? "temps GPU" : "images synchronisées"})`);
    calibrating = false;
    changed();
    return lastCalib;
  }

  // -------------------------------------------------------------------------
  // Délais avant de retenter un état qui a décroché
  // -------------------------------------------------------------------------
  let calibIdx = 0;
  const backoff = new Map<string, { until: number; wait: number }>();
  const blocked = (key: string) => (backoff.get(key)?.until ?? 0) > performance.now();
  function block(key: string) {
    const b = backoff.get(key);
    const wait = b ? Math.min(BACKOFF_MAX_MS, b.wait * 2) : BACKOFF_MS;
    backoff.set(key, { until: performance.now() + wait, wait });
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
    const L = ladder();
    const i = locate(L);
    if (i < 0) return; // état réglé à la main hors de l'échelle
    const down = useGpu ? DOWN_MS : DOWN_FRAME_MS, panic = useGpu ? PANIC_MS : DOWN_FRAME_MS * 1.6;
    if (load > down) {
      win.ups = 0;
      if (++win.strikes < 2 && load <= panic) return;
      win.strikes = 0;
      if (i >= L.length - 1) return;
      block(keyOf(L[i]));
      applyState(L[i + 1]);
      log(`baisse (${load.toFixed(1)} ms ${useGpu ? "GPU" : "/image"}) → ${stateName(L[i + 1])}`);
      win.cool = 800;
      changed();
      return;
    }
    win.strikes = 0;
    if (i === 0) { win.ups = 0; return; }
    const up = L[i - 1];
    const cost = ratio(L[i], up);
    const ok = !blocked(keyOf(up)) && (useGpu ? load * cost < UP_MS : load * cost < UP_FRAME_MS || i - 1 >= calibIdx);
    if (!ok) { win.ups = 0; return; }
    // marge large (coût prévu < 60 % du seuil) : une fenêtre suffit ; sinon deux de suite
    if (++win.ups < (useGpu && load * cost < UP_MS * 0.6 ? 1 : 2)) return;
    win.ups = 0;
    applyState(up);
    log(`remontée (${load.toFixed(1)} ms ${useGpu ? "GPU" : "/image"}) → ${stateName(up)}`);
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
    info: () => autoInfo,
    /** Diagnostic (?diag=1). */
    diag: () => {
      const L = ladder(), i = locate(L);
      return {
        calib: lastCalib,
        events,
        timer: frameTimer.available,
        last,
        step: i < 0 ? "hors échelle (manuel)" : `cran ${i + 1} / ${L.length}`,
        blocked: [...backoff.values()].filter((b) => b.until > performance.now()).length,
      };
    },
    dispose() { frameTimer.dispose(); calTimer.dispose(); },
  };
}
