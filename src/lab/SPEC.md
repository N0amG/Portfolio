# Lab — « Trou noir » : spec et storyboard

> Document de référence de l'expérience `lab.noamguez.fr`. Toute session de travail sur le lab commence par lire ce fichier.
> On ne change pas la direction artistique en cours de phase : les retours sont regroupés en fin de phase.

## 1. Intention

Portfolio **d'expérience**, pas de fonctionnalité, au niveau des sites primés type Awwwards. Lisibilité secondaire, **fluidité prioritaire** (60 fps). Tout se joue au scroll, sur un fond 3D permanent : un trou noir dans l'espace.

- Inspiration site : https://www.5lab.co/
- Référence trou noir : https://cdn8.futura-sciences.com/a1280/images/actu/trou-noir-nasa.jpg
- Référence trou blanc : https://upload.wikimedia.org/wikipedia/commons/6/61/White_hole_artistic_recreation-bpk.jpg
- Esprit visuel : Gargantua (Interstellar), avec un disque d'accrétion en plasma incandescent, une lumière courbée par la gravité et un anneau de photons.

## 2. Périmètre v1

**Dedans :**
- Ordinateur uniquement : souris et molette/trackpad.
- Préchargement « supernova ».
- Accueil trou noir et sections de texte aspirées.
- Plongée par le trou de ver jusqu'au trou blanc.
- Contact.
- Ambiance sonore.
- Easter egg (dernière phase).

**Hors v1 :**
- Mobile/tablette : afficher un écran sobre « Expérience conçue pour ordinateur » avec un lien vers noamguez.fr.
- Version allégée.
- Projets cliquables (ils sont décoratifs en v1).
- Écran de choix noamguez.fr / lab, ou bouton de passage depuis le site classique (ça concerne le site principal, plus tard).
- Bouton « Mode classique » : **aucun** dans le lab.

## 3. Architecture (existante, à respecter)

- `lab.noamguez.fr/x` est servi par `src/app/(lab)/lab/x` via `src/proxy.ts`. En local : `lab.localhost:3000`.
- Le lab a son layout racine (`src/app/(lab)/lab/layout.tsx`) et son CSS (`lab.css`). **Rien n'est partagé avec le site freelance** : pas d'import depuis `src/app/(site)` ni `src/components`. Le code du lab vit dans `src/lab/`.
- L'expérience remplace la page « en construction » de `src/app/(lab)/lab/page.tsx`. La DA terminal verte actuelle (`#b6f36a`) disparaît.
- `lab.indexable` reste à `false` jusqu'à l'ouverture.
- Stack déjà présente : Next 16, React 19, Tailwind 4, Lenis. À ajouter : `three` (vanilla, sans react-three-fiber) et `gsap` (tweens + `Observer` pour les gestes ; plus de ScrollTrigger, voir « Navigation par keyframes » en section 6).

**Organisation proposée :**
```
src/lab/
  config.ts            (existant)
  SPEC.md              (ce fichier)
  content.ts           phrases sélectionnées (copiées, pas importées du site)
  fonts/               woff2 auto-hébergés + LICENSES.txt
  experience/
    Experience.tsx     client component : un seul <canvas> fixe + couche DOM texte
    engine.ts          renderer, boucle, DPR adaptatif, pause onglet caché
    timeline.ts        keyframes + transitions animées -> paramètres de scène (source unique)
    shaders/           blackhole.frag, stars.vert/frag, ...
    text/              découpage en lettres + physique d'aspiration
    audio/             moteur Web Audio procédural
    game/              easter egg (chargé à la demande)
prototypes/black-hole.html   prototype autonome de la phase 0 (hors build)
```

**Principe clé :** `timeline.ts` traduit la progression globale de l'expérience (0 → 1, animée de keyframe en keyframe, et non plus liée à la position du scroll) en paramètres nommés (`collapse`, `dive`, `whiteness`, `whiteHole`…). Le shader, le texte et l'audio lisent ces mêmes paramètres, sans aucune autre source de vérité.

## 4. Direction artistique

**Palette**

| Rôle | Couleur |
|---|---|
| Vide | `#000000` |
| Cœur du disque | `#fff4e0` |
| Ambre | `#ffb347` |
| Orange plasma | `#ff5a1f` |
| Bord rouge | `#8a1a05` |
| Texte | `#f2efe8` (blanc cassé) |
| Trou blanc | `#ffffff` |
| Horizon bleu | `#7fd6ff` |
| Bleu profond | `#1b4dff` |

**Typographie** (auto-hébergée, SIL OFL, via `next/font/local`, sur le modèle de `src/app/(site)/layout.tsx`) :
- **Syne** (variable 400–800) pour le nom et les grands titres : large, très « award ».
- **JetBrains Mono** pour les micro-libellés façon HUD (coordonnées, % de scroll, état du son).
- Alternative plus poétique : *Instrument Serif* + *Geist Mono*.
- À différencier du site classique (Fraunces + Manrope).

**Matières**
- Grain de film léger.
- Bloom sur le disque.
- Aberration chromatique uniquement pendant la plongée.
- Aucun élément d'interface « carte » : le texte flotte dans l'espace.

## 5. Storyboard

**Navigation par keyframes (décision du 18/11/2026, remplace le scroll continu).** L'expérience n'est plus une longue page scrollée : c'est une suite d'écrans clés. **Un geste de scroll = une keyframe.** Le geste lance l'animation de transition, qui se joue **à sa propre vitesse, indépendamment du scroll**. Les gestes reçus pendant la transition sont ignorés. À la fin, on est posé sur la keyframe suivante. Le geste inverse ramène à la keyframe précédente. Les pourcentages ci-dessous ne sont plus des positions de scroll : ils donnent l'ordre des séquences et leur poids dans la progression globale. Le découpage précis en keyframes se fait en phase 2 (textes) et en phase 3 (plongée → trou blanc). Détails techniques : section 6, « Navigation par keyframes ».

### P — Préchargement « supernova » (automatique, ~4 s, avant le scroll)

Il sert aussi d'écran de chargement des assets. Séquence fidèle à une supernova à effondrement de cœur :
1. Une étoile bleutée pulse.
2. Le cœur **implose** : l'étoile se contracte et devient plus brillante.
3. Rebond : **flash** et onde de choc sphérique, les couches externes sont éjectées en nébuleuse.
4. Le reste s'effondre en **trou noir**. Les débris s'enroulent autour et **allument le disque d'accrétion**, ce qui donne exactement le décor de l'accueil.
5. Apparaît « Entrer » (mono, discret). Le clic **active le son**, car les navigateurs l'exigent, et libère le scroll.

Si la séquence a déjà été vue dans la session (`sessionStorage`), elle est raccourcie à ~1 s. Une touche/clic permet de la passer.

### 0–5 % — Accueil

- Trou noir plein écran : disque en rotation lente permanente, lentille gravitationnelle, anneau de photons. Le côté qui s'approche du spectateur est plus brillant (effet Doppler).
- **Étoiles du fond aspirées en continu** et spaghettifiées : elles s'étirent en traits vers l'horizon, puis disparaissent, et de nouvelles naissent en bordure. Le fond n'est jamais vide.
- « Noam Guez » en Syne, avec une ligne d'intitulé et un indicateur de scroll en mono.

### 5–55 % — Textes aspirés

- 6 à 8 blocs de phrases tirées du portfolio classique (`content.ts`). **Chaque bloc est une keyframe** : il est posé à l'écran, lisible.
- Au geste de scroll suivant, le bloc **se désassemble lettre par lettre** :
  1. **Explosion** : les lettres partent dans des directions opposées, avec rotation.
  2. Elles suivent ensuite une **trajectoire gravitationnelle en spirale** : vitesse tangentielle, accélération vers le centre, étirement à l'approche.
  3. Elles s'éteignent sur l'horizon.
- L'animation est **jouée en temps, pas pilotée par le scroll**. Une fois le bloc aspiré, la transition enchaîne d'elle-même sur le bloc suivant (nouvelle keyframe). Si on remonte d'un cran, l'animation inverse fait revenir les lettres sur la keyframe précédente.

### 55–62 % — Silence

Plus de texte, le trou noir est seul. La caméra s'approche lentement et le son monte.

### 62–75 % — Plongée / trou de ver

On traverse l'anneau de photons : traînées de lumière, tunnel déformé (le **trou de ver**, qui relie le trou noir au trou blanc), aberration chromatique croissante. Puis **noir total** et silence brutal.

### 75–80 % — Point blanc

Un point blanc apparaît au centre, puis grandit jusqu'à **remplir l'écran en blanc**.

### 80–90 % — Trou blanc

Dézoom (le reverse visuel de la plongée) qui révèle un **trou blanc à horizon bleu**. La matière est **éjectée** vers l'extérieur, et deux jets polaires façon quasar apparaissent (le quasar est intégré ici, sans scène en plus).

### 90–100 % — Contact

Sur le trou blanc : `contact@noamguez.fr` (copie au clic), liens, retour vers noamguez.fr.

### Au-delà de 100 % — Easter egg

Un indice discret en mono (« continuer ? »). Un geste de scroll de plus (keyframe supplémentaire) **débloque un mini-jeu** : on est un trou noir qui suit la souris, on avale des étoiles, on grossit, et il faut éviter certains obstacles (à définir). Ce mécanisme est original : pas de recréation d'un jeu existant. Le code est chargé à la demande (`import()` dynamique).

## 5 bis. Plan visuel v2 (décision du 18/11/2026)

Noam veut **un maximum d'effets visuels avant les textes**. Les 20 idées ci-dessous sont **toutes retenues**. Les vrais textes, le son, le contact et l'ouverture viennent après.

### Catalogue (numéros de référence)

Légende : coût GPU 🟢 léger · 🟠 moyen · 🔴 lourd.

| # | Élément | GPU | Description |
|---|---|---|---|
| 1 | Supernova | 🔴 | Préchargement : l'étoile pulse, le cœur implose, flash et onde de choc, éjection en nébuleuse, puis le reste s'effondre en trou noir et allume le disque. |
| 2 | Plongée + trou de ver | 🔴 | On traverse l'anneau de photons : traînées de lumière, tunnel déformé, aberration chromatique croissante, puis noir total. |
| 3 | Point blanc → trou blanc | 🔴 | Un point blanc grandit jusqu'à l'écran blanc, puis dézoom sur un trou blanc à horizon bleu : matière éjectée et jets façon quasar. |
| 4 | Nébuleuses | 🟠 | Volumes de gaz colorés (fBm raymarché à basse résolution, ou couches de billboards bruités), avec une teinte propre à chaque slide. |
| 5 | Étoile compagne dévorée | 🟠 | Étoile voisine dont la matière est arrachée en filament (débordement du lobe de Roche) et spirale jusque dans le disque. |
| 6 | Pulsar | 🟠 | Étoile à neutrons avec deux faisceaux coniques tournants, comme un phare, et un halo. |
| 7 | Planète à anneaux | 🟠 | Au premier plan, elle défile pendant un mouvement de caméra (effet de profondeur), éclairée par le disque. |
| 8 | Astéroïdes / débris | 🟢 | Rochers instanciés en orbite, avec rotation propre. |
| 9 | Comètes | 🟢 | Elles traversent l'écran avec leur queue et finissent aspirées. |
| 10 | Galaxie spirale de fond | 🟢 | Placée dans le fond échantillonné par le shader : elle est courbée par la lentille gravitationnelle. |
| 11 | Jets relativistes | 🟠 | Deux jets polaires du trou noir, visibles surtout en vue de dessous. |
| 12 | Ondes gravitationnelles | 🟢 | À chaque changement de slide, des anneaux de distorsion partent du trou noir et traversent l'écran (passe de composition). |
| 13 | Flou de mouvement + aberration chromatique | 🟢 | Pendant les mouvements de caméra, proportionnels à la vitesse. |
| 14 | Reflets anamorphiques | 🟢 | Longues traînées horizontales sur les sources très brillantes (côté Doppler du disque, pulsar, supernova). |
| 15 | Poussière au premier plan | 🟢 | Particules sur 2 ou 3 couches de profondeur, en parallaxe avec la caméra et la souris. |
| 16 | Éruption du disque au clic | 🟢 | Sursaut local de plasma qui fait le tour du disque, puis s'éteint. |
| 17 | Curseur gravitationnel | 🟠 | La souris est une petite masse qui courbe légèrement la lumière du fond autour d'elle. |
| 18 | Texte géant de fond | 🟠 | Grand texte en contour placé **derrière** le trou noir, dans le fond échantillonné, et tordu par la lentille. C'est la signature du site. |
| 19 | HUD scientifique | 🟢 | Coordonnées, masse, distance, décalage vers le rouge et vitesse de rotation défilent en mono, avec des valeurs propres à chaque slide. |
| 20 | Texte en anneau | 🟢 | Une phrase disposée en anneau qui orbite autour du trou noir, cachée en partie par l'ombre. |

### Parcours v2 (keyframes)

Ce parcours remplace les pourcentages de la section 5. Chaque slide garde son bloc de texte provisoire. Les arrêts de caméra continuent d'alterner au-dessus et au-dessous du disque.

| Étape | Scène | Éléments propres |
|---|---|---|
| P | Préchargement | 1 |
| S1 | Accueil, vue de base | 10, 18 |
| S2 | Dessous, à gauche | 5 |
| S3 | Dessus, à droite | 4, 9 |
| S4 | Dessous | 6, 8 |
| S5 | Dessus, la planète traverse le premier plan pendant l'arrivée | 7, 11 |
| S6 | Approche : le trou noir seul et grand, sans texte | 20 |
| S7 | Plongée | 2 |
| S8 | Point blanc | 3 (début) |
| S9 | Trou blanc | 3 |
| S10 | Contact | (phase ultérieure) |
| + | Easter egg | (phase ultérieure) |

**Effets présents partout :** 12, 13, 14, 15, 16, 17, 19.

### Règles de performance

- **Un registre de scènes.** Chaque élément est un module avec la même interface : `init`, `update(params)`, `render`, `dispose`. Il déclare :
  - **ses slides actives**, et n'est ni mis à jour ni rendu hors de sa fenêtre (sa slide ± la transition) ;
  - **son coût** et **le niveau de qualité minimal** à partir duquel il est activé.
- **Jamais plus d'un élément 🔴 actif à la fois.** Les éléments 🟠 sont limités à 2 simultanés en plus du trou noir.
- **Ordre de dégradation de la qualité automatique :** on coupe d'abord les décors 🟠, ensuite on réduit les décors 🟢, et seulement ensuite on baisse la résolution du trou noir.
- **Lentille gratuite :** tout ce qui doit être courbé (10, 18, nébuleuses lointaines) va dans le fond échantillonné par le shader du trou noir, pas en géométrie à part.
- **Chaque élément a son dossier dans le panneau de réglages** (en dev), avec un interrupteur pour mesurer son coût seul.

## 6. Rendu 3D (choix techniques)

**Trou noir et trou blanc**
- Un **fragment shader plein écran** fait du raymarching avec une courbure de rayons de type Schwarzschild approximée.
- Le disque est procédural (bruit fBm qui défile en rotation), avec beaming Doppler et anneau de photons. Le fond étoilé est échantillonné *à travers* les rayons courbés : la lentille est gratuite.
- Le trou blanc est le même shader avec des uniforms différents : palette bleue, flux inversé, jets.

**Étoiles aspirées**
- Une couche de particules instanciées : quads étirés selon la vitesse, mise à jour sur le GPU (shader de vertex, pas de boucle JS par étoile), respawn en bordure.

**Supernova**
- Shader dédié : sphère bruitée, puis onde de choc, puis nébuleuse de particules qui retombent dans le disque.

**Lettres**
- Texte posé : couche DOM (`<span>` par lettre, `transform` + `opacity` uniquement), au-dessus du canvas. Il reste net et accessible.
- **Dès qu'une lettre se détache, elle passe dans le canvas WebGL**, au pixel près, pour pouvoir être déformée. Le détail est dans « Acquis du prototype » ci-dessous.
- La physique est calculée en JS et appliquée dans la boucle de rendu commune (pas de setState React par frame).
- Au plus ~600 lettres actives à la fois.

**Post-traitement**
- Bloom maison léger, grain, aberration chromatique (plongée uniquement).

**Performance**
- Cible : 60 fps sur un GPU moyen d'ordinateur (type GTX 1660 / Apple M1).
- Le shader principal tourne à une résolution interne de 0.3 à 1, **choisie automatiquement selon le matériel**, puis mis à l'échelle en bicubique. Voir « Qualité automatique » dans les acquis ci-dessous.
- Rendu en pause quand l'onglet est caché.
- `prefers-reduced-motion` : image fixe et texte qui apparaît en fondu, sans explosion.

**Navigation par keyframes** (remplace le scroll continu, voir section 5)
- Pas de scroll natif : la page ne défile pas (`overflow: hidden`), Lenis est inutile pour le lab. Les gestes sont captés par GSAP `Observer` : molette, trackpad et clavier (flèches, Espace, Page suivante/précédente).
- Un geste = un pas, en avant ou en arrière, quelle que soit son amplitude. Règle validée sur le prototype : un nouveau geste ne commence qu'après **≥ 220 ms sans événement molette**. Tant que les événements s'enchaînent (scroll long, inertie du trackpad), c'est le même geste. Un geste qui commence pendant une transition est consommé et perdu, sans file d'attente. Les touches répétées (`repeat`) sont ignorées.
- `timeline.ts` décrit la liste des keyframes. Chaque transition est une animation GSAP, avec sa durée et ses courbes, qui fait avancer la progression globale et les paramètres de scène. Le shader, le texte et l'audio lisent toujours ces mêmes paramètres.
- Ce système libère la mise en scène : chaque transition a son propre rythme, sans dépendre de la vitesse de scroll de l'utilisateur.
- Une seule boucle `requestAnimationFrame` pilote tout.
- `prefers-reduced-motion` : transitions courtes en fondu.
- Le prototype de la phase 0 applique déjà ce système, avec 4 blocs de texte provisoires et une slide finale vide.
- **Transition horizontale par la caméra (décision du 18/11/2026).** Une seule valeur est animée : `cam.s`, la position de la caméra en slides, sur ≈ 3,2 s avec une courbe en douceur.
  - **Caméra :** `cameraPose(s)`.
    - **Trajectoire du schéma de Noam : un arrêt par slide** (`KEYS` : azimut, hauteur par rapport au plan du disque, distance, décalage de visée) :

      On **commence toujours sur la vue de base** (au-dessus du disque), puis on **alterne dessus / dessous** à chaque slide :

      | Arrêt | Position | Visée |
      |---|---|---|
      | 1 | vue de base, au-dessus du disque | — |
      | 2 | dessous, à gauche | le trou noir est à droite du cadre |
      | 3 | dessus, à droite | le trou noir est à gauche du cadre |
      | 4 | dessous | regarde vers le haut |
      | 5 (slide vide) | retour à la vue de base | — |
    - Entre deux arrêts, la caméra décrit une **boucle vers l'extérieur**, qui traverse le plan du disque :
      - un écart perpendiculaire au trajet, côté opposé au trou noir, d'ampleur `BULGE = 0,9 ×` la longueur du trajet ;
      - un recul de 32 % au milieu de la boucle ;
      - une inclinaison de la caméra dans le virage (`ROLL = 0,14 rad`).
    - Le centre du trou noir est projeté à l'écran à chaque image, ce qui recale les étoiles aspirées, la lentille et la spirale des lettres. Le rayon de l'ombre suit la distance.
  - **Texte en vraie 3D :** tout le texte est rendu en WebGL ; le DOM ne sert plus qu'à la mise en page et à l'accessibilité.
    - Chaque bloc est un plan posé dans la scène, face à la caméra de SA slide, à 7 unités devant elle (le trou noir est à 22).
    - Depuis sa slide, il occupe exactement sa place de mise en page. Quand la caméra bouge, on le voit sous un autre angle, avec la perspective d'un moteur 3D (projection par la même matrice que la scène).
  - **Désintégration :**
    - Avec `d = cam.s − n° du bloc`, elle commence passé `d > 0,1`, côté droit d'abord (c'est lui qui reste le plus longtemps dans le cadre).
    - Chaque lettre passe en douceur de sa position 3D projetée à la physique écran, via un mélange par sommet `iD.x`.
    - **Pas d'explosion pour l'instant** (`explosion = 0`) : les lettres sont aspirées une par une directement en spirale. Les forces de marée, la lentille et la déformation à la souris restent. L'explosion reste disponible : un réglage > 0 la réactive, 1,93 était l'ancien réglage validé.
  - **Bloc suivant :** il arrive par la droite (fondu entre `d = −0,45` et `−0,15`).
  - **Retour :** c'est l'exact inverse.
  - **Gestes :** la molette verticale, le glissé horizontal et les flèches ←/→ ou ↑/↓ font tous avancer ou reculer.

**Acquis du prototype (phase 0, `prototypes/black-hole.html`, validé par Noam)**

C'est la référence à porter en phase 1 : les shaders et la logique se reprennent tels quels.
- **Réglages validés** :

  | Réglage | Valeur |
  |---|---|
  | Vitesse du disque | 4 |
  | Intensité du plasma | 1,28 |
  | Couleur du plasma | `#ff5a1f` |
  | Aspiration des étoiles | 0,46 |
  | Explosion des lettres | 1,93 |
  | Doppler | 0,95 |
  | Bloom | 0,6 |
  | Grain | 0,11 |
  | Caméra | à 22 rayons de Schwarzschild, élévation 0,13 rad, demi-champ vertical tan = 0,42 |
  | Parallaxe souris | ±0,05 rad en azimut, ±0,025 rad en élévation |
- **Trou noir** :
  - Le pas d'intégration vaut `uStepK × r`.
  - Les rayons lointains (paramètre d'impact > 15) ne sont pas raymarchés : on applique la déviation analytique du champ faible.
  - Les autres rayons sortent du raymarching à r > 16, et la fin de leur déviation est calculée analytiquement.
  - Le disque garde deux phases de bruit en fondu enchaîné (période 40) pour éviter un cisaillement infini.
  - La passe écrit dans son alpha la **transmission** vers le fond (0 dans l'ombre), qui sert à composer ce qui est derrière.
- **Étoiles aspirées et lettres en pleine résolution** : elles sont composées dans la passe finale, avec la transmission du trou noir. Elles restent nettes même quand le trou noir est rendu à basse résolution.
- **Lettres détachées en WebGL** :
  - **Rendu :**
    - On construit un atlas de glyphes à partir de la police DOM, avec la même ligne de base.
    - Chaque lettre est une grille de 10×10 cases instanciée, qui reproduit le transform CSS.
    - Deux instances par lettre : l'image primaire et l'image secondaire, de l'autre côté de l'anneau.
  - **Déformation** (vertex shader), modulée par l'« absorption » de chaque lettre (0 pendant l'explosion, 1 quand elle est aspirée) :
    1. Marée : rotation différentielle qui courbe la lettre le long de sa spirale, plus un étirement radial.
    2. Lentille ponctuelle, θ = (β + √(β² + 4θE²)) / 2, avec θE = 1,15 × le rayon de l'ombre.
    3. Parallaxe souris (déformation au passage de la souris), seulement pendant l'absorption.
  - **Composition :**
    - Les lettres sont composées après le tonemapping, en `#f2efe8` exact.
    - Plus une lettre est absorbée, plus elle passe derrière le disque et dans l'ombre.
- **Qualité automatique** (remplace le simple « DPR adaptatif ») :
  1. **Indices matériels** : nom du GPU via `WEBGL_debug_renderer_info`, nombre de cœurs, mémoire. Avec un GPU intégré ou une petite machine, on démarre en qualité moyenne ; avec un rendu logiciel, en qualité basse.
  2. **Mini-test au chargement** (≈ 50 à 300 ms, à cacher dans le préchargement supernova) : deux mesures synchrones, à 0,6 et 0,35 de résolution. Avec le modèle `coût = fixe + k × résolution²` et un budget de 15 ms, on obtient la résolution maximale. On prend la meilleure qualité qui permet au moins 0,45.
  3. **Ajustement continu** (moyennes sur 1 s) : au-dessus de 18 ms, on baisse la résolution, puis la qualité, et le plafond est verrouillé. Sous 14 ms, sans verrou, on remonte : qualité d'abord, puis résolution par pas de 0,05.

  Les trois niveaux de qualité :

  | Niveau | `stepK` | Octaves du bruit | Étoiles |
  |---|---|---|---|
  | Haute | 0,07 | 4 | 1 100 |
  | Moyenne | 0,095 | 3 | 800 |
  | Basse | 0,13 | 2 | 500 |

  - Avec `powerPreference: 'high-performance'`, le navigateur demande le GPU dédié.
- **Outil de dev à garder** : un réglage « Simuler un GPU » qui refait le rendu ×N (×9 ≈ GTX 1660, ×90 ≈ Intel UHD 630 d'un i3 de 10e génération, par rapport à une RTX 5070 Ti), plus `__bench()`. Le panneau de réglages est fermé par défaut.
- **Mesures** : RTX 5070 Ti à 180 fps (plafond de l'écran) en résolution 1. Simulation i3 : environ 63 à 69 fps en qualité haute, résolution 0,5, lettres en vol comprises.

## 7. Son (essentiel)

Web Audio **procédural**, sans fichier au départ : aucune licence et un son entièrement réactif. On pourra remplacer par des samples plus tard.

| Moment | Son |
|---|---|
| Ambiance | Drone grave (40–60 Hz) + souffle filtré + battement lent synchronisé sur la rotation du disque |
| Scroll | La vitesse ouvre un filtre passe-bas |
| Lettre aspirée | Micro « tic » granulaire, limité en fréquence (pas d'avalanche) |
| Plongée | Glissando montant + bruit, puis **silence net** au noir |
| Point blanc | Note aiguë douce |
| Trou blanc | Drone plus clair (accord majeur), large stéréo |
| Supernova | Grondement, impact du flash, souffle de l'onde de choc |

- Bouton son on/off toujours visible (mono, coin d'écran), mémorisé (`localStorage`).
- Volume général modéré, fondus partout : jamais de coupure sèche, sauf le silence voulu de la plongée.

## 8. Phases de travail

Une **session neuve par phase**, qui commence par lire ce fichier.

**État au 18/11/2026 : lot V0 (socle) fait, en attente de validation par Noam. Prochaine étape : lot V1.**
- **Registre de scènes** (`experience/scenes/`) :
  - `types.ts` : interface `SceneElement` (`id`, `label`, `slides` en index 0-based via `S(n)` ou `"all"`, `cost` léger/moyen/lourd, `minTier`, `layers`, `enabledByDefault`, `init(ctx)`, `update(f)`, `render(layer, ctx)`, `dispose()`, `gui(folder)` optionnel), `FrameParams` (caméra, matrice, centre et ombre du trou noir, souris, `weight` 0→1 dans la fenêtre, `reduced`, `composite`) et `CompositeParams`.
  - Couches : `back` (après les étoiles, dans leur cible pleine résolution, caché par l'ombre), `sky` (cible équirectangulaire 1024×512 échantillonnée par le shader du trou noir à travers les rayons courbés : 10, 18), `front` (à l'écran après la composition). Effets de composition (12, 13, 14) : `f.composite` (`waves[4]`, `motion`, `chroma`, `flare`), branchés sur des uniforms déclarés dans `FINAL_FRAG`, utilisés à partir de V1.
  - `registry.ts` : fenêtre = slide ± 1 ; budget 1 lourd + 2 moyens (les plus proches de leur slide d'abord) ; niveau de décor 0/1/2. `index.ts` : liste des éléments, chaque lot y ajoute les siens.
  - `debug.ts` : élément factice (cube en couche `back`, grille en couche `sky`, S6–S9), en dev uniquement et éteint par défaut ; absent du build de production.
- **Parcours S1–S9** : `KEYS` étendu (S6 approche dessous à 15, S7 dessus à 12, S8 dessous à 12, S9 dessus à 22), S1–S5 inchangés ; `S(n)` et `LAST_SLIDE` dans `timeline.ts`. Compteur « 01 / 09 », indice « ← revenir » sur S9.
- **Qualité** : `quality.ts` dégrade d'abord le décor (moyens coupés, puis légers réduits) s'il y a des éléments concernés, puis la résolution, puis le niveau ; la remontée suit l'ordre inverse. Le décor revient à 0 à chaque slide posée et à la calibration.
- **Réglages dev** : dossier « Scènes (registre) » avec le niveau de décor et un dossier par élément (interrupteur, état actif, réglages propres) ; `__scenes` en console.

**Phase 1 (18/11/2026) : livrée et poussée (`f497d8b`).**
- Le prototype est porté dans `src/lab/experience/` sans changement de rendu :
  - `engine.ts` : renderer, passes dans l'ordre étoiles → lettres → trou noir → bloom → composition, boucle unique (ticker GSAP) ;
  - `timeline.ts` : `KEYS`, `cameraPose`, navigation (GSAP `Observer` pour la molette, clavier, tween `cam.s` en `sine.inOut`) ;
  - `text/letters.ts` : atlas, lettres WebGL, physique ; `quality.ts` : qualité automatique ; `shaders/*.ts` : GLSL repris tel quel ;
  - `devtools.ts` : lil-gui, « Simuler un GPU », `__bench()` et accès console, chargés par `import()` en dev uniquement (HUD fps aussi).
- `three` 0.170.0, `gsap` 3.15.1, `lil-gui` 0.20.0 (versions figées). Polices Syne + JetBrains Mono dans `src/lab/fonts` (sous-ensemble latin).
- DA verte supprimée ; `themeColor` noir. Écran « Expérience conçue pour ordinateur » sur les écrans tactiles sans survol.
- Textes : les 4 blocs provisoires, dans `src/lab/content.ts`.

**Phase 0 (18/11/2026) : terminée, validée par Noam.**
- Le prototype `prototypes/black-hole.html` va bien au-delà du livrable prévu. Il couvre déjà une bonne part des phases 1 et 2 :
  - la navigation par slides et la caméra sur trajectoire ;
  - le texte en 3D aspiré lettre par lettre ;
  - la qualité automatique.
- Tout est décrit dans la section 6 (« Navigation par keyframes » et « Acquis du prototype »).
- Prochaine étape : **phase 1, porter le prototype dans `src/lab/experience/`** sans changer le rendu. Il faut garder l'ordre des passes : étoiles, puis lettres, puis trou noir, puis bloom, puis composition finale.
- Vu ce qu'il y a désormais à porter (shaders, lettres en WebGL, caméra), prévoir **Opus** plutôt que Sonnet pour la phase 1.
- Textes : provisoires (4 blocs de remplissage). Les vrais textes viendront en phase 2 (`content.ts`).

**Plan à partir du 18/11/2026 : lots visuels V0 à V7 d'abord** (voir la section 5 bis), puis les phases de fin. Les phases 0 et 1 sont faites.

| Lot | Contenu (n° de la section 5 bis) | Modèle / effort | Livrable validé par Noam |
|---|---|---|---|
| V0 | **Socle** : registre de scènes, parcours étendu à S1–S9 (`KEYS`, une slide vide par scène à venir), règles de performance, dossier de réglages par élément | Opus, moyen | Navigation S1→S9 et retour, perfs identiques |
| V1 | **Effets légers partout** : 12, 13, 14, 15, 16, 19, + 9 et 10 | Sonnet, moyen | Le rendu de toutes les slides |
| V2 | **Lentille et texte** : 18, 17, 20 | Opus, moyen | S1 et S6 |
| V3 | **Étoile compagne dévorée + jets** : 5, 11 | Opus, élevé | S2 et S5 |
| V4 | **Nébuleuses + pulsar** : 4, 6 | Opus, élevé | S3 et S4 |
| V5 | **Astéroïdes + planète** : 8, 7 | Sonnet, moyen | S4 et S5 |
| V6 | **Supernova** : 1 | Opus, élevé | Le préchargement |
| V7 | **Plongée → trou blanc** : 2, 3 | Opus, élevé | S7 à S9 |
| F1 | Son | Sonnet, moyen | L'ambiance complète |
| F2 | Vrais textes (`content.ts`, polices en latin-ext pour « œ ») | Sonnet, moyen | Les textes |
| F3 | Contact + easter egg | Sonnet, moyen | Fin du site |
| F4 | Passe perfs + accessibilité minimale + ouverture (`indexable: true`) | Sonnet, moyen | Mise en ligne |

- **V0 passe obligatoirement en premier**, car tous les autres lots s'y branchent.
- **Après V0, les lots qui ne touchent pas aux mêmes fichiers peuvent tourner en parallèle.** Le plus sûr reste de les faire **un par un, avec un commit à chaque fois**, parce que presque tous modifient la composition dans `engine.ts`.

**Historique des anciennes phases :** 0 = prototype ; 1 = intégration Next ; 2 = textes (devenue F2) ; 3 = plongée (devenue V7) ; 4 = supernova (devenue V6) ; 5 = son (devenu F1) ; 6 = contact (devenu F3) ; 7 = ouverture (devenue F4).

**Règles d'économie :**
- Retours groupés en un message par phase.
- Pas de nouvelle idée de DA en cours de phase : on la note dans la section 9 ci-dessous et on la traite à la phase suivante.
- Captures d'écran seulement quand c'est nécessaire.

## 9. Idées en attente

- Version mobile allégée.
- Écran de choix ou bouton de passage depuis noamguez.fr.
- Projets cliquables (modale ou lien vers la fiche du site classique).
- Détail des textes (pour l'instant : phrases piochées dans le portfolio classique).
