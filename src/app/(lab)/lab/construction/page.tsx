import type { Metadata } from "next";
import "./construction.css";
import { lab } from "@/lab/config";

/**
 * Page de garde du lab, servie à tous les visiteurs tant que le lab est privé
 * (voir src/proxy.ts : seul un navigateur qui a la clé d'accès voit l'expérience).
 * Styles autonomes (construction.css) : ne dépend pas de la DA de l'expérience.
 */
export const metadata: Metadata = {
  title: "En construction",
  robots: { index: false, follow: false },
};

export default function LabConstruction() {
  return (
    <main className="lab-construction">
      <div aria-hidden className="lc-grid" />
      <div className="lc-inner">
        <p className="lc-muted lc-small">lab.noamguez.fr</p>
        <h1 className="lc-title">
          Le lab<span className="lc-caret" aria-hidden />
        </h1>
        <p className="lc-lead">
          Prototypes, interactions et expériences web. <span className="lc-strong">En construction.</span>
        </p>
        <div className="lc-footer">
          <span className="lc-signal">
            <span className="lc-dot" aria-hidden />
            Ouverture prochaine
          </span>
          <a href={lab.mainUrl} className="lc-link">
            Site principal : noamguez.fr
          </a>
        </div>
      </div>
    </main>
  );
}
