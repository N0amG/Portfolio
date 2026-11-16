"use client";

import { useEffect, useRef } from "react";

/**
 * Bandeau infini : le défilement est une animation CSS (transform, sur le
 * compositeur). La vitesse et le sens suivent la vélocité du scroll en
 * réglant le playbackRate de cette animation — calculé au scroll, pas à
 * chaque frame.
 */
export default function VelocityMarquee({ items, className }: { items: string[]; className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const anim = track.getAnimations()[0];
    if (!anim) return;

    let lastY = window.scrollY;
    let lastT = performance.now();
    let dir = 1;
    let rate = 1;
    let raf = 0;

    // Retour en douceur vers la vitesse de croisière quand le scroll s'arrête.
    const settle = () => {
      rate += (dir - rate) * 0.08;
      anim.playbackRate = rate;
      raf = Math.abs(rate - dir) > 0.01 ? requestAnimationFrame(settle) : 0;
    };

    const onScroll = () => {
      const now = performance.now();
      const v = (window.scrollY - lastY) / Math.max(1, now - lastT); // px/ms
      lastY = window.scrollY;
      lastT = now;
      if (v > 0.02) dir = 1;
      else if (v < -0.02) dir = -1;
      rate = dir * (1 + Math.min(5, Math.abs(v) * 3));
      anim.playbackRate = rate;
      if (!raf) raf = requestAnimationFrame(settle);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const row = (
    <span className="flex shrink-0">
      {items.map((it, i) => (
        <span key={i} className="flex items-center">
          <span>{it}</span>
          <span aria-hidden className="mx-[0.45em] inline-block h-[0.13em] w-[0.13em] -translate-y-[0.2em] rounded-full bg-accent" />
        </span>
      ))}
    </span>
  );

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className ?? ""}`} aria-hidden>
      <div ref={trackRef} className="marquee-track flex w-max">
        {row}
        {row}
      </div>
    </div>
  );
}
