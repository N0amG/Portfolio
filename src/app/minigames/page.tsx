"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { games, type Game } from "./games";

/* ─── Carte de jeu ─────────────────────────────────────────── */
function GameCard({ game, index }: { game: Game; index: number }) {
    const inner = (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
            whileHover={game.available ? { y: -6, scale: 1.02 } : {}}
            className="game-card group relative flex flex-col overflow-hidden rounded-2xl"
            style={
                {
                    "--card-color": game.color,
                    background: `#111114`,
                    border: `1px solid ${game.color}22`,
                    cursor: game.available ? "pointer" : "default",
                } as React.CSSProperties
            }
        >
            {/* Barre de couleur en haut */}
            <div
                className="h-1 w-full"
                style={{ background: game.color }}
            />

            <div className="flex flex-col gap-3 p-6">
                {/* Emoji + badge */}
                <div className="flex items-start justify-between">
                    <span
                        className="flex size-14 items-center justify-center rounded-xl text-3xl"
                        style={{ background: `${game.color}18` }}
                    >
                        {game.emoji}
                    </span>
                    <span
                        className="mt-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                        style={
                            game.available
                                ? { background: `${game.color}22`, color: game.color }
                                : { background: "#ffffff0d", color: "#ffffff44" }
                        }
                    >
                        {game.available ? "Jouer" : "Bientôt"}
                    </span>
                </div>

                {/* Titre */}
                <h2
                    className="text-xl font-black leading-tight tracking-tight text-white transition-colors duration-200"
                    style={
                        game.available
                            ? {}
                            : {}
                    }
                >
                    {game.title}
                </h2>

                {/* Description */}
                <p className="text-sm leading-relaxed" style={{ color: "#ffffff77" }}>
                    {game.description}
                </p>
            </div>

            {/* Glow au hover si disponible */}
            {game.available && (
                <div
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ boxShadow: `inset 0 0 30px ${game.color}22, 0 0 20px ${game.color}18` }}
                />
            )}
        </motion.div>
    );

    if (game.available && game.href) {
        return <Link href={game.href}>{inner}</Link>;
    }
    return inner;
}

/* ─── Page principale ───────────────────────────────────────── */
export default function MinigamesPage() {
    return (
        <div
            className="relative min-h-screen w-full overflow-x-hidden"
            style={{ background: "#0a0a0c", fontFamily: "'Inter', sans-serif" }}
        >
            {/* Fond animé (radial subtil) */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 60%)",
                }}
            />

            <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-24">
                {/* En-tête */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-16 text-center"
                >
                    {/* Lien retour */}
                    <Link
                        href="/"
                        className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
                        style={{
                            background: "#ffffff0d",
                            color: "#ffffff66",
                            border: "1px solid #ffffff11",
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M19 12H5M12 5l-7 7 7 7" />
                        </svg>
                        Retour au portfolio
                    </Link>

                    {/* Logo / titre principal */}
                    <div className="mt-6 flex flex-col items-center gap-4">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="flex size-20 items-center justify-center rounded-2xl text-5xl"
                            style={{ background: "#ffffff0d", border: "1px solid #ffffff11" }}
                        >
                            🕹️
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-5xl font-black tracking-tight sm:text-7xl"
                            style={{
                                color: "#fff",
                                letterSpacing: "-0.03em",
                                lineHeight: 1,
                            }}
                        >
                            Mini Jeux
                        </motion.h1>


                        <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                            style={{ background: "#660d05", color: "#fff" }}
                        >
                            ⚠️ En construction
                        </motion.span>


                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.35 }}
                            className="max-w-md text-base leading-relaxed sm:text-lg"
                            style={{ color: "#ffffff55" }}
                        >
                            Une collection de petits jeux pour tuer le temps, tester ton cerveau
                            — ou juste te détendre.
                        </motion.p>
                    </div>
                </motion.header>

                {/* Grille de jeux */}
                <main>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {games.map((game, i) => (
                            <GameCard key={game.id} game={game} index={i} />
                        ))}
                    </div>

                    {/* Message "en construction" */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-12 text-center"
                    >
                        <p className="text-sm" style={{ color: "#ffffff33" }}>
                            Les jeux arrivent bientôt — garde un œil 👀
                        </p>
                    </motion.div>
                </main>

                {/* Footer minimaliste */}
                <footer className="mt-24 flex items-center justify-center">
                    <p className="text-xs" style={{ color: "#ffffff22" }}>
                        Fait avec ☕ par{" "}
                        <Link
                            href="/"
                            className="transition-colors duration-200 hover:text-white"
                            style={{ color: "#ffffff44" }}
                        >
                            Noam Guez
                        </Link>
                    </p>
                </footer>
            </div>
        </div>
    );
}
