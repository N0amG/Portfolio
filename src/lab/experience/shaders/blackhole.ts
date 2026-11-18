import { COMMON } from "./common";

/* Trou noir : raymarching plein écran (géodésiques de Schwarzschild approximées). */
export const BLACKHOLE_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uRes; uniform float uTime, uTanHalf, uIntensity, uDoppler, uStepK, uOct, uClock;
  uniform mat3 uSkyRot;
  uniform vec3 uCamPos, uCamR, uCamU, uCamF, uC0, uC1, uC2, uC3;
  ${COMMON}
  const float R_IN = 2.9;
  const float R_OUT = 12.0;
  const float PERIOD = 40.0;
  const float B_FAR = 15.0;    // au-delà : déviation analytique, pas de raymarching
  const float R_EXIT = 16.0;   // rayon de sortie du raymarching

  vec3 ramp(float x){
    x = clamp(x, 0.0, 1.0);
    if (x < 0.33) return mix(uC0, uC1, x / 0.33);
    if (x < 0.66) return mix(uC1, uC2, (x - 0.33) / 0.33);
    return mix(uC2, uC3, (x - 0.66) / 0.34);
  }

  float diskNoise(float r, float phi, float t, float seed){
    float ph = phi + 1.55 * pow(r, -1.5) * t;     // rotation képlérienne (différentielle)
    float ar = 1.4 + 0.25 * r;                     // fréquence angulaire basse -> filaments
    vec3 q = vec3(cos(ph) * ar, sin(ph) * ar, r * 3.2 + seed);
    return fbm(q) * (uOct >= 4.0 ? 1.0 : (uOct >= 3.0 ? 1.0667 : 1.2));
  }

  vec4 diskSample(vec3 p, vec3 rd){
    float r = length(p.xz);
    if (r < R_IN - 0.4 || r > R_OUT) return vec4(0.0);
    float phi = atan(p.z, p.x);
    // deux phases en fondu enchaîné pour éviter un cisaillement infini
    float t1 = mod(uTime, PERIOD), t2 = mod(uTime + PERIOD * 0.5, PERIOD);
    float w1 = sin(3.14159265 * t1 / PERIOD); w1 *= w1;
    float n = w1 * diskNoise(r, phi, t1, 0.0) + (1.0 - w1) * diskNoise(r, phi, t2, 17.3);
    n = smoothstep(0.22, 0.82, n);

    float prof = smoothstep(R_IN - 0.4, R_IN + 0.9, r) * (1.0 - smoothstep(R_OUT * 0.42, R_OUT, r));
    // beaming Doppler : le côté gauche s'approche
    vec3 vdir = normalize(vec3(p.z, 0.0, -p.x));
    float beta = uDoppler * sqrt(0.5 / max(r - 1.0, 0.4));
    float gam = inversesqrt(1.0 - beta * beta);
    float D = 1.0 / (gam * (1.0 - beta * dot(vdir, -rd)));
    float shift = D * sqrt(1.0 - 1.0 / r);          // + décalage gravitationnel
    float temp = pow(R_IN / r, 0.85) * shift;
    vec3 c = ramp(temp * 0.95 + n * 0.18);
    float bright = prof * (0.25 + 1.5 * n) * pow(shift, 3.0) * (0.6 + 1.6 * pow(R_IN / r, 1.5)) * uIntensity * 2.2;
    float alpha = clamp(prof * (0.8 + 0.5 * n), 0.0, 0.97);
    return vec4(c * bright, alpha);
  }

  vec3 starField(vec3 d){
    d = uSkyRot * d;                   // le ciel tourne lentement : il défile à travers la lentille
    vec3 c = vec3(0.0);
    for (int l = 0; l < 2; l++){
      float sc = l == 0 ? 70.0 : 160.0;
      vec3 p = d * sc;
      vec3 id = floor(p);
      vec3 h = hash33(id + float(l) * 31.7);
      if (h.x > 0.8){
        vec3 sp = id + 0.15 + 0.7 * hash33(id + 4.7);
        float dist2 = dot(p - sp, p - sp);
        float b = exp(-dist2 * (l == 0 ? 150.0 : 70.0)) * (0.5 + 3.0 * h.y * h.y * h.y);
        b *= 0.65 + 0.35 * sin(uClock * (1.2 + 3.5 * h.z) + h.y * 60.0);   // scintillement
        c += b * mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.85, 0.65), h.z);
      }
    }
    float neb = fbm2(d * 2.4 + 3.0);
    c += vec3(0.012, 0.02, 0.06) * smoothstep(0.35, 0.7, neb) + vec3(0.03, 0.008, 0.004) * smoothstep(0.45, 0.75, fbm2(d * 1.3 - 7.0));
    return c;
  }

  void main(){
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uRes.x / uRes.y;
    vec3 rd = normalize(uCamF + uTanHalf * (uv.x * uCamR + uv.y * uCamU));
    vec3 hv = cross(uCamPos, rd);
    float h2 = dot(hv, hv);
    float b = sqrt(h2);                       // paramètre d'impact (rayon droit)
    vec3 acc_col = vec3(0.0);
    float alpha = 0.0, rmin = 1e3;
    bool captured = false;
    vec3 dir;
    if (b > B_FAR){
      // Rayon lointain : il ne croise ni le disque ni la zone de champ fort.
      // Déviation analytique en champ faible, de la caméra jusqu'à l'infini : (1/b)(1 - s0/sqrt(s0²+b²)).
      float s0 = dot(uCamPos, rd);
      float defl = (1.0 - s0 / sqrt(s0 * s0 + h2)) / b;
      vec3 toC = normalize(-uCamPos + dot(uCamPos, rd) * rd);
      dir = normalize(rd * cos(defl) + toC * sin(defl));
    } else {
      vec3 pos = uCamPos, vel = rd;
      for (int i = 0; i < 200; i++){
        float r = length(pos);
        float dt = clamp(uStepK * r, 0.02, 1.5);
        vec3 prev = pos;
        vel += -1.5 * h2 * pos / (r * r * r * r * r) * dt;
        pos += vel * dt;
        float r2 = length(pos);
        rmin = min(rmin, r2);
        if (prev.y * pos.y < 0.0){
          vec3 hit = mix(prev, pos, prev.y / (prev.y - pos.y));
          vec4 ds = diskSample(hit, normalize(vel));
          acc_col += (1.0 - alpha) * ds.rgb;
          alpha += (1.0 - alpha) * ds.a;
          if (alpha > 0.985) break;
        }
        if (r2 < 1.0){ captured = true; break; }
        if (r2 > R_EXIT && dot(pos, vel) > 0.0) break;   // sorti de la zone utile : fin analytique
      }
      dir = normalize(vel);
      // déviation restante jusqu'à l'infini (champ faible)
      float s1 = dot(pos, dir);
      vec3 perp = -pos + s1 * dir;
      float bb = max(length(perp), 1e-3);
      float defl = (1.0 - s1 / sqrt(s1 * s1 + bb * bb)) / bb;
      dir = normalize(dir * cos(defl) + perp / bb * sin(defl));
    }
    vec3 bg = vec3(0.0);
    if (!captured){
      bg = starField(dir);
      // anneau de photons : rayons qui ont frôlé la sphère de photons (r = 1.5)
      float ring = exp(-pow((rmin - 1.5) * 6.0, 2.0));
      acc_col += (1.0 - alpha * 0.7) * ring * mix(uC2, uC3, 0.6) * 0.45 * uIntensity;
    }
    acc_col += (1.0 - alpha) * bg;
    // alpha = transmission vers le fond : sert à composer les étoiles aspirées (pleine résolution) dans la passe finale
    float trans = captured ? 0.0 : (1.0 - alpha);
    gl_FragColor = vec4(acc_col, trans);
  }
`;
