/**
 * Deux sites, un seul projet :
 * - noamguez.fr      → site freelance (src/app/(site))
 * - lab.noamguez.fr  → lab expérimental (src/app/(lab)/lab), servi via src/proxy.ts
 */
export const MAIN_HOST = "noamguez.fr";
export const LAB_HOST = `lab.${MAIN_HOST}`;

/** Le chemin interne sous lequel vit le lab (invisible depuis lab.noamguez.fr). */
export const LAB_PREFIX = "/lab";

const hostname = (host: string) => host.split(":")[0].toLowerCase();

/** lab.noamguez.fr en production, lab.localhost en local. */
export function isLabHost(host: string): boolean {
  return hostname(host).startsWith("lab.");
}

/** Adresse du lab correspondant à l'hôte de la requête (garde le port en local). */
export function labOrigin(host: string): string {
  return hostname(host).endsWith("localhost") ? `http://lab.${host}` : `https://${LAB_HOST}`;
}
