'use client'
import { useState } from 'react'
import Icon from './Icon';

// DropdownTitle : titre, couleur icône, couleur chevron, couleur titre
export function DropdownTitle({
	title,
	iconPath = "M22 8V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V7H21C21.5523 7 22 7.44772 22 8ZM12.4142 5H2V4C2 3.44772 2.44772 3 3 3H10.4142L12.4142 5Z",
	iconColor,
	open = false,
	onClick,
	className = '',
	isLabel = false,
}) {
	const arrowPath = !isLabel ? 'M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z' : "M16 12L10 18V6L16 12Z"
	return (
		<button
			className={`flex items-center gap-2 w-full px-3 py-2 rounded transition-colors select-none justify-start ${className}`}
			onClick={onClick}
			type='button'
		>
			<span
				className={`transition-transform duration-200 flex items-center ${open ? 'text-slate-50 rotate-90' : ' text-slate-500  rotate-0'}`}
			>
				<svg
					xmlns='http://www.w3.org/2000/svg'
					viewBox='0 0 24 24'
					fill='currentColor'
					width='22'
					height='22'
				>
					<path d={arrowPath}></path>
				</svg>
			</span>
			{iconPath && !isLabel && (
				<Icon path={iconPath} size={22} color={iconColor} />
			)}
			<span
				className={`font-medium flex-1 text-left transition-colors duration-200 ${open ? ' text-slate-50' : 'text-slate-500'}`}
			>
				{title}
			</span>
		</button>
	)
}

// Dropdown : children = DropdownItem, props du title
export default function Dropdown({
	title,
	iconPath,
	iconColor,
	children,
	color,
	className = '',
	isLabel,
}) {
	const [open, setOpen] = useState(false);
	return (
		<div className={`w-full ${className}`}>
			<DropdownTitle
				title={title}
				iconPath={iconPath}
				iconColor={iconColor}
				open={open}
				isLabel={isLabel}
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
