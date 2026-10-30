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
          <h2 className="font-serif text-2xl font-bold text-charcoal-900">
            All Visitor Bookings
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-500">
            Complete database of confirmed, admitted, and cancelled tickets across all monuments.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="p-2.5 rounded-xl border border-sandstone-300 hover:bg-sandstone-50 text-charcoal-700"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-sandstone-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex items-center px-3.5 py-2.5 bg-ivory-50 rounded-xl border border-sandstone-300">
          <Search className="w-4 h-4 text-sandstone-600 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search booking ref (e.g. HC-), visitor name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs focus:outline-none"
          />
        </form>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-sandstone-300 bg-ivory-50 text-xs font-semibold text-charcoal-800"
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In / Admitted</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-sandstone-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-sandstone-200 flex justify-between items-center text-xs">
          <span className="font-semibold text-charcoal-800">
            Showing {bookings.length} of {total} total records
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-14 bg-sandstone-100 rounded-xl" />
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sandstone-50 text-charcoal-600 uppercase font-semibold border-b border-sandstone-200">
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
              <tbody className="divide-y divide-sandstone-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-sandstone-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-charcoal-900">
                      {b.bookingReference}
                    </td>
                    <td className="py-3 px-4 font-semibold text-charcoal-800">
                      {b.siteId?.name || 'Heritage Monument'}
                    </td>
                    <td className="py-3 px-4 text-charcoal-700">
                      <div>{formatDate(b.date)}</div>
                      <div className="text-[11px] text-charcoal-500">{b.slotTime}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-charcoal-900">{b.visitorName}</div>
                      <div className="text-[11px] text-charcoal-500">{b.visitorEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{b.visitorCount} Person(s)</div>
                      <div className="font-bold text-charcoal-900">{formatINR(b.totalPrice)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'checked_in'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/ticket/${b._id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-sandstone-200 hover:bg-sandstone-50 text-charcoal-600"
                          title="View Ticket Pass"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancelBooking(b._id, b.bookingReference)}
                            className="px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold"
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
          <div className="py-12 text-center text-xs text-charcoal-500">
            No bookings found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
}

