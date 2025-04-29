'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
	// Header principal du site avec navigation dynamique
	const pathname = usePathname()
	const isAbout = pathname === '/about'
	const focusStyle = `text-slate-50 lg:border-b-3 lg:border-b-orange-300`
	const borderXClass = isAbout ? 'border-x-transparent' : 'border-x'
	const [menuOpen, setMenuOpen] = useState(false)

	return (
		// Barre d'en-tête avec nom et navigation
		<header className='flex flex-col w-full text-slate-400 select-none z-10 border-b-2 border-slate-800 lg:flex-row'>
			<div className='flex flex-col items-stretch w-full lg:flex-row lg:items-center lg:justify-between lg:w-full lg:h-12'>
				{/* Logo ou nom à gauche + burger */}
				<div
					className={`flex items-center w-full h-14 px-4 border-b-2 border-slate-800 text-lg text-left lg:w-1/5 lg:max-w-[300px] lg:min-w-[165px] lg:h-full lg:px-6 lg:${borderXClass} lg:border-b-0`}
				>
					<button
						onClick={() => setMenuOpen((v) => !v)}
						className='flex items-center w-full h-full focus:outline-none lg:cursor-default lg:pointer-events-none bg-transparent'
						aria-label='Ouvrir le menu'
					>
						<span className='flex-1 text-left'>noam-guez</span>
						{/* Icône burger visible seulement en mobile */}
						<span className='lg:hidden ml-2'>
							{!menuOpen && (
								<svg
									width='28'
									height='28'
									viewBox='0 0 24 24'
									fill='none'
									className='text-slate-400'
								>
									<rect
										y='4'
										width='24'
										height='2'
										rx='1'
										fill='currentColor'
									/>
									<rect
										y='11'
										width='24'
										height='2'
										rx='1'
										fill='currentColor'
									/>
									<rect
										y='18'
										width='24'
										height='2'
										rx='1'
										fill='currentColor'
									/>
								</svg>
							)}
							{menuOpen && (
								<svg
									xmlns='http://www.w3.org/2000/svg'
									viewBox='0 0 24 24'
									fill='currentColor'
									className='text-slate-400'
									width={28}
									height={28}
								>
									<path d='M10.5859 12L2.79297 4.20706L4.20718 2.79285L12.0001 10.5857L19.793 2.79285L21.2072 4.20706L13.4143 12L21.2072 19.7928L19.793 21.2071L12.0001 13.4142L4.20718 21.2071L2.79297 19.7928L10.5859 12Z'></path>
								</svg>
							)}
						</span>
					</button>
				</div>
				{/* Navigation principale */}
				<nav
					className={`flex flex-col w-full text-sm lg:flex-row lg:flex-1 lg:w-[66.6667%] lg:h-full ${
						menuOpen ? '' : 'hidden'
					} lg:flex`}
				>
					<ul className='flex flex-col w-full divide-y divide-slate-800 border-slate-800 lg:flex-row lg:items-center lg:h-full lg:divide-y-0 lg:divide-x lg:w-full'>
						{/* Lien _accueil */}
						<li
							className={`py-4 px-4 w-full flex items-center border-b-2 border-slate-800 cursor-pointer transition-colors lg:px-8 lg:py-0 lg:w-auto lg:h-full lg:${borderXClass} lg:border-b-0 ${
								pathname === '/' ? focusStyle : ''
							}`}
							onMouseEnter={(e) =>
								e.currentTarget.classList.add('text-slate-50')
							}
							onMouseLeave={(e) => {
								if (pathname !== '/')
									e.currentTarget.classList.remove(
										'text-slate-50'
									)
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
							className={`py-4 px-4 w-full flex items-center border-b-2 border-slate-800 cursor-pointer transition-colors lg:px-8 lg:py-0 lg:w-auto lg:h-full lg:${borderXClass} lg:border-b-0 ${
								pathname === '/about' ? focusStyle : ''
							}`}
							onMouseEnter={(e) =>
								e.currentTarget.classList.add('text-slate-50')
							}
							onMouseLeave={(e) => {
								if (pathname !== '/about')
									e.currentTarget.classList.remove(
										'text-slate-50'
									)
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
							className={`py-4 px-4 w-full flex items-center border-b-2 border-slate-800 cursor-pointer transition-colors lg:px-8 lg:py-0 lg:w-auto lg:h-full lg:${
								isAbout
									? 'border-x-transparent'
									: 'border-x border-slate-800'
							} lg:border-b-0 ${
								pathname === '/projects' ? focusStyle : ''
							}`}
							onMouseEnter={(e) =>
								e.currentTarget.classList.add('text-slate-50')
							}
							onMouseLeave={(e) => {
								if (pathname !== '/projects')
									e.currentTarget.classList.remove(
										'text-slate-50'
									)
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
					<div
						className={`py-4 px-4 w-full flex items-center border-b-2 border-slate-800 cursor-pointer text-sm hover:text-slate-50 transition-colors lg:px-6 lg:py-0 lg:w-auto lg:h-full lg:border-l-2 lg:border-b-0 ${
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
				</nav>
			</div>
		</header>
	)
}
