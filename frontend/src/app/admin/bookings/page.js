'use client';

import { useState, useEffect } from 'react';
import {
  Ticket,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [actionNotice, setActionNotice] = useState(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (status) params.append('status', status);
      params.append('limit', '50');

      const res = await api.get(`/admin/bookings?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        setBookings(res.data);
        setTotal(res.total || res.data.length);
      }
    } catch (e) {
      console.warn('Error fetching bookings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [status]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleCancelBooking = async (id, ref) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${ref}? Slot capacity will be restored.`)) {
      return;
    }

    try {
      const res = await api.patch(`/bookings/${id}/cancel`, {});
      if (res.success) {
        setActionNotice(`Booking ${ref} cancelled successfully.`);
        fetchBookings();
      }
    } catch (err) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ivory-50">
            All Visitor Bookings
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-300 font-light mt-0.5">
            Complete database of confirmed, admitted, and cancelled tickets across all monuments.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="p-2.5 rounded-xl border border-white/[0.1] hover:border-gold-500/40 bg-navy-950/70 hover:bg-white/[0.05] text-charcoal-300 hover:text-ivory-50 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex items-center px-3.5 py-2.5 bg-navy-950/70 rounded-xl border border-white/[0.1] focus-within:border-gold-500/50">
          <Search className="w-4 h-4 text-gold-400 mr-2.5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search booking ref (e.g. HC-), visitor name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs focus:outline-none text-ivory-50 placeholder-charcoal-400 font-medium"
          />
        </form>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-navy-950 text-xs font-semibold text-gold-300 focus:outline-none focus:border-gold-500/50"
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In / Admitted</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {actionNotice && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Bookings Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex justify-between items-center text-xs">
          <span className="font-semibold text-charcoal-300">
            Showing {bookings.length} of {total} total records
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-14 bg-navy-800/60 rounded-xl" />
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/70 text-charcoal-300 uppercase font-semibold border-b border-white/[0.08]">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Monument</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Visitor Details</th>
                  <th className="py-3 px-4">Pax / Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-gold-300">
                      {b.bookingReference}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-ivory-100">
                      {b.siteId?.name || 'Heritage Monument'}
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-200">
                      <div>{formatDate(b.date)}</div>
                      <div className="text-[11px] text-charcoal-400 font-mono">{b.slotTime}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-ivory-50">{b.visitorName}</div>
                      <div className="text-[11px] text-charcoal-400">{b.visitorEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-charcoal-200">{b.visitorCount} Person(s)</div>
                      <div className="font-bold text-gold-gradient">{formatINR(b.totalPrice)}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : b.status === 'checked_in'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/ticket/${b._id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-white/[0.1] hover:border-gold-500/40 bg-navy-950/70 hover:bg-white/[0.05] text-charcoal-300 hover:text-ivory-50 transition-colors"
                          title="View Ticket Pass"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
                        </Link>
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancelBooking(b._id, b.bookingReference)}
                            className="px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[11px] font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-charcoal-400 font-light">
            No bookings found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
}
