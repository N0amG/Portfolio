'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
	// Header principal du site avec navigation dynamique
	const pathname = usePathname()
	const isAbout = pathname === '/about'
	const focusStyle = `text-slate-50 border-b-3 border-b-orange-300`
	const borderXClass = isAbout ? 'border-x-transparent' : 'border-x'

	return (
		// Barre d'en-tête avec nom et navigation
		<header className='w-full text-slate-400 select-none z-10 border-b-2 border-slate-800'>
			<div className='flex items-center justify-between w-full h-12'>
				{/* Logo ou nom à gauche */}
				<div
					className={`flex items-center w-1/5 max-w-[300px] h-full px-6 ${borderXClass} border-slate-800 text-lg text-left`}
				>
					noam-guez
				</div>
				{/* Navigation principale */}
				<nav className='flex-1 flex h-full w-[66.6667%] text-sm'>
					{' '}
					{/* 2x w-1/3 = w-2/3 */}
					<ul className='flex items-center h-full divide-slate-800 border-slate-800 w-full'>
						{/* Lien _accueil */}
						<li
							className={`px-8 h-full flex items-center ${borderXClass} cursor-pointer transition-colors ${
								pathname === '/' ? focusStyle : ''
							}`}
							onMouseEnter={(e) =>
								e.currentTarget.classList.add('text-slate-50')
							}
							onMouseLeave={(e) => {
								if (pathname !== '/')
									e.currentTarget.classList.remove('text-slate-50')
							}}
						>
							<Link
								href='/'
								className='w-full h-full flex items-center'
							>
								_accueil
							</Link>
						</li>
						{/* Lien _a-propos */}
						<li
							className={`px-8 h-full flex items-center ${borderXClass} cursor-pointer transition-colors ${
								pathname === '/about' ? focusStyle : ''
							}`}
							onMouseEnter={(e) =>
								e.currentTarget.classList.add('text-slate-50')
							}
							onMouseLeave={(e) => {
								if (pathname !== '/about')
									e.currentTarget.classList.remove('text-slate-50')
							}}
						>
							<Link
								href='/about'
								className='w-full h-full flex items-center'
							>
								_a-propos
							</Link>
						</li>
						{/* Lien _projets */}
						<li
							className={`px-8 h-full flex items-center ${
								isAbout
									? 'border-x-transparent'
									: 'border-x border-slate-800'
							} cursor-pointer transition-colors ${
								pathname === '/projects' ? focusStyle : ''
							}`}
							onMouseEnter={(e) =>
								e.currentTarget.classList.add('text-slate-50')
							}
							onMouseLeave={(e) => {
								if (pathname !== '/projects')
									e.currentTarget.classList.remove('text-slate-50')
							}}
						>
							<Link
								href='/projects'
								className='w-full h-full flex items-center'
							>
								_projets
							</Link>
						</li>
					</ul>
				</nav>
				{/* Lien _contact à droite */}
				<div
					className={`flex items-center h-full px-6 border-slate-800 border-l-2 cursor-pointer text-sm hover:text-slate-50 transition-colors ${
						pathname === '/contact' ? focusStyle : ''
					}`}
				>
					<Link
						href='/contact'
						className='w-full h-full flex items-center'
					>
						_contact
					</Link>
				</div>
			</div>
		</header>
	)
}
