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
          className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-600 hover:text-charcoal-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Monument Details</span>
        </button>

        <h1 className="font-serif text-3xl font-bold text-charcoal-900">
          Book Entry Ticket Pass
        </h1>
        <p className="mt-1 text-sm text-charcoal-600">
          Select date, time slot, and visitor count. Capacity is reserved atomically to guarantee admission.
        </p>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Booking Notice</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Booking Form Layout */}
      <form onSubmit={handleBooking} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Date & Slot Selection */}
        <div className="md:col-span-2 space-y-6">
          {/* Site Overview Banner */}
          <div className="bg-white p-5 rounded-2xl border border-sandstone-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-sandstone-700 uppercase tracking-wider block">
                Selected Heritage Site
              </span>
              <h2 className="font-serif text-xl font-bold text-charcoal-900 mt-0.5">
                {site?.name || 'Loading Monument...'}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-charcoal-500 block">Verified Official Fee</span>
              <span className="text-2xl font-bold text-charcoal-900">
                {formatINR(site?.entryFee)}
              </span>
            </div>
          </div>

          {/* Date Picker */}
          <div className="bg-white p-6 rounded-2xl border border-sandstone-200 shadow-sm space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-charcoal-900">
              <CalendarIcon className="w-4 h-4 text-sandstone-600" />
              <span>1. Choose Visit Date</span>
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-sandstone-300 bg-ivory-50 text-sm font-semibold text-charcoal-800 focus:outline-none focus:border-sandstone-600"
            />
            <p className="text-xs text-charcoal-500">
              Bookings are open up to 30 days in advance.
            </p>
          </div>

          {/* Time Slot Picker */}
          <div className="bg-white p-6 rounded-2xl border border-sandstone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold text-charcoal-900">
                <Clock className="w-4 h-4 text-sandstone-600" />
                <span>2. Select Entry Time Slot</span>
              </label>
              <span className="text-xs text-charcoal-500">
                {slots.length} slots available on {formatDate(selectedDate)}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-sandstone-100" />
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
                          ? 'opacity-50 cursor-not-allowed bg-stone-100 border-stone-200'
                          : isSelected
                          ? 'border-sandstone-700 bg-sandstone-50 ring-2 ring-sandstone-700/20 shadow-sm'
                          : 'border-sandstone-200 bg-white hover:border-sandstone-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-charcoal-900">
                            {slot.slotTime}
                          </span>
                          {!isAvailable && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase">
                              Sold Out
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-500 mt-0.5">
                          Remaining capacity: {slot.remainingCapacity} of {slot.capacity} visitors
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <CrowdBadge crowdStatus={slot.crowdStatus} />
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-sandstone-700 bg-sandstone-700 text-white'
                              : 'border-sandstone-300'
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
              <div className="py-8 text-center text-xs text-charcoal-500">
                No active time slots found for {formatDate(selectedDate)}. Please choose another date.
              </div>
            )}
          </div>

          {/* Visitor Count Selector */}
          <div className="bg-white p-6 rounded-2xl border border-sandstone-200 shadow-sm space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-charcoal-900">
              <Users className="w-4 h-4 text-sandstone-600" />
              <span>3. Number of Visitors</span>
            </label>

            <div className="flex items-center justify-between p-4 bg-ivory-50 rounded-xl border border-sandstone-200">
              <div>
                <p className="text-sm font-bold text-charcoal-900">General Admission Passes</p>
                <p className="text-xs text-charcoal-500">{formatINR(unitPrice)} per ticket</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setVisitorCount(Math.max(1, visitorCount - 1))}
                  disabled={visitorCount <= 1}
                  className="w-9 h-9 rounded-lg border border-sandstone-300 bg-white hover:bg-sandstone-100 disabled:opacity-40 font-bold text-lg text-charcoal-800 flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="font-serif text-lg font-bold text-charcoal-900 w-8 text-center">
                  {visitorCount}
                </span>
                <button
                  type="button"
                  onClick={() => setVisitorCount(Math.min(10, visitorCount + 1))}
                  disabled={visitorCount >= 10 || (selectedSlot && visitorCount >= selectedSlot.remainingCapacity)}
                  className="w-9 h-9 rounded-lg border border-sandstone-300 bg-white hover:bg-sandstone-100 disabled:opacity-40 font-bold text-lg text-charcoal-800 flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <p className="text-xs text-charcoal-400">
              Max 10 visitors per single booking transaction.
            </p>
          </div>

          {/* Primary Visitor Info */}
          <div className="bg-white p-6 rounded-2xl border border-sandstone-200 shadow-sm space-y-4">
            <label className="text-sm font-bold text-charcoal-900 block">
              4. Primary Visitor Contact Information
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Full Name (as per Gov ID Proof)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-sandstone-300 bg-ivory-50 text-sm focus:outline-none focus:border-sandstone-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Email Address (for Digital Pass)
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-sandstone-300 bg-ivory-50 text-sm focus:outline-none focus:border-sandstone-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-sandstone-300 bg-ivory-50 text-sm focus:outline-none focus:border-sandstone-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout Card */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-sandstone-300 shadow-md space-y-6 sticky top-28">
            <h3 className="font-serif text-lg font-bold text-charcoal-900 border-b border-sandstone-200 pb-3">
              Booking Summary
            </h3>

            <div className="space-y-3 text-xs text-charcoal-600">
              <div className="flex justify-between py-1">
                <span>Monument</span>
                <span className="font-semibold text-charcoal-900 text-right">{site?.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Date</span>
                <span className="font-semibold text-charcoal-900">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Time Slot</span>
                <span className="font-semibold text-charcoal-900">
                  {selectedSlot?.slotTime || 'Not Selected'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Visitors</span>
                <span className="font-semibold text-charcoal-900">{visitorCount} Adult(s)</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Ticket Price</span>
                <span className="text-charcoal-900">{formatINR(unitPrice)} each</span>
              </div>
            </div>

            {/* Total Price Display */}
            <div className="pt-4 border-t border-sandstone-200 flex items-baseline justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-charcoal-500 block">Total Amount</span>
                <span className="text-2xl font-serif font-bold text-charcoal-900">
                  {formatINR(totalPrice)}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-semibold border border-emerald-200">
                Official ASI Tariff
              </span>
            </div>

            {/* Submit Action */}
            {isAuthenticated ? (
              <button
                type="submit"
                disabled={isSubmitting || !selectedSlotId}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sandstone-700 to-sandstone-800 hover:from-sandstone-800 hover:to-sandstone-900 disabled:opacity-50 text-ivory-50 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Ticket className="w-4 h-4" />
                <span>{isSubmitting ? 'Reserving Slot...' : 'Confirm & Generate Ticket'}</span>
              </button>
            ) : (
              <Link
                href={`/login?redirect=/booking/${encodeURIComponent(siteId)}`}
                className="w-full py-3.5 px-6 rounded-2xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Lock className="w-4 h-4" />
                <span>Sign In to Complete Booking</span>
              </Link>
            )}

            <div className="text-[11px] text-charcoal-400 space-y-1 leading-relaxed">
              <p className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
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

