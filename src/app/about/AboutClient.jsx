'use client'
import Dropdown from '@/components/Dropdown'
import DropdownItem from '@/components/DropdownItem'
import Icon from '@/components/Icon'
import { useState } from 'react'

export default function AboutClient(className) {
	const [selectedId, setSelectedId] = useState('bio-1')

	const itemContents = {
		'bio-1': [
			'À propos de moi :',
			'Je suis passionné par l’informatique depuis petit,',
			'Je voulais créer des jeux vidéo.',
			'Avec le temps je me suis intéressé au code de manière plus',
			' globale, pour finalement y trouver pleinement ma voie.',
			'',
			'Après avoir finalement pu créer plusieurs sites web,',
			'et découvert les aspects du front/back-end,',
			'je souhaite poursuivre mon apprentissage en intégrant',
			'le monde professionnel, afin de gagner en expérience',
			'et en rigueur, et pouvoir découvrir toujours plus de',
			'nouvelles technos et les façons',
			'de penser qui les accompagnent :)',
		],
		'interests-1': [
			'Je suis passionné de jeux vidéo depuis petit.',
			'Découvrir des mondes fantastiques, des univers où',
			'les règles traditionnelles ne s’appliquaient pas',
			'm’a toujours fasciné. Rentrer dans la peau du',
			'personnage et explorer un nouvel univers, c’est',
			'toujours passionnant. Mon jeu préféré, c’est',
			'Minecraft pour sa liberté et sa créativité',
			'(j’ai d’ailleurs commencé le code dans ce jeu ahah).',
			'',
			'Sinon j’aime beaucoup les titres indés (pixel art),',
			'et les roguelikes (pour citer Dead Cells par exemple),',
			'ou encore les jeux de plateformes, toujours avec',
			'des bandes sons incroyables !! (on attend toujours',
			'la suite de Rayman Legends 😔)',
			'',
			'En bref, j’aime découvrir des ambiances et des',
			"univers alternatifs où l'on peut ressentir pleinement",
			'la volonté du créateur à travers son jeu.',
		],
		'interests-2': [
			'J’ai commencé au collège avec Scratch.',
			'En rentrant chez moi, je passais mes soirées à',
			'créer de petits jeux. C’est comme ça que j’ai',
			'découvert l’algorithmie et mes premières notions',
			'de code.',
			'',
			'En fin de collège, j’ai continué sur Minecraft',
			'avec les command blocks, qui permettaient de',
			'modifier le jeu via des fonctions et commandes.',
			'',
			'Au lycée, j’ai découvert Python, un vrai coup',
			'de cœur. Donner des instructions et voir une',
			'machine exécuter exactement ce qu’on veut, c’était',
			'fascinant. En spécialité NSI, je me suis donné à 200%.',
			'',
			'J’ai créé plusieurs jeux en Python, sans moteur,',
			'juste du code. Un Space Invaders pour la POO,',
			'un casse-briques pour apprendre les vecteurs,',
			'les vitesses et les matrices.',
			'',
			'Un tower defense ensuite, plus ambitieux, qui',
			'm’a permis de consolider tout ça sur plus de 100h.',
			'',
			'Enfin, un plateformer plus complexe m’a servi de',
			'labo : physique, optimisations, shaders, génération',
			'procédurale... J’y ai mis tout ce que j’avais appris.',
			'',
			'Tous ces projets m’ont donné une base solide que',
			'je réutilise aujourd’hui dans le développement web.',
		],
		'interests-3': [
			'Les sciences occupent une grande place dans ma vie.',
			'Je suis fasciné par des domaines très variés comme',
			'la physique quantique, l’astronomie, l’informatique,',
			'l’informatique quantique, la psychologie ou encore',
			'la philosophie.',
			'',
			'Ce que j’aime, c’est explorer les grands concepts',
			'qui façonnent notre réalité : des atomes aux trous',
			'noirs, du fonctionnement du cerveau aux grandes',
			'questions existentielles.',
			'',
			'Dans mon temps libre, je regarde souvent des vidéos',
			'sur ces sujets. J’adore laisser mon esprit se perdre',
			'dans ce flux d’idées nouvelles et stimulantes.'
		]
		,
		'studies-1': [
			'J’ai effectué mes études secondaires au lycée Déborde, à Lyon 6e.',
			'En première, j’ai choisi les spécialités Physique, ainsi que Mathématiques, et NSI (Informatique),',
			'que j’ai conservées en terminale.',
			'',
			'Grâce à un 18 en Mathématiques et un 20 en NSI, j’ai obtenu mon bac avec la mention Bien,',
			'puis j’ai pu poursuivre mes études dans l’enseignement supérieur.'
		],
		'studies-2': [
			'Mes études supérieures ont débuté par une année en école d\'informatique à l’Estiam.',
			'Cependant, j’ai rapidement réalisé que l’approche pédagogique ne correspondait pas à mes attentes en termes de',
			'profondeur et d’autonomie.',
			'',
			'J’ai ensuite participé à la piscine de 42, un mois d’immersion totale, où l’on code en C, avec des examens machines',
			'chaque semaine ainsi que des projets en équipe. Cette expérience a été extrêmement enrichissante et épanouissante.',
			'',
			'J’ai poursuivi au BTS des Chartreux, mais après quelques mois, je me suis rendu compte que le cadre scolaire',
			'n’était vraiment pas adapté pour que je m’épanouisse.',
			'',
			'Ayant adoré l’expérience à 42, où l’autonomie était primordiale, j’ai décidé de me lancer dans une formation diplômante',
			'd\'OpenClassrooms en développement web. Ce parcours m’a permis de m’épanouir pleinement grâce à son approche autonome',
			'et pratique, entièrement basée sur des projets.',
			'',
			'J’ai obtenu mon Bac +2 en 2025, et je souhaite désormais poursuivre mes études avec une formation OpenClassrooms en Bac +3/4',
			'en alternance, afin de gagner en expérience et de pouvoir apprendre directement sur le terrain.'
		],
	}

	return (
		// Conteneur principal de la colonne gauche et centrale
		<div className={`flex items-start w-full h-full ${className} text-sm`}>
			{/* Colonne de gauche : menu déroulant (Dropdown) */}
			<div className='left-container flex flex-col items-center justify-start h-full overflow-y-auto scrollbar-custom min-w-[250px] max-w-[700px] w-4/7'>
				<Dropdown
					title='_infos-personnelles'
					isLabel={true}
					className=''
				>
					<Dropdown
						title='_bio'
						iconColor='text-rose-400'
						isOpen={true}
					>
						<DropdownItem
							id='bio-1'
							title='_a-propos'
							iconPath='M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22H4ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13Z'
							activeId={selectedId}
							onClick={setSelectedId}
						/>
					</Dropdown>
					<Dropdown
						title='_centres-interet'
						iconColor='text-teal-400'
					>
						<DropdownItem
							id='interests-1'
							title='_jeux-video'
							iconPath='M17 4C20.3137 4 23 6.68629 23 10V14C23 17.3137 20.3137 20 17 20H7C3.68629 20 1 17.3137 1 14V10C1 6.68629 3.68629 4 7 4H17ZM17 6H7C4.8578 6 3.10892 7.68397 3.0049 9.80036L3 10V14C3 16.1422 4.68397 17.8911 6.80036 17.9951L7 18H17C19.1422 18 20.8911 16.316 20.9951 14.1996L21 14V10C21 7.8578 19.316 6.10892 17.1996 6.0049L17 6ZM10 9V11H12V13H9.999L10 15H8L7.999 13H6V11H8V9H10ZM18 13V15H16V13H18ZM16 9V11H14V9H16Z'
							activeId={selectedId}
							onClick={setSelectedId}
						/>
						<DropdownItem
							id='interests-2'
							title='_code'
							iconPath='M24 12L18.3431 17.6569L16.9289 16.2426L21.1716 12L16.9289 7.75736L18.3431 6.34315L24 12ZM2.82843 12L7.07107 16.2426L5.65685 17.6569L0 12L5.65685 6.34315L7.07107 7.75736L2.82843 12ZM9.78845 21H7.66009L14.2116 3H16.3399L9.78845 21Z'
							activeId={selectedId}
							onClick={setSelectedId}
						/>
						<DropdownItem
							id='interests-3'
							title='_sciences'
							iconPath="M12.001 13.5001C11.1725 13.5001 10.501 12.8285 10.501 12.0001C10.501 11.1716 11.1725 10.5001 12.001 10.5001C12.8294 10.5001 13.501 11.1716 13.501 12.0001C13.501 12.8285 12.8294 13.5001 12.001 13.5001ZM11.4733 16.4945C11.6479 16.705 11.8239 16.908 12.001 17.103C12.178 16.908 12.3541 16.705 12.5286 16.4945C12.3538 16.4982 12.1779 16.5001 12.001 16.5001C11.824 16.5001 11.6481 16.4982 11.4733 16.4945ZM9.47837 16.3694C8.6762 16.2846 7.91035 16.1603 7.19268 16.0016C7.11832 16.3512 7.06134 16.6904 7.02243 17.0166C6.83358 18.6 7.09805 19.5617 7.50098 19.7943C7.9039 20.0269 8.86893 19.7751 10.1458 18.8199C10.4088 18.6231 10.6741 18.4042 10.9397 18.1649C10.4434 17.6228 9.95287 17.0217 9.47837 16.3694ZM16.8093 16.0016C16.0916 16.1603 15.3257 16.2846 14.5236 16.3694C14.0491 17.0217 13.5585 17.6228 13.0622 18.1649C13.3279 18.4042 13.5931 18.6231 13.8562 18.8199C15.133 19.7751 16.0981 20.0269 16.501 19.7943C16.9039 19.5617 17.1684 18.6 16.9795 17.0166C16.9406 16.6904 16.8836 16.3512 16.8093 16.0016ZM18.2598 15.6136C18.8364 18.2526 18.5328 20.3533 17.251 21.0933C15.9691 21.8334 13.9981 21.046 12.001 19.2271C10.0038 21.046 8.03282 21.8334 6.75098 21.0933C5.46913 20.3533 5.16555 18.2526 5.74217 15.6136C3.16842 14.7935 1.50098 13.4802 1.50098 12.0001C1.50098 10.5199 3.16842 9.20668 5.74217 8.38654C5.16555 5.74754 5.46913 3.64687 6.75098 2.9068C8.03282 2.16673 10.0038 2.95415 12.001 4.77302C13.9981 2.95415 15.9691 2.16673 17.251 2.9068C18.5328 3.64687 18.8364 5.74754 18.2598 8.38654C20.8335 9.20668 22.501 10.5199 22.501 12.0001C22.501 13.4802 20.8335 14.7935 18.2598 15.6136ZM10.9397 5.83521C10.6741 5.59597 10.4088 5.37703 10.1458 5.18024C8.86893 4.22499 7.9039 3.97321 7.50098 4.20584C7.09805 4.43847 6.83358 5.4001 7.02243 6.9835C7.06134 7.30969 7.11832 7.6489 7.19268 7.99857C7.91035 7.83985 8.6762 7.71556 9.47837 7.63078C9.95287 6.97848 10.4434 6.37737 10.9397 5.83521ZM14.5236 7.63078C15.3257 7.71556 16.0916 7.83985 16.8093 7.99857C16.8836 7.6489 16.9406 7.30969 16.9795 6.9835C17.1684 5.4001 16.9039 4.43847 16.501 4.20584C16.0981 3.97321 15.133 4.22499 13.8562 5.18024C13.5931 5.37703 13.3279 5.59597 13.0622 5.83521C13.5585 6.37737 14.0491 6.97848 14.5236 7.63078ZM12.5286 7.50565C12.3541 7.29515 12.178 7.09211 12.001 6.89711C11.8239 7.09211 11.6479 7.29515 11.4733 7.50565C11.6481 7.50194 11.824 7.50007 12.001 7.50007C12.1779 7.50007 12.3538 7.50194 12.5286 7.50565ZM8.37252 14.7042C8.28191 14.5547 8.19233 14.4033 8.10386 14.2501C8.01539 14.0968 7.92906 13.9435 7.84488 13.7903C7.74985 14.0467 7.66205 14.3007 7.58169 14.5515C7.83908 14.6074 8.10295 14.6583 8.37252 14.7042ZM10.3049 14.9377C10.8579 14.9788 11.4251 15.0001 12.001 15.0001C12.5769 15.0001 13.144 14.9788 13.697 14.9377C14.0091 14.4793 14.3111 13.9988 14.5991 13.5001C14.887 13.0013 15.1522 12.4995 15.393 12.0001C15.1522 11.5006 14.887 10.9988 14.5991 10.5001C14.3111 10.0013 14.0091 9.52081 13.697 9.06246C13.144 9.02133 12.5769 9.00007 12.001 9.00007C11.4251 9.00007 10.8579 9.02133 10.3049 9.06246C9.99283 9.52081 9.69086 10.0013 9.4029 10.5001C9.11494 10.9988 8.8498 11.5006 8.60892 12.0001C8.8498 12.4995 9.11494 13.0013 9.4029 13.5001C9.69086 13.9988 9.99283 14.4793 10.3049 14.9377ZM16.1571 10.2098C16.2521 9.9534 16.3399 9.6994 16.4203 9.44859C16.1629 9.39278 15.899 9.34182 15.6294 9.29591C15.72 9.44543 15.8096 9.59683 15.8981 9.75007C15.9866 9.9033 16.0729 10.0566 16.1571 10.2098ZM6.13143 9.83671C5.79142 9.94714 5.46917 10.0674 5.16723 10.1968C3.70154 10.825 3.00098 11.5348 3.00098 12.0001C3.00098 12.4653 3.70154 13.1752 5.16723 13.8033C5.46917 13.9327 5.79142 14.053 6.13143 14.1634C6.35281 13.4625 6.6281 12.7371 6.95576 12.0001C6.6281 11.263 6.35281 10.5376 6.13143 9.83671ZM7.58169 9.44859C7.66205 9.6994 7.74985 9.9534 7.84488 10.2098C7.92906 10.0566 8.01539 9.9033 8.10386 9.75007C8.19233 9.59683 8.28191 9.44543 8.37252 9.29591C8.10295 9.34182 7.83908 9.39278 7.58169 9.44859ZM17.8705 14.1634C18.2105 14.053 18.5328 13.9327 18.8347 13.8033C20.3004 13.1752 21.001 12.4653 21.001 12.0001C21.001 11.5348 20.3004 10.825 18.8347 10.1968C18.5328 10.0674 18.2105 9.94714 17.8705 9.83671C17.6491 10.5376 17.3739 11.263 17.0462 12.0001C17.3739 12.7371 17.6491 13.4625 17.8705 14.1634ZM16.4203 14.5515C16.3399 14.3007 16.2521 14.0467 16.1571 13.7903C16.0729 13.9435 15.9866 14.0968 15.8981 14.2501C15.8096 14.4033 15.72 14.5547 15.6294 14.7042C15.899 14.6583 16.1629 14.6074 16.4203 14.5515Z"
							activeId={selectedId}
							onClick={setSelectedId}
						/>
					</Dropdown>
					<Dropdown title='_etudes' iconColor='text-indigo-500'>
						<DropdownItem
							id='studies-1'
							title='_lycee'
							iconPath='M12 0.585693L18 6.58569V9H22V19H23V21H1V19H2V9H6V6.58569L12 0.585693ZM18 19H20V11H18V19ZM6 11H4V19H6V11ZM8 7.41412V18.9999H11V12H13V18.9999H16V7.41412L12 3.41412L8 7.41412Z'
							activeId={selectedId}
							onClick={setSelectedId}
						/>
						<DropdownItem
							id='studies-2'
							title='_etudes-superieures'
							iconPath='M4 16H20V5H4V16ZM13 18V20H17V22H7V20H11V18H2.9918C2.44405 18 2 17.5511 2 16.9925V4.00748C2 3.45107 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44892 22 4.00748V16.9925C22 17.5489 21.5447 18 21.0082 18H13Z'
							activeId={selectedId}
							onClick={setSelectedId}
						/>
						
					</Dropdown>
				</Dropdown>
				<Dropdown title='_contacts' isLabel={true} className='h-full'>
					<DropdownItem
						id='contacts-1'
						title='noamguez0@gmail.com'
						iconPath='M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM12.0606 11.6829L5.64722 6.2377L4.35278 7.7623L12.0731 14.3171L19.6544 7.75616L18.3456 6.24384L12.0606 11.6829Z'
						onClick={() => {}}
					/>
					<DropdownItem
						id='contacts-2'
						title='+33611918062'
						iconPath='M21 16.42V19.9561C21 20.4811 20.5941 20.9167 20.0705 20.9537C19.6331 20.9846 19.2763 21 19 21C10.1634 21 3 13.8366 3 5C3 4.72371 3.01545 4.36687 3.04635 3.9295C3.08337 3.40588 3.51894 3 4.04386 3H7.5801C7.83678 3 8.05176 3.19442 8.07753 3.4498C8.10067 3.67907 8.12218 3.86314 8.14207 4.00202C8.34435 5.41472 8.75753 6.75936 9.3487 8.00303C9.44359 8.20265 9.38171 8.44159 9.20185 8.57006L7.04355 10.1118C8.35752 13.1811 10.8189 15.6425 13.8882 16.9565L15.4271 14.8019C15.5572 14.6199 15.799 14.5573 16.001 14.6532C17.2446 15.2439 18.5891 15.6566 20.0016 15.8584C20.1396 15.8782 20.3225 15.8995 20.5502 15.9225C20.8056 15.9483 21 16.1633 21 16.42Z'
						onClick={() => {}}
					/>
				</Dropdown>
			</div>
			{/* Colonne centrale : affichage du contenu sélectionné */}
			<div className='right-left-container flex flex-col items-start justify-start w-full min-w-[600px] h-full'>
				{selectedId && (
					<h3 className='title flex items-center gap-2 max-w-[300px] h-[40px] px-3 py-[10px] transition-colors select-none justify-between border-slate-800 border-r-2 text-md'>
						{
							[
								{ id: 'bio-1', title: '_a-propos' },
								{ id: 'interests-1', title: '_jeux-video' },
								{ id: 'interests-2', title: '_code' },
								{ id: 'interests-3', title: '_sciences' },
								{
									id: 'studies-1',
									title: '_etudes-superieures',
								},
								{ id: 'studies-2', title: '_lycee' },
							].find((item) => item.id === selectedId)?.title
						}
						<button onClick={() => setSelectedId(null)} className='ml-3'>
							<Icon path='M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z' />
						</button>
					</h3>
				)}
				{selectedId && (
					<div className='flex flex-col text-justify text-lg text-slate-400 py-5 px-2 border-t-2 border-slate-800 h-full w-full  overflow-y-auto scrollbar-custom'>
						<div className='flex flex-col font-mono text-base bg-none p-0 m-0 break-words gap-0'>
							<span className='flex items-start pl-2 indent-0 tabular-nums'>
								<span className='inline-block w-[2.2em] min-w-[2.2em] text-right text-slate-400 mr-[30px] select-none'>
									1
								</span>
								<span className='mr-2.5'>/**</span>
							</span>
							{itemContents[selectedId].map((line, idx) => (
								<span
									className='flex items-start pl-2 indent-0 tabular-nums'
									key={idx}
								>
									<span className='inline-block w-[2.2em] min-w-[2.2em] text-right text-slate-400 mr-[30px] select-none'>
										{String(idx + 2)}
									</span>
									<span className='mr-2.5'>*</span>
									<span className='flex-1 text-left break-words text-sm'>
										{line}
									</span>
								</span>
							))}
							<span className='flex items-start pl-2 indent-0 tabular-nums'>
								<span className='inline-block w-[2.2em] min-w-[2.2em] text-right text-slate-400 mr-[30px] select-none'>
									{itemContents[selectedId].length + 2}
								</span>
								<span className='mr-2.5'>*/</span>
							</span>
						</div>
					</div>
				)}
			</div>
			<span className='right-between-container flex items-start mt-[40px] pt-[10px] justify-center min-w-[40px] bg-transparent border-t-2 border-l-2 h-[calc(100%-40px)] border-slate-800 pt-5=3'>
				<div className='bg-slate-500 w-[26px] h-[6px]' />
			</span>
		</div>
	)
}
