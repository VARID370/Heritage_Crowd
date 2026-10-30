'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  MapPin,
  Compass,
  RefreshCw,
  AlertCircle,
  Ticket,
  SlidersHorizontal,
} from 'lucide-react';
import SiteCard from '@/components/SiteCard';
import { api } from '@/lib/api';

const CATEGORIES = [
  { id: '', label: 'All Heritage' },
  { id: 'fort', label: 'Forts & Fortresses' },
  { id: 'palace', label: 'Palaces' },
  { id: 'monument', label: 'Monuments' },
  { id: 'archaeological_site', label: 'Archaeological Ruins' },
  { id: 'temple_heritage', label: 'Heritage Temples' },
];

export default function SitesDirectoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search filter states
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [state, setState] = useState(searchParams.get('state') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [bookableOnly, setBookableOnly] = useState(searchParams.get('bookableOnly') === 'true');

  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);

  // Request sequence tracker to avoid out-of-order race conditions
  const requestSeqRef = useRef(0);

  const fetchSites = useCallback(async (overrides = {}) => {
    const currentSeq = ++requestSeqRef.current;
    setIsLoading(true);

    const activeQ = (overrides.query !== undefined ? overrides.query : query).trim();
    const activeCity = (overrides.city !== undefined ? overrides.city : city).trim();
    const activeState = (overrides.state !== undefined ? overrides.state : state).trim();
    const activeCat = overrides.category !== undefined ? overrides.category : category;
    const activeBookable = overrides.bookableOnly !== undefined ? overrides.bookableOnly : bookableOnly;

    try {
      const params = new URLSearchParams();
      if (activeQ) params.append('q', activeQ);
      if (activeCity) params.append('city', activeCity);
      if (activeState) params.append('state', activeState);
      if (activeCat) params.append('category', activeCat);
      if (activeBookable) params.append('bookableOnly', 'true');
      params.append('limit', '30');

      const res = await api.get(`/sites/discover?${params.toString()}`);

      // If a newer search was started while this was in flight, ignore this stale result
      if (currentSeq !== requestSeqRef.current) return;

      if (res.success && Array.isArray(res.data)) {
        setSites(res.data);
        setIsFromCache(!!res.isFromCache);
        setError(null);
      } else {
        setSites([]);
        setError(null);
      }
    } catch (err) {
      // If a newer search was started, ignore stale errors
      if (currentSeq !== requestSeqRef.current) return;

      console.error('Discovery error:', err);
      setError(err.message || 'Failed to reach OpenStreetMap discovery service.');
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [query, city, state, category, bookableOnly]);

  // Debounced search on input changes (500ms delay to prevent rapid-fire requests on every keystroke)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSites();
    }, 450);

    return () => clearTimeout(timer);
  }, [fetchSites]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchSites();
  };

  const handleResetFilters = () => {
    setQuery('');
    setCity('');
    setState('');
    setCategory('');
    setBookableOnly(false);
    fetchSites({ query: '', city: '', state: '', category: '', bookableOnly: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-sandstone-200 pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900">
          Heritage Discovery Directory
        </h1>
        <p className="mt-2 text-sm text-charcoal-600 max-w-3xl">
          Search, explore, and book official passes across real Indian historic landmarks. Dynamic data is fetched directly via OpenStreetMap with verified booking configurations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-sandstone-200 shadow-sm space-y-4">
        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-4 flex items-center px-3.5 py-2.5 bg-ivory-50 rounded-xl border border-sandstone-300 focus-within:border-sandstone-600">
            <Search className="w-4 h-4 text-sandstone-600 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Monument or fort name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>

          {/* City */}
          <div className="lg:col-span-3 flex items-center px-3.5 py-2.5 bg-ivory-50 rounded-xl border border-sandstone-300 focus-within:border-sandstone-600">
            <MapPin className="w-4 h-4 text-sandstone-600 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="City (e.g. Agra, Jaipur)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>

          {/* State */}
          <div className="lg:col-span-3 flex items-center px-3.5 py-2.5 bg-ivory-50 rounded-xl border border-sandstone-300 focus-within:border-sandstone-600">
            <MapPin className="w-4 h-4 text-sandstone-600 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="State (e.g. Rajasthan, UP)"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="p-2.5 rounded-xl border border-sandstone-300 hover:bg-sandstone-50 text-charcoal-600"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Category Pills & Bookable Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-sandstone-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-charcoal-500 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  category === cat.id
                    ? 'bg-sandstone-700 text-ivory-50 shadow-sm'
                    : 'bg-sandstone-100 text-charcoal-700 hover:bg-sandstone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Bookable only toggle */}
          <label className="inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={bookableOnly}
              onChange={(e) => setBookableOnly(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
            <span className="ml-2.5 text-xs font-semibold text-charcoal-800 flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5 text-emerald-600" /> Bookable Only
            </span>
          </label>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-charcoal-500">
        <p>
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-sandstone-700 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Discovering heritage landmarks via OpenStreetMap...
            </span>
          ) : error && sites.length === 0 ? (
            <span className="text-rose-600 font-medium">Discovery request failed</span>
          ) : (
            <>
              Showing <span className="font-bold text-charcoal-900">{sites.length}</span> discovered sites
              {isFromCache && ' (Fast cached response)'}
            </>
          )}
        </p>
        <span className="text-sandstone-700">OpenStreetMap ODbL Verified</span>
      </div>

      {/* Error state: only show when there are NO sites displayed */}
      {error && sites.length === 0 && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">External Discovery Service Notice</h4>
            <p className="text-xs mt-1">{error}</p>
            <button
              onClick={() => fetchSites()}
              className="mt-2 px-3 py-1 rounded-md bg-rose-200 hover:bg-rose-300 text-rose-900 text-xs font-semibold transition-colors"
            >
              Retry Discovery
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-sandstone-100 animate-pulse border border-sandstone-200 flex flex-col justify-between p-5"
              >
                <div className="h-44 w-full bg-sandstone-200/70 rounded-xl" />
                <div className="space-y-2 pt-2">
                  <div className="h-5 w-3/4 bg-sandstone-200/70 rounded" />
                  <div className="h-3 w-full bg-sandstone-200/50 rounded" />
                  <div className="h-3 w-2/3 bg-sandstone-200/50 rounded" />
                </div>
                <div className="h-10 w-full bg-sandstone-200/70 rounded-xl mt-3" />
              </div>
            ))}
          </div>
        </div>
      ) : sites.length > 0 ? (
        /* Results Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <SiteCard key={site.osmId} site={site} />
          ))}
        </div>
      ) : !error ? (
        /* Empty State (Only when search completed without error and 0 matches) */
        <div className="text-center py-16 bg-white rounded-3xl border border-sandstone-200 p-8 space-y-4">
          <Compass className="w-16 h-16 text-sandstone-300 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-charcoal-900">
            No heritage monuments found
          </h3>
          <p className="text-sm text-charcoal-500 max-w-md mx-auto">
            No monuments matched your search query. Try broadening your criteria, searching by monument name (e.g. &ldquo;Hawa Mahal&rdquo; or &ldquo;Red Fort&rdquo;), or clearing filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 text-sm font-semibold transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : null}
    </div>
  );
}

