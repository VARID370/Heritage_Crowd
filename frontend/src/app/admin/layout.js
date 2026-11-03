'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Landmark,
  Clock,
  Ticket,
  QrCode,
  ShieldAlert,
  ArrowLeft,
  Users,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isStaff, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || !isStaff)) {
      router.push('/login?redirect=/admin');
    }
  }, [user, isStaff, isLoading, router]);

  if (isLoading || !isStaff) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-gold-500 dark:text-gold-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-charcoal-600 dark:text-charcoal-300">Verifying administrative access...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Crowd Dashboard', icon: LayoutDashboard },
    { href: '/admin/verify-ticket', label: 'Gate QR Verification', icon: QrCode },
    { href: '/admin/sites', label: 'Bookable Sites', icon: Landmark },
    { href: '/admin/slots', label: 'Slot & Capacity', icon: Clock },
    { href: '/admin/bookings', label: 'All Bookings', icon: Ticket },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-card p-5 sm:p-6 rounded-3xl mb-8">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-500/20 to-navy-900 border border-gold-400/30 text-gold-600 dark:text-gold-400 flex items-center justify-center font-bold text-sm shadow-gold-glow">
              ASI
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-gold-600 dark:text-gold-400 tracking-widest block">
                HeritageConnect Control Center
              </span>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-charcoal-900 dark:text-ivory-50 mt-0.5">
                Staff & Administration Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-charcoal-900 dark:text-ivory-100 block">{user?.name}</span>
              <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-gold-500/15 text-gold-700 dark:text-gold-300 border border-gold-500/25">
                {user?.role}
              </span>
            </div>
            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl border border-sandstone-300 dark:border-white/[0.12] hover:border-gold-500/40 bg-sandstone-100 dark:bg-navy-950/70 hover:bg-sandstone-200 dark:hover:bg-white/[0.06] text-xs font-semibold text-charcoal-800 dark:text-charcoal-200 hover:text-charcoal-900 dark:hover:text-ivory-50 flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
              <span>Public Portal</span>
            </Link>
          </div>
        </div>

        {/* Admin Navigation Pills */}
        <div className="flex items-center overflow-x-auto gap-2 pb-4 mb-6 border-b border-sandstone-200 dark:border-white/[0.08] no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                  active
                    ? 'bg-gold-500/20 text-gold-700 dark:text-gold-300 border border-gold-400/40 shadow-gold-glow font-bold'
                    : 'bg-white/70 dark:bg-navy-900/60 text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-ivory-50 hover:bg-sandstone-100 dark:hover:bg-white/[0.05] border border-sandstone-200 dark:border-white/[0.08]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-gold-600 dark:text-gold-400' : 'text-charcoal-500 dark:text-charcoal-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Admin Page Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
