'use client'

import IconBox from './IconBox'
import Link from 'next/link'
import { useRef, useState } from 'react'

export default function ProjectCard({
	title,
	description,
	languages,
	className,
	tag = '', // Ajout d'un tag technique optionnel
	img = null, // Ajout d'une image optionnelle
	onView = null, // Callback pour le bouton view-project
}) {
	const slug = title ? title.toLowerCase().replace(/\s+/g, '-') : ''
	const cardRef = useRef(null)
	const [tilt, setTilt] = useState({ x: 0, y: 0 })

	function handleMouseMove(e) {
		const card = cardRef.current
		if (!card) return
		const rect = card.getBoundingClientRect()
		const x = e.clientX - rect.left
		const y = e.clientY - rect.top
		const centerX = rect.width / 2
		const centerY = rect.height / 2
		const rotateX = ((y - centerY) / centerY) * 6 // max 6deg (moins prononcé)
		const rotateY = ((x - centerX) / centerX) * 6
		setTilt({ x: -rotateX, y: rotateY })
	}

	function handleMouseLeave() {
		setTilt({ x: 0, y: 0 })
	}

	return (
		<div
			ref={cardRef}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			style={{
				transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1)`,
				transition:
					tilt.x === 0 && tilt.y === 0
						? 'transform 0.3s cubic-bezier(.23,1.02,.32,1)'
						: 'transform 0.08s',
			}}
			className={`flex flex-col shadow-md p-0 overflow-hidden ${className} cursor-pointer hover:scale-[1.03] transition-transform`}
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
			<Link href={`/projects/${slug}`} className='no-underline rounded-2xl border-2 border-slate-800'>
				<div className='rounded-2xl p-0 overflow-hidden h-[240px] w-[320px]'>
					{/* Image juste après le titre */}
					{img && (
						<div className='relative w-full h-[110px] bg-slate-800 flex items-center justify-center'>
							<img
								src={img}
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
					)}
					{/* Bloc texte + bouton avec fond slate-950 */}
					<div className='flex flex-col h-[calc(100%-110px)] justify-between items-center p-2 rounded-b-2xl bg-slate-950'>
						<p className='text-slate-400 leading-relaxed text-sm'>
							{description}
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
		</div>
	)
}
