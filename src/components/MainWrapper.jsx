import Header from './Header';
import Footer from './Footer';

export default function MainWrapper({ children }) {
  // Composant qui englobe tout le contenu principal de la page (header, contenu, footer)
  return (
    // Main avec fond personnalisé et structure verticale
    <main className='backdrop flex flex-1 flex-col items-center justify-between min-h-screen'>
      <Header />
      {/* Contenu principal de la page (injecté par les routes) */}
      {children}
      <Footer />
    </main>
  );
}
