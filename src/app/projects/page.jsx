export default function Project() {
	const project = {
		title: "Mon Vieux Grimoire",
		description: "Application web de notation de livres avec Express/MongoDB, intégrant authentification, sécurisation des données et gestion d’images.",
		tags: ["Node.js", "MongoDB", "Express", "Multer"],
		slug: "mon-vieux-grimoire"
	  };

	return (
		<div>
			<h1>Project</h1>
			Ajoute ici des cards avec titre, description courte, et tag techno. Exemple :

			<pre>{JSON.stringify(project, null, 2)}</pre>
		</div>
	)
}
