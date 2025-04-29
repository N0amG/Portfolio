import Header from './Header'
import Footer from './Footer'
import { ViewportProvider } from '@/utils/ViewportContext'

export default function MainWrapper({ children }) {
	// Composant qui englobe tout le contenu principal de la page (header, contenu, footer)
	return (
		// Main avec fond personnalisé et structure verticale
		<main className='backdrop flex flex-1 flex-col lg:items-center justify-between min-h-screen w-full'>
			<ViewportProvider>
				<Header />
				{/* Contenu principal de la page (injecté par les routes) */}
				{children}
				<Footer />
			</ViewportProvider>
		</main>
	)
}
