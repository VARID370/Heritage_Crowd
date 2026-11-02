'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Landmark,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import CrowdBadge from '@/components/CrowdBadge';

export default function AdminSlotsPage() {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // New Slot Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [capacity, setCapacity] = useState(150);

  // 1. Fetch sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await api.get('/admin/sites');
        if (res.success && Array.isArray(res.data)) {
          setSites(res.data);
          if (res.data.length > 0) {
            setSelectedSiteId(res.data[0]._id);
          }
        }
      } catch (e) {
        console.error('Failed to load sites:', e);
      }
    };
    fetchSites();
  }, []);

  // 2. Fetch slots when site or date changes
  const fetchSlots = async () => {
    if (!selectedSiteId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/sites/${selectedSiteId}/slots?date=${selectedDate}`);
      if (res.success) {
        setSlots(res.slots || []);
      }
    } catch (e) {
      console.warn('Error loading slots:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSiteId && selectedDate) {
      fetchSlots();
    }
  }, [selectedSiteId, selectedDate]);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const payload = {
        siteId: selectedSiteId,
        date: selectedDate,
        startTime,
        endTime,
        capacity: parseInt(capacity, 10),
      };

      const res = await api.post('/admin/slots', payload);
      if (res.success) {
        setMessage({ type: 'success', text: 'Time slot created successfully!' });
        setShowAddForm(false);
        fetchSlots();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create time slot.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ivory-50">
            Time Slot & Capacity Management
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-300 font-light mt-0.5">
            Configure visiting windows and monitor crowd allocation for each monument.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-gold px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4 text-navy-950" />
          <span>{showAddForm ? 'Close Form' : 'Create New Slot'}</span>
        </button>
      </div>

      {/* Filter Selector Bar */}
      <div className="glass-card p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-charcoal-300 mb-1.5 uppercase tracking-wider">
            Select Monument
          </label>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-navy-950 text-xs font-bold text-gold-300 focus:outline-none focus:border-gold-500/50"
          >
            {sites.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.city})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-300 mb-1.5 uppercase tracking-wider">
            Slot Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-navy-950 text-xs font-bold text-ivory-50 focus:outline-none focus:border-gold-500/50"
          />
        </div>
      </div>

      {/* Notification */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 backdrop-blur-md ${
            message.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Add Slot Form Drawer */}
      {showAddForm && (
        <div className="glass-panel-gold p-6 rounded-3xl space-y-4 animate-in fade-in shadow-glass-card">
          <h3 className="font-serif text-base font-bold text-ivory-50">
            Create Time Slot for {formatDate(selectedDate)}
          </h3>

          <form onSubmit={handleCreateSlot} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-charcoal-300 mb-1 uppercase tracking-wider">Start Time (24h)</label>
              <input
                type="text"
                required
                placeholder="09:00"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-navy-950 text-gold-300 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-charcoal-300 mb-1 uppercase tracking-wider">End Time (24h)</label>
              <input
                type="text"
                required
                placeholder="12:00"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-navy-950 text-gold-300 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-charcoal-300 mb-1 uppercase tracking-wider">Slot Capacity</label>
              <input
                type="number"
                required
                min="1"
                placeholder="150"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-navy-950 text-ivory-50 font-bold"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl border border-white/[0.12] hover:bg-white/[0.06] text-charcoal-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-gold px-5 py-2 rounded-xl font-semibold shadow-sm"
              >
                Save Slot
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Slots List */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.08] flex justify-between items-center">
          <h3 className="font-serif text-base font-bold text-ivory-50">
            Active Slots on {formatDate(selectedDate)}
          </h3>
          <span className="text-xs text-charcoal-400 font-light">{slots.length} configured slot(s)</span>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-navy-800/60 rounded-xl" />
            ))}
          </div>
        ) : slots.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/70 text-charcoal-300 uppercase font-semibold border-b border-white/[0.08]">
                <tr>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Booked / Total Capacity</th>
                  <th className="py-3 px-4">Remaining Available</th>
                  <th className="py-3 px-4">Crowd Utilization</th>
                  <th className="py-3 px-4">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {slots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-ivory-50 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gold-400" />
                      <span className="font-mono text-gold-300">{slot.slotTime}</span>
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-300">
                      <span className="font-bold text-ivory-100">{slot.bookedVisitors}</span> / {slot.capacity}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-gold-300">{slot.remainingCapacity} visitors</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 w-36">
                        <div className="flex-1 h-2 rounded-full bg-navy-950 border border-white/[0.08] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              slot.crowdStatus.percent < 40
                                ? 'bg-emerald-500'
                                : slot.crowdStatus.percent < 70
                                ? 'bg-sky-500'
                                : slot.crowdStatus.percent < 85
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${slot.crowdStatus.percent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-charcoal-400">
                          {slot.crowdStatus.percent}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <CrowdBadge crowdStatus={slot.crowdStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-charcoal-400 space-y-2 font-light">
            <p>No slots found for this monument on {formatDate(selectedDate)}.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-gold-400 hover:text-gold-300 font-semibold underline"
            >
              Click here to create the first slot.
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
