import { COMMON } from "./common";

/* Trou noir : raymarching plein écran (géodésiques de Schwarzschild approximées). */
export const BLACKHOLE_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uRes; uniform float uTime, uTanHalf, uIntensity, uDoppler, uStepK, uOct, uClock;
  uniform mat3 uSkyRot;
  uniform vec4 uErupt;   // 16 · éruption du disque : (azimut de départ, âge, vitesse angulaire, amplitude)
  uniform vec4 uHot;     // 5 · point chaud du filament de l'étoile compagne : (azimut, rayon, largeur radiale, amplitude)
  uniform sampler2D uSkyTex; uniform float uSkyOn;
  uniform vec4 uLensM;   // 17 · curseur gravitationnel : (position uv, θE², rayon du cœur)
  uniform sampler2D uTitleTex; uniform vec3 uTitleO, uTitleN, uTitleCol; uniform vec4 uTitleA1, uTitleA2;   // 18 · texte géant   // couche "sky" du registre (équirectangulaire, repère monde)
  uniform sampler2D uNebTex; uniform vec4 uNebC; uniform vec3 uNebE1, uNebE2; uniform float uNebF, uNebFill;   // 4 · nébuleuse (patch raymarché, voir nebula.ts)
  // couverture du patch (1 dedans, fondu vers 0 sur son bord) et coordonnées
  float nebCov(vec3 dir, out vec2 nuv){
    float nc = dot(dir, uNebC.xyz);
    if (nc <= 0.05){ nuv = vec2(0.0); return 0.0; }
    nuv = vec2(dot(dir, uNebE1), dot(dir, uNebE2)) / nc * 0.5 + 0.5;
    vec2 ed = abs(nuv - 0.5);
    // fondu sur le bord du patch : en cadrage caméra (traversée), les rayons courbés près du trou noir sortent du patch ;
    // sans fondu, la nébuleuse s'y arrête net (bord de « bulle »). Le fondu commence hors écran (marge du patch : ×1,12).
    return 1.0 - smoothstep(0.455, 0.5, max(ed.x, ed.y));
  }
  vec4 nebAt(vec3 dir){
    vec2 nuv;
    float cv = nebCov(dir, nuv);
    return cv > 0.0 ? textureLod(uNebTex, nuv, 0.0) * cv : vec4(0.0);
  }
  uniform vec3 uCamPos, uCamR, uCamU, uCamF, uC0, uC1, uC2, uC3;
  uniform vec4 uDive;    // 2 · plongée : (bleuissement, surcroît d'éclat, atténuation du disque en fin de chute, -)
  uniform vec2 uAberr;   // 2 · plongée : vitesse de chute vers le trou noir (β), aberration relativiste ; y = β d'il y a un instant (traînées)
  uniform vec4 uTunnel;  // 2 · trou de ver : (visibilité, phase d'écoulement, torsion, rayon d'Einstein de la gorge) ; x = 0 : inactif
  uniform vec4 uTunBend; // 2 · trou de ver : xy = courbure du tunnel (souris), z = intérieur de la gorge noir (0..1), w = éclat
  uniform float uTunSpin; // 2 · trou de ver : rotation de l'image (rad), même sens que le roulis de la chute
  // 2 · entrée dans le trou de ver : image de la chute capturée à l'horizon, plaquée sur les parois.
  // (active 0/1, rayon de l'ombre à la capture, avance de l'écoulement depuis, rotation depuis)
  uniform sampler2D uCapTex; uniform vec4 uCap;
  uniform vec4 uWhite;   // 3 · trou blanc : (mode 0/1, vitesse d'éjection radiale, éclat de l'horizon, halo)
  uniform vec3 uW0, uW1, uW2, uW3;   // 3 · palette du trou blanc (bord → cœur)
  uniform vec3 uBFar;    // raccord rayons raymarchés / analytiques : (b de bascule, largeur du fondu en b, poids du terme de 2e ordre)
  uniform vec2 uSkySec;  // images secondaires du ciel profond : (poids, largeur du fondu en rad)
  ${COMMON}
  const float R_IN = 2.9;
  const float R_OUT = 12.0;
  const float PERIOD = 40.0;
  const float R_EXIT = 16.0;   // rayon de sortie du raymarching

  vec3 ramp4(float x, vec3 c0, vec3 c1, vec3 c2, vec3 c3){
    x = clamp(x, 0.0, 1.0);
    if (x < 0.33) return mix(c0, c1, x / 0.33);
    if (x < 0.66) return mix(c1, c2, (x - 0.33) / 0.33);
    return mix(c2, c3, (x - 0.66) / 0.34);
  }
  // palette du disque : plasma du trou noir, ou bleu du trou blanc (3 : #1b4dff → #7fd6ff → blanc)
  vec3 ramp(float x){
    vec3 c = ramp4(x, uC0, uC1, uC2, uC3);
    if (uWhite.x > 0.0) c = mix(c, ramp4(x, uW0, uW1, uW2, uW3), uWhite.x);
    return c;
  }

  float diskNoise(float r, float phi, float t, float seed){
    // 3 · trou blanc : le film du disque à l'envers (rotation inversée) et la matière éjectée vers l'extérieur
    float sg = 1.0 - 2.0 * uWhite.x;
    float ph = phi + sg * 1.55 * pow(r, -1.5) * t;     // rotation képlérienne (différentielle)
    float ar = 1.4 + 0.25 * r;                     // fréquence angulaire basse -> filaments
    vec3 q = vec3(cos(ph) * ar, sin(ph) * ar, r * 3.2 + seed - uWhite.y * uWhite.x * t);
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
    // (trou blanc : rotation inversée et vitesse radiale vers l'extérieur)
    vec3 vdir = normalize(vec3(p.z, 0.0, -p.x) * (1.0 - 2.0 * uWhite.x) + uWhite.x * 0.6 * vec3(p.x, 0.0, p.z) / r);
    float beta = uDoppler * sqrt(0.5 / max(r - 1.0, 0.4));
    float gam = inversesqrt(1.0 - beta * beta);
    float D = 1.0 / (gam * (1.0 - beta * dot(vdir, -rd)));
    float shift = D * sqrt(1.0 - 1.0 / r);          // + décalage gravitationnel
    float temp = pow(R_IN / r, 0.85) * shift;
    vec3 c = ramp(temp * 0.95 + n * 0.18);
    float bright = prof * (0.25 + 1.5 * n) * pow(shift, 3.0) * (0.6 + 1.6 * pow(R_IN / r, 1.5)) * uIntensity * 2.2;
    if (uErupt.w > 0.0){
      // 16 · éruption : une langue de plasma part de l'azimut du clic, fait le tour du disque (front net, queue qui s'étire)
      float head = uErupt.x + uErupt.z * uErupt.y;
      float dl = mod(head - phi + 3.14159265, 6.2831853) - 3.14159265;  // ≥ 0 : derrière le front
      dl *= sign(uErupt.z);
      float tail = dl >= 0.0 ? exp(-dl * 1.1) : exp(dl * 9.0);
      float rad = exp(-pow((r - 5.2) / 4.2, 2.0));
      float e = tail * rad * uErupt.w * (0.65 + 0.7 * n);
      bright = bright * (1.0 + 3.5 * e) + prof * e * 7.0 * uIntensity;
      c = mix(c, ramp(0.9), clamp(e, 0.0, 1.0) * 0.7);
    }
    if (uHot.w > 0.0){
      // 5 · point chaud : là où le filament de l'étoile compagne frappe le disque. Le plasma chauffé est entraîné
      // par la rotation (azimut décroissant) : queue qui s'étire en aval, front net en amont.
      float dl = mod(uHot.x - phi + 3.14159265, 6.2831853) - 3.14159265;
      float tail = dl >= 0.0 ? exp(-dl * 1.8) : exp(dl * 12.0);
      float e = tail * exp(-pow((r - uHot.y) / uHot.z, 2.0)) * uHot.w * (0.6 + 0.8 * n);
      bright += e * shift * shift * 5.0 * uIntensity;
      c = mix(c, ramp(0.97), clamp(e * 1.4, 0.0, 1.0) * 0.75);
    }
    float alpha = clamp(prof * (0.8 + 0.5 * n), 0.0, 0.97);
    return vec4(c * bright, alpha);
  }

  // Déviation restante de s (abscisse signée depuis le périastre) jusqu'à l'infini, pour la MÊME force que le raymarching (∝ 1/r⁴).
  // Cohérente avec lui à la bascule b = uBFar.x (voir farDir pour le 2e ordre) : sans ça, un cercle net apparaît autour du trou noir sur les fonds lisses.
  float tailDefl(float s, float b){ float q = s * s + b * b; return (1.0 - s * (2.0 * s * s + 3.0 * b * b) / (2.0 * q * sqrt(q))) / b; }

  // Direction finale d'un rayon lointain (b > uBFar.x - uBFar.y), sans raymarching : déviation analytique de la caméra à l'infini.
  // Le raymarching intègre la force exacte, qui contient le terme de 2e ordre de Schwarzschild (15π/16b², ≈ 13 mrad à b = 15) :
  // on l'ajoute ici (même répartition le long du rayon que le 1er ordre), sinon un cercle net apparaît à la bascule.
  vec3 farDir(vec3 rd, float b){
    float s0 = dot(uCamPos, rd);
    float defl = tailDefl(s0, b) * (1.0 + uBFar.z * 1.47262156 / b);   // × (1 + (15π/32) / b)
    vec3 toC = normalize(-uCamPos + s0 * rd);
    return normalize(rd * cos(defl) + toC * sin(defl));
  }

  // étoiles ponctuelles seules (sans la nébulosité), pour les traînées de la plongée
  vec3 starPts(vec3 d){
    d = uSkyRot * d;
    vec3 c = vec3(0.0);
    for (int l = 0; l < 2; l++){
      float sc = l == 0 ? 70.0 : 160.0;
      vec3 p = d * sc;
      vec3 id = floor(p);
      vec3 h = hash33(id + float(l) * 31.7);
      if (h.x > 0.8){
        vec3 sp = id + 0.15 + 0.7 * hash33(id + 4.7);
        float dist2 = dot(p - sp, p - sp);
        c += exp(-dist2 * (l == 0 ? 150.0 : 70.0)) * (0.5 + 3.0 * h.y * h.y * h.y) * mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.85, 0.65), h.z);
      }
    }
    return c;
  }
  // aberration : direction vue (repère de la caméra qui tombe le long de nf à la vitesse beta) → repère statique
  vec3 aberrate(vec3 rd, vec3 nf, float beta){
    float co = dot(rd, nf);
    float cs = (co - beta) / (1.0 - beta * co);
    vec3 pp = rd - nf * co;
    float pl = length(pp);
    return pl > 1e-6 ? nf * cs + pp / pl * sqrt(max(0.0, 1.0 - cs * cs)) : nf * sign(cs);
  }
  vec3 skyAt(vec3 d){
    return textureLod(uSkyTex, vec2(atan(d.z, d.x) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5), 0.0).rgb;
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

  // 2 · trou de ver : traînée de lumière dans une cellule (g.x = colonne autour du tunnel, g.y = écoulement).
  // Tête brillante côté caméra (les traînées viennent vers nous), queue vers la gorge.
  float tStreak(vec2 g, float seed){
    vec2 id = floor(g), f = fract(g);
    vec3 h = hash33(vec3(id, seed));
    float x = (f.x - 0.5) * 2.0 / (0.1 + 0.22 * h.y);
    float v = f.y / (0.3 + 0.6 * h.z);
    float body = v < 1.0 ? pow(1.0 - v, 2.5) : 0.0;
    return step(0.62, h.x) * exp(-x * x) * body * (0.4 + 1.8 * h.y * h.y);
  }
  // 2 · trou de ver, en espace écran (p : unités NDC verticales, centre de l'écran). Parois tapissées de la lumière du ciel
  // étirée le long de l'écoulement ; gorge en anneau d'Einstein (lentille extrême : les parois convergent sur l'anneau
  // des deux côtés, image secondaire retournée à l'intérieur), lueur blanche de l'autre côté.
  float tunT;   // transmission de l'image du tunnel (non nulle là où l'image de la chute est encore plaquée)
  vec3 tunnelCol(vec2 p){
    tunT = 0.0;
    float r = length(p);
    // l'axe du tunnel se courbe avec la profondeur (souris + lente ondulation ; droit à l'entrée et au bout)
    vec2 bend = uTunBend.xy + 0.07 * (1.0 - uTunBend.z) * vec2(sin(uTunnel.y * 0.11), cos(uTunnel.y * 0.083));
    p -= bend * (1.0 - 1.0 / (1.0 + 0.3 / max(r, 1e-3)));
    r = length(p);
    float rE = uTunnel.w;
    float rs = abs(r - rE * rE / max(r, 1e-4));
    float inner = step(r, rE);
    float z = 1.0 / max(rs, 1e-3);                                  // profondeur dans le tunnel
    float a0 = atan(p.y, p.x);
    float a = a0 + uTunSpin + uTunnel.z * log(1.0 + z) + inner * 3.14159265;   // rotation, torsion ; image secondaire retournée
    float w = z + uTunnel.y;                                        // coordonnée d'écoulement
    float an = a * 0.15915494 + 0.5;
    vec3 c = vec3(0.0);
    c += tStreak(vec2(an * 90.0, w * 0.9), 1.0) * vec3(0.75, 0.88, 1.0) * 1.7;
    if (uOct > 2.5) c += tStreak(vec2(an * 210.0, w * 2.1), 7.0) * vec3(1.0, 0.88, 0.72) * 0.9;
    vec3 cyl = vec3(cos(a) * 1.6, sin(a) * 1.6, w * 0.35);
    float neb = fbm(cyl);
    c += mix(uW1, uW2, neb) * smoothstep(0.35, 0.8, neb) * 0.55;    // gaz bleu qui s'écoule
    c += uC1 * 0.3 * smoothstep(0.55, 0.85, fbm2(cyl * 1.9 + 5.0)); // restes ambrés du disque
    if (uSkyOn > 0.5) c += textureLod(uSkyTex, vec2(an, 0.5 + 0.4 * sin(w * 0.05)), 0.0).rgb * 2.5;   // ciel profond étiré
    // les parois s'assombrissent vers la gorge ; au bout, l'intérieur de la gorge (la sortie) est noir
    c *= exp(-z * 0.16) * (1.0 - mix(0.65, 1.0, smoothstep(0.0, 0.25, uTunBend.z)) * inner);
    c *= 0.55 + 0.45 * smoothstep(1.9, 0.5, r);                       // parois toutes proches (bords) : moins nettes
    // anneau d'Einstein de la gorge et lueur blanche de l'autre côté (annonce du point blanc)
    float ring = exp(-pow((r - rE) / (0.006 + 0.08 * min(rE, 0.12)), 2.0));   // liseré fin, même quand la gorge s'ouvre
    c += ring * mix(uW2, uW3, 0.5) * 2.4 * (1.0 - 0.75 * uTunBend.z);
    c += inner * uW3 * 0.5 * exp(-3.0 * r / max(rE, 1e-3)) * (1.0 - smoothstep(0.0, 0.25, uTunBend.z));   // au bout : la sortie est noire
    c *= uTunBend.w;
    if (uCap.x > 0.0 && inner < 0.5){
      // entrée : l'image de la chute est la texture des parois. Le point de paroi vu ici à la profondeur z était, au
      // moment de la capture, à la profondeur z + avance : on retrouve son rayon à l'écran d'alors (r − R²/r = 1/z),
      // et sa direction, tournée de la rotation depuis. Au départ (avance 0, gorge = ombre) l'image est identique ;
      // ensuite elle file vers l'extérieur en s'étirant, et le tunnel la remplace depuis la gorge.
      float zH = z + uCap.z;
      float x = 1.0 / zH, R = uCap.y;
      float rH = 0.5 * (x + sqrt(x * x + 4.0 * R * R));
      float aH = a0 + uCap.w;
      vec2 cuv = rH * vec2(cos(aH), sin(aH)) / vec2(uRes.x / uRes.y, 1.0) * 0.5 + 0.5;
      vec4 cap = textureLod(uCapTex, cuv, 0.0);
      float wc = 1.0 - smoothstep(20.0, 40.0, zH);
      c = mix(c, cap.rgb, wc);
      tunT = clamp(cap.a, 0.0, 1.0) * wc;
    }
    return c;
  }

  void main(){
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uRes.x / uRes.y;
    if (uTunnel.x >= 0.999){
      // 2 · trou de ver : plus de raymarching (la caméra est sous l'horizon) ; transmission nulle (étoiles aspirées cachées)
      vec3 tc = tunnelCol(uv);
      gl_FragColor = vec4(tc, tunT);
      return;
    }
    vec3 rd = normalize(uCamF + uTanHalf * (uv.x * uCamR + uv.y * uCamU));
    float dop = 1.0;
    vec3 rd0 = rd;
    if (uAberr.x > 0.0){
      // 2 · plongée : aberration relativiste. La caméra tombe vers le trou noir à la vitesse β : chaque direction vue est
      // ramenée au repère statique (cos θs = (cos θ − β) / (1 − β cos θ)). Tout le ciel (étoiles, ciel profond,
      // nébuleuse, texte géant) et le disque se resserrent vers l'avant et se déforment avec nous ; l'ombre ne couvre
      // plus l'écran. Facteur Doppler D = 1 / (γ (1 − β cos θ)) : l'avant bleuit et brille, l'arrière s'éteint.
      vec3 nf = normalize(-uCamPos);
      float co = dot(rd, nf);
      rd = aberrate(rd, nf, uAberr.x);
      dop = sqrt(1.0 - uAberr.x * uAberr.x) / (1.0 - uAberr.x * co);
    }
    vec3 hv = cross(uCamPos, rd);
    float h2 = dot(hv, hv);
    float b = sqrt(h2);                       // paramètre d'impact (rayon droit)
    vec3 acc_col = vec3(0.0);
    float alpha = 0.0, rmin = 1e3;
    bool captured = false;
    vec3 dir;
    if (b > uBFar.x){
      // Rayon lointain : il ne croise ni le disque ni la zone de champ fort, déviation analytique.
      dir = farDir(rd, b);
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
      float defl = tailDefl(s1, bb);
      dir = normalize(dir * cos(defl) + perp / bb * sin(defl));
      // fondu vers la déviation analytique à l'approche de la bascule : le reste d'écart (pas d'intégration) s'étale
      // sur toute la bande au lieu de former un cercle net
      float wf = smoothstep(uBFar.x - uBFar.y, uBFar.x, b);
      if (wf > 0.0 && !captured) dir = normalize(mix(dir, farDir(rd, b), wf));
    }
    if (uLensM.z > 0.0){
      // 17 · curseur gravitationnel : lentille ponctuelle douce autour de la souris, sur le fond seulement (β = θ − θE² θ/|θ|²)
      vec2 dm = uv - uLensM.xy;
      float r2 = dot(dm, dm);
      vec2 dd = dm * (uLensM.z / (r2 + uLensM.w * uLensM.w)) * exp(-r2 * 7.0);
      dir = normalize(dir - uTanHalf * (dd.x * uCamR + dd.y * uCamU));
    }
    vec3 title = vec3(0.0);
    if (uTitleA2.w > 0.0){
      // 18 · texte géant : plan derrière le trou noir, atteint par le rayon courbé (lentille et anneau d'Einstein gratuits)
      float dn = dot(dir, uTitleN);
      float t = dot(uTitleO, uTitleN) / (abs(dn) < 1e-4 ? 1e-4 : dn);
      vec3 hp = t * dir - uTitleO;
      vec2 tuv = vec2(dot(hp, uTitleA1.xyz), dot(hp, uTitleA2.xyz)) * 0.5 + 0.5;
      float inside = step(0.0, t) * step(abs(tuv.x - 0.5), 0.5) * step(abs(tuv.y - 0.5), 0.5);
      title = uTitleCol * (texture2D(uTitleTex, tuv).a * inside * uTitleA2.w);
    }
    vec3 bg = vec3(0.0);
    float whiteCore = 0.0;
    if (captured && uWhite.x > 0.0){
      // 3 · horizon du trou blanc : il émet. Cœur blanc pur, limbe horizon bleu, liseré bleu profond
      // (b est conservé le long du rayon : b / b_c = position dans le disque de l'horizon, 1 au bord).
      // Le cœur (b / b_c < 0,62) est marqué pour être composé en blanc pur (255) après le tonemapping : vu de tout près
      // au début du dézoom, il remplit l'écran exactement comme l'écran blanc qui le précède.
      float lb = clamp(b / 2.598, 0.0, 1.0);
      vec3 hc = mix(uW3 * 1.5, uW2 * 1.6, smoothstep(0.62, 0.92, lb));
      hc = mix(hc, uW1 * 1.1, smoothstep(0.92, 1.0, lb));
      acc_col += (1.0 - alpha) * hc * uWhite.z * uWhite.x;
      whiteCore = (1.0 - smoothstep(0.62, 0.8, lb)) * (1.0 - alpha) * uWhite.x * min(uWhite.z, 1.0);
    }
    if (!captured){
      bg = starField(dir) + title;
      vec3 trailAx = vec3(0.0);
      float trailAng = 0.0;
      if (uAberr.x > 0.0 && abs(uAberr.x - uAberr.y) > 1e-4){
        // 2 · plongée : chaque astre glisse très vite dans l'image pendant que la vitesse de chute augmente ; on trace sa
        // traînée le long de ce glissement (de sa position d'il y a un instant à l'actuelle) : le ciel se déforme avec nous
        vec3 rdL = aberrate(rd0, normalize(-uCamPos), uAberr.y);
        vec3 ax = cross(rd, rdL);
        float sa = length(ax);
        if (sa > 1e-5){
          trailAx = ax / sa;
          trailAng = atan(sa, dot(rd, rdL));
          for (int k = 1; k <= 4; k++){
            float a = trailAng * float(k) / 4.0;
            vec3 dk = dir * cos(a) + cross(trailAx, dir) * sin(a) + trailAx * dot(trailAx, dir) * (1.0 - cos(a));
            bg += starPts(dk) * (0.75 - 0.15 * float(k));
          }
        }
      }
      if (uSkyOn > 0.5){
        // Image secondaire (rayon passé de l'autre côté de l'axe caméra → trou noir) : ses objets sont comprimés en
        // anneau fin autour de l'ombre (ex. S3, galaxie aspirée), exagéré ici car le ciel est traité comme infiniment
        // lointain alors que ses objets ont une position finie, parfois proche du trou noir. Atténuation progressive :
        // le poids passe continûment de 1 à uSkySec.x autour de l'anneau d'Einstein (source pile derrière, β = 0).
        float wsec = 1.0;
        if (uSkySec.x < 1.0){
          vec3 ax = normalize(-uCamPos);
          vec3 it = rd - ax * dot(ax, rd);
          float beta = dot(dir - ax * dot(ax, dir), it) * inversesqrt(max(dot(it, it), 1e-12));
          wsec = mix(uSkySec.x, 1.0, smoothstep(-uSkySec.y, uSkySec.y * 0.25, beta));
        }
        bg += wsec * skyAt(dir);
        if (trailAng > 0.0){
          // traînées du ciel profond (galaxies, nébuleuses) pendant la plongée
          for (int k = 1; k <= 3; k++){
            float a = trailAng * float(k) / 3.0;
            vec3 dk = dir * cos(a) + cross(trailAx, dir) * sin(a) + trailAx * dot(trailAx, dir) * (1.0 - cos(a));
            bg += wsec * skyAt(dk) * (0.6 - 0.15 * float(k));
          }
        }
      }
      if (uNebC.w > 0.0 && uNebF < 1.0){
        // 4 · nébuleuse derrière le trou noir : devant le fond (sa poussière masque les étoiles), lentille gratuite
        vec2 nuv;
        float cv = nebCov(dir, nuv);
        vec4 nb = cv > 0.0 ? textureLod(uNebTex, nuv, 0.0) * cv : vec4(0.0);
        // de près (patch cadré sur la caméra) : là où le rayon courbé sort du patch, le gaz vu est surtout entre la
        // caméra et le trou noir → rayon droit, en fondu (sinon une bulle vide entoure le trou noir)
        if (uNebFill > 0.5 && cv < 1.0) nb += (1.0 - cv) * nebAt(rd);
        float g = uNebC.w * (1.0 - uNebF);
        bg = bg * (1.0 - nb.a * min(g, 1.0)) + nb.rgb * g;
      }
      // anneau de photons : rayons qui ont frôlé la sphère de photons (r = 1.5)
      float ring = exp(-pow((rmin - 1.5) * 6.0, 2.0));
      vec3 ringCol = mix(mix(uC2, uC3, 0.6), mix(uW2, uW3, 0.4) * 3.0, uWhite.x);
      acc_col += (1.0 - alpha * 0.7) * ring * ringCol * 0.45 * uIntensity;
      if (uWhite.x > 0.0){
        // 3 · halo du trou blanc : lumière émise autour de l'horizon (décroît avec le paramètre d'impact)
        acc_col += (1.0 - alpha * 0.5) * uWhite.w * uWhite.x * mix(uW2, uW1, smoothstep(2.6, 9.0, b)) * exp(-(b - 2.598) * 0.45) * 0.6;
      }
    }
    if (uAberr.x > 0.0){
      // Doppler de la chute : le ciel de l'avant s'éclaire fort, le disque (déjà très brillant de près) beaucoup moins
      acc_col *= pow(dop, 0.4) * (1.0 - uDive.z);   // en fin de chute le disque est derrière nous : il s'efface
      bg *= pow(dop, 1.3);
    }
    acc_col += (1.0 - alpha) * bg;
    // alpha = transmission vers le fond : sert à composer les étoiles aspirées (pleine résolution) dans la passe finale
    // (trou blanc : alpha négatif, lu par la composition finale : −1 sur l'horizon (pas de vignette), jusqu'à −2 sur
    //  son cœur (part de blanc pur))
    float trans = captured ? -(min(uWhite.x, 1.0) + whiteCore) : (1.0 - alpha);
    if (uNebC.w > 0.0 && uNebF > 0.0){
      // 4 · caméra dans la nébuleuse (traversée) : le gaz est devant tout, trou noir compris (rayon droit, pas de lentille)
      vec4 nb = nebAt(rd);
      float g = uNebC.w * uNebF;
      acc_col = acc_col * (1.0 - nb.a * min(g, 1.0)) + nb.rgb * g;
      trans *= 1.0 - nb.a * min(g, 1.0);
    }
    if (uDive.x > 0.0){
      // 2 · plongée : la lumière reçue de l'avant est décalée vers le bleu (selon D quand la caméra tombe) et plus brillante
      float l = dot(acc_col, vec3(0.2126, 0.7152, 0.0722));
      vec3 tint = vec3(0.22, 0.5, 1.35);
      float bl = uDive.x * (uAberr.x > 0.0 ? smoothstep(0.7, 2.0, dop) : 1.0);
      acc_col = mix(acc_col, mix(acc_col * tint, l * tint, 0.5), bl) * (1.0 + uDive.y);
    }
    if (uTunnel.x > 0.0){
      // 2 · entrée dans le trou de ver : fondu enchaîné (l'ombre devient la gorge, le ciel déformé devient les parois)
      acc_col = mix(acc_col, tunnelCol(uv), uTunnel.x);
      trans *= 1.0 - uTunnel.x;
    }
    gl_FragColor = vec4(acc_col, trans);
  }
`;
