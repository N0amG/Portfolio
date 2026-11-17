import { NextResponse, type NextRequest } from "next/server";
import { LAB_PREFIX, isLabHost, labOrigin } from "@/lib/hosts";

const inLab = (pathname: string) => pathname === LAB_PREFIX || pathname.startsWith(`${LAB_PREFIX}/`);

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
    const url = request.nextUrl.clone();
    // /robots.txt du lab : route dédiée (le nom "robots.txt" est réservé par Next)
    const path = pathname === "/robots.txt" ? "/robots" : pathname;
    url.pathname = path === "/" ? LAB_PREFIX : `${LAB_PREFIX}${path}`;
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
