// Composant TextCard : affiche un bloc de texte façon terminal avec curseur animé
export default function TextCard({ children, className }) {
	return (
		// Conteneur stylisé façon terminal, avec texte et curseur animé
		<div
			className={`bg-black text-card-foreground border border-border rounded-lg p-6 shadow-md text-xl font-monospace max-w-fit ${className}`}
		>
			{'C:\\Users\\noamguez>  '}
			{children}
			<span className='inline-block align-middle ml-1 w-3 h-7 bg-white animate-blink cursor-blink' />
		</div>
	)
}
