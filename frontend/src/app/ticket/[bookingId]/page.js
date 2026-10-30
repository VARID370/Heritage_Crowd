'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Printer,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Users,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  AlertTriangle,
  Landmark,
  QrCode,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';

export default function TicketPassPage() {
  const { bookingId } = useParams();
  const router = useRouter();

  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const decodedId = decodeURIComponent(bookingId);
        const res = await api.get(`/bookings/${encodeURIComponent(decodedId)}`);
        if (res.success && res.data) {
          setTicket(res.data);
        } else {
          setError('Ticket not found or access denied.');
        }
      } catch (err) {
        setError(err.message || 'Could not load ticket pass.');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchTicket();
    }
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-sandstone-200 rounded-lg" />
        <div className="h-[520px] bg-sandstone-100 rounded-3xl border border-sandstone-200" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-charcoal-900">
          Ticket Not Found
        </h2>
        <p className="text-sm text-charcoal-600">{error || 'Unable to locate ticket pass.'}</p>
        <Link
          href="/my-bookings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sandstone-700 text-ivory-50 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to My Bookings</span>
        </Link>
      </div>
    );
  }

  const isConfirmed = ticket.status === 'confirmed';
  const isCheckedIn = ticket.status === 'checked_in';
  const isCancelled = ticket.status === 'cancelled';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/my-bookings"
          className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-600 hover:text-charcoal-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Bookings</span>
        </Link>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Official Boarding Pass Ticket Container */}
      <div className="ticket-container bg-white rounded-3xl border-2 border-sandstone-300 shadow-xl overflow-hidden print:shadow-none print:border-black">
        {/* Ticket Header */}
        <div className="bg-sandstone-800 text-ivory-50 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-sandstone-700 border border-gold-400/30 flex items-center justify-center text-ivory-50">
              <Landmark className="w-6 h-6 text-gold-300" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight">
                Heritage<span className="text-sandstone-400">Connect</span>
              </span>
              <p className="text-[11px] text-ivory-300 font-mono tracking-wider uppercase">
                Official Digital Admission Pass
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {isConfirmed && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Valid Pass
              </span>
            )}
            {isCheckedIn && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Admitted / Used
              </span>
            )}
            {isCancelled && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/40 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> Cancelled
              </span>
            )}
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Monument Title & Booking Ref */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-sandstone-200 pb-5">
            <div>
              <span className="text-xs font-semibold text-sandstone-700 uppercase tracking-wider">
                Monument of Visit
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 mt-0.5">
                {ticket.site?.name || 'Heritage Monument'}
              </h2>
              <p className="text-xs text-charcoal-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-sandstone-600" />
                <span>{[ticket.site?.city, ticket.site?.state].filter(Boolean).join(', ') || 'India'}</span>
              </p>
            </div>

            <div className="bg-sandstone-50 border border-sandstone-200 rounded-xl p-3 text-right">
              <span className="text-[10px] text-charcoal-400 uppercase tracking-wider font-semibold block">
                Booking Reference
              </span>
              <span className="font-mono text-base font-bold text-charcoal-900">
                {ticket.bookingReference}
              </span>
            </div>
          </div>

          {/* Grid of Key Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-b border-sandstone-200 text-xs">
            <div>
              <span className="text-charcoal-400 uppercase font-semibold text-[10px] block">Visit Date</span>
              <span className="font-bold text-charcoal-900 text-sm mt-0.5 block">
                {formatDate(ticket.date)}
              </span>
            </div>

            <div>
              <span className="text-charcoal-400 uppercase font-semibold text-[10px] block">Time Slot</span>
              <span className="font-bold text-charcoal-900 text-sm mt-0.5 block">
                {ticket.slotTime}
              </span>
            </div>

            <div>
              <span className="text-charcoal-400 uppercase font-semibold text-[10px] block">Visitors</span>
              <span className="font-bold text-charcoal-900 text-sm mt-0.5 block">
                {ticket.visitorCount} Person(s)
              </span>
            </div>

            <div>
              <span className="text-charcoal-400 uppercase font-semibold text-[10px] block">Amount Paid</span>
              <span className="font-bold text-charcoal-900 text-sm mt-0.5 block text-emerald-800">
                {formatINR(ticket.totalPrice)}
              </span>
            </div>
          </div>

          {/* Visitor Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs py-1 border-b border-sandstone-200">
            <div>
              <span className="text-charcoal-400 uppercase font-semibold text-[10px] block">Primary Visitor</span>
              <span className="font-semibold text-charcoal-900 text-sm mt-0.5 block">
                {ticket.visitorName}
              </span>
            </div>

            <div>
              <span className="text-charcoal-400 uppercase font-semibold text-[10px] block">Contact Email</span>
              <span className="font-medium text-charcoal-800 text-sm mt-0.5 block">
                {ticket.visitorEmail}
              </span>
            </div>
          </div>

          {/* QR Code and Gate Verification Instructions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-6 bg-sandstone-50/70 p-6 rounded-2xl border border-sandstone-200">
            {/* QR Code Display */}
            <div className="flex-shrink-0 bg-white p-3 rounded-2xl border border-sandstone-300 shadow-sm text-center">
              {ticket.qrCodeDataUrl ? (
                <Image
                  src={ticket.qrCodeDataUrl}
                  alt={`QR Pass ${ticket.bookingReference}`}
                  width={180}
                  height={180}
                  className="mx-auto"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center bg-sandstone-100 rounded-xl">
                  <QrCode className="w-16 h-16 text-sandstone-400" />
                </div>
              )}
              <span className="block mt-2 font-mono text-[10px] text-charcoal-500">
                {ticket.bookingReference}
              </span>
            </div>

            {/* Verification Instructions */}
            <div className="space-y-3 text-xs text-charcoal-700">
              <h4 className="font-serif text-sm font-bold text-charcoal-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Monument Entry Verification Instructions</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-charcoal-600 list-disc list-inside">
                <li>Present this digital or printed pass at the monument turnstile or security gate.</li>
                <li>Each pass permits one-time entry during the designated slot window.</li>
                <li>Primary visitor must present a valid government photo identity card.</li>
                <li>Non-transferable pass. Strictly adheres to ASI conservation guidelines.</li>
              </ul>
              {isCheckedIn && ticket.checkedInAt && (
                <p className="text-xs text-blue-800 font-semibold bg-blue-50 p-2 rounded-lg border border-blue-200">
                  Admitted at gate on: {new Date(ticket.checkedInAt).toLocaleString('en-IN')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Footer */}
        <div className="bg-sandstone-100 px-6 py-3 border-t border-sandstone-200 text-center text-[10px] text-charcoal-500">
          HeritageConnect Integrated Digital Ticketing • Government & ASI Certified System • Keep pass safe
        </div>
      </div>
    </div>
  );
}

