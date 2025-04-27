import IconBox from './IconBox'
import Link from 'next/link'
import TiltWrapper from './TiltWrapper'

export default function ProjectCard({
	title,
	subtitle,
	languages,
	className,
	tag = '', // Ajout d'un tag technique optionnel
	onView = null, // Callback pour le bouton view-project
}) {
	const slug = title ? title.toLowerCase().replace(/\s+/g, '-') : ''
	return (
		<TiltWrapper
			className={`flex flex-col shadow-md p-0 h-fit overflow-hidden ${className} cursor-pointer hover:scale-[1.1] transition-transform`}
		>
			{/* Titre au-dessus de la carte, sans background */}
			<div className='w-full flex pt-3 pb-1'>
				<span className='font-mono text-sm text-slate-300'>
					<span className='text-indigo-500 font-bold text-lg'>
						{title}
					</span>
					<span className='text-slate-400 font-normal'>
						{' '}
						// {tag || '_project'}
					</span>
				</span>
			</div>
			<Link
				href={`/projects/${slug}`}
				className='no-underline rounded-2xl border-2 border-slate-800'
			>
				<div className='rounded-2xl p-0 overflow-hidden h-[240px] w-[320px]'>
					{/* Image juste après le titre */}

					<div className='relative w-full h-[110px] bg-slate-800 flex items-center justify-center'>
						<img
							src={`/img/${slug}/0.webp`}
							alt={title}
							className='object-cover w-full h-full rounded-t-xl border-b-2 border-slate-800'
						/>
						{/* Filtre noir transparent */}
						<div className='absolute inset-0 bg-black opacity-10 rounded-t-xl pointer-events-none' />
						{/* IconBox en haut à droite sur l'image */}
						<div className='absolute top-2 right-2 flex gap-2'>
							{languages.map((language, index) => (
								<IconBox
									key={index}
									language={language}
									bgColor='bg-slate-700'
									iconColor='text-slate-900'
									className='shadow-md'
									size={24}
								/>
							))}
						</div>
					</div>
					{/* Bloc texte + bouton avec fond slate-950 */}
					<div className='flex flex-col h-[calc(100%-110px)] justify-between items-center p-2 rounded-b-2xl bg-slate-950'>
						<p className='text-slate-400 leading-relaxed text-sm'>
							{subtitle}
						</p>
						{/* Bouton view-project en bas à gauche */}
						<div className='w-full flex justify-start'>
							<button
								onClick={onView}
								className='px-4 py-2 mt-3 mb-1 rounded-lg bg-slate-600 text-slate-50 text-sm font-mono hover:bg-slate-500 transition'
							>
								view-project
							</button>
						</div>
					</div>
				</div>
			</Link>
		</TiltWrapper>
	)
}
