'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  MapPin,
  Calendar,
  ShieldCheck,
  QrCode,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Landmark,
} from 'lucide-react';
import SiteCard from '@/components/SiteCard';
import { api } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [featuredSites, setFeaturedSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/sites/discover?limit=6');
        if (res.success && Array.isArray(res.data)) {
          setFeaturedSites(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch featured sites:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('q', searchQuery.trim());
    if (selectedCity.trim()) params.append('city', selectedCity.trim());
    router.push(`/sites?${params.toString()}`);
  };

  return (
    <div className="space-y-16 lg:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[580px] lg:min-h-[660px] flex items-center justify-center overflow-hidden bg-charcoal-900 text-white">
        {/* Background Image with Dark & Sandstone Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1920&q=85"
            alt="Taj Mahal Agra"
            fill
            priority
            unoptimized
            className="object-cover object-center brightness-75 scale-105 animate-pulse duration-[10000ms]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/60 to-black/40" />
          <div className="absolute inset-0 bg-sandstone-950/20 mix-blend-multiply" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sandstone-500/20 backdrop-blur-md border border-gold-400/30 text-gold-200 text-xs sm:text-sm font-medium tracking-wide">
            <Sparkles className="w-4 h-4 text-gold-300" />
            <span>Preserving Indian Heritage through Smart Crowd Management</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ivory-50 leading-tight">
            Discover India&apos;s Timeless Wonders,{' '}
            <span className="text-sandstone-300 underline decoration-gold-500/50 decoration-wavy">
              Without the Crowd
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-ivory-200/90 leading-relaxed font-light">
            Dynamic heritage discovery powered by real-time OpenStreetMap data, atomic time-slot reservations, and smart gate verification.
          </p>

          {/* Search Form Card */}
          <form
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-sandstone-200/60 flex flex-col md:flex-row gap-3 text-charcoal-900"
          >
            <div className="flex-1 flex items-center px-4 py-2.5 bg-ivory-100 rounded-xl sm:rounded-2xl border border-sandstone-200 focus-within:border-sandstone-500 transition-colors">
              <Search className="w-5 h-5 text-sandstone-600 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search monument, fort, palace (e.g. Red Fort)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none placeholder-charcoal-400 font-medium"
              />
            </div>

            <div className="w-full md:w-56 flex items-center px-4 py-2.5 bg-ivory-100 rounded-xl sm:rounded-2xl border border-sandstone-200 focus-within:border-sandstone-500 transition-colors">
              <MapPin className="w-5 h-5 text-sandstone-600 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="City (e.g. Agra, Delhi)"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none placeholder-charcoal-400 font-medium"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-sandstone-700 to-sandstone-800 hover:from-sandstone-800 hover:to-sandstone-900 text-ivory-50 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Filter Tags */}
          <div className="pt-2 flex flex-wrap justify-center items-center gap-2 text-xs text-ivory-200 font-medium">
            <span className="text-sandstone-300">Popular hubs:</span>
            {['Delhi', 'Agra', 'Jaipur', 'Varanasi', 'Hampi', 'Amritsar'].map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => router.push(`/sites?city=${city}`)}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-colors"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Architectural Features Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-sandstone-200 shadow-sm flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-sandstone-100 flex items-center justify-center text-sandstone-700 flex-shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-charcoal-900">
                Dynamic OpenStreetMap Discovery
              </h3>
              <p className="mt-1 text-xs text-charcoal-500 leading-relaxed">
                Live geospatial queries across India. No hardcoded or fixed monument lists.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-sandstone-200 shadow-sm flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-charcoal-900">
                Atomic Capacity Reservation
              </h3>
              <p className="mt-1 text-xs text-charcoal-500 leading-relaxed">
                Concurrency-safe booking engine guarantees monuments are never overbooked.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-sandstone-200 shadow-sm flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gold-100 flex items-center justify-center text-gold-700 flex-shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-charcoal-900">
                Cryptographic QR Admission
              </h3>
              <p className="mt-1 text-xs text-charcoal-500 leading-relaxed">
                One-time ticket verification at monument gates prevents ticket reuse and fraud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured / Discovered Sites Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-sandstone-700 font-semibold text-xs tracking-wider uppercase">
              <Landmark className="w-4 h-4" />
              <span>Live Heritage Registry</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 mt-1">
              Discovered Monuments & Historic Sites
            </h2>
            <p className="text-sm text-charcoal-600 mt-1">
              Real heritage sites dynamically resolved from OpenStreetMap with verified ticketing configurations.
            </p>
          </div>

          <Link
            href="/sites"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-sandstone-300 bg-white hover:bg-sandstone-50 text-sm font-semibold text-charcoal-800 transition-colors shadow-sm"
          >
            <span>Browse Full Directory</span>
            <ArrowRight className="w-4 h-4 text-sandstone-600" />
          </Link>
        </div>

        {/* Sites Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-sandstone-100 animate-pulse border border-sandstone-200" />
            ))}
          </div>
        ) : featuredSites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSites.map((site) => (
              <SiteCard key={site.osmId} site={site} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-sandstone-200 p-8 space-y-4">
            <Compass className="w-12 h-12 text-sandstone-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-charcoal-800">
              No discovered heritage sites loaded yet
            </h3>
            <p className="text-sm text-charcoal-500 max-w-md mx-auto">
              OpenStreetMap queries run live on demand. Click below to explore all regions.
            </p>
            <Link
              href="/sites"
              className="inline-block px-5 py-2.5 rounded-xl bg-sandstone-700 text-ivory-50 text-sm font-medium"
            >
              Open Directory
            </Link>
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="bg-sandstone-100/70 border-y border-sandstone-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-sandstone-700">
              Simple & Reliable Workflow
            </span>
            <h2 className="font-serif text-3xl font-bold text-charcoal-900">
              How HeritageConnect Works
            </h2>
            <p className="text-sm text-charcoal-600">
              Seamless travel experience from discovery to gate check-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-sandstone-200 shadow-sm relative">
              <span className="absolute -top-4 left-8 px-3 py-1 bg-sandstone-700 text-ivory-50 text-xs font-bold rounded-full">
                Step 1
              </span>
              <div className="w-12 h-12 rounded-xl bg-sandstone-100 text-sandstone-700 flex items-center justify-center mb-5">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-charcoal-900">
                Discover Heritage Sites
              </h3>
              <p className="mt-2 text-xs text-charcoal-600 leading-relaxed">
                Search thousands of forts, palaces, archaeological ruins, and temples dynamically retrieved from OpenStreetMap with genuine coordinates.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-sandstone-200 shadow-sm relative">
              <span className="absolute -top-4 left-8 px-3 py-1 bg-sandstone-700 text-ivory-50 text-xs font-bold rounded-full">
                Step 2
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-charcoal-900">
                Book Verified Slot
              </h3>
              <p className="mt-2 text-xs text-charcoal-600 leading-relaxed">
                Select your visit date and preferred time slot. Live capacity indicators show crowd levels (Low, Moderate, High, Peak) with atomic slot reservations.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-sandstone-200 shadow-sm relative">
              <span className="absolute -top-4 left-8 px-3 py-1 bg-sandstone-700 text-ivory-50 text-xs font-bold rounded-full">
                Step 3
              </span>
              <div className="w-12 h-12 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center mb-5">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-charcoal-900">
                Flash QR Pass at Gate
              </h3>
              <p className="mt-2 text-xs text-charcoal-600 leading-relaxed">
                Receive an official, print-friendly digital ticket pass. Authorized gate staff scan the QR code to grant one-time secure admission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Server-Side Crowd Classification Explainer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-sandstone-200 p-8 lg:p-12 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-sandstone-700">
                Transparent Metrics
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 mt-1">
                Standardized Crowd Classification
              </h2>
              <p className="text-sm text-charcoal-600 mt-1">
                Crowd utilization levels are computed directly from verified booking data against maximum slot capacity.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-charcoal-500 bg-sandstone-50 px-4 py-2 rounded-xl border border-sandstone-200">
              <Clock className="w-4 h-4 text-sandstone-600" />
              <span>Real-time server synchronization</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Low Crowd</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">&lt; 40%</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Comfortable visit with minimal wait times and uncrowded observation areas.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Moderate Crowd</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-900">40% - 69%</span>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                Steady visitor flow. Normal queue and moving times throughout the monument.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">High Crowd</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">70% - 84%</span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Substantial footfall. Recommended to arrive promptly at slot start time.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Peak Crowd</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">&ge; 85%</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                Nearing full capacity. Strict gate admission and slot window enforced.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

