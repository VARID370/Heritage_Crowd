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
  Layers,
  Activity,
  Zap,
} from 'lucide-react';
import SiteCard from '@/components/SiteCard';
import { api } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [featuredSites, setFeaturedSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Interactive Live Crowd Preview Widget state
  const [activeSlotPreview, setActiveSlotPreview] = useState(1);

  const sampleSlots = [
    {
      id: 0,
      time: '08:00 AM – 10:30 AM',
      name: 'Sunrise Serenity Slot',
      monument: 'Taj Mahal, Agra',
      booked: 140,
      capacity: 500,
      level: 'low',
      badge: 'Low Crowd',
      badgeStyle: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 shadow-sm dark:shadow-[0_0_12px_rgba(16,185,129,0.15)]',
      dotStyle: 'bg-emerald-500 dark:bg-emerald-400',
      description: 'Quiet, optimal for photography with minimal waiting times at entrance gates.',
    },
    {
      id: 1,
      time: '11:00 AM – 01:30 PM',
      name: 'Midday Historical Tour',
      monument: 'Red Fort, Delhi',
      booked: 480,
      capacity: 800,
      level: 'moderate',
      badge: 'Moderate Crowd',
      badgeStyle: 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30 shadow-sm dark:shadow-[0_0_12px_rgba(14,165,233,0.15)]',
      dotStyle: 'bg-sky-500 dark:bg-sky-400',
      description: 'Pleasant flow. Main museum exhibits open with standard 5-minute queueing.',
    },
    {
      id: 2,
      time: '02:00 PM – 04:30 PM',
      name: 'Afternoon Heritage Walk',
      monument: 'Amber Fort, Jaipur',
      booked: 720,
      capacity: 900,
      level: 'high',
      badge: 'High Crowd',
      badgeStyle: 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/30 shadow-sm dark:shadow-[0_0_12px_rgba(245,158,11,0.15)]',
      dotStyle: 'bg-amber-500 dark:bg-amber-400',
      description: 'Busy footfall. Arrive 10 minutes prior to your allocated slot for smooth admission.',
    },
    {
      id: 3,
      time: '04:30 PM – 07:00 PM',
      name: 'Sunset Courtyard Experience',
      monument: 'Qutb Minar, Delhi',
      booked: 570,
      capacity: 600,
      level: 'peak',
      badge: 'Peak Crowd (95%)',
      badgeStyle: 'bg-rose-500/15 text-rose-900 dark:text-rose-300 border-rose-500/30 shadow-sm dark:shadow-[0_0_12px_rgba(244,63,94,0.15)]',
      dotStyle: 'bg-rose-500 dark:bg-rose-400',
      description: 'Near full capacity. Strict gate verification enforced to protect structural integrity.',
    },
  ];

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

  const selectedSlotData = sampleSlots[activeSlotPreview];
  const selectedPct = Math.round((selectedSlotData.booked / selectedSlotData.capacity) * 100);

  return (
    <div className="space-y-20 lg:space-y-32 pb-24">
      {/* Hero Section */}
      <section className="relative min-h-[640px] lg:min-h-[740px] flex items-center justify-center overflow-hidden">
        {/* Cinematic Backdrop with Multi-Layer Gradients */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2160&q=85"
            alt="Taj Mahal Agra"
            fill
            priority
            unoptimized
            className="object-cover object-center brightness-[0.4] scale-105"
          />
          {/* Gradients blending into the background */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70" />
          <div className="absolute inset-0 bg-gold-950/15 mix-blend-color-burn" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-8">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 dark:bg-navy-900/80 backdrop-blur-xl border border-gold-400/30 text-gold-300 text-xs sm:text-sm font-medium tracking-wide shadow-gold-glow animate-in fade-in slide-in-from-top-4 duration-700">
            <Sparkles className="w-4 h-4 text-gold-400 animate-pulse" />
            <span>Preserving Indian Heritage through Smart Crowd Regulation</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ivory-50 leading-[1.15] sm:leading-[1.12]">
            Discover India&apos;s Timeless Wonders,{' '}
            <span className="text-gold-300 block sm:inline drop-shadow">
              Without the Crowd
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-ivory-200 leading-relaxed font-light">
            Dynamic heritage discovery powered by real-time OpenStreetMap queries, concurrency-safe atomic time-slot reservations, and cryptographic QR gate verification.
          </p>

          {/* Search Form Card */}
          <form
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto glass-panel-gold p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col md:flex-row gap-3 text-charcoal-900 dark:text-ivory-50"
          >
            <div className="flex-1 flex items-center px-4 py-3 bg-white dark:bg-navy-900/90 rounded-xl sm:rounded-2xl border border-sandstone-300 dark:border-white/[0.08] focus-within:border-gold-500 transition-colors">
              <Search className="w-5 h-5 text-sandstone-600 dark:text-gold-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search monument, fort, palace (e.g. Red Fort)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none placeholder-charcoal-400 text-charcoal-900 dark:text-ivory-50 font-medium"
              />
            </div>

            <div className="w-full md:w-56 flex items-center px-4 py-3 bg-white dark:bg-navy-900/90 rounded-xl sm:rounded-2xl border border-sandstone-300 dark:border-white/[0.08] focus-within:border-gold-500 transition-colors">
              <MapPin className="w-5 h-5 text-sandstone-600 dark:text-gold-400 mr-2.5 flex-shrink-0" />
              <input
                type="text"
                placeholder="City (e.g. Agra, Delhi)"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none placeholder-charcoal-400 text-charcoal-900 dark:text-ivory-50 font-medium"
              />
            </div>

            <button
              type="submit"
              className="btn-gold px-7 py-3.5 rounded-xl sm:rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          {/* Quick Filter Tags */}
          <div className="pt-2 flex flex-wrap justify-center items-center gap-2 text-xs text-ivory-200 font-medium">
            <span className="text-gold-300 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Popular hubs:
            </span>
            {['Delhi', 'Agra', 'Jaipur', 'Varanasi', 'Hampi', 'Amritsar'].map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => router.push(`/sites?city=${city}`)}
                className="px-3.5 py-1.5 rounded-full bg-white/10 dark:bg-navy-900/80 hover:bg-gold-500/20 hover:text-gold-200 hover:border-gold-400/50 backdrop-blur-md border border-white/20 text-ivory-100 transition-all duration-200"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Architecture Metrics Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 sm:p-7 rounded-2xl flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-sandstone-100 dark:bg-gold-500/10 border border-sandstone-300 dark:border-gold-500/25 flex items-center justify-center text-sandstone-700 dark:text-gold-400 flex-shrink-0 shadow-sm dark:shadow-gold-glow">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-charcoal-900 dark:text-ivory-50">
                Dynamic OpenStreetMap Discovery
              </h3>
              <p className="mt-1 text-xs text-charcoal-600 dark:text-charcoal-300 leading-relaxed font-light">
                Direct geospatial queries across India. No hardcoded or synthetic lists.
              </p>
            </div>
          </div>

          <div className="glass-card p-6 sm:p-7 rounded-2xl flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/25 flex items-center justify-center text-emerald-700 dark:text-emerald-400 flex-shrink-0 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-charcoal-900 dark:text-ivory-50">
                Atomic Capacity Reservation
              </h3>
              <p className="mt-1 text-xs text-charcoal-600 dark:text-charcoal-300 leading-relaxed font-light">
                Concurrency-safe reservation engine guarantees monuments never exceed maximum threshold.
              </p>
            </div>
          </div>

          <div className="glass-card p-6 sm:p-7 rounded-2xl flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-sandstone-100 dark:bg-gold-500/10 border border-sandstone-300 dark:border-gold-500/25 flex items-center justify-center text-sandstone-700 dark:text-gold-400 flex-shrink-0 shadow-sm dark:shadow-gold-glow">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-charcoal-900 dark:text-ivory-50">
                Cryptographic QR Admission
              </h3>
              <p className="mt-1 text-xs text-charcoal-600 dark:text-charcoal-300 leading-relaxed font-light">
                One-time ticket verification at monument gates eliminates paper passes and fraud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured / Discovered Sites Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-sandstone-700 dark:text-gold-400 font-semibold text-xs tracking-widest uppercase">
              <Landmark className="w-4 h-4" />
              <span>Live Heritage Registry</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 dark:text-ivory-50 mt-1">
              Discovered Monuments & Historic Sites
            </h2>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-300 mt-1 font-light">
              Real Indian heritage sites dynamically resolved from OpenStreetMap with verified ticketing configurations.
            </p>
          </div>

          <Link
            href="/sites"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-sandstone-300 dark:border-white/[0.12] hover:border-sandstone-400 dark:hover:border-gold-500/40 bg-white dark:bg-navy-900/70 hover:bg-sandstone-50 dark:hover:bg-white/[0.06] text-sm font-semibold text-charcoal-800 dark:text-ivory-100 transition-all shadow-sm"
          >
            <span>Browse Full Directory</span>
            <ArrowRight className="w-4 h-4 text-sandstone-700 dark:text-gold-400" />
          </Link>
        </div>

        {/* Sites Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-sandstone-200/60 dark:bg-navy-900/50 animate-pulse border border-sandstone-300 dark:border-white/[0.06]" />
            ))}
          </div>
        ) : featuredSites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSites.map((site) => (
              <SiteCard key={site.osmId} site={site} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-card rounded-2xl p-8 space-y-4">
            <Compass className="w-12 h-12 text-sandstone-600 dark:text-gold-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-charcoal-900 dark:text-ivory-100">
              No discovered heritage sites loaded yet
            </h3>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-300 max-w-md mx-auto font-light">
              OpenStreetMap queries run live on demand. Click below to explore all regions.
            </p>
            <Link
              href="/sites"
              className="btn-gold inline-block px-5 py-2.5 rounded-xl text-sm font-medium"
            >
              Open Directory
            </Link>
          </div>
        )}
      </section>

      {/* Interactive Live Crowd Preview / Time-Slot Heatmap Widget */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel-gold rounded-3xl p-8 sm:p-10 lg:p-12 space-y-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sandstone-700 dark:text-gold-400 text-xs uppercase tracking-widest font-semibold">
                <Activity className="w-4 h-4" />
                <span>Real-Time Visitor Flow Simulation</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 dark:text-ivory-50 mt-1">
                Interactive Crowd-Level Preview
              </h2>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-300 mt-1 max-w-xl font-light">
                Inspect how dynamic slot allocation protects monumental spaces from overcrowding. Click any slot to view live crowd utilization.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-gold-300 bg-sandstone-100 dark:bg-navy-950/70 px-4 py-2 rounded-xl border border-sandstone-300 dark:border-gold-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Dynamic Engine Sync</span>
            </div>
          </div>

          {/* Interactive Slot Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sampleSlots.map((slot) => {
              const pct = Math.round((slot.booked / slot.capacity) * 100);
              const isSelected = activeSlotPreview === slot.id;
              return (
                <button
                  key={slot.id}
                  onClick={() => setActiveSlotPreview(slot.id)}
                  className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-sandstone-100 dark:bg-navy-900 border-sandstone-500 dark:border-gold-500 shadow-md dark:shadow-gold-glow'
                      : 'bg-white/80 dark:bg-navy-950/60 border-sandstone-200 dark:border-white/[0.08] hover:border-sandstone-400 dark:hover:border-gold-500/30 hover:bg-sandstone-50 dark:hover:bg-navy-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-sandstone-800 dark:text-gold-300 font-semibold">{slot.time}</span>
                    <span className={`w-2 h-2 rounded-full ${slot.dotStyle}`} />
                  </div>
                  <p className="text-sm font-bold text-charcoal-900 dark:text-ivory-50 truncate">{slot.monument}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-charcoal-600 dark:text-charcoal-300">
                    <span>{slot.booked}/{slot.capacity} booked</span>
                    <span className="font-bold text-charcoal-900 dark:text-ivory-100">{pct}%</span>
                  </div>
                  <div className="mt-1.5 w-full h-1.5 rounded-full bg-sandstone-200 dark:bg-navy-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 85 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : pct >= 40 ? 'bg-sky-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Slot Detailed Inspection Card */}
          <div className="p-6 rounded-2xl bg-white/90 dark:bg-navy-950/80 border border-sandstone-200 dark:border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${selectedSlotData.badgeStyle}`}>
                  <span className={`w-2 h-2 rounded-full ${selectedSlotData.dotStyle} animate-pulse`} />
                  <span>{selectedSlotData.badge}</span>
                </span>
                <span className="text-xs text-charcoal-500 dark:text-charcoal-400 font-mono">{selectedSlotData.time}</span>
              </div>
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-ivory-50">
                {selectedSlotData.monument} — {selectedSlotData.name}
              </h3>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-300 max-w-xl font-light">
                {selectedSlotData.description}
              </p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0 w-full md:w-auto justify-between md:justify-end">
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-charcoal-500 dark:text-charcoal-400 font-semibold block">Slots Remaining</span>
                <span className="text-2xl font-mono font-bold text-sandstone-800 dark:text-gold-300">
                  {selectedSlotData.capacity - selectedSlotData.booked}
                </span>
              </div>
              <Link
                href="/sites"
                className="btn-gold px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Book This Slot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest font-semibold text-sandstone-700 dark:text-gold-400">
            Simple & Transparent Architecture
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-ivory-50">
            How HeritageConnect Works
          </h2>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-300 font-light">
            A continuous four-tier workflow engineered for seamless visitor ticketing and monumental site preservation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl relative space-y-4">
            <span className="inline-block px-3 py-1 bg-sandstone-100 dark:bg-gold-500/20 text-sandstone-800 dark:text-gold-300 text-xs font-bold rounded-full border border-sandstone-300 dark:border-gold-500/30">
              Step 01
            </span>
            <div className="w-12 h-12 rounded-xl bg-sandstone-100 dark:bg-gold-500/10 border border-sandstone-200 dark:border-gold-500/20 text-sandstone-700 dark:text-gold-400 flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-charcoal-900 dark:text-ivory-50">
              Discover Heritage Sites
            </h3>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-300 leading-relaxed font-light">
              Search thousands of forts, palaces, archaeological ruins, and heritage temples dynamically retrieved from OpenStreetMap with genuine coordinates.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl relative space-y-4">
            <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-500/30">
              Step 02
            </span>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-charcoal-900 dark:text-ivory-50">
              Book Verified Slot
            </h3>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-300 leading-relaxed font-light">
              Select your visit date and preferred time window. Live capacity indicators show crowd levels with atomic database reservations preventing overbooking.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl relative space-y-4">
            <span className="inline-block px-3 py-1 bg-sandstone-100 dark:bg-gold-500/20 text-sandstone-800 dark:text-gold-300 text-xs font-bold rounded-full border border-sandstone-300 dark:border-gold-500/30">
              Step 03
            </span>
            <div className="w-12 h-12 rounded-xl bg-sandstone-100 dark:bg-gold-500/10 border border-sandstone-200 dark:border-gold-500/20 text-sandstone-700 dark:text-gold-400 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-charcoal-900 dark:text-ivory-50">
              Flash QR Pass at Gate
            </h3>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-300 leading-relaxed font-light">
              Receive a digital pass with cryptographic verification. Authorized gate staff scan the QR code to grant one-time secure admission without physical paper.
            </p>
          </div>
        </div>
      </section>

      {/* Standardized Crowd Classification Explainer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-3xl p-8 lg:p-12 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-sandstone-700 dark:text-gold-400">
                Transparent Science & Guidelines
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 dark:text-ivory-50 mt-1">
                Standardized Crowd Classification
              </h2>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-300 mt-1 font-light">
                Crowd utilization percentages are calculated directly from verified reservation counts against maximum safe structural capacity.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-charcoal-600 dark:text-charcoal-300 bg-sandstone-100 dark:bg-navy-950/80 px-4 py-2 rounded-xl border border-sandstone-200 dark:border-white/[0.08]">
              <Clock className="w-4 h-4 text-sandstone-700 dark:text-gold-400" />
              <span>Real-time server synchronization</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Low Crowd</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">&lt; 40%</span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-300 leading-relaxed font-light">
                Comfortable visit with minimal wait times and uncrowded observation areas.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-sky-500/25 bg-sky-500/[0.05] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">Moderate Crowd</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-500/30">40% - 69%</span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-300 leading-relaxed font-light">
                Steady visitor flow. Normal queue and moving times throughout the monument.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">High Crowd</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30">70% - 84%</span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-300 leading-relaxed font-light">
                Substantial footfall. Recommended to arrive promptly at slot start time.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-rose-500/25 bg-rose-500/[0.05] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-300">Peak Crowd</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-900 dark:text-rose-300 border border-rose-500/30">&ge; 85%</span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-300 leading-relaxed font-light">
                Nearing full capacity. Strict gate admission and slot window enforced.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden glass-panel-gold p-10 sm:p-14 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-sandstone-100 dark:bg-gold-500/15 border border-sandstone-300 dark:border-gold-400/30 text-sandstone-700 dark:text-gold-400 flex items-center justify-center mx-auto shadow-sm dark:shadow-gold-glow">
            <Landmark className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900 dark:text-ivory-50">
            Ready to Explore India&apos;s Rich Heritage?
          </h2>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-charcoal-600 dark:text-charcoal-300 font-light leading-relaxed">
            Discover verified monuments across 28 states, choose low-crowd time slots, and experience India&apos;s cultural heritage without the rush.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/sites"
              className="btn-gold px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-navy-950" />
              <span>Explore All Monuments</span>
            </Link>
            <Link
              href="/register"
              className="px-7 py-3.5 rounded-xl border border-sandstone-300 dark:border-white/[0.12] hover:border-sandstone-400 dark:hover:border-gold-500/40 bg-white/80 dark:bg-navy-950/60 hover:bg-white dark:hover:bg-white/[0.06] text-charcoal-800 dark:text-ivory-100 text-sm font-medium transition-all shadow-sm"
            >
              <span>Create Visitor Account</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
