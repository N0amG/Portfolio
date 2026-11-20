"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { lab } from "@/lab/config";
import { CONTACT_TEXT, TEXTS } from "@/lab/content";
import { createEngine, type Engine } from "./engine";

/* ───────────────────────────────────────────────────────────
   Expérience du lab : un seul <canvas> fixe + couche DOM (mise en page et accessibilité).
   Le moteur (three.js vanilla) vit hors de React : aucun setState par image.
   ─────────────────────────────────────────────────────────── */

const DEV = process.env.NODE_ENV !== "production";

// Mobile / tablette : écran tactile sans survol → écran « Expérience conçue pour ordinateur ».
const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(TOUCH_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const isTouch = () => window.matchMedia(TOUCH_QUERY).matches;
const onServer = () => null;

// ?diag=1 : diagnostic de performance (aussi en production, pour les retours sur d'autres machines)
const noop = () => () => {};
const wantsDiag = () => new URLSearchParams(window.location.search).get("diag") === "1";
function formatDiag(d: ReturnType<Engine["diag"]>) {
  const pct = (r: number) => `${Math.round(r * 100)} %`;
  const q = d.quality;
  const c = q.calib;
  const lines = [
    `GPU      ${d.gpu.name}${d.gpu.unmasked ? "" : " (nom masqué par le navigateur)"}`,
    `         ${d.gpu.vendor} · ${d.gpu.raw}`,
    `ext      timer GPU ${d.ext.timer ? "oui" : "non"} · compilation parallèle ${d.ext.parallel ? "oui" : "non"}`,
    `qualité  ${d.tier} · ${d.auto ? "auto" : "manuelle"} · ${q.step} · trou noir ${pct(d.res)} de la sortie` +
      (q.blocked ? ` · ${q.blocked} état(s) en attente` : ""),
    `sortie   ${d.output} · trou noir ${d.internal} · écran ${d.screen} · dpr ${d.dpr}`,
    `images   ${d.frames.fps.toFixed(0)} fps · moy. ${d.frames.avgMs.toFixed(1)} ms · pire ${d.frames.worstMs.toFixed(1)} ms (2 s)`,
    `mesure   ${q.last.ms ? `${q.last.ms.toFixed(2)} ms ${q.last.gpu ? "GPU (médiane 2 s)" : "entre images (médiane 2 s, sans timer GPU)"}` : "—"}`,
    `slide    s = ${d.slide.toFixed(2)} · moyens actifs : ${d.active.join(", ") || "aucun"} · décor ${d.decor}`,
    `shaders  ${d.warm.ms < 0 ? "précompilation en cours…" : `${d.warm.programs} programmes prêts en ${d.warm.ms} ms`}`,
  ];
  if (c) {
    lines.push(
      `calib.   ${c.tier} ${c.lines ? `${c.lines}p` : "écran"}${c.res < 0.999 ? ` · trou noir ${pct(c.res)}` : ""} en ${c.ms} ms (${c.gpuTimed ? "temps GPU" : "images synchronisées"}) · ${c.why} · ${c.hints.cores} cœurs, ${c.hints.mem} Go`,
      // points de mesure du test (pas l'état choisi, qui est sur la ligne « qualité » / « sortie »)
      ...c.tried.map((t) => `         test ${t.tier} : ${t.msFull} ms à l'écran, ${t.msSmall} ms en ${t.small.replace(/^\S+ /, "")}`),
    );
  }
  if (d.quality.events.length) lines.push("journal", ...d.quality.events.map((e) => `         ${e}`));
  return lines.join("\n");
}

export default function Experience() {
  const touch = useSyncExternalStore(subscribe, isTouch, onServer);
  if (touch === null) return <div className="lab-void" />;
  return touch ? <DesktopOnly /> : <Scene />;
}

function DesktopOnly() {
  return (
    <main className="lab-desktop-only">
      <p className="mono">lab.noamguez.fr</p>
      <h1>Expérience conçue pour ordinateur</h1>
      <p>Ouvrez cette page sur un ordinateur, avec une souris ou un trackpad.</p>
      <a href={lab.mainUrl} className="mono">
        Voir noamguez.fr →
      </a>
    </main>
  );
}

function Scene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const letters = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLDivElement>(null);
  const fps = useRef<HTMLElement>(null);
  const res = useRef<HTMLSpanElement>(null);
  const gpu = useRef<HTMLSpanElement>(null);
  const qual = useRef<HTMLSpanElement>(null);
  const diag = useRef<HTMLPreElement>(null);
  const showDiag = useSyncExternalStore(noop, wantsDiag, () => false);

  useEffect(() => {
    const engine = createEngine(
      {
        canvas: canvas.current!,
        page: page.current!,
        letters: letters.current!,
        hint: hint.current!,
        count: count.current!,
        hud: DEV ? { fps: fps.current!, res: res.current!, gpu: gpu.current!, qual: qual.current! } : undefined,
      },
      TEXTS,
      CONTACT_TEXT,
    );
    let unmountDev: (() => void) | undefined;
    let alive = true;
    if (DEV) {
      import("./devtools").then((m) => {
        if (alive) unmountDev = m.mountDevtools(engine);
      });
    }
    engine.start();
    // ?diag=1 (production comprise) : overlay de diagnostic, rafraîchi 4 fois par seconde hors de la boucle de rendu
    let diagTimer: number | undefined;
    if (diag.current) {
      const el = diag.current;
      diagTimer = window.setInterval(() => (el.textContent = formatDiag(engine.diag())), 250);
    }
    return () => {
      alive = false;
      window.clearInterval(diagTimer);
      unmountDev?.();
      engine.destroy();
    };
  }, []);

  return (
    <>
      <canvas ref={canvas} className="lab-gl" />
      <div ref={page} className="lab-page" />
      <div ref={letters} className="lab-letters glyph" role="region" aria-live="polite" />
      {DEV && (
        <div className="lab-hud mono">
          fps <b ref={fps}>—</b>
          <br />
          <span ref={res}>—</span>
          <br />
          <span ref={gpu}>—</span>
          <br />
          <span ref={qual}>—</span>
        </div>
      )}
      {showDiag && <pre ref={diag} className="lab-diag mono" aria-hidden="true" />}
      <div className="lab-brand mono">Noam Guez — lab</div>
      <div ref={hint} className="lab-hint mono">
        Scroll →
      </div>
      <div ref={count} className="lab-count mono">
        01 / 10
      </div>
    </>
  );
}
