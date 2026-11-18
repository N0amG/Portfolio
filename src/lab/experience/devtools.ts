import GUI from "lil-gui";
import * as THREE from "three";
import type { Engine } from "./engine";
import { TIER_ORDER } from "./quality";

/* ───────────────────────────────────────────────────────────
   Outils de dev uniquement (chargés par import() dynamique hors production) :
   panneau lil-gui (fermé par défaut), « Simuler un GPU », __bench() et accès console.
   ─────────────────────────────────────────────────────────── */

type DevWindow = Window & Record<string, unknown>;

export function mountDevtools(engine: Engine) {
  const { P, bhMat, quality } = engine;
  const w = window as unknown as DevWindow;

  const gui = new GUI({ title: "Réglages — trou noir" });
  const refreshGui = () => gui.controllersRecursive().forEach((c) => c.updateDisplay());
  engine.listeners.paramsChanged = refreshGui;

  const calibrate = () => (w.__calib = quality.calibrate());
  gui.add(P, "diskSpeed", 0, 4, 0.01).name("Vitesse du disque");
  gui.add(P, "plasmaIntensity", 0.2, 3, 0.01).name("Intensité plasma");
  gui.addColor(P, "plasmaColor").name("Couleur plasma").onChange((v: string) => (bhMat.uniforms.uC1.value as THREE.Color).set(v));
  gui.add(P, "suction", 0, 4, 0.01).name("Aspiration étoiles");
  gui.add(P, "skyDrift", 0, 0.2, 0.005).name("Dérive du ciel");
  gui.add(P, "starTrail", 0, 3, 0.05).name("Traînée d'aspiration");
  gui.add(P, "explosion", 0, 3, 0.01).name("Explosion lettres (0 = off)");
  gui.add(P, "absorbDur", 1, 8, 0.1).name("Durée transition (s)");
  gui.add(P, "auto").name("Auto (selon le matériel)").onChange((v: boolean) => {
    if (v) calibrate();
    engine.updateQualityLabel();
  });
  gui.add(P, "tier", TIER_ORDER).name("Qualité").onChange((v: (typeof TIER_ORDER)[number]) => {
    P.auto = false;
    quality.applyTier(v);
    refreshGui();
    engine.updateQualityLabel();
  });
  gui
    .add(P, "resolution", 0.25, 1, 0.05)
    .name("Résolution interne")
    .onChange(() => {
      P.auto = false;
      refreshGui();
      engine.updateQualityLabel();
    })
    .onFinishChange(engine.resizeTargets);
  gui.add({ recal: () => { P.auto = true; calibrate(); } }, "recal").name("Recalibrer");
  // Ratios de puissance de calcul (FP32) par rapport à une RTX 5070 Ti (~44 TFLOPS) :
  // GTX 1660 ~5 TFLOPS -> ×9 ; Intel UHD 630 (i3 10e gen) ~0,45 TFLOPS -> ×90.
  gui
    .add(P, "simGpu", { "Aucune (ce GPU)": 1, "GTX 1660 (×9)": 9, "Intel UHD 630 · i3 10e gen (×90)": 90 })
    .name("Simuler un GPU")
    .onChange(() => {
      engine.updateGpuLabel();
      if (P.auto) calibrate();
    });
  const more = gui.addFolder("Divers");
  more.add(P, "doppler", 0, 0.95, 0.01).name("Doppler");
  more.add(P, "bloom", 0, 2, 0.01).name("Bloom");
  more.add(P, "grain", 0, 0.15, 0.005).name("Grain");
  more.close();
  gui.close(); // panneau fermé par défaut
  refreshGui();

  // Accès console (mêmes noms que dans le prototype)
  w.__P = P;
  w.__stats = engine.stats;
  w.__cam = engine.cam;
  w.__go = engine.nav.go;
  w.__nav = engine.nav.state;
  w.__bench = engine.bench;
  w.__calibrate = calibrate;
  w.__setRes = (r: number) => {
    P.auto = false;
    P.resolution = r;
    engine.resizeTargets();
    refreshGui();
    engine.updateQualityLabel();
  };

  return () => {
    gui.destroy();
    for (const k of ["__P", "__stats", "__cam", "__go", "__nav", "__bench", "__calibrate", "__setRes", "__calib"]) delete w[k];
  };
}
