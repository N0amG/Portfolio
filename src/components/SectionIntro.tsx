import { FadeIn, MaskLines } from "./Reveal";

/** En-tête de section : petit libellé terracotta, titre Fraunces qui monte, chapeau. */
export default function SectionIntro({
  eyebrow,
  title,
  intro,
  className,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  className?: string;
}) {
  return (
    <div className={`max-w-2xl ${className ?? ""}`}>
      <p className="f-label text-accent-ink">{eyebrow}</p>
      <MaskLines as="h2" className="f-display mt-3 text-[clamp(2rem,3.6vw,3.25rem)] [--wght:450]" lines={[title]} />
      {intro && (
        <FadeIn delay={0.1}>
          <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p>
        </FadeIn>
      )}
    </div>
  );
}
