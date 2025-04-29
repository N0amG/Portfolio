'use client'
import { useState } from 'react'
import Icon from './Icon';

// DropdownTitle : bouton d'en-tête pour chaque section du menu déroulant
export function DropdownTitle({
	title,
	iconPath = "M22 8V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V7H21C21.5523 7 22 7.44772 22 8ZM12.4142 5H2V4C2 3.44772 2.44772 3 3 3H10.4142L12.4142 5Z",
	iconColor,
	open = false,
	onClick,
	className = '',
	isLabel = false,
}) {
	// Flèche différente selon le type de dropdown (label ou non)
	const arrowPath = !isLabel ? 'M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z' : "M16 12L10 18V6L16 12Z"
	return (
		// Bouton d'en-tête avec icône, flèche et titre
		<button
			className={`flex items-center gap-2 w-full px-3 py-2 transition-colors select-none justify-start  border-slate-800 ${className, isLabel ? open ? 'border-b-2' : 'border-b-1' : ''}`}
			onClick={onClick}
			type='button'
		>
			<span
				className={`transition-transform duration-200 flex items-center ${open ? 'text-slate-50 rotate-90' : ' text-slate-500  rotate-0'}`}
			>
				{/* Flèche d'ouverture/fermeture */}
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
			{/* Icône de section si ce n'est pas un label */}
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

// Dropdown : composant principal du menu déroulant, gère l'ouverture/fermeture et l'affichage des enfants
export default function Dropdown({
	title,
	iconPath,
	iconColor,
	children,
	className = '',
	isOpen = false,
	isLabel = false,
}) {
	// État d'ouverture du dropdown : ouvert si isOpen true, sinon fermé (labels fermés par défaut en mobile)
	const [open, setOpen] = useState(isOpen);

	return ( // Met un border basse et droite au dropdown label sauf si c'est le label contacts, enleve le border-bottom
		// Conteneur principal du dropdown, applique les bordures selon le type
		<div className={`w-full ${className, (isLabel ? (title === '_contacts' || title === 'projets') ? 'border-r-2 border-slate-800 h-full' : 'border-b-2 border-r-2 border-slate-800' : '')}`}>
			<DropdownTitle
				title={title}
				iconPath={iconPath}
				iconColor={iconColor}
				open={open}
				isLabel={isLabel}
				onClick={() => setOpen((v) => !v)}
			/>
			{/* Affichage conditionnel des enfants (DropdownItem) si ouvert */}
			{open && (
				<div className="flex flex-col gap-1 animate-fade-in pb-2 pt-2 pl-5">
					{children}
				</div>
			)}
		</div>
	);
}
