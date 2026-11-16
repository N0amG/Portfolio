import { FadeIn, MaskLines } from "./Reveal";

/** En-tête de section : un titre Fraunces qui monte, un chapeau optionnel. */
export default function SectionIntro({
  title,
  intro,
  className,
}: {
  title: string;
  intro?: string;
  className?: string;
}) {
  return (
    <div className={`max-w-2xl ${className ?? ""}`}>
      <MaskLines as="h2" className="f-display text-[clamp(2rem,3.6vw,3.25rem)] [--wght:450]" lines={[title]} />
      {intro && (
        <FadeIn delay={0.1}>
          <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p>
        </FadeIn>
      )}
    </div>
  );
}
