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
          <h2 className="font-serif text-2xl font-bold text-charcoal-900">
            Time Slot & Capacity Management
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-500">
            Configure visiting windows and monitor crowd allocation for each monument.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Form' : 'Create New Slot'}</span>
        </button>
      </div>

      {/* Filter Selector Bar */}
      <div className="bg-white p-5 rounded-2xl border border-sandstone-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">
            Select Monument
          </label>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-sandstone-300 bg-ivory-50 text-xs font-bold text-charcoal-900 focus:outline-none focus:border-sandstone-600"
          >
            {sites.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.city})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">
            Slot Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-sandstone-300 bg-ivory-50 text-xs font-bold text-charcoal-900 focus:outline-none focus:border-sandstone-600"
          />
        </div>
      </div>

      {/* Notification */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Add Slot Form Drawer */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-3xl border border-sandstone-300 shadow-md space-y-4 animate-in fade-in">
          <h3 className="font-serif text-base font-bold text-charcoal-900">
            Create Time Slot for {formatDate(selectedDate)}
          </h3>

          <form onSubmit={handleCreateSlot} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">Start Time (24h)</label>
              <input
                type="text"
                required
                placeholder="09:00"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-sandstone-300 bg-ivory-50 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">End Time (24h)</label>
              <input
                type="text"
                required
                placeholder="12:00"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-sandstone-300 bg-ivory-50 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">Slot Capacity</label>
              <input
                type="number"
                required
                min="1"
                placeholder="150"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-sandstone-300 bg-ivory-50 font-bold"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl border border-sandstone-300 hover:bg-sandstone-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 font-semibold shadow-sm"
              >
                Save Slot
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Slots List */}
      <div className="bg-white rounded-3xl border border-sandstone-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-sandstone-200 flex justify-between items-center">
          <h3 className="font-serif text-base font-bold text-charcoal-900">
            Active Slots on {formatDate(selectedDate)}
          </h3>
          <span className="text-xs text-charcoal-500">{slots.length} configured slot(s)</span>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-sandstone-100 rounded-xl" />
            ))}
          </div>
        ) : slots.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sandstone-50 text-charcoal-600 uppercase font-semibold border-b border-sandstone-200">
                <tr>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Booked / Total Capacity</th>
                  <th className="py-3 px-4">Remaining Available</th>
                  <th className="py-3 px-4">Crowd Utilization</th>
                  <th className="py-3 px-4">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sandstone-100">
                {slots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-sandstone-50/50">
                    <td className="py-3.5 px-4 font-bold text-charcoal-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sandstone-600" />
                      <span>{slot.slotTime}</span>
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-700">
                      <span className="font-bold text-charcoal-900">{slot.bookedVisitors}</span> / {slot.capacity}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-charcoal-800">{slot.remainingCapacity} visitors</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 w-36">
                        <div className="flex-1 h-2 rounded-full bg-sandstone-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              slot.crowdStatus.percent < 40
                                ? 'bg-emerald-500'
                                : slot.crowdStatus.percent < 70
                                ? 'bg-blue-500'
                                : slot.crowdStatus.percent < 85
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${slot.crowdStatus.percent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-charcoal-600">
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
          <div className="py-12 text-center text-xs text-charcoal-500 space-y-2">
            <p>No slots found for this monument on {formatDate(selectedDate)}.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-sandstone-700 font-semibold underline"
            >
              Click here to create the first slot.
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

