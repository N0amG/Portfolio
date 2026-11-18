import * as THREE from "three";
import type { FrameParams, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   16 · Éruption du disque au clic (toutes les slides).
   Un clic lance un sursaut de plasma depuis l'azimut du disque situé sous le curseur (intersection du rayon de
   visée avec le plan du disque) : une langue brillante fait le tour du disque dans le sens de sa rotation, puis
   s'éteint. L'effet est calculé dans le shader du trou noir (uniform uErupt), cet élément ne gère que le déclenchement.
   ─────────────────────────────────────────────────────────── */

export function createEruption(): SceneElement {
  const P = { amp: 1.0, speed: 2.3, duration: 3.4 };
  let age = -1, phi0 = 0;
  let seen = -1e9; // dernier update() : un clic pendant que l'élément est coupé (interrupteur) est ignoré
  // dernière pose de caméra connue (pour convertir le clic en azimut du disque)
  const cp = new THREE.Vector3(), cf = new THREE.Vector3(), cr = new THREE.Vector3(), cu = new THREE.Vector3();
  let W = 1, H = 1, ready = false;
  const ray = new THREE.Vector3();

  const onDown = (e: PointerEvent) => {
    if (!ready || performance.now() - seen > 300 || e.button !== 0 || (e.target as Element | null)?.closest?.(".lil-gui, a, button")) return;
    // rayon de visée du clic (même convention que le shader : cf + tanHalf × (x·cr + y·cu), tanHalf = 0.42)
    const nx = ((e.clientX / W) * 2 - 1) * (W / H), ny = 1 - (e.clientY / H) * 2;
    ray.copy(cf).addScaledVector(cr, 0.42 * nx).addScaledVector(cu, 0.42 * ny).normalize();
    let a: number;
    if (Math.abs(ray.y) > 1e-3 && -cp.y / ray.y > 0) {
      const t = -cp.y / ray.y;
      a = Math.atan2(cp.z + ray.z * t, cp.x + ray.x * t);
    } else {
      a = Math.random() * Math.PI * 2; // rayon parallèle au disque : azimut au hasard
    }
    phi0 = a;
    age = 0;
  };

  return {
    id: "eruption",
    label: "16 · Éruption du disque (clic)",
    slides: "all",
    cost: "leger",
    minTier: "basse",
    layers: [],
    init() {
      window.addEventListener("pointerdown", onDown);
    },
    update(f: FrameParams) {
      cp.copy(f.camPos); cf.copy(f.camF); cr.copy(f.camR); cu.copy(f.camU);
      W = f.width; H = f.height; ready = true;
      seen = performance.now();
      if (age < 0) return;
      age += f.dt;
      const u = age / P.duration;
      if (u >= 1) { age = -1; return; }
      // attaque rapide, extinction lente
      const env = Math.min(1, age / 0.18) * Math.pow(1 - u, 1.4);
      f.bh.erupt.set(phi0, age, -P.speed, P.amp * env * (f.reduced ? 0.8 : 1));
    },
    render() {},
    dispose() {
      window.removeEventListener("pointerdown", onDown);
    },
    gui(folder) {
      folder.add(P, "amp", 0, 3, 0.05).name("Intensité");
      folder.add(P, "speed", 0.5, 6, 0.05).name("Vitesse (rad/s)");
      folder.add(P, "duration", 1, 8, 0.1).name("Durée (s)");
      folder.add({ go: () => { phi0 = Math.random() * Math.PI * 2; age = 0; } }, "go").name("Déclencher");
    },
  };
}
