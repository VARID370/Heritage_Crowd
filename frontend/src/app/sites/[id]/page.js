'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Ticket,
  Compass,
  ArrowLeft,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  Building,
  Sparkles,
} from 'lucide-react';
import CrowdBadge from '@/components/CrowdBadge';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';

export default function SiteDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [site, setSite] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchSite = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const decodedId = decodeURIComponent(id);
        const res = await api.get(`/sites/${encodeURIComponent(decodedId)}`);
        if (res.success && res.data) {
          setSite(res.data);
        } else {
          setError('Heritage site not found.');
        }
      } catch (err) {
        setError(err.message || 'Could not load site details.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchSite();
    }
  }, [id]);

  const fallbackImage = '/placeholder-monument.svg';

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 animate-pulse">
        <div className="h-8 w-40 bg-navy-800/80 rounded-xl" />
        <div className="h-[420px] w-full bg-navy-900/60 rounded-3xl border border-white/[0.06]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-10 w-3/4 bg-navy-800/80 rounded-xl" />
            <div className="h-32 w-full bg-navy-900/50 rounded-2xl" />
          </div>
          <div className="h-80 bg-navy-900/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto text-amber-400 shadow-gold-glow">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-ivory-50">
          Monument Not Found
        </h2>
        <p className="text-sm text-charcoal-300 font-light leading-relaxed">{error || 'Requested landmark could not be retrieved.'}</p>
        <Link
          href="/sites"
          className="btn-gold inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Directory</span>
        </Link>
      </div>
    );
  }

  const mapUrl = site.coordinates
    ? `https://www.openstreetmap.org/?mlat=${site.coordinates.lat}&mlon=${site.coordinates.lng}#map=16/${site.coordinates.lat}/${site.coordinates.lng}`
    : null;

  const bookingUrl = site.isBookable && site.bookableSiteId
    ? `/booking/${site.bookableSiteId}`
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-300 hover:text-ivory-50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-gold-400" />
        <span>Back to Directory</span>
      </button>

      {/* Hero Header & Panoramic Image */}
      <div className="relative rounded-3xl overflow-hidden bg-navy-950 border border-white/[0.08] shadow-2xl min-h-[380px] md:min-h-[480px] flex items-end">
        <Image
          src={imageError || !site.imageUrl ? fallbackImage : site.imageUrl}
          alt={site.name}
          fill
          priority
          unoptimized
          className="object-cover brightness-75 scale-102"
          onError={() => setImageError(true)}
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gold-950/10 mix-blend-color-burn" />

        <div className="relative z-10 p-6 sm:p-10 w-full space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-navy-950/80 backdrop-blur-md text-gold-300 border border-gold-400/30 shadow-sm">
              {site.category?.replace('_', ' ') || 'Heritage Landmark'}
            </span>
            {site.isBookable ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md text-emerald-300 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Ticket className="w-3.5 h-3.5" /> Bookable Ticket Pass Available
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-navy-900/80 border border-white/10 backdrop-blur-md text-charcoal-200 flex items-center gap-1.5 shadow-sm">
                <Compass className="w-3.5 h-3.5 text-gold-400" /> Discovered Heritage Record
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-ivory-50 leading-tight">
            {site.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-charcoal-200">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gold-400" />
              <span className="font-medium">{[site.city, site.state].filter(Boolean).join(', ') || 'India'}</span>
            </div>

            {site.coordinates && (
              <span className="text-charcoal-400 font-mono text-xs">
                Coordinates: {site.coordinates.lat.toFixed(4)}° N, {site.coordinates.lng.toFixed(4)}° E
              </span>
            )}
          </div>

          {site.imageAttribution && (
            <p className="text-[11px] text-charcoal-400 pt-1 font-light">
              Photo credit: {site.imageAttribution}
            </p>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description & Monument Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overview & Description */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Historical Significance</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-ivory-50">
              About This Monument
            </h2>
            <p className="text-sm sm:text-base text-charcoal-200 leading-relaxed font-light">
              {site.description}
            </p>
          </div>

          {/* Location & Directions */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-ivory-50 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold-400" />
              <span>Geographic Coordinates & Navigation</span>
            </h3>

            {site.coordinates ? (
              <div className="space-y-4">
                <p className="text-xs text-charcoal-300 font-light">
                  OpenStreetMap verified spatial coordinate node:{' '}
                  <span className="font-mono font-semibold text-gold-300">
                    {site.coordinates.lat}, {site.coordinates.lng}
                  </span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-950/70 hover:bg-white/[0.08] text-ivory-100 border border-white/[0.12] text-xs font-semibold transition-all"
                  >
                    <span>View on OpenStreetMap</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${site.coordinates.lat},${site.coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-950/70 hover:bg-white/[0.08] text-ivory-100 border border-white/[0.12] text-xs font-semibold transition-all"
                  >
                    <span>Directions via Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-charcoal-400 italic">
                Coordinates are not available for this record in OpenStreetMap.
              </p>
            )}
          </div>

          {/* Rules and Visitor Guidelines */}
          {site.rules && site.rules.length > 0 && (
            <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-4">
              <h3 className="font-serif text-lg font-bold text-ivory-50 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Entry Rules & Visiting Guidelines</span>
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-charcoal-300 font-light">
                {site.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Ticketing Card or Exploration Notice */}
        <div className="space-y-6">
          {site.isBookable ? (
            /* Bookable Site Card */
            <div className="glass-panel-gold p-6 sm:p-7 rounded-3xl space-y-6 sticky top-28 shadow-glass-card">
              <div className="border-b border-white/[0.08] pb-4">
                <span className="text-xs uppercase tracking-widest font-semibold text-gold-400 block">
                  Verified Online Ticketing
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-serif font-bold text-gold-gradient">
                      {formatINR(site.entryFee)}
                    </span>
                    <span className="text-xs text-charcoal-400 ml-1.5 font-light">/ visitor</span>
                  </div>
                  <CrowdBadge crowdStatus={site.crowdStatus} />
                </div>
              </div>

              {/* Slot / Hours info */}
              <div className="space-y-3 text-xs text-charcoal-300 font-light">
                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
                  <span className="flex items-center gap-1.5 font-medium text-ivory-100">
                    <Clock className="w-4 h-4 text-gold-400" /> Opening Hours
                  </span>
                  <span className="font-mono text-ivory-200">{site.openingHours || '09:00 AM - 05:30 PM'}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
                  <span className="flex items-center gap-1.5 font-medium text-ivory-100">
                    <ShieldCheck className="w-4 h-4 text-gold-400" /> Slot Control
                  </span>
                  <span className="text-emerald-300 font-medium">Safe Capacity Cap</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="flex items-center gap-1.5 font-medium text-ivory-100">
                    <Ticket className="w-4 h-4 text-gold-400" /> Ticket Type
                  </span>
                  <span>Cryptographic QR Pass</span>
                </div>
              </div>

              <Link
                href={bookingUrl}
                className="btn-gold w-full py-3.5 px-6 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Ticket className="w-4 h-4 text-navy-950" />
                <span>Book Tickets Now</span>
              </Link>
              <p className="text-[11px] text-center text-charcoal-400 font-light">
                Instant confirmation • Verified QR pass generation
              </p>
            </div>
          ) : (
            /* Discovery Only / Non-Bookable Notice Card */
            <div className="glass-card p-6 sm:p-7 rounded-3xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 flex items-center justify-center shadow-gold-glow">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-ivory-50">
                Online booking not currently configured for this site
              </h3>
              <p className="text-xs text-charcoal-300 leading-relaxed font-light">
                This monument is discovered dynamically via OpenStreetMap. Only monuments with official verified entry fee configurations in HeritageConnect have digital booking enabled.
              </p>
              <div className="pt-2">
                <p className="text-[11px] text-charcoal-400 font-light">
                  Are you an authorized site administrator? You can configure online booking for this site from the Admin Portal.
                </p>
                <Link
                  href="/admin/sites"
                  className="mt-3 inline-block text-xs font-semibold text-gold-400 hover:text-gold-300 underline"
                >
                  Configure Site in Admin Portal →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
