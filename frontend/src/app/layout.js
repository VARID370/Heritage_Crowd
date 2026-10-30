import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'HeritageConnect — Heritage Site Discovery, Ticket Booking & Crowd Management',
  description: 'Third-year CSE Capstone Project: Discover Indian heritage monuments dynamically, reserve verified tickets, and monitor crowd capacity in real-time.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-ivory-50 text-charcoal-900 selection:bg-sandstone-200 selection:text-sandstone-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

