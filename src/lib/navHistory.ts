"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/*
 * Mémorise la page précédente lors des navigations internes, pour qu'un bouton
 * « Retour » ramène là d'où l'on vient (et pas toujours au même endroit).
 * Vide après un chargement direct (lien partagé, rechargement) : on n'a alors
 * pas de page précédente sur le site.
 */
let current: string | null = null;
let previous: string | null = null;

/** À monter une fois dans l'arbre (Providers). */
export function RouteTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname === current) return;
    previous = current;
    current = pathname;
  }, [pathname]);
  return null;
}

/** Page interne visitée juste avant la page actuelle, ou null. */
export function getPreviousPath(): string | null {
  return previous;
}
