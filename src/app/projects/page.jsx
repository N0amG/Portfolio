import MainWrapper from '@/components/MainWrapper';

export default function Project() {
	// Page de présentation des projets
	const project = {
		title: "Mon Vieux Grimoire",
		description: "Application web de notation de livres avec Express/MongoDB, intégrant authentification, sécurisation des données et gestion d’images.",
		tags: ["Node.js", "MongoDB", "Express", "Multer"],
		slug: "mon-vieux-grimoire"
	};

	return (
		// Conteneur principal de la page projets
		<div>
			<h1>Project</h1>
			{/* Exemple d'affichage d'une card projet (à remplacer par une vraie liste plus tard) */}
			Ajoute ici des cards avec titre, description courte, et tag techno. Exemple :

			<pre>{JSON.stringify(project, null, 2)}</pre>
		</div>
	)
}
