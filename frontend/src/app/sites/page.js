'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Compass,
  RefreshCw,
  AlertCircle,
  Ticket,
  SlidersHorizontal,
  Sparkles,
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

  // Debounced search on input changes (450ms delay)
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
      <div className="border-b border-white/[0.08] pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/25 text-gold-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Geospatial Directory</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ivory-50">
          Heritage Discovery Directory
        </h1>
        <p className="mt-2 text-sm text-charcoal-300 max-w-3xl font-light">
          Search, explore, and reserve passes across authentic Indian historical landmarks. Dynamic data is fetched directly via OpenStreetMap with verified ticketing configurations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-white/[0.08] shadow-glass-card space-y-4">
        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-4 flex items-center px-3.5 py-2.5 bg-navy-950/70 rounded-xl border border-white/[0.1] focus-within:border-gold-500/50 transition-colors">
            <Search className="w-4 h-4 text-gold-400 mr-2.5 flex-shrink-0" />
            <input
              type="text"
              placeholder="Monument or fort name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none text-ivory-50 placeholder-charcoal-400 font-medium"
            />
          </div>

          {/* City */}
          <div className="lg:col-span-3 flex items-center px-3.5 py-2.5 bg-navy-950/70 rounded-xl border border-white/[0.1] focus-within:border-gold-500/50 transition-colors">
            <MapPin className="w-4 h-4 text-gold-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="City (e.g. Agra, Jaipur)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none text-ivory-50 placeholder-charcoal-400 font-medium"
            />
          </div>

          {/* State */}
          <div className="lg:col-span-3 flex items-center px-3.5 py-2.5 bg-navy-950/70 rounded-xl border border-white/[0.1] focus-within:border-gold-500/50 transition-colors">
            <MapPin className="w-4 h-4 text-gold-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="State (e.g. Rajasthan, UP)"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none text-ivory-50 placeholder-charcoal-400 font-medium"
            />
          </div>

          {/* Action Buttons */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="btn-gold w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <span>Search</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="p-2.5 rounded-xl border border-white/[0.1] hover:border-gold-500/40 bg-navy-950/70 hover:bg-white/[0.06] text-charcoal-300 hover:text-ivory-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Category Pills & Bookable Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-charcoal-400 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gold-400" /> Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  category === cat.id
                    ? 'bg-gold-500/20 text-gold-300 border border-gold-400/40 shadow-gold-glow font-semibold'
                    : 'bg-navy-950/60 text-charcoal-300 hover:text-ivory-50 hover:bg-white/[0.06] border border-white/[0.08]'
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
            <div className="w-9 h-5 bg-navy-950 border border-white/[0.15] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-charcoal-400 peer-checked:after:bg-navy-950 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold-400 peer-checked:border-gold-400 relative"></div>
            <span className="ml-2.5 text-xs font-semibold text-ivory-100 flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-gold-400" /> Bookable Passes Only
            </span>
          </label>
        </div>
      </div>

      {/* Results Header Status */}
      <div className="flex items-center justify-between text-xs text-charcoal-400">
        <p>
          {isLoading ? (
            <span className="flex items-center gap-2 text-gold-300 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Discovering heritage landmarks via OpenStreetMap...
            </span>
          ) : error && sites.length === 0 ? (
            <span className="text-rose-400 font-medium">Discovery request failed</span>
          ) : (
            <>
              Showing <span className="font-bold text-ivory-100">{sites.length}</span> discovered sites
              {isFromCache && ' (Fast cached response)'}
            </>
          )}
        </p>
        <span className="text-charcoal-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>OpenStreetMap ODbL Verified</span>
        </span>
      </div>

      {/* Error state: only show when there are NO sites displayed */}
      {error && sites.length === 0 && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 flex items-start gap-3 backdrop-blur-md">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-200">External Discovery Service Notice</h4>
            <p className="text-xs mt-1 text-rose-300/90 leading-relaxed">{error}</p>
            <button
              onClick={() => fetchSites()}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold transition-colors"
            >
              Retry Discovery
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-96 rounded-2xl bg-navy-900/60 animate-pulse border border-white/[0.06] flex flex-col justify-between p-5"
            >
              <div className="h-44 w-full bg-navy-800/60 rounded-xl" />
              <div className="space-y-2 pt-2">
                <div className="h-5 w-3/4 bg-navy-800/80 rounded" />
                <div className="h-3 w-full bg-navy-800/50 rounded" />
                <div className="h-3 w-2/3 bg-navy-800/50 rounded" />
              </div>
              <div className="h-10 w-full bg-navy-800/70 rounded-xl mt-3" />
            </div>
          ))}
        </div>
      ) : sites.length > 0 ? (
        /* Results Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <SiteCard key={site.osmId} site={site} />
          ))}
        </div>
      ) : !error ? (
        /* Empty State */
        <div className="text-center py-20 glass-card rounded-3xl p-8 space-y-4">
          <Compass className="w-16 h-16 text-gold-400 mx-auto opacity-75" />
          <h3 className="font-serif text-xl font-bold text-ivory-100">
            No heritage monuments found
          </h3>
          <p className="text-sm text-charcoal-300 max-w-md mx-auto font-light leading-relaxed">
            No monuments matched your current search filters. Try broadening your criteria, searching by monument name (e.g. &ldquo;Hawa Mahal&rdquo; or &ldquo;Red Fort&rdquo;), or clearing filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="btn-gold px-6 py-2.5 rounded-xl text-sm font-semibold"
          >
            Clear All Filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
