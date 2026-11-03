import Link from 'next/link';
import { Landmark, Heart, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-navy-950 text-charcoal-600 dark:text-charcoal-400 border-t border-sandstone-200 dark:border-white/[0.08] relative z-10 transition-colors duration-300 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-14">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sandstone-500/20 to-sandstone-100 dark:from-gold-500/20 dark:to-navy-900 border border-sandstone-300 dark:border-gold-400/30 flex items-center justify-center text-sandstone-700 dark:text-gold-400 shadow-sm dark:shadow-gold-glow">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="font-serif text-2xl font-bold text-charcoal-900 dark:text-ivory-50">
                Heritage<span className="text-sandstone-600 dark:text-gold-400">Connect</span>
              </span>
            </div>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-300 max-w-md leading-relaxed font-light">
              An intelligent heritage discovery, authenticated digital ticketing, and crowd management platform designed to protect, preserve, and celebrate India&apos;s architectural wonders.
            </p>
            <div className="pt-2 flex flex-wrap gap-2.5 text-xs">
              <span className="px-3 py-1 rounded-full bg-sandstone-100 dark:bg-navy-900 text-sandstone-800 dark:text-gold-300 border border-sandstone-300 dark:border-gold-500/25 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3 h-3 text-sandstone-600 dark:text-gold-400" /> Third-Year CSE Capstone Project
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-navy-900 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/25 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" /> Overpass API Live Discovery
              </span>
            </div>
          </div>

          {/* Quick Public Links */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-semibold text-charcoal-900 dark:text-ivory-100 uppercase tracking-widest font-sans">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-charcoal-600 dark:text-charcoal-300 hover:text-sandstone-900 dark:hover:text-gold-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/sites" className="text-charcoal-600 dark:text-charcoal-300 hover:text-sandstone-900 dark:hover:text-gold-300 transition-colors">
                  Heritage Directory
                </Link>
              </li>
              <li>
                <Link href="/my-bookings" className="text-charcoal-600 dark:text-charcoal-300 hover:text-sandstone-900 dark:hover:text-gold-300 transition-colors">
                  My Tickets & Passes
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-charcoal-600 dark:text-charcoal-300 hover:text-sandstone-900 dark:hover:text-gold-300 transition-colors">
                  Visitor Login
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-sandstone-700 dark:text-gold-400 hover:text-sandstone-900 dark:hover:text-gold-300 transition-colors font-medium">
                  Staff & Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Data & Attribution */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-semibold text-charcoal-900 dark:text-ivory-100 uppercase tracking-widest font-sans">
              Attribution & Data
            </h4>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-300 leading-relaxed font-light">
              Geographic coordinates and heritage landmark metadata provided by{' '}
              <a
                href="https://www.openstreetmap.org"
                target="_blank"
                rel="noreferrer"
                className="text-sandstone-700 dark:text-gold-400 underline hover:text-sandstone-900 dark:hover:text-gold-300 inline-flex items-center gap-0.5 font-medium"
              >
                OpenStreetMap <ExternalLink className="w-3 h-3" />
              </a>{' '}
              contributors under ODbL.
            </p>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-300 leading-relaxed font-light">
              High-resolution imagery sourced from Wikimedia Commons and verified public domain archives.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-sandstone-200 dark:border-white/[0.08] flex flex-col sm:flex-row justify-between items-center text-xs text-charcoal-500 dark:text-charcoal-400 gap-4">
          <p>© {new Date().getFullYear()} HeritageConnect. Individual CSE Capstone Engineering Project.</p>
          <p className="flex items-center gap-1.5">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Indian Cultural Heritage Preservation
          </p>
        </div>
      </div>
    </footer>
  );
}
