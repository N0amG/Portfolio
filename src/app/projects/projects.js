// Liste centralisée des projets
const projects = [
	{
		title: 'Booki',
		url: 'https://n0amg.github.io/OC_Booki/',
		subtitle: 'Aplication web/mobile de réservation hotelière',
		description: [
			"(scénario fictif)",
			"",
			"La start-up Booki souhaitait réaliser leur site internet et m'ont chargés d'intégrer son interface. Il permet aux usagers de trouver des hébergements et des activités dans la ville de leur choix. J'ai utilisé les langages HTML et CSS afin de reproduire la maquette qui m'était fournie.",
			"",
			"Le site est responsive, ce qui signifie que le contenu s'adapte selon la taille d'écran. Le site a une version tablette ainsi qu'une version mobile."
		],
		languages: ['HTML', 'CSS', 'Responsive'],
		imgCount: 4
	},
	{
		title: 'Sophie Bluel',
		subtitle: "Portfolio d'une architecte d'intérieur",
		url: 'https://github.com/N0amG/OC_Sophie_Bluel',
		description: [
			"(scénario fictif)",
			"",
			"Une équipe travaillant sur le portfolio d'une architecte d'intérieur m'a recruté pour que je m'occupe de la partie Frontend. J'ai utilisé le langage Javascript mêlé au HTML/CSS afin de rendre la page dynamique et faire des requêtes à l'API.",
			"",
			"Le site est composé d'une présentation professionnelle ainsi que d'un formulaire de contact. Il possède une page de connexion qui permet à l'architecte de s'identifier. En mode connecté, il est possible d'ajouter ou de supprimer des projets dynamiquement via une modale. Les projets peuvent être triés par catégorie dans la page principale.",
		],
		languages: ['HTML', 'CSS', 'Javascript'],
		imgCount: 3
	},
	{
		title: 'Nina Carducci',
		subtitle: "Optimisation du site web d'une photographe.",
		url: 'https://n0amg.github.io/OC_Nina_Carducci/',
		description: [
			"(scénario fictif)",
			"",
			"Après avoir remarqué de nombreux problèmes sur le site de la photographe Nina Carducci, je l'ai contacté afin de lui proposer mes services.",
			"",
			"J'ai tout d'abord réglé quelques erreurs de code qui faisaient disfonctionner le site. J'ai ensuite réalisé un audit et un rapport d'intervention afin de lister les modifications apportées.",
			"",
			"Les performances du site ont été nettement améliorées, en grande partie grâce à la compression des images. Le site a été restructuré et adapté afin d'être accessible par tout type d'utilisateur (notamment les personnes en situations de handicape).",
			"",
			"J'ai aussi rendu le code plus clair et j'ai ajouté des balises afin d'améliorer son référencement par les navigateurs de recherche ( SEO ).",
		],
		languages: ['HTML', 'CSS', 'Javascript', 'SEO', 'Performances', 'Accessibilité'],
		imgCount: 3
	},
	{
		title: 'Kasa',
		subtitle: "Site de location d’appartements entre particuliers.",
		description: [
			"(scénario fictif)",
			"",
			"L'entreprise de location immobilière Kasa entamait la refonte de son site internet. En tant que développeur Frontend freelance, j'ai été chargé de recoder le site en utilisant le framework javascript React. Le site permet aux utilisateurs de trouver un appartement à louer et de se renseigner sur celui-ci.",
			"",
			"J'ai donc reproduis la maquette en créant les composants React nécessaires. Le style du site a été réalisé avec le langage Sass qui permet de rendre l'utilisation du CSS plus pratique. Quelques petites animations ont été réalisées, par exemple lors de l'ouverture des collapses. Le site est responsive et donc adapté pour les utilisateurs sur mobile.",
		],
		url: "https://github.com/N0amG/OC_Kasa",
		languages: ['React', 'CSS', 'SASS', 'Responsive'],
		imgCount: 4
	},
	{
		title: 'Mon Vieux Grimoire',
		url: "https://github.com/N0amG/OC_Mon_Vieux_Grimoire",
		subtitle: "Site d'information, de publication et de notation de livres.",
		description: [
			"(scénario fictif)",
			"",
			`Un collègue souhaitait réaliser un site de référencement et de notation de livres pour une chaîne de librairie nommée "Mon vieux grimoire". J'ai accepté de m'occuper de la partie Backend qui devait être réalisée avec le framework Express de Nodejs, en communiquant avec une base de données MongoDB.`,
			"",
			"J'ai tout d'abord réalisé les méthodes qui permettent aux utilisateurs de s'inscrire et de se connecter. J'ai ensuite réalisé les routes API qui servent à créer, modifier ou supprimer des livres. Les images des livres sont stockées avec Multer et compressées avec Sharp. J'ai finis par coder les routes qui permettent aux utilisateurs de noter les livres postés sur le site. Les 3 livres les mieux notés apparaissent sur chaque page.",
			"",
			"Difficultés rencontrées :",
			"J’ai bloqué au début du projet. Après avoir installé les packages MongoDB avec npm, je ne comprenais pas pourquoi j’avais une erreur de connexion à la base de données, peu importe ce que je faisais. Rien ne fonctionnait, jusqu’à ce que, désespéré, je désinstalle complètement Node.js de mon PC pour le réinstaller… et c’était bien ça ! Node était corrompu, tout comme certains packages installés, mais aucune erreur ne remontait en console."
		],
		languages: ['Node', 'Javascript', 'CSS', 'Express', 'MongoDB', 'Multer', 'Sharp'],
		imgCount: 4
	},
	{
		title: 'Qwenta',
		subtitle: 'Gestion du projet "Menu Maker" de l\'entreprise Qwenta',
		url: "https://github.com/N0amG/OC_Qwenta",
		description: [
			"(scénario fictif)",
			"",
			`En tant que développeur de l'agence Webgencia, j'ai été choisi afin de planifier notre prochain projet. Il s'agissait du nouveau site internet "Menu Maker" de l'entreprise Qwenta.`,
			"",
			"Le site permet aux restaurateurs de créer un menu de restaurant personnalisé afin de l'utiliser comme ils le souhaitent.",
			"",
			"J'ai tout d'abord effectué une veille technologique organisée afin de sélectionner les outils du projet. J'ai ensuite créé le document qui liste les détails des spécifications techniques. J'ai alors réparti les tâches au sein d'un tableau Kanban sur Notion afin d'organiser le projet. J'ai finis par préparer la présentation au Product Owner afin de le briefer.",
			"",
			"Difficultés rencontrées :",
			"J’ai rencontré quelques difficultés, car organiser un projet est très différent de le réaliser. Étant plus habitué à exécuter des sprints plutôt qu’à les planifier, j’ai été un peu dépaysé au début."
		],
		languages: ["Feedly", "Notion"],
		imgCount: 5
	},
	{
		title: 'Portfolio',
		subtitle: "Le portfolio que vous êtes en train de parcourir",
		url: "https://github.com/N0amG/Portfolio",
		description: [
			"Le portfolio que vous consultez est le résultat de mon dernier projet de formation bac +2. J’ai choisi de le concevoir avec Next.js pour sa flexibilité et ses performances, et Tailwind CSS pour son approche utilitaire qui me permet de créer des interfaces propres et réactives rapidement.",
			"",
			"Entièrement responsive, il s’adapte à tous les types d’appareils, et il est hébergé sur Vercel pour garantir des temps de chargement rapides et une gestion fluide. À travers ce site, vous pouvez explorer mon parcours, découvrir mes compétences techniques et créatives, et consulter mes projets les plus récents.",
			"",
			"De plus, une page de contact vous permet de me joindre facilement pour toute question ou collaboration."

		],
		languages: ['NextJS', 'Tailwind', 'Responsive', 'Hébergement'],
		imgCount: 1
	},
	{
		title: 'Books Online Scraper',
		subtitle: "Projet de scraping du site Books to Scrape",
		url: "https://github.com/N0amG/OC_Books_Online",
		description: [
			"Ce projet met en œuvre un pipeline ETL (Extract, Transform, Load) complet pour collecter des données depuis le site Books to Scrape. L'étape d'extraction parcourt récursivement les catégories et produits, récupérant informations et images sur un millier de livres.",
			"",
			"La phase de transformation assure le nettoyage des données (encodage, formatage des prix, gestion des caractères spéciaux), garantissant leur qualité. Enfin, le chargement organise les résultats dans une structure de fichiers CSV et dossiers d'images cohérente.",
			"",
			"L'architecture est optimisée pour la performance (via des sessions HTTP réutilisées) et la maintenabilité."
		],
		languages: ['Python', 'BeautifulSoup', 'Requests', 'CSV', 'Scraping', 'ETL'],
		imgCount: 5
	},
	{
		title: 'Manager de Tournois',
		subtitle: "Un logiciel de gestion de tournois d'échecs en console",
		url: "https://github.com/N0amG/OC_ChessTournament",
		description: [
			"Application de gestion de tournois d'échecs développée en Python, utilisant le système suisse pour l'organisation des matchs.",
			"",
			"Conçue avec une architecture MVC (Modèle-Vue-Contrôleur), elle sépare strictement la logique métier, l'interface utilisateur et la gestion des données. L'interface en ligne de commande est enrichie grâce à la librairie Rich pour une meilleure expérience utilisateur.",
			"",
			"Les données des joueurs et des tournois sont persistées dans des fichiers JSON avec un système de stockage optimisé. Le code respecte les normes PEP 8, validé via Flake8 pour garantir sa qualité et sa maintenabilité."
		],
		languages: ['Python', 'MVC', 'JSON', 'Rich', 'Flake8'],
		imgCount: 3
	},
	{
		title: 'AlgoInvest & Trade',
		subtitle: "Algorithme d'optimisation de portefeuille financier",
		url: "https://github.com/N0amG/OC_Algorithmie",
		description: [
			"Application Python conçue pour résoudre le problème du sac à dos (Knapsack Problem) appliqué à l'investissement financier. L'objectif est de sélectionner la meilleure combinaison d'actions pour maximiser le profit au bout de 2 ans, avec un budget limité à 500€.",
			"",
			"Le projet compare deux approches : un algorithme de force brute (Brute Force) qui teste toutes les combinaisons possibles, et un algorithme glouton (Greedy) optimisé pour la performance.",
			"",
			"L'algorithme glouton permet de traiter des fichiers contenant des milliers d'actions en une fraction de seconde (complexité O(n log n)), offrant un compromis idéal entre rapidité d'exécution et précision du résultat."
		],
		languages: ['Python', 'Algorithmique', 'Performance', 'CSV'],
		imgCount: 3
	},
];

export default projects;
