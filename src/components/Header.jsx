'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Header() {
	// Header principal du site avec navigation dynamique
	const pathname = usePathname()
	const isAbout = pathname === '/about'
	const focusStyle = `text-slate-50 md:border-b-3 md:border-b-orange-300`
	const borderXClass = isAbout ? 'border-x-transparent' : 'border-x'
	const [menuOpen, setMenuOpen] = useState(false)
	const [isClient, setIsClient] = useState(false)
	const [isMounted, setIsMounted] = useState(false)

	useEffect(() => {
		setIsClient(true)
		setIsMounted(true)
	}, [])

	// Afficher la navigation seulement après le montage côté client pour éviter l'hydration error
	if (!isMounted) return null;

	return (
		// Barre d'en-tête avec nom et navigation
		<header className='flex rounded-lg bg-slate-900 flex-col w-full text-slate-400 select-none z-10 border-b-2 border-slate-800 md:flex-row'>
			<div className='flex flex-col items-stretch w-full md:flex-row md:items-center md:justify-between md:w-full md:h-12'>
				{/* Logo ou nom à gauche + burger */}
				<div
					className={`flex items-center w-full h-14 px-4 border-b-2 border-slate-800 text-lg text-left md:w-1/5 md:max-w-[300px] md:min-w-[165px] md:h-full md:px-6 md:${borderXClass} md:border-b-0`}
				>
					<button
						onClick={() => setMenuOpen((v) => !v)}
						className='flex items-center w-full h-full focus:outline-none md:cursor-default md:pointer-events-none bg-transparent'
						aria-label='Ouvrir le menu'
					>
						<span className='flex-1 text-left'>noam-guez</span>
						{/* Icône burger visible seulement en mobile */}
						<span className='md:hidden ml-2'>
								{isClient && !menuOpen && (
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
								{isClient && menuOpen && (
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
					className={`flex flex-col w-full text-sm md:flex-row md:flex-1 md:w-[66.6667%] md:h-full md:flex ${
						menuOpen && isMounted ? '' : 'hidden md:flex'
					}`}
				>
					<ul className='flex flex-col w-full divide-y divide-slate-800 border-slate-800 md:flex-row md:items-center md:h-full md:divide-y-0 md:divide-x md:w-full'>
						{/* Lien _accueil */}
						<li
							className={`py-4 px-4 w-full flex items-center border-b-2 border-slate-800 cursor-pointer transition-colors md:px-8 md:py-0 md:w-auto md:h-full md:${borderXClass} md:border-b-0 ${
								pathname === '/' ? focusStyle : ''
							}`}
							onMouseEnter={isClient ? (e) =>
								e.currentTarget.classList.add('text-slate-50') : undefined}
							onMouseLeave={isClient ? (e) => {
								if (pathname !== '/')
									e.currentTarget.classList.remove('text-slate-50')
							} : undefined}
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
							className={`py-4 px-4 w-full flex items-center border-b-2 border-slate-800 cursor-pointer transition-colors md:px-8 md:py-0 md:w-auto md:h-full md:${borderXClass} md:border-b-0 ${
								pathname === '/about' ? focusStyle : ''
							}`}
							onMouseEnter={isClient ? (e) =>
								e.currentTarget.classList.add('text-slate-50') : undefined}
							onMouseLeave={isClient ? (e) => {
								if (pathname !== '/about')
									e.currentTarget.classList.remove('text-slate-50')
							} : undefined}
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
							className={`py-4 px-4 w-full flex items-center border-b-2 border-slate-800 cursor-pointer transition-colors md:px-8 md:py-0 md:w-auto md:h-full md:${
								isAbout
									? 'border-x-transparent'
									: 'border-x border-slate-800'
							} md:border-b-0 ${
								pathname === '/projects' ? focusStyle : ''
							}`}
							onMouseEnter={isClient ? (e) =>
								e.currentTarget.classList.add('text-slate-50') : undefined}
							onMouseLeave={isClient ? (e) => {
								if (pathname !== '/projects')
									e.currentTarget.classList.remove('text-slate-50')
							} : undefined}
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
						className={`py-4 px-4 w-full flex items-center border-b-2 border-slate-800 cursor-pointer text-sm hover:text-slate-50 transition-colors md:px-6 md:py-0 md:w-auto md:h-full md:border-l-2 md:border-b-0 ${
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
