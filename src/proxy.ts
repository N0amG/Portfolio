import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { LAB_PREFIX, isLabHost, labOrigin } from "@/lib/hosts";

const inLab = (pathname: string) => pathname === LAB_PREFIX || pathname.startsWith(`${LAB_PREFIX}/`);

/* ───────────────────────────────────────────────────────────
   Lab privé (temporaire, jusqu'à l'ouverture)
   - Tout le monde voit la page « en construction » (/lab/construction).
   - lab.noamguez.fr/?acces=<LAB_ACCESS_KEY> pose un cookie httpOnly sur ce navigateur
     → il voit l'expérience. lab.noamguez.fr/?acces=off retire l'accès.
   - Sans variable LAB_ACCESS_KEY, personne n'a accès (sécurité par défaut), sauf en développement
     (NODE_ENV ≠ production) où la vérification est désactivée.
   - À l'ouverture : supprimer ce bloc (et la variable d'environnement).
   ─────────────────────────────────────────────────────────── */
const ACCESS_COOKIE = "lab_access";
const ACCESS_PARAM = "acces";
const CONSTRUCTION = `${LAB_PREFIX}/construction`;

/** Le cookie contient une empreinte de la clé, jamais la clé elle-même. */
const fingerprint = (key: string) => createHash("sha256").update(`lab-access:${key}`).digest("hex");
const expectedToken = () => (process.env.LAB_ACCESS_KEY ? fingerprint(process.env.LAB_ACCESS_KEY) : null);
const sameToken = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * Aiguillage par domaine :
 * - lab.noamguez.fr/x       → sert /lab/x (réécriture, l'adresse reste propre)
 * - lab.noamguez.fr/lab/x   → redirige vers lab.noamguez.fr/x (une seule adresse par page)
 * - noamguez.fr/lab/x       → redirige vers lab.noamguez.fr/x (le lab vit sur son sous-domaine)
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname, search } = request.nextUrl;

  if (isLabHost(host)) {
    if (inLab(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice(LAB_PREFIX.length) || "/";
      return NextResponse.redirect(url, 308);
    }
    const token = expectedToken();

    // Lien d'accès : pose (ou retire) le cookie, puis renvoie vers l'adresse propre, sans la clé
    const given = request.nextUrl.searchParams.get(ACCESS_PARAM);
    if (given !== null) {
      const clean = request.nextUrl.clone();
      clean.searchParams.delete(ACCESS_PARAM);
      const res = NextResponse.redirect(clean, 303);
      if (given === "off") {
        res.cookies.delete(ACCESS_COOKIE);
      } else if (token && sameToken(fingerprint(given), token)) {
        res.cookies.set(ACCESS_COOKIE, token, {
          httpOnly: true,
          secure: request.nextUrl.protocol === "https:",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
      }
      return res;
    }

    const url = request.nextUrl.clone();
    // /robots.txt du lab : route dédiée (le nom "robots.txt" est réservé par Next)
    const path = pathname === "/robots.txt" ? "/robots" : pathname;
    url.pathname = path === "/" ? LAB_PREFIX : `${LAB_PREFIX}${path}`;

    // Sans accès : toute page du lab (sauf robots.txt) affiche « en construction »
    const cookie = request.cookies.get(ACCESS_COOKIE)?.value ?? "";
    // En développement (npm run dev), pas de vérification : l'expérience est toujours accessible.
    const allowed = process.env.NODE_ENV !== "production" || (token !== null && sameToken(cookie, token));
    if (!allowed && path !== "/robots") url.pathname = CONSTRUCTION;
    return NextResponse.rewrite(url);
  }

  if (inLab(pathname)) {
    const target = new URL(pathname.slice(LAB_PREFIX.length) || "/", labOrigin(host));
    target.search = search;
    return NextResponse.redirect(target, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Tout sauf les fichiers internes de Next et les fichiers statiques (images, polices…).
  // robots.txt et sitemap.xml passent par le proxy : le lab a les siens.
  matcher: ["/((?!_next/|.*\\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?|css|js|map|webmanifest)$).*)"],
};
