"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";

function RouteReset() {
  const pathname = usePathname();
  const lenis = useLenis();
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [pathname, lenis]);
  return null;
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)", true);

  if (reduce) return <>{children}</>;

  return (
    <ReactLenis root options={{ lerp: 0.1, wheelMultiplier: 1, anchors: true }}>
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
