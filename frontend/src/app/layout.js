import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ParticleBackground from '@/components/ParticleBackground';

export const metadata = {
  title: 'HeritageConnect — Premium Heritage Discovery & Smart Ticketing',
  description: 'Discover Indian heritage monuments dynamically, reserve verified tickets, and monitor crowd capacity in real-time.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-navy-950 text-ivory-50 selection:bg-gold-500/30 selection:text-gold-200 relative">
        <AuthProvider>
          <ParticleBackground />
          <Navbar />
          <main className="flex-grow relative z-10">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
