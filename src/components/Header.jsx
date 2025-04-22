'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
	const focusStyle = "text-slate-50 border-b-3 border-b-orange-300";
	const pathname = usePathname();

	return (
		<header className='w-full text-slate-400 select-none z-10 border-b-2 border-slate-800'>
			<div className='flex items-center justify-between w-full h-16'>
				<div className='flex items-center w-1/5 max-w-[300px] h-full px-6 border-r border-slate-800 text-lg text-left'>
					noamg-guez
				</div>
				<nav className='flex-1 flex h-full w-[66.6667%]'> {/* 2x w-1/3 = w-2/3 */}
					<ul className='flex items-center h-full divide-x divide-slate-800 border-slate-800 w-full'>
						<li className={`px-8 h-full flex items-center relative group border-x cursor-pointer transition-colors ${pathname === "/" ? focusStyle : ""}`}
							onMouseEnter={e => e.currentTarget.classList.add("text-slate-50")}
							onMouseLeave={e => { if (pathname !== "/") e.currentTarget.classList.remove("text-slate-50") }}>
							<Link href="/">_hello</Link>
							<span className='absolute left-1/2 -translate-x-1/2 bottom-2 w-3/4 h-[2px] bg-primary rounded'></span>
						</li>
						<li className={`px-8 h-full flex items-center border-x cursor-pointer transition-colors ${pathname === "/about" ? focusStyle : ""}`}
							onMouseEnter={e => e.currentTarget.classList.add("text-slate-50")}
							onMouseLeave={e => { if (pathname !== "/about") e.currentTarget.classList.remove("text-slate-50") }}>
							<Link href="/about">_about-me</Link>
						</li>
						<li className={`px-8 h-full flex items-center border-x  border-slate-800 cursor-pointer transition-colors ${pathname === "/projects" ? focusStyle : ""}`}
							onMouseEnter={e => e.currentTarget.classList.add("text-slate-50")}
							onMouseLeave={e => { if (pathname !== "/projects") e.currentTarget.classList.remove("text-slate-50") }}>
							<Link href="/projects">_projects</Link>
						</li>
					</ul>
				</nav>
				<div className={`flex items-center h-full px-6 border-l border-slate-800 cursor-pointer hover:text-primary transition-colors ${pathname === "/contact" ? focusStyle : ""}`}>
					<Link href="/contact">_contact-me</Link>
				</div>
			</div>
		</header>
	);
}