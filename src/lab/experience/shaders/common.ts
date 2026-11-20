import * as THREE from "three";

/* GLSL partagé — repris du prototype phase 0 (prototypes/black-hole.html). */

export const FS_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/** Taille du réseau de la texture de hachage (HASH_N³ valeurs, une par sommet du réseau entier). */
export const HASH_N = 64;

/**
 * Optimisation (20/11/2026) : le bruit de valeur lit les valeurs de son réseau dans une texture 3D au lieu de les
 * calculer (8 hachages par appel, jusqu'à 64 par croisement du disque). Le filtrage trilinéaire du GPU, avec la
 * coordonnée lissée (i + f lissé), fait exactement le même mélange que vnoise() ; la texture contient hash13(i) pour
 * i dans [−32, 32)³, donc la nébulosité du ciel (entre −16 et 21) est identique, et au-delà le réseau se répète
 * (période 64 : bruit statistiquement identique, invisible sur le disque qui défile).
 * NOISE_HASH défini : ancien calcul (référence, comparaisons A/B).
 */
export const COMMON = /* glsl */ `
  precision highp sampler3D;
  uniform sampler3D uHashTex;
  float hash13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  vec3 hash33(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33);
                       return fract((p.xxy + p.yxx) * p.zyx); }
  float vnoise(vec3 p){
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  #ifdef NOISE_HASH
    float a = hash13(i),               b = hash13(i + vec3(1,0,0));
    float c = hash13(i + vec3(0,1,0)), d = hash13(i + vec3(1,1,0));
    float e = hash13(i + vec3(0,0,1)), g = hash13(i + vec3(1,0,1));
    float h = hash13(i + vec3(0,1,1)), k = hash13(i + vec3(1,1,1));
    return mix(mix(mix(a,b,f.x), mix(c,d,f.x), f.y), mix(mix(e,g,f.x), mix(h,k,f.x), f.y), f.z);
  #else
    return textureLod(uHashTex, (i + f + ${HASH_N / 2}.5) * ${(1 / HASH_N).toFixed(8)}, 0.0).r;
  #endif
  }
  float fbm(vec3 p){
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++){ if (float(i) >= uOct) break; s += a * vnoise(p); p = p * 2.07 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
    return s;
  }
  float fbm2(vec3 p){ return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.07 + vec3(1.7, 9.2, 3.1)); }
`;

/** hash13 du shader, en flottants 32 bits (même arrondi que le GPU, à l'ordre des opérations près). */
function hash13(x: number, y: number, z: number) {
  const f = Math.fround;
  const fr = (v: number) => f(v - Math.floor(v));
  const k = f(0.1031), c = f(31.32);
  let px = fr(f(x * k)), py = fr(f(y * k)), pz = fr(f(z * k));
  const d = f(f(f(px * f(pz + c)) + f(py * f(py + c))) + f(pz * f(px + c)));
  px = f(px + d); py = f(py + d); pz = f(pz + d);
  return fr(f(f(px + py) * pz));
}

/** Texture de hachage du bruit de valeur (R8, répétée), à lier à l'uniform uHashTex. */
export function makeHashTexture() {
  const n = HASH_N, h = n / 2;
  const data = new Uint8Array(n * n * n);
  for (let z = 0; z < n; z++) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    data[(z * n + y) * n + x] = Math.round(hash13(x - h, y - h, z - h) * 255);
  }
  const tex = new THREE.Data3DTexture(data, n, n, n);
  tex.format = THREE.RedFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}
