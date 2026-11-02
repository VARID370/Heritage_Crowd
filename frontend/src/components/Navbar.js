'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Landmark,
  Compass,
  Ticket,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isStaff, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-navy-950/85 backdrop-blur-xl border-b border-white/[0.08] transition-all no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400/20 via-gold-500/10 to-transparent border border-gold-400/30 flex items-center justify-center text-gold-400 shadow-gold-glow group-hover:scale-105 group-hover:border-gold-400/50 transition-all duration-300">
              <Landmark className="w-5 h-5 text-gold-400 drop-shadow" />
              <div className="absolute inset-0 rounded-xl bg-gold-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-ivory-50 flex items-center">
                Heritage<span className="text-gold-400">Connect</span>
              </span>
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-charcoal-400">
                <span>Preservation</span>
                <span className="text-gold-500/60">•</span>
                <span>Ticketing</span>
                <span className="text-gold-500/60">•</span>
                <span>Crowd Control</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              href="/sites"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 border ${
                isActive('/sites')
                  ? 'bg-gold-500/10 text-gold-300 border-gold-500/30 shadow-[0_0_15px_rgba(230,168,23,0.15)] font-semibold'
                  : 'text-charcoal-300 hover:text-ivory-50 hover:bg-white/[0.05] border-transparent'
              }`}
            >
              <Compass className={`w-4 h-4 ${isActive('/sites') ? 'text-gold-400' : 'text-charcoal-400'}`} />
              <span>Explore Sites</span>
            </Link>

            {isAuthenticated && (
              <Link
                href="/my-bookings"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 border ${
                  isActive('/my-bookings')
                    ? 'bg-gold-500/10 text-gold-300 border-gold-500/30 shadow-[0_0_15px_rgba(230,168,23,0.15)] font-semibold'
                    : 'text-charcoal-300 hover:text-ivory-50 hover:bg-white/[0.05] border-transparent'
                }`}
              >
                <Ticket className={`w-4 h-4 ${isActive('/my-bookings') ? 'text-gold-400' : 'text-charcoal-400'}`} />
                <span>My Bookings</span>
              </Link>
            )}

            {isStaff && (
              <Link
                href="/admin"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 border ${
                  pathname.startsWith('/admin')
                    ? 'bg-gold-500/15 text-gold-200 border-gold-400/50 shadow-gold-glow font-semibold'
                    : 'text-gold-300/90 hover:text-gold-200 bg-gold-500/[0.07] border-gold-500/20 hover:border-gold-500/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-gold-400" />
                <span>Admin Portal</span>
              </Link>
            )}
          </div>

          {/* User Profile / Auth buttons */}
          <div className="hidden md:flex items-center space-x-3.5">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2.5 px-3.5 py-2 rounded-full border border-white/[0.12] hover:border-gold-500/40 bg-navy-900/80 text-sm font-medium text-ivory-100 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(230,168,23,0.15)]"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-gold-600 to-gold-400 text-navy-950 flex items-center justify-center font-bold text-xs uppercase shadow">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="max-w-[130px] truncate text-ivory-100 text-xs sm:text-sm">{user?.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-charcoal-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div
                    onMouseLeave={() => setUserDropdownOpen(false)}
                    className="absolute right-0 mt-2.5 w-60 rounded-2xl bg-navy-900/95 backdrop-blur-2xl shadow-2xl border border-white/[0.12] py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="px-4 py-3 border-b border-white/[0.08]">
                      <p className="text-[11px] uppercase tracking-wider text-charcoal-400">Signed in as</p>
                      <p className="text-sm font-medium text-ivory-50 truncate mt-0.5">{user?.email}</p>
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-gold-500/15 text-gold-300 border border-gold-500/25">
                        {user?.role}
                      </span>
                    </div>

                    <Link
                      href="/my-bookings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-charcoal-200 hover:text-ivory-50 hover:bg-white/[0.05] transition-colors"
                    >
                      <Ticket className="w-4 h-4 text-gold-400" />
                      <span>My Tickets & Passes</span>
                    </Link>

                    {isStaff && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-gold-300 hover:text-gold-200 hover:bg-gold-500/10 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-gold-400" />
                        <span>Staff Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 border-t border-white/[0.08] text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-charcoal-300 hover:text-ivory-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="btn-gold px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-navy-950" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-charcoal-300 hover:text-ivory-50 hover:bg-white/[0.06] border border-white/[0.08] focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-navy-900/95 backdrop-blur-2xl px-5 pt-3 pb-6 space-y-3">
          <Link
            href="/sites"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-base font-medium text-charcoal-200 hover:text-ivory-50 hover:bg-white/[0.05]"
          >
            <Compass className="w-5 h-5 text-gold-400" />
            <span>Explore Heritage Sites</span>
          </Link>

          {isAuthenticated && (
            <Link
              href="/my-bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-base font-medium text-charcoal-200 hover:text-ivory-50 hover:bg-white/[0.05]"
            >
              <Ticket className="w-5 h-5 text-gold-400" />
              <span>My Bookings</span>
            </Link>
          )}

          {isStaff && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-base font-medium text-gold-200 bg-gold-500/10 border border-gold-500/30"
            >
              <ShieldCheck className="w-5 h-5 text-gold-400" />
              <span>Admin & Gate Verification</span>
            </Link>
          )}

          <div className="pt-3 border-t border-white/[0.08]">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3.5 py-2">
                  <p className="text-sm font-semibold text-ivory-50">{user?.name}</p>
                  <p className="text-xs text-charcoal-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-base font-medium text-rose-400 hover:bg-rose-500/10 text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-white/[0.12] font-medium text-ivory-100 bg-white/[0.04]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl btn-gold font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
