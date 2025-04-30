import Avatar from '@/components/Avatar'
import TiltWrapper from '@/components/TiltWrapper'

// Page d'accueil principale du portfolio
export default function Home() {
	// Conteneur principal centré verticalement et horizontalement
	return (
		<div
			className='flex flex-col items-start h-full justify-center bg-transparent text-foreground b z-1 md:px-10'
			id='home'
		>
			{/* Section présentation avec nom, titre et avatar */}
			<div className='flex items-center justify-center h-1/2 bg-transparent text-foreground z-1 gap-[60px]'>
				<div>
					<span className='flex w-full text-left px-4 text-slate-400'>
						{'Boujour à tous. Je suis'.split('').map((char, i) => (
							<span
								key={i}
								className='inline-block animate-[slide-down-cascade_0.5s_ease-out_forwards]'
								style={{ animationDelay: `${i * 0.03}s` }}
							>
								{char === ' ' ? '\u00A0' : char}
							</span>
						))}
					</span>

					<h1 className='text-left w-full text-8xl text-slate-50 px-4 rounded-xl z-0 overflow-hidden'>
						<span
							className='inline-block animate-[slide-up_.5s_ease-out_forwards]'
							style={{
								animationDelay: `1.3s`,
								transform: 'translateY(-100%)',
							}}
						>
							Noam
						</span>{' '}
						<span
							className='inline-block animate-[slide-up_.9s_ease-out_forwards]'
							style={{
								animationDelay: `1.5s`,
								transform: 'translateY(-200%)',
							}}
						>
							Guez
						</span>
					</h1>
					<h2 className='text-left nowrap w-full text-xl md:text-4xl text-indigo-500 p-4 rounded-xl z-0 overflow-hidden'>
						{'> Développeur Full Stack'.split('').map((char, i) => (
							<span
								key={i}
								className='inline-block overflow-hidden' // conteneur de masquage
							>
								<span
									className='inline-block animate-[slide-to-right_0.5s_ease-out_forwards]'
									style={{
										animationDelay: `${2.5 +i * 0.05}s`,
										display: 'inline-block',
										transform: 'translateX(-100%)',
									}}
								>
									{char === ' ' ? '\u00A0' : char}
								</span>
							</span>
						))}
					</h2>
				</div>
				{/* Avatar à droite du texte */}
				<TiltWrapper
					intensity={25}
					className='hidden md:block md:w-[200px] md:h-[200px] mr-10 transition-transform duration-1000 hover:scale-[1.3] '
				>
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
