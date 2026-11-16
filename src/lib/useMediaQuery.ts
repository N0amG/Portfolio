"use client";

import { useSyncExternalStore } from "react";

/** Abonnement à une media query, compatible SSR (renvoie `serverValue` côté serveur). */
export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
