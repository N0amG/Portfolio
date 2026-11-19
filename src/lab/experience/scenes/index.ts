import { createComets } from "./comets";
import { createCompanion } from "./companion";
import { createJets } from "./jets";
import { createFlare, createMotion, createWaves } from "./composite";
import { createDebugElement } from "./debug";
import { createDust } from "./dust";
import { createEruption } from "./eruption";
import { createDeepSky } from "./deepsky";
import { createHud } from "./hud";
import { createCursor } from "./cursor";
import { createRing } from "./ring";
import { createTitle } from "./title";
import type { SceneElement } from "./types";

/**
 * Liste des éléments visuels enregistrés (catalogue de la section 5 bis de SPEC.md).
 * Chaque lot V1–V7 ajoute ici ses éléments : `list.push(createXxx())`, etc.
 */
export function createSceneElements(): SceneElement[] {
  const list: SceneElement[] = [];
  // Lot V1 : effets légers
  list.push(createWaves(), createMotion(), createFlare(), createDust(), createEruption(), createHud(), createComets(), createDeepSky());
  // Lot V2 : lentille et texte
  list.push(createTitle(), createCursor(), createRing());
  // Lot V3 : étoile compagne dévorée + jets
  list.push(createCompanion(), createJets());
  // Élément factice de test : dev uniquement (retiré du build de production), éteint par défaut.
  if (process.env.NODE_ENV !== "production") list.push(createDebugElement());
  return list;
}
