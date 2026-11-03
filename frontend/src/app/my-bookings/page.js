'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowRight,
  Landmark,
  Compass,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';

export default function MyBookingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/bookings/my-bookings');
      if (res.success && Array.isArray(res.data)) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/my-bookings');
      } else {
        fetchBookings();
      }
    }
  }, [authLoading, isAuthenticated, router]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this ticket? Your slot capacity will be restored for other visitors.')) {
      return;
    }

    setCancellingId(bookingId);
    setActionMessage(null);
    try {
      const res = await api.patch(`/bookings/${bookingId}/cancel`, {});
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: 'Booking cancelled successfully. Slot capacity has been restored.',
        });
        fetchBookings();
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Could not cancel booking.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === 'all') return true;
    return b.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Confirmed Pass</span>
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Admitted / Used</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-sandstone-200 dark:bg-navy-800/80 rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 bg-sandstone-100 dark:bg-navy-900/60 rounded-3xl border border-sandstone-200 dark:border-white/[0.06]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sandstone-200 dark:border-white/[0.08] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/25 text-gold-600 dark:text-gold-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-gold-500 dark:text-gold-400" />
            <span>Visitor Digital Wallet</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-charcoal-900 dark:text-ivory-50">
            My Tickets & Heritage Passes
          </h1>
          <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-300 font-light">
            View active bookings, access cryptographic QR passes, or manage cancellations.
          </p>
        </div>

        <Link
          href="/sites"
          className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm"
        >
          <Compass className="w-4 h-4 text-navy-950" />
          <span>Explore More Sites</span>
        </Link>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-2.5 backdrop-blur-md ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-sandstone-200 dark:border-white/[0.08] pb-4">
        {[
          { id: 'all', label: `All (${bookings.length})` },
          { id: 'confirmed', label: `Confirmed (${bookings.filter((b) => b.status === 'confirmed').length})` },
          { id: 'checked_in', label: `Admitted (${bookings.filter((b) => b.status === 'checked_in').length})` },
          { id: 'cancelled', label: `Cancelled (${bookings.filter((b) => b.status === 'cancelled').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterStatus(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterStatus === tab.id
                ? 'bg-gold-500/20 text-gold-700 dark:text-gold-300 border border-gold-400/40 shadow-gold-glow'
                : 'text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-ivory-50 hover:bg-sandstone-100 dark:hover:bg-white/[0.05] border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="glass-card rounded-3xl p-6 hover:border-gold-500/40 transition-all flex flex-col md:flex-row justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-bold text-gold-700 dark:text-gold-300 bg-gold-500/10 border border-gold-500/25 px-3 py-1 rounded-lg">
                    REF: {b.bookingReference}
                  </span>
                  {getStatusBadge(b.status)}
                </div>

                <div>
                  <h3 className="font-serif text-xl font-bold text-charcoal-900 dark:text-ivory-50">
                    {b.site?.name || 'Heritage Monument'}
                  </h3>
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-300 font-light mt-0.5">
                    {[b.site?.city, b.site?.state].filter(Boolean).join(', ') || 'India'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-charcoal-700 dark:text-charcoal-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gold-500 dark:text-gold-400" />
                    <span className="font-medium">{formatDate(b.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gold-500 dark:text-gold-400" />
                    <span className="font-mono text-gold-700 dark:text-gold-200">{b.slotTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-gold-500 dark:text-gold-400" />
                    <span className="font-medium">{b.visitorCount} Visitor(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="w-3.5 h-3.5 text-gold-500 dark:text-gold-400" />
                    <span className="font-bold text-charcoal-900 dark:text-ivory-50">{formatINR(b.totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex md:flex-col justify-end md:justify-center items-end gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-sandstone-200 dark:border-white/[0.08] flex-shrink-0">
                <Link
                  href={`/ticket/${b.id}`}
                  className="btn-gold px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Ticket className="w-3.5 h-3.5 text-navy-950" />
                  <span>View QR Pass</span>
                </Link>

                {b.status === 'confirmed' && (
                  <button
                    type="button"
                    disabled={cancellingId === b.id}
                    onClick={() => handleCancelBooking(b.id)}
                    className="px-4 py-2.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass-card rounded-3xl p-8 space-y-4">
          <Ticket className="w-16 h-16 text-gold-500 dark:text-gold-400 mx-auto opacity-70" />
          <h3 className="font-serif text-xl font-bold text-charcoal-900 dark:text-ivory-100">
            No bookings found
          </h3>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-300 max-w-sm mx-auto font-light leading-relaxed">
            You don&apos;t have any {filterStatus !== 'all' ? filterStatus : ''} ticket bookings at the moment.
          </p>
          <Link
            href="/sites"
            className="btn-gold inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
          >
            <span>Browse Heritage Monuments</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
