/* GLSL partagé — repris tel quel du prototype phase 0 (prototypes/black-hole.html). */

export const FS_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const COMMON = /* glsl */ `
  float hash13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  vec3 hash33(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33);
                       return fract((p.xxy + p.yxx) * p.zyx); }
  float vnoise(vec3 p){
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float a = hash13(i),               b = hash13(i + vec3(1,0,0));
    float c = hash13(i + vec3(0,1,0)), d = hash13(i + vec3(1,1,0));
    float e = hash13(i + vec3(0,0,1)), g = hash13(i + vec3(1,0,1));
    float h = hash13(i + vec3(0,1,1)), k = hash13(i + vec3(1,1,1));
    return mix(mix(mix(a,b,f.x), mix(c,d,f.x), f.y), mix(mix(e,g,f.x), mix(h,k,f.x), f.y), f.z);
  }
  float fbm(vec3 p){
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++){ if (float(i) >= uOct) break; s += a * vnoise(p); p = p * 2.07 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
    return s;
  }
  float fbm2(vec3 p){ return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.07 + vec3(1.7, 9.2, 3.1)); }
`;
