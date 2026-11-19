import type { FrameParams, SceneContext, SceneElement } from "./types";

/* ───────────────────────────────────────────────────────────
   17 · Curseur gravitationnel (toutes les slides).
   La souris est une petite masse : le shader du trou noir dévie le fond (étoiles, ciel profond, texte géant) autour
   d'elle comme une lentille ponctuelle douce (uniform uLensM ; le disque et l'ombre ne bougent pas). La masse suit la
   souris avec inertie (ressort amorti, léger dépassement) et grossit un peu quand on bouge vite.
   Le curseur natif est remplacé par un petit point (DOM, `.lab-cursor`) qui suit la souris sans retard.
   ─────────────────────────────────────────────────────────── */

export function createCursor(): SceneElement {
  const P = { radius: 0.055, core: 0.02, stiffness: 28, damping: 0.55, boost: 0.6, dot: true };
  let rawX = 0, rawY = 0, x = 0, y = 0, vx = 0, vy = 0, amp = 0, inside = false, seen = false, speed = 0;
  let dot: HTMLDivElement | null = null;
  let root: HTMLElement;
  let active = false;

  const onMove = (e: PointerEvent) => {
    rawX = e.clientX; rawY = e.clientY;
    if (!seen) { x = rawX; y = rawY; seen = true; }
    inside = true;
  };
  const onLeave = () => { inside = false; };

  const showDot = () => {
    const on = active && P.dot;
    root.classList.toggle("lab-nocursor", on);
    if (dot) dot.style.display = on ? "" : "none";
  };

  return {
    id: "curseur",
    label: "17 · Curseur gravitationnel",
    slides: "all",
    cost: "moyen",
    minTier: "basse",
    layers: [],
    init(ctx: SceneContext) {
      root = ctx.root;
      dot = document.createElement("div");
      dot.className = "lab-cursor";
      dot.setAttribute("aria-hidden", "true");
      dot.style.display = "none";
      root.appendChild(dot);
      window.addEventListener("pointermove", onMove);
      document.documentElement.addEventListener("pointerleave", onLeave);
    },
    setActive(a: boolean) {
      active = a;
      showDot();
    },
    update(f: FrameParams) {
      if (!seen) return;
      const dt = Math.min(f.dt, 1 / 30);
      // ressort amorti (en px) : la masse traîne derrière la souris puis la rattrape
      const k = P.stiffness, c = 2 * Math.sqrt(k) * P.damping;
      vx += ((rawX - x) * k - vx * c) * dt;
      vy += ((rawY - y) * k - vy * c) * dt;
      x += vx * dt; y += vy * dt;
      const sp = Math.hypot(vx, vy) / f.height; // hauteurs d'écran par seconde
      speed += (Math.min(sp, 3) - speed) * (1 - Math.exp(-dt * 4));
      amp += ((inside ? 1 : 0) - amp) * (1 - Math.exp(-dt * 3));
      if (dot) dot.style.transform = `translate3d(${rawX}px, ${rawY}px, 0)`;
      if (amp < 0.002) return;
      // position dans le repère uv du shader : y vers le haut, demi-hauteur = 1, x × aspect
      const ux = ((x / f.width) * 2 - 1) * (f.width / f.height), uy = 1 - (y / f.height) * 2;
      const te = P.radius * (1 + P.boost * speed);
      f.bh.lensM.set(ux, uy, te * te * amp * (f.reduced ? 0.7 : 1), P.core);
    },
    render() {},
    dispose() {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      root?.classList.remove("lab-nocursor");
      dot?.remove();
      dot = null;
    },
    gui(folder) {
      folder.add(P, "radius", 0, 0.2, 0.005).name("Rayon d'Einstein");
      folder.add(P, "core", 0.002, 0.08, 0.002).name("Cœur (douceur)");
      folder.add(P, "stiffness", 4, 120, 1).name("Raideur (inertie)");
      folder.add(P, "damping", 0.2, 1.2, 0.05).name("Amortissement");
      folder.add(P, "boost", 0, 2, 0.05).name("Gain à la vitesse");
      folder.add(P, "dot").name("Point à la place du curseur").onChange(showDot);
    },
  };
}
