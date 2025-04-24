import Header from './Header';
import Footer from './Footer';

export default function MainWrapper({ children }) {
  return (
    <main className='backdrop flex flex-1 flex-col items-center justify-between min-h-screen'>
      <Header />
      {children}
      <Footer />
    </main>
  );
}
