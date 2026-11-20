"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { lab } from "@/lab/config";
import { CONTACT_TEXT, TEXTS } from "@/lab/content";
import { createEngine } from "./engine";

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
    return () => {
      alive = false;
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
