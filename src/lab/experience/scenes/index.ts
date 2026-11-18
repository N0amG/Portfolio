import { createComets } from "./comets";
import { createFlare, createMotion, createWaves } from "./composite";
import { createDebugElement } from "./debug";
import { createDust } from "./dust";
import { createEruption } from "./eruption";
import { createGalaxy } from "./galaxy";
import { createHud } from "./hud";
import type { SceneElement } from "./types";

/**
 * Liste des éléments visuels enregistrés (catalogue de la section 5 bis de SPEC.md).
 * Chaque lot V1–V7 ajoute ici ses éléments : `list.push(createGalaxy())`, etc.
 */
export function createSceneElements(): SceneElement[] {
  const list: SceneElement[] = [];
  // Lot V1 : effets légers
  list.push(createWaves(), createMotion(), createFlare(), createDust(), createEruption(), createHud(), createComets(), createGalaxy());
  // Élément factice de test : dev uniquement (retiré du build de production), éteint par défaut.
  if (process.env.NODE_ENV !== "production") list.push(createDebugElement());
  return list;
}
