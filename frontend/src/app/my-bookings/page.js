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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed Pass
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Admitted / Used
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-sandstone-200 rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 bg-sandstone-100 rounded-3xl border border-sandstone-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sandstone-200 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-charcoal-900">
            My Tickets & Heritage Passes
          </h1>
          <p className="mt-1 text-sm text-charcoal-600">
            View active bookings, download official QR passes, or manage cancellations.
          </p>
        </div>

        <Link
          href="/sites"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 text-xs font-semibold shadow-sm transition-colors"
        >
          <Compass className="w-4 h-4" />
          <span>Explore More Sites</span>
        </Link>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-sandstone-200 pb-3">
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterStatus === tab.id
                ? 'bg-sandstone-700 text-ivory-50 shadow-sm'
                : 'text-charcoal-600 hover:bg-sandstone-100'
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
              className="bg-white rounded-3xl border border-sandstone-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-bold text-sandstone-800 bg-sandstone-100 px-3 py-1 rounded-lg">
                    {b.bookingReference}
                  </span>
                  {getStatusBadge(b.status)}
                </div>

                <div>
                  <h3 className="font-serif text-xl font-bold text-charcoal-900">
                    {b.site?.name || 'Heritage Monument'}
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    {[b.site?.city, b.site?.state].filter(Boolean).join(', ') || 'India'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-charcoal-700">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sandstone-600" />
                    <span className="font-medium">{formatDate(b.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sandstone-600" />
                    <span className="font-medium">{b.slotTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sandstone-600" />
                    <span className="font-medium">{b.visitorCount} Visitor(s)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-sandstone-600" />
                    <span className="font-bold text-charcoal-900">{formatINR(b.totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex md:flex-col justify-end md:justify-center items-end gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-sandstone-100 flex-shrink-0">
                <Link
                  href={`/ticket/${b.id}`}
                  className="px-4 py-2.5 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>View Pass</span>
                </Link>

                {b.status === 'confirmed' && (
                  <button
                    type="button"
                    disabled={cancellingId === b.id}
                    onClick={() => handleCancelBooking(b.id)}
                    className="px-4 py-2.5 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-sandstone-200 p-8 space-y-4">
          <Ticket className="w-16 h-16 text-sandstone-300 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-charcoal-900">
            No bookings found
          </h3>
          <p className="text-sm text-charcoal-500 max-w-sm mx-auto">
            You don&apos;t have any {filterStatus !== 'all' ? filterStatus : ''} ticket bookings at the moment.
          </p>
          <Link
            href="/sites"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 text-sm font-semibold transition-colors"
          >
            <span>Browse Heritage Monuments</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

