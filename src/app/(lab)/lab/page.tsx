import { lab } from "@/lab/config";

/** Page de garde du lab, en attendant le vrai contenu. */
export default function LabHome() {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden px-6 py-16">
      <div aria-hidden className="lab-grid pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-2xl">
        <p className="text-sm text-[var(--lab-muted)]">lab.noamguez.fr</p>
        <h1 className="mt-6 text-[clamp(2.5rem,8vw,5rem)] font-semibold leading-none tracking-tight">
          Le lab<span className="lab-caret" aria-hidden />
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-[var(--lab-muted)]">
          Prototypes, interactions et expériences web. <span className="text-[var(--lab-fg)]">En construction.</span>
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[var(--lab-line)] pt-6 text-sm">
          <span className="inline-flex items-center gap-2 text-[var(--lab-signal)]">
            <span className="h-2 w-2 rounded-full bg-[var(--lab-signal)]" aria-hidden />
            Ouverture prochaine
          </span>
          <a href={lab.mainUrl} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-[var(--lab-signal)]">
            Site principal : noamguez.fr
          </a>
        </div>
      </div>
    </main>
  );
}
