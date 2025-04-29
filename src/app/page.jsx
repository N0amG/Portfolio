import Avatar from '@/components/Avatar'
import TiltWrapper from '@/components/TiltWrapper'

// Page d'accueil principale du portfolio
export default function Home() {
	// Conteneur principal centré verticalement et horizontalement
	return (
		<div
			className='flex flex-col items-start h-full justify-center bg-transparent text-foreground b z-1 select-none md:px-10'
			id='home'
		>
			{/* Section présentation avec nom, titre et avatar */}
			<div className='flex items-center justify-center h-1/2 bg-transparent text-foreground z-1 gap-[60px]'>
				<div>
					<span className='flex w-full text-left px-4 text-slate-400'>
						Boujour à tous. Je suis 
					</span>
					<h1 className='text-left w-full text-8xl text-slate-50 px-4 rounded-xl z-0'>
						Noam Guez
					</h1>
					<h2 className='text-left nowrap w-full text-xl md:text-4xl text-indigo-500 p-4 rounded-xl z-0'>
						{'>'} Développeur Full Stack
					</h2>
				</div>
				{/* Avatar à droite du texte */}
				<TiltWrapper intensity={25} className='hidden md:block md:w-[200px] md:h-[200px] mr-10 transition-transform duration-1000 hover:scale-[1.3] '>
					<Avatar className={'border-slate-400'} />
				</TiltWrapper>
			</div>
			{/* Lien Github stylisé façon code */}
			<div className='flex flex-col p-4'>
				<p className='text-slate-400'>//find my profile on Github:</p>
				<p>
					<span className='text-indigo-500'>const </span>
					<span className='text-teal-400'>githubLink</span> ={' '}
					<a
						href='https://github.com/N0amG'
						className='text-rose-300 hover:underline'
						target='_blank'
					>
						"https://github.com/N0amG"
					</a>
				</p>
			</div>
		</div>
	)
}
