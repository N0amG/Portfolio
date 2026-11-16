"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowUpRightIcon, CopyIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { FadeIn, MaskLines, DrawRule } from "@/components/Reveal";
import LocalTime from "@/components/LocalTime";
import { copyEmail } from "@/components/CommandMenu";
import { site } from "@/lib/site";

type Status = "idle" | "loading" | "success" | "error" | "ratelimit";

function Field({
  n,
  label,
  children,
}: {
  n: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="group block">
      <span className="f-label flex items-center gap-3 text-muted transition-colors group-focus-within:text-signal">
        <span>{n}</span>
        <span className="h-px w-6 bg-current" />
        <span>{label}</span>
      </span>
      {children}
    </label>
  );
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

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
        toast("Message envoyé", { description: "Merci ! Je vous réponds rapidement." });
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
    <div className="shell pb-24 pt-28 md:pb-36 md:pt-40">
      <p className="f-label mb-6 text-muted">
        <span className="text-signal">(Contact)</span>&nbsp;&nbsp;{site.status}
      </p>
      <MaskLines
        as="h1"
        className="f-display text-[clamp(3.4rem,13vw,14rem)] uppercase [--wght:880]"
        lines={[
          <span key="1" className="f-display" style={{ "--wdth": 64 } as React.CSSProperties}>
            Écrivez-
          </span>,
          <span key="2" className="f-display flex items-baseline" style={{ "--wdth": 140 } as React.CSSProperties}>
            moi<span className="text-signal">.</span>
          </span>,
        ]}
      />

      <div className="grid-12 mt-16 gap-y-16 md:mt-24">
        {/* Colonne infos */}
        <aside className="col-span-4 md:col-span-4">
          <FadeIn>
            <p className="text-pretty max-w-[34ch] text-lg leading-snug">
              Je cherche actuellement une alternance. Si mon profil vous intéresse, écrivez-moi : je réponds en général sous
              24 heures.
            </p>
          </FadeIn>
          <FadeIn delay={0.1} className="mt-12">
            <DrawRule />
            <dl className="f-label divide-y divide-line">
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-muted">Email</dt>
                <dd className="flex items-center gap-3 normal-case">
                  <a href={`mailto:${site.email}`} className="u-link">
                    {site.email}
                  </a>
                  <button type="button" onClick={copyEmail} aria-label="Copier l'adresse email" className="text-muted hover:text-signal">
                    <CopyIcon size={14} />
                  </button>
                </dd>
              </div>
              {site.socials.map((s) => (
                <div key={s.href} className="flex items-center justify-between gap-4 py-4">
                  <dt className="text-muted">{s.label}</dt>
                  <dd>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="u-link inline-flex items-center gap-1 normal-case">
                      {s.handle} <ArrowUpRightIcon size={11} />
                    </a>
                  </dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-muted">Lyon</dt>
                <dd>
                  <LocalTime />
                </dd>
              </div>
            </dl>
          </FadeIn>
        </aside>

        {/* Formulaire */}
        <FadeIn delay={0.15} className="col-span-4 md:col-span-7 md:col-start-6">
          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid gap-12 md:grid-cols-2 md:gap-[var(--gutter)]">
              <Field n="01" label="Votre nom">
                <input
                  className="field"
                  placeholder="Jeanne Martin"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field n="02" label="Votre email">
                <input
                  className="field"
                  placeholder="jeanne@studio.fr"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            </div>
            <Field n="03" label="Votre message">
              <textarea
                className="field min-h-40 resize-none leading-snug"
                placeholder="Le contexte, le poste, le projet…"
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Field>

            <div className="flex flex-col-reverse items-start justify-between gap-6 sm:flex-row sm:items-center">
              <p className="f-label text-muted" aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={status}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className={`block ${status === "success" ? "text-ink" : status === "error" || status === "ratelimit" ? "text-signal" : ""}`}
                  >
                    {
                      {
                        idle: "Tous les champs sont requis",
                        loading: "Envoi en cours…",
                        success: "Message envoyé — merci !",
                        error: "Erreur lors de l'envoi. Réessayez.",
                        ratelimit: "Limite atteinte — patientez 5 minutes",
                      }[status]
                    }
                  </motion.span>
                </AnimatePresence>
              </p>

              <motion.button
                type="submit"
                disabled={disabled}
                whileTap={{ scale: 0.97 }}
                className="group relative flex h-16 items-center gap-6 overflow-hidden bg-ink pl-7 pr-5 text-paper disabled:opacity-50"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 origin-left scale-x-0 bg-signal transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-x-100"
                />
                <span
                  className="f-display relative text-2xl uppercase transition-colors group-hover:text-on-signal"
                  style={{ "--wdth": 110, "--wght": 760 } as React.CSSProperties}
                >
                  {status === "loading" ? "Envoi…" : "Envoyer"}
                </span>
                <span className="relative grid h-9 w-9 place-items-center overflow-hidden transition-colors group-hover:text-on-signal">
                  <ArrowRightIcon size={20} weight="bold" className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-10" />
                  <ArrowRightIcon
                    size={20}
                    weight="bold"
                    className="absolute -translate-x-10 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-0"
                  />
                </span>
              </motion.button>
            </div>
          </form>
        </FadeIn>
      </div>
    </div>
  );
}
