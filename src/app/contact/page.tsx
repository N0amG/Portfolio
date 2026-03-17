"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setRateLimitError(false);
    setIsError(false);
    setIsSuccess(false);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    setIsLoading(false);

    if (res.ok) {
      setName("");
      setEmail("");
      setMessage("");
      setIsSuccess(true);
      setIsError(false);
    } else {
      if (res.status === 429) setRateLimitError(true);
      setIsError(true);
      setIsSuccess(false);
    }
  };

  return (
    <div className="pt-24">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-12 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left side */}
          <div className="space-y-12">
            <AnimatedSection animation="fade-right">
              <div className="max-w-md">
                <h2 className="text-5xl lg:text-6xl font-black tracking-tighter mb-6 leading-[1.1] text-base-content">
                  Let&apos;s build{" "}
                  <span className="text-primary">something</span> great
                  together.
                </h2>
                <p className="text-base-content/60 text-lg leading-relaxed">
                  Je suis actuellement disponible pour du freelance et des
                  opportunités à temps plein. Si vous avez un projet en tête, ou
                  simplement envie de discuter, n&apos;hésitez pas.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1} animation="fade-left">
              <div className="space-y-8">
                <motion.div
                  className="flex items-start gap-4"
                  whileHover={{ x: 6 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="bg-primary/10 p-3 rounded-lg text-primary">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-base-content/50 uppercase tracking-widest">
                      Email
                    </p>
                    <a
                      className="text-xl font-semibold text-base-content hover:text-primary transition-colors"
                      href="mailto:noamguez0@gmail.com"
                    >
                      noamguez0@gmail.com
                    </a>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start gap-4"
                  whileHover={{ x: 6 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="bg-secondary/10 p-3 rounded-lg text-secondary">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-base-content/50 uppercase tracking-widest">
                      Réseaux sociaux
                    </p>
                    <div className="flex gap-4">
                      {[
                        {
                          label: "GitHub",
                          href: "#",
                          hoverClass: "hover:bg-primary hover:border-primary hover:text-primary-content",
                          icon: (
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          ),
                        },
                        {
                          label: "LinkedIn",
                          href: "#",
                          hoverClass: "hover:bg-secondary hover:border-secondary hover:text-secondary-content",
                          icon: (
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          ),
                        },
                        {
                          label: "Twitter",
                          href: "#",
                          hoverClass: "hover:bg-accent hover:border-accent hover:text-accent-content",
                          icon: (
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          ),
                        },
                      ].map((social, i) => (
                        <motion.a
                          key={social.label}
                          className={`h-10 w-10 flex items-center justify-center rounded-full border border-base-content/10 ${social.hoverClass} transition-all text-base-content/60`}
                          href={social.href}
                          aria-label={social.label}
                          whileHover={{ scale: 1.15, rotate: i % 2 === 0 ? 5 : -5 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                            {social.icon}
                          </svg>
                        </motion.a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2} animation="blur">
              <div className="pt-8 border-t border-base-content/10">
                <div className="w-full h-48 rounded-xl bg-base-200 overflow-hidden grayscale opacity-70 hover:opacity-100 transition-opacity">
                  <div className="h-full w-full bg-gradient-to-br from-base-200 to-base-300" />
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Right side - Form */}
          <AnimatedSection delay={0.15} animation="fade-left">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-base-200/50 p-8 lg:p-12 rounded-2xl border border-base-content/10 shadow-2xl shadow-primary/5"
            >
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1 text-base-content">
                      Nom complet
                    </label>
                    <input
                      className="input input-bordered w-full"
                      placeholder="John Doe"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1 text-base-content">
                      Adresse email
                    </label>
                    <input
                      className="input input-bordered w-full"
                      placeholder="john@example.com"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold ml-1 text-base-content">
                    Message
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full resize-none"
                    placeholder="Parlez-moi de votre projet..."
                    rows={6}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`btn btn-primary w-full shadow-xl shadow-primary/20 group ${
                    isLoading || rateLimitError ? "btn-disabled" : ""
                  }`}
                  type="submit"
                  disabled={isLoading || rateLimitError}
                >
                  {isLoading ? "Envoi en cours..." : "Envoyer le message"}
                  <svg
                    className="h-5 w-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </motion.button>
                {isSuccess && (
                  <p className="text-center text-sm text-success mt-2">
                    Message envoyé avec succès !
                  </p>
                )}
                {isError && !rateLimitError && (
                  <p className="text-center text-sm text-error mt-2">
                    Erreur lors de l&apos;envoi. Veuillez réessayer.
                  </p>
                )}
                {rateLimitError && (
                  <p className="text-center text-sm text-error mt-2">
                    Limite d&apos;envoi atteinte. Merci de patienter 5 minutes.
                  </p>
                )}
                <p className="text-center text-xs text-base-content/40 mt-4">
                  Temps de réponse habituel : sous 24 heures.
                </p>
              </form>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
