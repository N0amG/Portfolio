"use client";

import { ArrowUpRightIcon, PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { FadeIn } from "@/components/Reveal";
import EmailActions from "@/components/EmailActions";
import { site } from "@/lib/site";

export default function ContactPage() {
  const phone = site.phone.trim();
  const phoneDigits = phone.replace(/[^\d+]/g, "");

  return (
    <div className="shell pb-16 pt-28 md:pb-24 md:pt-36">
      <h1 className="f-display text-[clamp(3rem,7vw,6.5rem)] leading-[1] tracking-[-0.03em] [--wght:390]">
        <span className="-my-[0.1em] block overflow-hidden py-[0.1em]">
          <span className="hero-rise block" style={{ animationDelay: "0.06s" }}>
            Écrivez-<em className="text-accent">moi.</em>
          </span>
        </span>
      </h1>
      <p className="hero-up mt-6 max-w-[42ch] text-lg leading-relaxed text-muted md:text-[1.25rem]" style={{ animationDelay: "0.2s" }}>
        Décrivez votre projet en quelques lignes. Le premier échange et le devis sont sans engagement.
      </p>

      {/* L'adresse, à copier ou à ouvrir directement dans Gmail */}
      <FadeIn delay={0.15} className="mt-10 md:mt-14">
        <div className="rounded-[28px] bg-card p-6 shadow-card sm:p-8 md:p-12">
          <p className="f-label text-muted">Email</p>
          <div className="mt-4">
            <EmailActions size="lg" />
          </div>
          <p className="mt-6 text-[0.9375rem] text-muted">
            Une autre messagerie ?{" "}
            <a href={`mailto:${site.email}`} className="u-link font-medium text-ink">
              Ouvrir avec votre application mail
            </a>
            .
          </p>
        </div>
      </FadeIn>

      {/* Autres moyens de me joindre */}
      <FadeIn delay={0.25} className="mt-10 border-t border-line pt-4 md:mt-14">
        <ul>
          {phone && (
            <li className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
              <span className="text-muted">Téléphone</span>
              <span className="flex items-center gap-4">
                <a href={`tel:${phoneDigits}`} className="u-link inline-flex items-center gap-2 font-medium">
                  <PhoneIcon size={16} /> {phone}
                </a>
                <a
                  href={`https://wa.me/${phoneDigits.replace("+", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="u-link inline-flex items-center gap-1.5 font-medium"
                >
                  <WhatsappLogoIcon size={16} /> WhatsApp
                </a>
              </span>
            </li>
          )}
          {site.socials.map((s) => (
            <li key={s.href} className="flex items-center justify-between gap-3 border-b border-line py-4">
              <span className="text-muted">{s.label}</span>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="u-link inline-flex min-h-11 items-center gap-1 font-medium">
                {s.handle} <ArrowUpRightIcon size={12} />
              </a>
            </li>
          ))}
        </ul>
      </FadeIn>
    </div>
  );
}
