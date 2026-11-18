/* Étoiles aspirées : quads instanciés, trajectoire entièrement calculée dans le vertex shader. */

export const STARS_VERT = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uT, uAspect, uRh, uPx, uTrail;
  uniform vec2 uC;   // centre du trou noir à l'écran (NDC)
  varying float vAcross, vAlong, vB, vAbs; varying vec3 vCol;

  // position sur la spirale (espace "unités verticales" : x dans [-aspect, aspect])
  vec2 pathPos(float f, float a0, float r0){
    float r = uRh + (r0 - uRh) * (1.0 - pow(f, 3.4));
    float a = a0 + 2.4 * pow(f, 3.6);            // sens anti-horaire, accélère près de l'horizon
    return vec2(cos(a), sin(a)) * r;
  }
  void main(){
    float a0 = aSeed.x;
    vec2 cs = vec2(cos(a0), sin(a0));
    float rEdge = min(uAspect / max(abs(cs.x), 1e-3), 1.0 / max(abs(cs.y), 1e-3));
    // les étoiles naissent un peu partout autour du trou noir (jusqu'au bord de l'écran), puis tombent ; en boucle
    float r0 = mix(uRh * 2.4, rEdge * 1.15, sqrt(fract(aSeed.w * 7.13)));
    float rate = 0.055 * aSeed.y;
    float f = fract(uT * rate + aSeed.z);   // temps propre : indépendant du scroll et des slides
    // traînée filante courte (style d'origine) + traînée rémanente courbe qui ne pousse que pendant l'aspiration
    float streak = 0.0015 + 0.05 * pow(f, 7.0);
    float absorbTrail = uTrail * 0.28 * smoothstep(0.55, 1.0, f);
    float df = streak + absorbTrail;
    vAbs = absorbTrail / df;
    float x = position.x;
    float t = max(x, 0.0);
    float ft = max(f - df * t, 0.0);
    vec2 p = pathPos(ft, a0, r0);
    vec2 tg = pathPos(min(ft + 0.003, 0.9999), a0, r0) - pathPos(max(ft - 0.003, 0.0), a0, r0);
    float tl = length(tg);
    vec2 dir = tl > 1e-6 ? tg / tl : -normalize(p);
    vec2 nrm = vec2(-dir.y, dir.x);
    float wHead = max(uPx * (0.9 + 1.6 * aSeed.w) * mix(1.0, 0.55, f * f), uPx * 0.9);
    float w = wHead * mix(1.0, 0.4, t);                     // la traînée s'affine vers la queue
    if (x < 0.0) p += dir * (-x) * wHead * 1.6;             // pointe arrondie devant la tête
    p += nrm * position.y * 1.6 * w;
    vAcross = position.y * 1.6;
    vAlong = x;
    // chaque point de la traînée s'éteint quand il atteint l'horizon
    float fadeOut = smoothstep(uRh * 1.0, uRh * 1.35, length(p));
    float fadeIn = smoothstep(0.0, 0.12, f);    // apparition douce
    vB = (0.25 + 1.2 * pow(aSeed.w, 3.0)) * (1.0 + 4.0 * pow(f, 5.0)) * fadeIn * fadeOut;
    vCol = mix(vec3(0.78, 0.86, 1.0), vec3(1.0, 0.72, 0.42), smoothstep(0.55, 1.0, ft));
    gl_Position = vec4(p.x / uAspect + uC.x, p.y + uC.y, 0.0, 1.0);
  }
`;

export const STARS_FRAG = /* glsl */ `
  varying float vAcross, vAlong, vB, vAbs; varying vec3 vCol;
  void main(){
    float across = exp(-vAcross * vAcross * 2.2);
    // tête arrondie ; corps : traînée filante d'origine (dégradé linéaire), qui devient une lumière rémanente
    // à décroissance exponentielle quand l'étoile se fait aspirer
    float body = mix(0.2 + 0.8 * (1.0 - vAlong), exp(-vAlong * 3.0), vAbs);
    float along = vAlong < 0.0 ? exp(-vAlong * vAlong * 5.0) : body;
    gl_FragColor = vec4(vCol * vB * across * along, 1.0);
  }
`;
