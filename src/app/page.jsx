import Banner from '@/components/Banner'

export default function Home() {
	return (
		<main className='flex min-h-screen h-[3000px] flex-col items-center'>
			<Banner />

			<section id="about" className='flex flex-col justify-center w-full bg-background text-foreground pt-30'>
				<h2>A propos de moi</h2>
				<p>
					Salut, moi c’est Noam 👋 Développeur web passionné par
					l’I.A, le développement applicatif et les projets techniques
					innovants. Diplomé d'un bac +2 en developpemenbt web, je
					construis des projets robustes en front comme en back.
				</p>

        <br/>
        <p className='text-justify '>
        Je m'appelle Noam Guez, développeur web basé à Lyon. Actuellement en fin de parcours Bac+2 (OpenClassrooms - Développement Web, mai 2025), je renforce ma formation par un BTS SIO option SLAM aux Chartreux et une immersion intensive en langage C à l’école 42 Lyon.

        Je suis à l’aise aussi bien avec le développement front-end (HTML, CSS, JS, Vue.js) que back-end (PHP, MySQL, Python, C). Je m’intéresse particulièrement aux applications web, à l’intelligence artificielle, à la cybersécurité et au développement de jeux vidéo.

        Autonome, curieux et dynamique, j’ai appris à gérer la pression lors de périodes de rushs intensives (école 42, projets d'équipe). Je suis aussi sociable, habitué au travail collaboratif, et toujours motivé à apprendre de nouvelles technos.

        🎓 **Formations :**  
        - Bac+2 OpenClassrooms – Développement Web (2025)  
        - BTS SIO SLAM – Les Chartreux Lyon (2024–2026)  
        - Piscine C – École 42 Lyon (2024)  
        - Bac général – Mention Bien (Spécialités Maths/NSI)

        🛠️ **Compétences principales :**  
        - **Web** : HTML, CSS, JavaScript, PHP, Vue.js, MySQL  
        - **Back** : Python (CTk, Pygame), C, C#, C++  
        - **Systèmes** : Linux (Ubuntu/Debian), Windows  
        - **Outils** : VS Code, GitHub, IA, Pack Office

        🔗 [Mon GitHub](https://github.com/N0amG)  
        🔗 [Mon LinkedIn](https://www.linkedin.com/in/noam-guez-0ba691261)

        </p>
			</section>
		</main>
	)
}
