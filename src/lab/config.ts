import { LAB_HOST, MAIN_HOST } from "@/lib/hosts";

/**
 * Lab (lab.noamguez.fr) : le portfolio expérimental, pour les développeurs.
 * Tout ce qui lui est propre vit ici (src/lab) et dans src/app/(lab)/lab :
 * rien n'est partagé avec le site freelance (src/app/(site), src/components).
 */
export const lab = {
  name: "Noam Guez — Lab",
  url: `https://${LAB_HOST}`,
  mainUrl: `https://${MAIN_HOST}`,
  description: "Le laboratoire de Noam Guez : prototypes, interactions et expériences web.",
  /** Passer à true à l'ouverture pour laisser Google indexer le lab. */
  indexable: false,
} as const;
