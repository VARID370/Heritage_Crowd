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
          <ShieldAlert className="w-12 h-12 text-sandstone-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-charcoal-700">Verifying administrative access...</p>
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
    <div className="min-h-screen bg-sandstone-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-sandstone-200 shadow-sm mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-900 border border-gold-300 flex items-center justify-center font-bold">
              ASI
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-sandstone-700 tracking-wider block">
                HeritageConnect Control Center
              </span>
              <h1 className="font-serif text-xl font-bold text-charcoal-900">
                Staff & Administration Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-charcoal-900 block">{user?.name}</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sandstone-100 text-sandstone-800">
                {user?.role}
              </span>
            </div>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl border border-sandstone-300 hover:bg-sandstone-50 text-xs font-semibold text-charcoal-700 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Portal</span>
            </Link>
          </div>
        </div>

        {/* Admin Navigation Pills */}
        <div className="flex items-center overflow-x-auto gap-2 pb-4 mb-6 border-b border-sandstone-200 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                  active
                    ? 'bg-sandstone-800 text-ivory-50 shadow-md'
                    : 'bg-white text-charcoal-700 hover:bg-sandstone-100 border border-sandstone-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-gold-300' : 'text-sandstone-600'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Page Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}

