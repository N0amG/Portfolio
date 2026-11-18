/* Lettres détachées : petit maillage instancié par lettre, déformé (marée, lentille, souris). */

export const GLYPH_VERT = /* glsl */ `
  attribute vec4 iA;   // origine écran (px), angle vitesse, rotation propre (rad)
  attribute vec4 iB;   // échelle x/y, opacité, absorption
  attribute vec4 iC;   // boîte (px), marge (px), image (0 primaire / 1 secondaire)
  attribute vec4 iUV;  // rectangle dans l'atlas
  attribute vec4 iW, iR, iU, iD;   // texte posé en 3D (voir JS)
  uniform vec2 uView, uCenter, uPar;
  uniform mat4 uViewProj;
  uniform float uThetaE, uSwirl, uTide;
  varying vec2 vUv; varying float vOp, vS;
  vec2 rot2(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
  void main(){
    float op = iB.z, s = iB.w, img = iC.w;
    vOp = img < 0.5 ? op : op * s * s * 0.75;
    vS = s;
    vUv = mix(iUV.xy, iUV.zw, position.xy);
    if (vOp < 0.002){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }

    // 1. transform de la lettre (identique au CSS du DOM : rotate(va) scale(sx,sy) rotate(rot - va))
    vec2 box = iC.xy; float pad = iC.z;
    vec2 local = position.xy * (box + 2.0 * pad) - pad;
    vec2 p = local - vec2(0.5, 0.55) * box;
    // 0. texte posé : vraie position 3D dans la scène, projetée par la même caméra que le trou noir
    vec3 wp = iW.xyz + iR.xyz * p.x + iU.xyz * p.y;
    vec4 clipR = uViewProj * vec4(wp, 1.0);
    vec2 ndcR = clipR.xy / max(clipR.w, 1e-3);
    p = rot2(p, iA.w); p *= iB.xy; p = rot2(p, iA.z);
    vec2 rel = iA.xy + p - uCenter;

    // 2. forces de marée : rotation différentielle (le bord intérieur prend de l'avance -> la lettre se courbe
    //    le long de sa spirale) + étirement radial (spaghettification courbe, pas en ligne droite)
    float rL = max(length(iA.xy - uCenter), 1.0);
    float r = max(length(rel), 1.0);
    rel = rot2(rel, -uSwirl * s * (rL / r - 1.0));
    r = max(rL + (r - rL) * (1.0 + uTide * s * s), 1.0);
    vec2 dir = normalize(rel);

    // 3. lentille gravitationnelle (équation de lentille d'un point massif), décalée par la parallaxe souris
    vec2 beta = dir * r + uPar * s;
    float b = max(length(beta), 1e-3);
    vec2 bd = beta / b;
    float q = sqrt(b * b + 4.0 * uThetaE * uThetaE);
    vec2 outRel = img < 0.5 ? bd * mix(b, 0.5 * (b + q), s)      // image primaire
                            : bd * 0.5 * (b - q);                // image secondaire, de l'autre côté de l'anneau
    if (img > 0.5) vOp *= clamp(1.6 - b / (2.2 * uThetaE), 0.0, 1.0);
    vec2 sp = uCenter + outRel;
    vec2 ndcS = vec2(sp.x / uView.x * 2.0 - 1.0, 1.0 - sp.y / uView.y * 2.0);
    // passage progressif du plan 3D à la physique écran au moment où la lettre se détache
    gl_Position = vec4(mix(ndcR, ndcS, iD.x), 0.0, 1.0);
  }
`;

export const GLYPH_FRAG = /* glsl */ `
  uniform sampler2D uAtlas;
  varying vec2 vUv; varying float vOp, vS;
  void main(){
    float a = texture2D(uAtlas, vUv).a * vOp;
    gl_FragColor = vec4(a, a * vS, 0.0, a);
  }
`;
