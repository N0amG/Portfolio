import type * as THREE from "three";
import type GUI from "lil-gui";
import type { TierName } from "../quality";

/* ───────────────────────────────────────────────────────────
   Registre de scènes : interface commune des éléments visuels (catalogue de la section 5 bis).

   Points d'insertion dans le pipeline du moteur :
     étoiles ─▶ [back] ─▶ lettres ─▶ [sky] ─▶ trou noir ─▶ bloom ─▶ composition (+ CompositeParams) ─▶ [front]
   - "sky"   : fond échantillonné par le shader du trou noir, donc courbé par la lentille (10, 18, nébuleuses
               lointaines). Cible équirectangulaire SKY_W×SKY_H (HalfFloat, additive, effacée à chaque image) :
               uv.x = longitude (atan(d.z, d.x) / 2π + 0.5), uv.y = latitude (asin(d.y) / π + 0.5), repère monde.
   - "back"  : derrière le trou noir, pleine résolution (même cible que les étoiles aspirées, additive) :
               composé avec la transmission du trou noir, donc caché par l'ombre et le disque.
   - "front" : par-dessus l'image finale, directement à l'écran (après tonemapping et grain).
   Les effets de composition (12, 13, 14) n'ont pas de couche : ils écrivent dans `f.composite` pendant update().
   ─────────────────────────────────────────────────────────── */

export type Cost = "leger" | "moyen" | "lourd";
export type Layer = "sky" | "back" | "front";

// 2048×1024 depuis le lot V1 (la galaxie, 10, y est trop floue à 1024×512 : ~3 px par degré contre ~22 à l'écran).
export const SKY_W = 2048;
export const SKY_H = 1024;

/** Paramètres des passes de composition, remis à zéro à chaque image avant les update(). */
export interface CompositeParams {
  /** 12 · ondes gravitationnelles : jusqu'à 4 anneaux (x, y = centre NDC, z = rayon NDC, w = amplitude ; w = 0 : inactif). */
  waves: THREE.Vector4[];
  /** 13 · flou de mouvement : déplacement apparent pendant l'obturation, en NDC (x et y). */
  motion: THREE.Vector2;
  /** 13 · aberration chromatique (0 = aucune). */
  chroma: number;
  /** 14 · reflets anamorphiques (0 = aucun). */
  flare: number;
}

/** Paramètres transmis au shader du trou noir (remis à zéro à chaque image comme `composite`). */
export interface BlackholeParams {
  /** 16 · éruption du disque : x = azimut de départ (rad), y = âge (s), z = vitesse angulaire signée (rad/s), w = amplitude (0 = inactif). */
  erupt: THREE.Vector4;
  /** 17 · curseur gravitationnel : xy = position (repère uv du shader : y vers le haut, x × aspect), z = θE², w = rayon du cœur (z = 0 : inactif). */
  lensM: THREE.Vector4;
  /** 18 · texte géant de fond : plan échantillonné à travers les rayons courbés (voir title.ts). a2.w = intensité (0 : inactif). */
  title: {
    tex: { value: THREE.Texture | null };
    /** Centre du plan moins la position de la caméra (monde). */
    o: THREE.Vector3;
    /** Normale du plan (unitaire). */
    n: THREE.Vector3;
    /** Axes du plan divisés par la demi-largeur / demi-hauteur (uv = dot(p, a) × 0,5 + 0,5). */
    a1: THREE.Vector4;
    a2: THREE.Vector4;
  };
}

/** Ressources partagées, fournies une fois à init(). */
export interface SceneContext {
  /** Conteneur DOM du lab (pour les éléments DOM, ex. le HUD scientifique). */
  root: HTMLElement;
  renderer: THREE.WebGLRenderer;
  /** Caméra perspective de la scène (même pose et même projection que le texte et le trou noir). */
  camera: THREE.PerspectiveCamera;
  /** Caméra orthographique (-1..1) pour les passes plein écran (géométrie : triangle avec FS_VERT). */
  ortho: THREE.OrthographicCamera;
  /** Image du trou noir (résolution interne) : alpha = transmission vers le fond (0 dans l'ombre et derrière le disque). */
  bhTex: THREE.Texture;
}

/** État de l'image, recalculé à chaque frame (lecture seule pour les éléments, sauf `composite`). */
export interface FrameParams {
  /** Position de la caméra en slides (0 = S1). */
  s: number;
  /** Slide de l'élément la plus proche de s, et son poids : 1 posé dessus, 0 au bord de la fenêtre (±1 slide). */
  slide: number;
  weight: number;
  dt: number;
  time: number;
  camPos: THREE.Vector3;
  camF: THREE.Vector3;
  camR: THREE.Vector3;
  camU: THREE.Vector3;
  viewProj: THREE.Matrix4;
  /** Centre du trou noir à l'écran (px CSS) et en NDC ; rayon apparent de l'ombre (NDC vertical). */
  bhScreen: THREE.Vector2;
  bhNdc: THREE.Vector2;
  rhNdc: number;
  /** Souris lissée (-1..1). */
  mouse: THREE.Vector2;
  width: number;
  height: number;
  dpr: number;
  /** Qualité automatique : true = décor léger à réduire (moins de particules, etc.). */
  reduced: boolean;
  composite: CompositeParams;
  bh: BlackholeParams;
}

export interface SceneElement {
  /** Identifiant court, ex. "galaxie" ; numéro du catalogue dans le libellé, ex. "10 · Galaxie spirale". */
  id: string;
  label: string;
  /** Slides actives (0-based, utiliser S(n) de timeline.ts) ou "all" (effets présents partout). */
  slides: readonly number[] | "all";
  cost: Cost;
  /** Niveau de qualité minimal : "basse" = toujours, "moyenne" = moyenne et haute, "haute" = haute seulement. */
  minTier: TierName;
  layers: readonly Layer[];
  /** Interrupteur initial (false pour un élément de test). */
  enabledByDefault?: boolean;
  /** Création des ressources GPU (appelé une fois au démarrage du moteur). */
  init(ctx: SceneContext): void;
  /** Uniquement quand l'élément est actif (dans sa fenêtre, retenu par le budget). */
  update(f: FrameParams): void;
  /** Optionnel : appelé quand l'élément devient actif ou inactif (interrupteur, fenêtre, budget), pour les éléments DOM. */
  setActive?(active: boolean): void;
  /** Une fois par couche déclarée ; la cible et autoClear = false sont déjà réglés par le moteur. */
  render(layer: Layer, ctx: SceneContext): void;
  dispose(): void;
  /** Réglages de dev propres à l'élément (le dossier et l'interrupteur sont créés par devtools). */
  gui?(folder: GUI): void;
}
