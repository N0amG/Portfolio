/* ───────────────────────────────────────────────────────────
   Qualité automatique : indices matériels + mini-test au chargement, puis ajustement continu.
   (Le mini-test sera caché dans le préchargement supernova en phase 4.)
   ─────────────────────────────────────────────────────────── */

export const TIERS = {
  haute: { stepK: 0.07, oct: 4, stars: 1100 },
  moyenne: { stepK: 0.095, oct: 3, stars: 800 },
  basse: { stepK: 0.13, oct: 2, stars: 500 },
} as const;
export type TierName = keyof typeof TIERS;
export type Tier = (typeof TIERS)[TierName];
export const TIER_ORDER: TierName[] = ["haute", "moyenne", "basse"];

const BUDGET_MS = 15; // coût visé par image, mesuré en synchrone (pessimiste) : marge sous 16,7 ms
const RES_MIN = 0.3;

interface QualityParams {
  resolution: number;
  simGpu: number;
  auto: boolean;
  tier: TierName;
}

interface QualityDeps {
  P: QualityParams;
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  gpuName: string;
  render: () => void;
  resizeTargets: () => void;
  setTier: (t: Tier) => void;
  /** Appelé quand la qualité ou la résolution change (libellés, panneau de dev). */
  changed: () => void;
}

export function createQuality({ P, gl, gpuName, render, resizeTargets, setTier, changed }: QualityDeps) {
  let autoCeil = 1; // plafond de résolution trouvé par la calibration (abaissé si la machine décroche)
  let autoInfo = "";
  const adapt = { acc: 0, n: 0, good: 0, fast: 0, cool: 0, locked: false };

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

  // Temps moyen d'une image complète (simulation de GPU comprise) à une résolution donnée, synchronisé sur le GPU
  const syncPx = new Uint8Array(4);
  function timeFrames(res: number) {
    P.resolution = res;
    resizeTargets();
    const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, syncPx);
    for (let k = 0; k < P.simGpu; k++) render();
    sync(); // échauffement (compilation, allocation)
    let n = 0;
    const t0 = performance.now();
    do {
      for (let k = 0; k < P.simGpu; k++) render();
      sync();
      n++;
    } while (n < 3 || (performance.now() - t0 < 120 && n < 20));
    return (performance.now() - t0) / n;
  }

  function calibrate() {
    const t0 = performance.now();
    const h = hardwareHints();
    const start = h.software ? 2 : h.integrated || h.cores <= 4 || h.mem <= 4 ? 1 : 0;
    let chosen = { tier: TIER_ORDER[TIER_ORDER.length - 1], res: RES_MIN, msAt060: 0, msAt035: 0 };
    for (let i = start; i < TIER_ORDER.length; i++) {
      applyTier(TIER_ORDER[i]);
      // modèle : coût = fixe + k × résolution²  (deux mesures suffisent)
      const ra = 0.6, rb = 0.35;
      const a = timeFrames(ra), b = timeFrames(rb);
      const k = Math.max(1e-3, (a - b) / (ra * ra - rb * rb));
      const fixed = Math.max(0, a - k * ra * ra);
      let r = Math.sqrt(Math.max(0, (BUDGET_MS - fixed) / k));
      r = Math.min(1, Math.floor(r * 20) / 20);
      if (r >= 0.45 || i === TIER_ORDER.length - 1) {
        chosen = { tier: TIER_ORDER[i], res: Math.max(RES_MIN, r), msAt060: +a.toFixed(2), msAt035: +b.toFixed(2) };
        break;
      }
    }
    applyTier(chosen.tier);
    autoCeil = chosen.res;
    P.resolution = chosen.res;
    resizeTargets();
    const ms = Math.round(performance.now() - t0);
    autoInfo = `calibré en ${ms} ms` + (start > 0 ? ` · indice ${h.software ? "rendu logiciel" : "gpu modeste"}` : "");
    adapt.cool = 1500; adapt.acc = 0; adapt.n = 0; adapt.good = 0; adapt.fast = 0; adapt.locked = false;
    changed();
    return { ...chosen, hints: h, ms };
  }

  // Ajustement continu : on baisse si les images dépassent ~18 ms en moyenne sur 1 s, on remonte prudemment.
  function adaptQuality(rawMs: number) {
    if (!P.auto || rawMs > 250) return; // onglet revenu au premier plan, etc.
    if (adapt.cool > 0) { adapt.cool -= rawMs; return; }
    adapt.acc += rawMs;
    adapt.n++;
    if (adapt.acc < 1000) return;
    const avg = adapt.acc / adapt.n;
    adapt.acc = 0;
    adapt.n = 0;
    if (avg > 18) {
      adapt.good = 0; adapt.fast = 0; adapt.locked = true; // plafond verrouillé après un décrochage
      if (P.resolution > RES_MIN + 0.001) {
        autoCeil = Math.max(RES_MIN, P.resolution - 0.05); // ne pas remonter au niveau qui a décroché
        P.resolution = Math.max(RES_MIN, Math.round((P.resolution - 0.1) * 20) / 20);
      } else {
        const i = TIER_ORDER.indexOf(P.tier);
        if (i < TIER_ORDER.length - 1) applyTier(TIER_ORDER[i + 1]);
      }
      resizeTargets();
      adapt.cool = 800;
    } else if (avg < 17.5 && P.resolution < autoCeil - 0.001) {
      if (++adapt.good >= 4) {
        P.resolution = Math.min(autoCeil, Math.round((P.resolution + 0.05) * 20) / 20);
        resizeTargets();
        adapt.good = 0;
        adapt.cool = 800;
      }
    } else if (avg < 14 && !adapt.locked && (P.resolution < 0.999 || P.tier !== "haute")) {
      // Marge nette (écran > 60 Hz et images rapides) : on remonte d'un cran, qualité d'abord puis résolution
      adapt.good = 0;
      if (++adapt.fast >= 3) {
        const i = TIER_ORDER.indexOf(P.tier);
        if (i > 0 && P.resolution >= 0.5) applyTier(TIER_ORDER[i - 1]);
        else {
          P.resolution = Math.min(1, Math.round((P.resolution + 0.05) * 20) / 20);
          autoCeil = P.resolution;
        }
        resizeTargets();
        adapt.fast = 0;
        adapt.cool = 800;
      }
    } else {
      adapt.good = 0;
      adapt.fast = 0;
    }
    changed();
  }

  return { applyTier, calibrate, adapt: adaptQuality, info: () => autoInfo };
}
