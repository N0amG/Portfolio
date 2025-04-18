"use client";
import { useEffect, useState } from "react";
import { gradientCss1 } from "../variables";
export default function Header() {
	const [show, setShow] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 0) {
				setShow(true);
			} else {
				setShow(false);
			}
		};
		window.addEventListener("scroll", handleScroll);
		// Vérifie la position au chargement
		handleScroll();
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const gradientCss = "text-md + " + gradientCss1 + " hover:text-white";

	return (
		<header
			className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out transform ${
				show
					? "translate-y-0 opacity-100"
					: "-translate-y-full opacity-0"
			} flex items-center justify-between p-4 bg-gray-800 text-white w-full bg-background text-foreground border-b border-border`}
		>
			<div className="text-lg font-bold">Mon Portfolio</div>
			<nav className="w-4/5">
				<ul className="flex justify-around items-center w-full space-x-4">
					<li>
						<a
							href="/"
							className={gradientCss}
						>
							Accueil
						</a>
					</li>
					<li>
						<a
							href="/projects"
							className={gradientCss}
						>
							Projets
						</a>
					</li>
					<li>
						<a
							href="/contact"
							className={gradientCss}
						>
							Contact
						</a>
					</li>
				</ul>
			</nav>
		</header>
	);
}
