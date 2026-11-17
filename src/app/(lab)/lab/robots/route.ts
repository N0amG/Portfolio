import { lab } from "@/lab/config";

/** robots.txt de lab.noamguez.fr (servi sur /robots.txt via src/proxy.ts). */
export function GET() {
  const body = lab.indexable ? "User-agent: *\nAllow: /\n" : "User-agent: *\nDisallow: /\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
