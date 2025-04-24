import Icon from './Icon'

// IconBox : affiche une icône stylisée dans un conteneur
export default function IconBox({
	iconPath,
	bgColor = 'bg-slate-700',
	iconColor = 'text-slate-900',
	className = '',
}) {
	return (
		// Utilise le composant Icon avec styles et couleurs personnalisés
		<Icon path={iconPath} className={`w-[40px] h-[40px] ${iconColor} ${className} transition-colors ease-in-out rounded-md hover:bg-slate-700`} />
	)
}
