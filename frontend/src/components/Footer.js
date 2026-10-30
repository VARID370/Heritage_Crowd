import Link from 'next/link';
import { Landmark, Heart, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 text-charcoal-300 border-t border-charcoal-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sandstone-700 flex items-center justify-center text-ivory-50">
                <Landmark className="w-5 h-5 text-gold-300" />
              </div>
              <span className="font-serif text-2xl font-bold text-ivory-50">
                Heritage<span className="text-sandstone-400">Connect</span>
              </span>
            </div>
            <p className="text-sm text-charcoal-400 max-w-md leading-relaxed">
              An intelligent heritage discovery, authenticated digital ticketing, and crowd management platform designed to protect and celebrate India&apos;s architectural wonders.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs text-charcoal-400">
              <span className="px-2.5 py-1 rounded-md bg-charcoal-800 text-sandstone-300 border border-charcoal-700">
                Third-Year CSE College Project
              </span>
              <span className="px-2.5 py-1 rounded-md bg-charcoal-800 text-emerald-400 border border-charcoal-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Overpass API Live Discovery
              </span>
            </div>
          </div>

          {/* Quick Public Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-ivory-100 uppercase tracking-wider font-sans">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-gold-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/sites" className="hover:text-gold-300 transition-colors">
                  Heritage Directory
                </Link>
              </li>
              <li>
                <Link href="/my-bookings" className="hover:text-gold-300 transition-colors">
                  My Tickets & Passes
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-gold-300 transition-colors">
                  Visitor Login
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-gold-300 transition-colors text-sandstone-400">
                  Staff & Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Data & Attribution */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-ivory-100 uppercase tracking-wider font-sans">
              Attribution & Data
            </h4>
            <p className="text-xs text-charcoal-400 leading-relaxed">
              Geographic coordinates and heritage landmark metadata provided by{' '}
              <a
                href="https://www.openstreetmap.org"
                target="_blank"
                rel="noreferrer"
                className="text-sandstone-300 underline hover:text-gold-300 inline-flex items-center gap-0.5"
              >
                OpenStreetMap <ExternalLink className="w-3 h-3" />
              </a>{' '}
              contributors under ODbL.
            </p>
            <p className="text-xs text-charcoal-400 leading-relaxed">
              High-resolution imagery sourced from Wikimedia Commons and verified public domain archives.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-charcoal-800 flex flex-col sm:flex-row justify-between items-center text-xs text-charcoal-400 gap-4">
          <p>© {new Date().getFullYear()} HeritageConnect. Individual CSE Capstone Engineering Project.</p>
          <p className="flex items-center gap-1.5">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Indian Cultural Heritage Preservation
          </p>
        </div>
      </div>
    </footer>
  );
}

