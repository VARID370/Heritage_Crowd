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
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isStaff, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-ivory-50/95 backdrop-blur-md border-b border-sandstone-200 transition-all no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sandstone-600 to-sandstone-800 flex items-center justify-center text-ivory-50 shadow-md group-hover:scale-105 transition-transform">
              <Landmark className="w-6 h-6 text-gold-300" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-charcoal-900 flex items-center">
                Heritage<span className="text-sandstone-600">Connect</span>
              </span>
              <span className="hidden sm:block text-[11px] font-medium uppercase tracking-wider text-charcoal-500">
                Preservation • Ticketing • Crowd Control
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
            <Link
              href="/sites"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                isActive('/sites')
                  ? 'bg-sandstone-100 text-sandstone-900 font-semibold'
                  : 'text-charcoal-700 hover:text-charcoal-900 hover:bg-ivory-200'
              }`}
            >
              <Compass className="w-4 h-4 text-sandstone-600" />
              <span>Explore Sites</span>
            </Link>

            {isAuthenticated && (
              <Link
                href="/my-bookings"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  isActive('/my-bookings')
                    ? 'bg-sandstone-100 text-sandstone-900 font-semibold'
                    : 'text-charcoal-700 hover:text-charcoal-900 hover:bg-ivory-200'
                }`}
              >
                <Ticket className="w-4 h-4 text-sandstone-600" />
                <span>My Bookings</span>
              </Link>
            )}

            {isStaff && (
              <Link
                href="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 border border-gold-400/40 bg-gold-50/50 ${
                  pathname.startsWith('/admin')
                    ? 'bg-gold-100 text-gold-900 font-semibold border-gold-500'
                    : 'text-gold-900 hover:bg-gold-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-gold-700" />
                <span>Admin Portal</span>
              </Link>
            )}
          </div>

          {/* User Profile / Auth buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-full border border-sandstone-300 hover:border-sandstone-400 bg-white text-sm font-medium text-charcoal-800 transition-all shadow-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-sandstone-200 text-sandstone-800 flex items-center justify-center font-bold text-xs uppercase">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="max-w-[130px] truncate">{user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-charcoal-500" />
                </button>

                {userDropdownOpen && (
                  <div
                    onMouseLeave={() => setUserDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-sandstone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="px-4 py-2 border-b border-sandstone-100">
                      <p className="text-xs text-charcoal-500">Signed in as</p>
                      <p className="text-sm font-semibold text-charcoal-900 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-sandstone-100 text-sandstone-800">
                        {user?.role}
                      </span>
                    </div>

                    <Link
                      href="/my-bookings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2.5 text-sm text-charcoal-700 hover:bg-sandstone-50"
                    >
                      <Ticket className="w-4 h-4 text-sandstone-600" />
                      <span>My Tickets & Passes</span>
                    </Link>

                    {isStaff && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gold-800 hover:bg-gold-50"
                      >
                        <ShieldCheck className="w-4 h-4 text-gold-600" />
                        <span>Staff Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 border-t border-sandstone-100 text-left"
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
                  className="px-4 py-2 text-sm font-medium text-charcoal-800 hover:text-charcoal-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 text-sm font-medium shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-charcoal-700 hover:bg-sandstone-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-sandstone-200 bg-ivory-100 px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/sites"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-charcoal-800 hover:bg-sandstone-200"
          >
            <Compass className="w-5 h-5 text-sandstone-600" />
            <span>Explore Heritage Sites</span>
          </Link>

          {isAuthenticated && (
            <Link
              href="/my-bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-charcoal-800 hover:bg-sandstone-200"
            >
              <Ticket className="w-5 h-5 text-sandstone-600" />
              <span>My Bookings</span>
            </Link>
          )}

          {isStaff && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-gold-900 bg-gold-100/70 border border-gold-300"
            >
              <ShieldCheck className="w-5 h-5 text-gold-700" />
              <span>Admin & Gate Verification</span>
            </Link>
          )}

          <div className="pt-3 border-t border-sandstone-200">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-charcoal-900">{user?.name}</p>
                  <p className="text-xs text-charcoal-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-rose-600 hover:bg-rose-50"
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
                  className="w-full text-center py-2.5 rounded-xl border border-sandstone-300 font-medium text-charcoal-800 bg-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-sandstone-700 font-medium text-ivory-50 shadow-sm"
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

