'use client';

import { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  Edit2,
  Check,
  X,
  MapPin,
  ShieldCheck,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import CrowdBadge from '@/components/CrowdBadge';

export default function AdminSitesPage() {
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState(null);
  const [editFee, setEditFee] = useState('');
  const [editCapacity, setEditCapacity] = useState('');

  // New site form state
  const [formData, setFormData] = useState({
    osmId: '',
    name: '',
    city: '',
    state: '',
    category: 'monument',
    lat: '',
    lng: '',
    entryFee: 50,
    crowdCapacityPerSlot: 150,
    openingHours: '09:00 AM - 05:30 PM',
    description: '',
    imageUrl: '',
  });

  const fetchSites = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/sites');
      if (res.success && Array.isArray(res.data)) {
        setSites(res.data);
      }
    } catch (err) {
      setError(err.message || 'Could not load bookable sites.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleConfigureSite = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        osmId: formData.osmId.trim(),
        name: formData.name.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        category: formData.category,
        coordinates: {
          lat: parseFloat(formData.lat) || 28.6139,
          lng: parseFloat(formData.lng) || 77.2090,
        },
        entryFee: parseFloat(formData.entryFee) || 0,
        crowdCapacityPerSlot: parseInt(formData.crowdCapacityPerSlot, 10) || 150,
        openingHours: formData.openingHours,
        description: formData.description,
        imageUrl: formData.imageUrl,
        isActive: true,
      };

      await api.post('/admin/sites/configure', payload);
      setShowConfigModal(false);
      fetchSites();
    } catch (err) {
      alert(`Error configuring site: ${err.message}`);
    }
  };

  const startEdit = (site) => {
    setEditingSiteId(site._id);
    setEditFee(site.entryFee.toString());
    setEditCapacity(site.crowdCapacityPerSlot.toString());
  };

  const saveEdit = async (siteId) => {
    try {
      await api.patch(`/admin/sites/${siteId}`, {
        entryFee: parseFloat(editFee),
        crowdCapacityPerSlot: parseInt(editCapacity, 10),
      });
      setEditingSiteId(null);
      fetchSites();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const toggleSiteStatus = async (site) => {
    try {
      await api.patch(`/admin/sites/${site._id}`, {
        isActive: !site.isActive,
      });
      fetchSites();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-charcoal-900">
            Bookable Monument Configurations
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-500">
            Map discovered OpenStreetMap landmarks into verified bookable heritage sites.
          </p>
        </div>

        <button
          onClick={() => setShowConfigModal(true)}
          className="px-4 py-2.5 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Configure Discovered Site</span>
        </button>
      </div>

      {/* Sites List */}
      <div className="bg-white rounded-3xl border border-sandstone-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-sandstone-100 rounded-xl" />
            ))}
          </div>
        ) : sites.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sandstone-50 text-charcoal-600 uppercase font-semibold border-b border-sandstone-200">
                <tr>
                  <th className="py-3 px-4">Monument & OSM Identifier</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Verified Fee</th>
                  <th className="py-3 px-4">Slot Capacity</th>
                  <th className="py-3 px-4">Today&apos;s Crowd</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sandstone-100">
                {sites.map((site) => {
                  const isEditing = editingSiteId === site._id;

                  return (
                    <tr key={site._id} className="hover:bg-sandstone-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-serif text-sm font-bold text-charcoal-900 block">
                          {site.name}
                        </span>
                        <span className="font-mono text-[10px] text-charcoal-400 block">
                          OSM: {site.osmId}
                        </span>
                      </td>

                      <td className="py-3 px-4 uppercase text-[10px] font-semibold text-charcoal-600">
                        {site.category?.replace('_', ' ')}
                      </td>

                      <td className="py-3 px-4 text-charcoal-700">
                        {[site.city, site.state].filter(Boolean).join(', ') || 'India'}
                      </td>

                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editFee}
                            onChange={(e) => setEditFee(e.target.value)}
                            className="w-20 px-2 py-1 rounded border border-sandstone-400 text-xs font-bold"
                          />
                        ) : (
                          <span className="font-bold text-charcoal-900">
                            {formatINR(site.entryFee)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            value={editCapacity}
                            onChange={(e) => setEditCapacity(e.target.value)}
                            className="w-20 px-2 py-1 rounded border border-sandstone-400 text-xs font-bold"
                          />
                        ) : (
                          <span className="text-charcoal-800 font-medium">
                            {site.crowdCapacityPerSlot} / slot
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <CrowdBadge crowdStatus={site.crowdStatus} />
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleSiteStatus(site)}
                          title="Toggle Active Status"
                          className="flex items-center gap-1.5"
                        >
                          {site.isActive ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700">
                              Inactive
                            </span>
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => saveEdit(site._id)}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                              title="Save Changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingSiteId(null)}
                              className="p-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-600"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(site)}
                            className="p-1.5 rounded-lg border border-sandstone-300 hover:bg-sandstone-100 text-charcoal-700 transition-colors"
                            title="Edit Pricing & Capacity"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-charcoal-500">
            No bookable monuments configured yet. Click &quot;Configure Discovered Site&quot; to add one.
          </div>
        )}
      </div>

      {/* Configure Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-sandstone-200 pb-3">
              <h3 className="font-serif text-lg font-bold text-charcoal-900">
                Configure Heritage Site for Ticketing
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfigureSite} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  OpenStreetMap Place Identifier (osmId) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. way/107049449 or node/1234567"
                  value={formData.osmId}
                  onChange={(e) => setFormData({ ...formData, osmId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-sandstone-300 bg-ivory-50 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Monument Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Golconda Fort"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-sandstone-300 bg-ivory-50 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Hyderabad"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sandstone-300 bg-ivory-50 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Telangana"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sandstone-300 bg-ivory-50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="17.3833"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sandstone-300 bg-ivory-50 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="78.4011"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sandstone-300 bg-ivory-50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Verified Entry Fee (₹ INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="50"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sandstone-300 bg-ivory-50 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Max Capacity / Slot *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="200"
                    value={formData.crowdCapacityPerSlot}
                    onChange={(e) => setFormData({ ...formData, crowdCapacityPerSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sandstone-300 bg-ivory-50 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Historical Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Historical landmark background..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-sandstone-300 bg-ivory-50 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-sandstone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl border border-sandstone-300 hover:bg-sandstone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 font-semibold shadow-sm"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

