'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Ticket,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import CrowdBadge from '@/components/CrowdBadge';

export default function BookingFlowPage() {
  const { siteId } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [site, setSite] = useState(null);
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Today's date YYYY-MM-DD as default min
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [visitorCount, setVisitorCount] = useState(1);

  // Visitor contact details
  const [visitorName, setVisitorName] = useState(user?.name || '');
  const [visitorEmail, setVisitorEmail] = useState(user?.email || '');
  const [visitorPhone, setVisitorPhone] = useState(user?.phone || '');

  // Pre-fill user info when authenticated
  useEffect(() => {
    if (user) {
      if (!visitorName) setVisitorName(user.name || '');
      if (!visitorEmail) setVisitorEmail(user.email || '');
      if (!visitorPhone) setVisitorPhone(user.phone || '');
    }
  }, [user]);

  // Fetch slots whenever site or selectedDate changes
  useEffect(() => {
    const fetchSiteAndSlots = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const decodedSiteId = decodeURIComponent(siteId);
        const res = await api.get(`/sites/${encodeURIComponent(decodedSiteId)}/slots?date=${selectedDate}`);
        if (res.success) {
          setSite(res.site);
          setSlots(res.slots || []);
          // Auto-select first available slot if any
          const firstAvailable = res.slots?.find((s) => s.isAvailable);
          if (firstAvailable) {
            setSelectedSlotId(firstAvailable.id);
          } else {
            setSelectedSlotId('');
          }
        }
      } catch (err) {
        setError(err.message || 'Could not load site slots.');
      } finally {
        setIsLoading(false);
      }
    };

    if (siteId && selectedDate) {
      fetchSiteAndSlots();
    }
  }, [siteId, selectedDate]);

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  const unitPrice = site?.entryFee || 0;
  const totalPrice = unitPrice * visitorCount;

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?redirect=/booking/${encodeURIComponent(siteId)}`);
      return;
    }

    if (!selectedSlotId) {
      setError('Please select an available time slot.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        siteId: site.id,
        slotId: selectedSlotId,
        date: selectedDate,
        visitorCount: parseInt(visitorCount, 10),
        visitorName: visitorName.trim(),
        visitorEmail: visitorEmail.trim(),
        visitorPhone: visitorPhone.trim(),
      };

      const res = await api.post('/bookings', payload);
      if (res.success && res.data?.booking) {
        // Successfully booked! Navigate to ticket pass
        router.push(`/ticket/${res.data.booking.id}`);
      }
    } catch (err) {
      setError(err.message || 'Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-300 hover:text-ivory-50 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 text-gold-400" />
          <span>Back to Monument Details</span>
        </button>

        <h1 className="font-serif text-3xl font-bold text-ivory-50">
          Book Entry Ticket Pass
        </h1>
        <p className="mt-1 text-sm text-charcoal-300 font-light">
          Select date, time slot, and visitor count. Capacity is reserved atomically to guarantee admission.
        </p>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs sm:text-sm flex items-start gap-3 backdrop-blur-md">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-200">Booking Notice</h4>
            <p className="mt-0.5 text-rose-300/90 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Booking Form Layout */}
      <form onSubmit={handleBooking} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Date & Slot Selection */}
        <div className="md:col-span-2 space-y-6">
          {/* Site Overview Banner */}
          <div className="glass-card p-5 sm:p-6 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest block">
                Selected Heritage Site
              </span>
              <h2 className="font-serif text-xl font-bold text-ivory-50 mt-1">
                {site?.name || 'Loading Monument...'}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-charcoal-400 block font-light">Official Tariff</span>
              <span className="text-2xl font-bold text-gold-gradient font-serif">
                {formatINR(site?.entryFee)}
              </span>
            </div>
          </div>

          {/* Date Picker */}
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-ivory-50">
              <CalendarIcon className="w-4 h-4 text-gold-400" />
              <span>1. Choose Visit Date</span>
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-navy-950/70 text-sm font-semibold text-ivory-50 focus:outline-none focus:border-gold-500/50"
            />
            <p className="text-xs text-charcoal-400 font-light">
              Bookings are open up to 30 days in advance.
            </p>
          </div>

          {/* Time Slot Picker */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold text-ivory-50">
                <Clock className="w-4 h-4 text-gold-400" />
                <span>2. Select Entry Time Slot</span>
              </label>
              <span className="text-xs text-charcoal-400">
                {slots.length} slots available on {formatDate(selectedDate)}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-navy-800/60" />
                ))}
              </div>
            ) : slots.length > 0 ? (
              <div className="space-y-3">
                {slots.map((slot) => {
                  const isSelected = selectedSlotId === slot.id;
                  const isAvailable = slot.isAvailable;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                        !isAvailable
                          ? 'opacity-40 cursor-not-allowed bg-navy-950/40 border-white/[0.04]'
                          : isSelected
                          ? 'border-gold-500 bg-gold-500/10 shadow-gold-glow'
                          : 'border-white/[0.08] bg-navy-950/60 hover:border-gold-500/30 hover:bg-white/[0.03]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-bold text-ivory-50 font-mono">
                            {slot.slotTime}
                          </span>
                          {!isAvailable && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                              Sold Out
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-400 mt-1 font-light">
                          Remaining capacity: {slot.remainingCapacity} of {slot.capacity} visitors
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <CrowdBadge crowdStatus={slot.crowdStatus} />
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-gold-400 bg-gold-400 text-navy-950'
                              : 'border-white/[0.2]'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-charcoal-400 font-light">
                No active time slots found for {formatDate(selectedDate)}. Please choose another date.
              </div>
            )}
          </div>

          {/* Visitor Count Selector */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-ivory-50">
              <Users className="w-4 h-4 text-gold-400" />
              <span>3. Number of Visitors</span>
            </label>

            <div className="flex items-center justify-between p-4 bg-navy-950/70 rounded-xl border border-white/[0.08]">
              <div>
                <p className="text-sm font-bold text-ivory-50">General Admission Passes</p>
                <p className="text-xs text-charcoal-400 font-light">{formatINR(unitPrice)} per ticket</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setVisitorCount(Math.max(1, visitorCount - 1))}
                  disabled={visitorCount <= 1}
                  className="w-9 h-9 rounded-lg border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 font-bold text-lg text-ivory-50 flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="font-mono text-lg font-bold text-gold-300 w-8 text-center">
                  {visitorCount}
                </span>
                <button
                  type="button"
                  onClick={() => setVisitorCount(Math.min(10, visitorCount + 1))}
                  disabled={visitorCount >= 10 || (selectedSlot && visitorCount >= selectedSlot.remainingCapacity)}
                  className="w-9 h-9 rounded-lg border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 font-bold text-lg text-ivory-50 flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <p className="text-xs text-charcoal-400 font-light">
              Max 10 visitors per single booking transaction.
            </p>
          </div>

          {/* Primary Visitor Info */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <label className="text-sm font-bold text-ivory-50 block">
              4. Primary Visitor Contact Information
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-charcoal-300 mb-1.5 uppercase tracking-wider">
                  Full Name (as per Gov ID Proof)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-navy-950/70 text-sm focus:outline-none focus:border-gold-500/50 text-ivory-50 placeholder-charcoal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-300 mb-1.5 uppercase tracking-wider">
                  Email Address (for Digital Pass)
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-navy-950/70 text-sm focus:outline-none focus:border-gold-500/50 text-ivory-50 placeholder-charcoal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-300 mb-1.5 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-navy-950/70 text-sm focus:outline-none focus:border-gold-500/50 text-ivory-50 placeholder-charcoal-500 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout Card */}
        <div className="space-y-6">
          <div className="glass-panel-gold p-6 rounded-3xl space-y-6 sticky top-28 shadow-glass-card">
            <h3 className="font-serif text-lg font-bold text-ivory-50 border-b border-white/[0.08] pb-3">
              Booking Summary
            </h3>

            <div className="space-y-3 text-xs text-charcoal-300 font-light">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span>Monument</span>
                <span className="font-semibold text-ivory-100 text-right">{site?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span>Date</span>
                <span className="font-semibold text-ivory-100">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span>Time Slot</span>
                <span className="font-semibold text-gold-300 font-mono">
                  {selectedSlot?.slotTime || 'Not Selected'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span>Visitors</span>
                <span className="font-semibold text-ivory-100">{visitorCount} Adult(s)</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Ticket Price</span>
                <span className="text-ivory-200">{formatINR(unitPrice)} each</span>
              </div>
            </div>

            {/* Total Price Display */}
            <div className="pt-4 border-t border-white/[0.08] flex items-baseline justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-charcoal-400 block tracking-wider">Total Amount</span>
                <span className="text-2xl font-serif font-bold text-gold-gradient">
                  {formatINR(totalPrice)}
                </span>
              </div>
              <span className="text-[11px] text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-md font-semibold border border-emerald-500/30">
                Official ASI Tariff
              </span>
            </div>

            {/* Submit Action */}
            {isAuthenticated ? (
              <button
                type="submit"
                disabled={isSubmitting || !selectedSlotId}
                className="btn-gold w-full py-3.5 px-6 rounded-2xl disabled:opacity-50 text-sm font-semibold flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Ticket className="w-4 h-4 text-navy-950" />
                <span>{isSubmitting ? 'Reserving Slot...' : 'Confirm & Generate Ticket'}</span>
              </button>
            ) : (
              <Link
                href={`/login?redirect=/booking/${encodeURIComponent(siteId)}`}
                className="btn-gold w-full py-3.5 px-6 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-navy-950" />
                <span>Sign In to Complete Booking</span>
              </Link>
            )}

            <div className="text-[11px] text-charcoal-400 space-y-1.5 leading-relaxed font-light">
              <p className="flex items-center gap-1.5 text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Immediate digital pass with cryptographic QR code.</span>
              </p>
              <p>Cancellation allowed up to slot start time.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
