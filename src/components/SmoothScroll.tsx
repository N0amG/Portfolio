"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * Nouvelle page → haut de page. Sauf pour un retour / une avance du navigateur
 * (popstate) : on laisse la position précédente être restaurée.
 */
function RouteReset() {
  const pathname = usePathname();
  const lenis = useLenis();
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPop = () => {
      fromHistory.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (fromHistory.current) {
      fromHistory.current = false;
      lenis?.resize();
      return;
    }
    // Arrivée sur /#section depuis une autre page : on se place sur la section
    const hash = window.location.hash;
    if (hash.length > 1 && document.querySelector(hash)) {
      const id = window.setTimeout(() => lenis?.scrollTo(hash, { immediate: true, force: true }), 60);
      return () => window.clearTimeout(id);
    }
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [pathname, lenis]);
  return null;
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  // La structure de l'arbre doit rester identique entre le serveur et le client :
  // basculer entre "avec" et "sans" Lenis après l'hydratation démontait et
  // remontait toute la page. On garde donc toujours Lenis, et on coupe
  // seulement le lissage si l'utilisateur préfère réduire les animations.
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  const options = useMemo(
    () => ({ lerp: 0.1, wheelMultiplier: 1, anchors: true, smoothWheel: !reduce }),
    [reduce],
  );

  return (
    <ReactLenis root options={options}>
      <RouteReset />
      {children}
    </ReactLenis>
  );
}

/** Met Lenis en pause pendant qu'une modale est ouverte. */
export function useLenisLock(locked: boolean) {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis) return;
    if (locked) lenis.stop();
    else lenis.start();
    return () => lenis.start();
  }, [locked, lenis]);
}
