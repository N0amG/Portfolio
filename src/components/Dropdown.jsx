'use client'
import { useState } from 'react'

// Icône dossier SVG custom
function FolderIcon({ color = 'slate-700', size = 22 }) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			viewBox='0 0 24 24'
			fill='currentColor'
			width={size}
			height={size}
			className={`text-${color}`}
		>
			<path
				d='M22 8V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V7H21C21.5523 7 22 7.44772 22 8ZM12.4142 5H2V4C2 3.44772 2.44772 3 3 3H10.4142L12.4142 5Z'
			/>
		</svg>
	)
}

// DropdownTitle : titre, couleur icône, couleur chevron, couleur titre
export function DropdownTitle({
	title,
	icon: Icon = FolderIcon,
	iconColor,
	open = false,
	onClick,
	className = '',
}) {
	return (
		<button
			className={`flex items-center gap-2 w-full px-3 py-2 rounded transition-colors select-none justify-start ${className}`}
			onClick={onClick}
			type='button'
		>
			<span
				className={`transition-transform duration-200 flex items-center ${
					open ? 'text-slate-50 rotate-90' : 'text-slate-700 rotate-0'
				}`}
			>
				<svg
					xmlns='http://www.w3.org/2000/svg'
					viewBox='0 0 24 24'
					fill='currentColor'
					width='22'
					height='22'
				>
					<path d='M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z'></path>
				</svg>
			</span>
			<Icon color={iconColor}/>
			<span
				className={`font-medium flex-1 text-left transition-colors duration-200 ${
					open ? 'text-slate-50' : 'text-slate-700'
				}`}
			>
				{title}
			</span>
		</button>
	)
}

// Dropdown : children = DropdownItem, props du title
export default function Dropdown({
	title,
	icon,
	iconColor,
	children,
	className = '',
}) {
	const [open, setOpen] = useState(false);
	return (
		<div className={`w-full ${className}`}>
			<DropdownTitle
				title={title}
				icon={icon}
				iconColor={iconColor}
				open={open}
				onClick={() => setOpen((v) => !v)}
			/>
			{open && (
				<div className="pl-12 flex flex-col gap-1 animate-fade-in">
					{children}
				</div>
			)}
		</div>
	);
}
