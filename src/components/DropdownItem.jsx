import Icon from './Icon'

// DropdownItem : bouton d'item individuel dans un menu déroulant
export default function DropdownItem({
	id,
	title,
	iconPath,
	activeId = '',
	onClick,
	className = '',
	active = activeId === id,
	isSelectable = false
}) {
	// Détermine la couleur de l'icône selon l'état actif
	const iconColor = active ? 'text-slate-50' : 'text-slate-700'
	
	return (
		// Bouton stylisé, met en avant l'item actif
		<button
			className={`flex items-center justify-end gap-2 py-2 pl-2 mr-2 rounded transition-colors ${!isSelectable ? 'select-none ' : ''}${
				active
					? 'bg-slate-700 text-slate-50'
					: 'hover:bg-slate-800 text-slate-500'
			} ${className}`}
			onClick={() => onClick(id)}
			type='button'
		>
			{/* Icône à gauche du titre si fourni */}
			{iconPath && 
				<Icon
					path={iconPath}
					color={iconColor}
					className='w-[22px] h-[22px]'/>
			}
			<span className='flex-1 text-left w-fit'>{title}</span>
		</button>
	)
}
