import { createComets } from "./comets";
import { createCompanion } from "./companion";
import { createJets } from "./jets";
import { createMagnetar } from "./magnetar";
import { createNebula } from "./nebula";
import { createPulsar } from "./pulsar";
import { createFlare, createMotion, createWaves } from "./composite";
import { createDebugElement } from "./debug";
import { createDive, createWhiteHole, createWormhole } from "./finale";
import { createDust } from "./dust";
import { createEruption } from "./eruption";
import { createDeepSky } from "./deepsky";
import { createHud } from "./hud";
import { createCursor } from "./cursor";
import { createDebris } from "./debris";
import { createPlanet } from "./planet";
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
  // (20 · texte en anneau retiré le 19/11/2026 à la demande de Noam ; le module ring.ts reste disponible)
  list.push(createTitle(), createCursor());
  // Lot V3 : étoile compagne dévorée + jets
  list.push(createCompanion(), createJets());
  // Lot V4 : nébuleuse + pulsar
  list.push(createNebula(), createPulsar());
  // Magnétar (S4, ajouté après V4 à la demande de Noam)
  list.push(createMagnetar());
  // Lot V7 : fin du parcours (plongée, trou de ver, point blanc → trou blanc), trois éléments lourds
  list.push(createDive(), createWormhole(), createWhiteHole());
  // Lot V5 : astéroïdes (autour du pulsar) + planète à anneaux (S4 → S5)
  list.push(createDebris(), createPlanet());
  // Élément factice de test : dev uniquement (retiré du build de production), éteint par défaut.
  if (process.env.NODE_ENV !== "production") list.push(createDebugElement());
  return list;
}
