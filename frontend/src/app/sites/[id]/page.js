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
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-8 animate-pulse">
        <div className="h-8 w-40 bg-sandstone-200 rounded-lg" />
        <div className="h-96 w-full bg-sandstone-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="h-10 w-3/4 bg-sandstone-200 rounded-lg" />
            <div className="h-24 w-full bg-sandstone-200 rounded-xl" />
          </div>
          <div className="h-72 bg-sandstone-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-charcoal-900">
          Monument Not Found
        </h2>
        <p className="text-sm text-charcoal-600">{error || 'Requested landmark could not be retrieved.'}</p>
        <Link
          href="/sites"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sandstone-700 text-ivory-50 text-sm font-semibold"
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
        className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-600 hover:text-charcoal-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Directory</span>
      </button>

      {/* Hero Header & Image */}
      <div className="relative rounded-3xl overflow-hidden bg-sandstone-900 border border-sandstone-200 shadow-lg min-h-[360px] md:min-h-[460px] flex items-end">
        <Image
          src={imageError || !site.imageUrl ? fallbackImage : site.imageUrl}
          alt={site.name}
          fill
          priority
          unoptimized
          className="object-cover brightness-90"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/95 via-charcoal-950/40 to-transparent" />

        <div className="relative z-10 p-6 sm:p-10 w-full text-white space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/20 backdrop-blur-md text-ivory-50 border border-white/20">
              {site.category?.replace('_', ' ')}
            </span>
            {site.isBookable ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600/90 text-white flex items-center gap-1.5 shadow-sm">
                <Ticket className="w-3.5 h-3.5" /> Bookable Ticket Pass Available
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-charcoal-800/80 text-ivory-200 flex items-center gap-1.5 shadow-sm">
                <Compass className="w-3.5 h-3.5" /> Discovery Record
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-ivory-50 leading-tight">
            {site.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-ivory-200">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gold-400" />
              <span>{[site.city, site.state].filter(Boolean).join(', ') || 'India'}</span>
            </div>

            {site.coordinates && (
              <span className="text-ivory-300">
                Coords: {site.coordinates.lat.toFixed(4)}° N, {site.coordinates.lng.toFixed(4)}° E
              </span>
            )}
          </div>

          {site.imageAttribution && (
            <p className="text-[11px] text-ivory-300/80 pt-1">
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
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sandstone-200 shadow-sm space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal-900">
              About This Monument
            </h2>
            <p className="text-sm sm:text-base text-charcoal-700 leading-relaxed">
              {site.description}
            </p>
          </div>

          {/* Location & Directions */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sandstone-200 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-charcoal-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sandstone-600" />
              <span>Geographic Coordinates & Directions</span>
            </h3>

            {site.coordinates ? (
              <div className="space-y-3">
                <p className="text-xs text-charcoal-600">
                  Exact OpenStreetMap coordinate points: <span className="font-semibold text-charcoal-800">{site.coordinates.lat}, {site.coordinates.lng}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ivory-100 hover:bg-sandstone-100 text-charcoal-800 border border-sandstone-300 text-xs font-semibold transition-colors"
                  >
                    <span>View on OpenStreetMap</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${site.coordinates.lat},${site.coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ivory-100 hover:bg-sandstone-100 text-charcoal-800 border border-sandstone-300 text-xs font-semibold transition-colors"
                  >
                    <span>Directions via Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-charcoal-500 italic">
                Coordinates are not available for this record in OpenStreetMap.
              </p>
            )}
          </div>

          {/* Rules and Visitor Guidelines */}
          {site.rules && site.rules.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sandstone-200 shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-bold text-charcoal-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sandstone-600" />
                <span>Entry Rules & Visiting Guidelines</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-charcoal-700">
                {site.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
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
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-sandstone-300 shadow-md space-y-6 sticky top-28">
              <div className="border-b border-sandstone-200 pb-4">
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-700 block">
                  Verified Online Ticketing
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-serif font-bold text-charcoal-900">
                      {formatINR(site.entryFee)}
                    </span>
                    <span className="text-xs text-charcoal-500 ml-1">/ visitor</span>
                  </div>
                  <CrowdBadge crowdStatus={site.crowdStatus} />
                </div>
              </div>

              {/* Slot / Hours info */}
              <div className="space-y-3 text-xs text-charcoal-600">
                <div className="flex items-center justify-between py-1 border-b border-sandstone-100">
                  <span className="flex items-center gap-1.5 font-medium text-charcoal-700">
                    <Clock className="w-4 h-4 text-sandstone-600" /> Opening Hours
                  </span>
                  <span>{site.openingHours || '09:00 AM - 05:30 PM'}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-sandstone-100">
                  <span className="flex items-center gap-1.5 font-medium text-charcoal-700">
                    <ShieldCheck className="w-4 h-4 text-sandstone-600" /> Slot Control
                  </span>
                  <span>Strict Capacity Limit</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-1.5 font-medium text-charcoal-700">
                    <Ticket className="w-4 h-4 text-sandstone-600" /> Ticket Type
                  </span>
                  <span>Digital Cryptographic QR</span>
                </div>
              </div>

              <Link
                href={bookingUrl}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sandstone-700 to-sandstone-800 hover:from-sandstone-800 hover:to-sandstone-900 text-ivory-50 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Ticket className="w-4 h-4" />
                <span>Book Tickets Now</span>
              </Link>
              <p className="text-[11px] text-center text-charcoal-400">
                Instant confirmation • Instant QR generation
              </p>
            </div>
          ) : (
            /* Discovery Only / Non-Bookable Notice Card */
            <div className="bg-sandstone-50 p-6 sm:p-7 rounded-3xl border border-sandstone-200 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-sandstone-200 text-sandstone-800 flex items-center justify-center">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-charcoal-900">
                Online booking is not currently available for this site
              </h3>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                This monument is discovered dynamically via OpenStreetMap. Only monuments with official verified entry fee configurations in HeritageConnect have digital booking enabled.
              </p>
              <div className="pt-2">
                <p className="text-[11px] text-charcoal-500">
                  Are you an authorized site administrator? You can configure online booking for this site from the Admin Portal.
                </p>
                <Link
                  href="/admin/sites"
                  className="mt-3 inline-block text-xs font-semibold text-sandstone-800 underline hover:text-sandstone-950"
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

