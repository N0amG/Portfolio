"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRightIcon, ArrowUpRightIcon, CopyIcon, PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { FadeIn } from "@/components/Reveal";
import { ctaClass } from "@/components/Navbar";
import { copyEmail } from "@/lib/copyEmail";
import { site } from "@/lib/site";

type Status = "idle" | "loading" | "success" | "error" | "ratelimit";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-[0.9375rem] font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const phone = site.phone.trim();
  const phoneDigits = phone.replace(/[^\d+]/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        setName("");
        setEmail("");
        setMessage("");
        setStatus("success");
        toast("Message envoyé", { description: "Je reviens vers vous rapidement." });
      } else if (res.status === 429) {
        setStatus("ratelimit");
        toast("Limite d'envoi atteinte", { description: "Merci de patienter 5 minutes." });
      } else {
        setStatus("error");
        toast("Échec de l'envoi", { description: "Réessayez, ou écrivez directement par email." });
      }
    } catch {
      setStatus("error");
      toast("Échec de l'envoi", { description: "Réessayez, ou écrivez directement par email." });
    }
  };

  const disabled = status === "loading" || status === "ratelimit";

  return (
    <div className="shell pb-24 pt-32 md:pb-36 md:pt-40">
      <div className="grid gap-14 md:grid-cols-12 md:gap-12">
        {/* Colonne infos */}
        <aside className="md:col-span-5">
          <h1 className="f-display text-[clamp(3rem,5.2vw,4.75rem)] leading-[1] tracking-[-0.03em] [--wght:390]">
            {[
              <>
                Écrivez-<em className="text-accent">moi.</em>
              </>,
            ].map((line, i) => (
              <span key={i} className="-my-[0.1em] block overflow-hidden py-[0.1em]">
                <span className="hero-rise block" style={{ animationDelay: `${0.06 + i * 0.09}s` }}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p className="hero-up mt-8 max-w-[40ch] text-lg leading-relaxed text-muted" style={{ animationDelay: "0.3s" }}>
            Un site à créer, une réservation en ligne, un site existant à améliorer ? Décrivez votre besoin en quelques
            lignes : je reviens vers vous avec mes questions ou une première estimation. Le premier échange et le devis
            sont sans engagement.
          </p>

          <FadeIn delay={0.2} className="mt-12 space-y-1 border-t border-line pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 py-2">
              <span className="text-muted">Email</span>
              <span className="flex items-center gap-1">
                <a href={`mailto:${site.email}`} className="u-link font-medium">
                  {site.email}
                </a>
                <button
                  type="button"
                  onClick={copyEmail}
                  aria-label="Copier l'adresse email"
                  className="grid h-11 w-11 place-items-center rounded-full text-muted transition-colors hover:bg-alt hover:text-ink"
                >
                  <CopyIcon size={16} />
                </button>
              </span>
            </div>
            {phone && (
              <div className="flex flex-wrap items-center justify-between gap-3 py-2">
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
              </div>
            )}
            {site.socials.map((s) => (
              <div key={s.href} className="flex items-center justify-between gap-3 py-2">
                <span className="text-muted">{s.label}</span>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="u-link inline-flex items-center gap-1 font-medium">
                  {s.handle} <ArrowUpRightIcon size={12} />
                </a>
              </div>
            ))}
          </FadeIn>
        </aside>

        {/* Formulaire */}
        <FadeIn delay={0.15} className="md:col-span-7">
          <form onSubmit={handleSubmit} className="rounded-[28px] bg-card p-6 shadow-card md:p-10">
            <p className="f-display text-[1.75rem] leading-tight [--wght:450]">Votre message</p>
            <p className="mt-1 text-[0.9375rem] text-muted">Tous les champs sont obligatoires.</p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <Field label="Votre nom" htmlFor="c-name">
                <input
                  id="c-name"
                  className="field"
                  placeholder="Jeanne Martin"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Votre email" htmlFor="c-email">
                <input
                  id="c-email"
                  className="field"
                  placeholder="jeanne@boutique.fr"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            </div>
            <div className="mt-6">
              <Field label="Votre projet" htmlFor="c-message">
                <textarea
                  id="c-message"
                  className="field min-h-44 resize-y"
                  placeholder="Votre commerce, ce que vous aimeriez sur votre site, le délai, le budget si vous l'avez déjà…"
                  rows={6}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-8 flex flex-col-reverse items-start justify-between gap-5 sm:flex-row sm:items-center">
              <p className="min-h-6 text-[0.9375rem] text-muted" aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={status}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className={`block ${status === "success" ? "font-semibold text-ink" : status === "error" || status === "ratelimit" ? "font-semibold text-accent-ink" : ""}`}
                  >
                    {
                      {
                        idle: "",
                        loading: "Envoi en cours…",
                        success: "Message envoyé, je reviens vers vous rapidement.",
                        error: "Erreur lors de l'envoi. Réessayez, ou écrivez-moi par email.",
                        ratelimit: "Limite atteinte, patientez 5 minutes.",
                      }[status]
                    }
                  </motion.span>
                </AnimatePresence>
              </p>
              <button type="submit" disabled={disabled} className={`${ctaClass} h-14 px-8 text-lg disabled:opacity-50`}>
                {status === "loading" ? "Envoi…" : "Envoyer le message"}
                <ArrowRightIcon size={18} weight="bold" className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        </FadeIn>
      </div>
    </div>
  );
}
