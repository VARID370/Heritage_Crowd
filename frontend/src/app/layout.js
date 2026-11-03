import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ParticleBackground from '@/components/ParticleBackground';

export const metadata = {
  title: 'HeritageConnect — Premium Heritage Discovery & Smart Ticketing',
  description: 'Discover Indian heritage monuments dynamically, reserve verified tickets, and monitor crowd capacity in real-time.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('heritage_theme') || 'dark';
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-ivory-50 dark:bg-navy-950 text-charcoal-900 dark:text-ivory-50 selection:bg-gold-500/30 selection:text-gold-200 relative transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            <ParticleBackground />
            <Navbar />
            <main className="flex-grow relative z-10">{children}</main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
