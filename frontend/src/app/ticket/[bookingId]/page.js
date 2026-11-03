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
  Sparkles,
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
        <div className="h-8 w-40 bg-sandstone-200 dark:bg-navy-800/80 rounded-xl" />
        <div className="h-[520px] bg-sandstone-100 dark:bg-navy-900/60 rounded-3xl border border-sandstone-200 dark:border-white/[0.06]" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto text-amber-500 dark:text-amber-400 shadow-gold-glow">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-charcoal-900 dark:text-ivory-50">
          Ticket Not Found
        </h2>
        <p className="text-sm text-charcoal-600 dark:text-charcoal-300 font-light leading-relaxed">{error || 'Unable to locate ticket pass.'}</p>
        <Link
          href="/my-bookings"
          className="btn-gold inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold mt-2"
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
          className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-ivory-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gold-500 dark:text-gold-400" />
          <span>Back to My Bookings</span>
        </Link>

        <button
          onClick={handlePrint}
          className="btn-gold px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
        >
          <Printer className="w-4 h-4 text-navy-950" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Official Boarding Pass Ticket Container */}
      <div className="ticket-container bg-white dark:bg-navy-900 rounded-3xl border border-sandstone-300 dark:border-gold-500/30 shadow-2xl overflow-hidden print:shadow-none print:bg-white print:border-black print:text-black">
        {/* Ticket Header */}
        <div className="bg-sandstone-100 dark:bg-navy-950 text-charcoal-900 dark:text-ivory-50 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sandstone-200 dark:border-white/[0.08] print:border-b-2 print:border-black">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gold-500/15 border border-gold-400/30 flex items-center justify-center text-gold-600 dark:text-gold-400 shadow-gold-glow">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-50 print:text-black">
                Heritage<span className="text-gold-600 dark:text-gold-400">Connect</span>
              </span>
              <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400 font-mono tracking-widest uppercase mt-0.5 print:text-gray-600">
                Official Digital Admission Pass
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {isConfirmed && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span>Valid Pass</span>
              </span>
            )}
            {isCheckedIn && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-400/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Admitted / Used</span>
              </span>
            )}
            {isCancelled && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-400/40 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Cancelled</span>
              </span>
            )}
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Monument Title & Booking Ref */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-sandstone-200 dark:border-white/[0.08] pb-5 print:border-gray-300">
            <div>
              <span className="text-xs font-semibold text-gold-600 dark:text-gold-400 uppercase tracking-widest">
                Monument of Visit
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 dark:text-ivory-50 mt-1 print:text-black">
                {ticket.site?.name || 'Heritage Monument'}
              </h2>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-300 flex items-center gap-1.5 mt-1 font-light print:text-gray-700">
                <MapPin className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
                <span>{[ticket.site?.city, ticket.site?.state].filter(Boolean).join(', ') || 'India'}</span>
              </p>
            </div>

            <div className="bg-sandstone-50 dark:bg-navy-950 border border-sandstone-200 dark:border-white/[0.1] rounded-2xl p-3.5 text-right print:border-gray-300 print:bg-gray-50">
              <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400 uppercase tracking-widest font-semibold block">
                Booking Reference
              </span>
              <span className="font-mono text-base font-bold text-gold-600 dark:text-gold-300 print:text-black">
                {ticket.bookingReference}
              </span>
            </div>
          </div>

          {/* Grid of Key Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-b border-sandstone-200 dark:border-white/[0.08] text-xs print:border-gray-300">
            <div>
              <span className="text-charcoal-500 dark:text-charcoal-400 uppercase font-semibold text-[10px] tracking-wider block">Visit Date</span>
              <span className="font-bold text-charcoal-900 dark:text-ivory-100 text-sm mt-0.5 block print:text-black">
                {formatDate(ticket.date)}
              </span>
            </div>

            <div>
              <span className="text-charcoal-500 dark:text-charcoal-400 uppercase font-semibold text-[10px] tracking-wider block">Time Slot</span>
              <span className="font-mono font-bold text-gold-600 dark:text-gold-300 text-sm mt-0.5 block print:text-black">
                {ticket.slotTime}
              </span>
            </div>

            <div>
              <span className="text-charcoal-500 dark:text-charcoal-400 uppercase font-semibold text-[10px] tracking-wider block">Visitors</span>
              <span className="font-bold text-charcoal-900 dark:text-ivory-100 text-sm mt-0.5 block print:text-black">
                {ticket.visitorCount} Person(s)
              </span>
            </div>

            <div>
              <span className="text-charcoal-500 dark:text-charcoal-400 uppercase font-semibold text-[10px] tracking-wider block">Amount Paid</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-300 text-sm mt-0.5 block print:text-black">
                {formatINR(ticket.totalPrice)}
              </span>
            </div>
          </div>

          {/* Visitor Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs py-1 border-b border-sandstone-200 dark:border-white/[0.08] print:border-gray-300">
            <div>
              <span className="text-charcoal-500 dark:text-charcoal-400 uppercase font-semibold text-[10px] tracking-wider block">Primary Visitor</span>
              <span className="font-semibold text-charcoal-900 dark:text-ivory-100 text-sm mt-0.5 block print:text-black">
                {ticket.visitorName}
              </span>
            </div>

            <div>
              <span className="text-charcoal-500 dark:text-charcoal-400 uppercase font-semibold text-[10px] tracking-wider block">Contact Email</span>
              <span className="font-medium text-charcoal-700 dark:text-charcoal-200 text-sm mt-0.5 block print:text-black">
                {ticket.visitorEmail}
              </span>
            </div>
          </div>

          {/* QR Code and Gate Verification Instructions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-6 bg-sandstone-50 dark:bg-navy-950/80 p-6 rounded-2xl border border-sandstone-200 dark:border-white/[0.08] print:bg-white print:border-gray-300">
            {/* QR Code Display */}
            <div className="flex-shrink-0 bg-white p-3.5 rounded-2xl border border-gold-400/40 shadow-lg text-center">
              {ticket.qrCodeDataUrl ? (
                <Image
                  src={ticket.qrCodeDataUrl}
                  alt={`QR Pass ${ticket.bookingReference}`}
                  width={180}
                  height={180}
                  className="mx-auto"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center bg-gray-100 rounded-xl">
                  <QrCode className="w-16 h-16 text-gray-500" />
                </div>
              )}
              <span className="block mt-2 font-mono text-[10px] font-bold text-navy-950">
                {ticket.bookingReference}
              </span>
            </div>

            {/* Verification Instructions */}
            <div className="space-y-3 text-xs text-charcoal-600 dark:text-charcoal-300 print:text-gray-700">
              <h4 className="font-serif text-sm font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-1.5 print:text-black">
                <ShieldCheck className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                <span>Monument Entry Verification Instructions</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-charcoal-600 dark:text-charcoal-300 list-disc list-inside font-light print:text-gray-600">
                <li>Present this digital or printed pass at the monument turnstile or security gate.</li>
                <li>Each pass permits one-time entry during the designated slot window.</li>
                <li>Primary visitor must present a valid government photo identity card.</li>
                <li>Non-transferable pass. Strictly adheres to ASI conservation guidelines.</li>
              </ul>
              {isCheckedIn && ticket.checkedInAt && (
                <p className="text-xs text-sky-700 dark:text-sky-300 font-semibold bg-sky-500/15 p-2 rounded-lg border border-sky-500/30">
                  Admitted at gate on: {new Date(ticket.checkedInAt).toLocaleString('en-IN')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Footer */}
        <div className="bg-sandstone-100 dark:bg-navy-950 px-6 py-3 border-t border-sandstone-200 dark:border-white/[0.08] text-center text-[10px] text-charcoal-500 dark:text-charcoal-400 font-mono tracking-wider print:border-gray-300 print:text-gray-600">
          HeritageConnect Integrated Digital Ticketing • Government & ASI Certified System • Keep pass safe
        </div>
      </div>
    </div>
  );
}
