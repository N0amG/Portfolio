import Header from './Header';
import Footer from './Footer';

export default function MainWrapper({ children }) {
  return (
    <main className='backdrop flex flex-col items-center justify-between h-full'>
      <Header />
      {children}
      <Footer />
    </main>
  );
}
