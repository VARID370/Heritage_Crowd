'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Ticket, Compass, ArrowRight, Sparkles } from 'lucide-react';
import CrowdBadge from './CrowdBadge';
import { formatINR } from '@/lib/utils';

export default function SiteCard({ site }) {
  const [imageError, setImageError] = useState(false);

  // Fallback neutral architectural illustration if remote image fails or is missing
  const fallbackImage = '/placeholder-monument.svg';

  const siteLink = `/sites/${encodeURIComponent(site.osmId)}`;
  const bookingLink = site.isBookable && site.bookableSiteId
    ? `/booking/${site.bookableSiteId}`
    : siteLink;

  const categoryLabels = {
    fort: 'Historic Fort',
    palace: 'Royal Palace',
    monument: 'Monument',
    archaeological_site: 'Archaeological Site',
    temple_heritage: 'Heritage Temple',
    historic: 'Historic Landmark',
    other: 'Heritage Structure',
  };

  return (
    <div className="group relative bg-navy-900/65 backdrop-blur-md rounded-2xl border border-white/[0.08] hover:border-gold-500/40 overflow-hidden shadow-glass-card hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.8),0_0_25px_rgba(230,168,23,0.18)] transition-all duration-300 flex flex-col hover:-translate-y-1.5">
      {/* Image Container */}
      <div className="relative h-56 w-full bg-navy-950 overflow-hidden">
        <Image
          src={imageError || !site.imageUrl ? fallbackImage : site.imageUrl}
          alt={site.name}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-108 transition-transform duration-700 brightness-90 group-hover:brightness-100"
          onError={() => setImageError(true)}
        />
        {/* Cinematic gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gold-950/10 mix-blend-overlay" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex justify-between items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-navy-950/80 backdrop-blur-md text-gold-300 border border-gold-400/20 shadow-sm">
            {categoryLabels[site.category] || 'Heritage Site'}
          </span>

          {site.isBookable ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md text-emerald-300 shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <Ticket className="w-3.5 h-3.5" /> Bookable
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-navy-900/80 border border-white/10 backdrop-blur-md text-charcoal-300 shadow-sm flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-gold-400" /> Explore Only
            </span>
          )}
        </div>

        {/* Bottom overlay with location */}
        <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
          <p className="flex items-center text-xs text-ivory-200 drop-shadow">
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-gold-400 flex-shrink-0" />
            <span className="truncate font-medium">
              {[site.city, site.state].filter(Boolean).join(', ') || 'India'}
            </span>
          </p>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <Link href={siteLink} className="block group/title">
            <h3 className="font-serif text-lg font-bold text-ivory-50 group-hover/title:text-gold-300 transition-colors line-clamp-1">
              {site.name}
            </h3>
          </Link>
          <p className="text-xs text-charcoal-300 line-clamp-2 leading-relaxed font-light">
            {site.description || 'Verified archaeological landmark recorded on OpenStreetMap.'}
          </p>
        </div>

        {/* Crowd Indicator */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <CrowdBadge crowdStatus={site.crowdStatus} />
          <div className="text-right">
            <span className="text-[10px] text-charcoal-400 block uppercase tracking-wider font-semibold">Entry Fee</span>
            <span className="text-sm font-bold text-ivory-100">
              {site.isBookable && typeof site.entryFee === 'number'
                ? formatINR(site.entryFee)
                : 'Free / Direct Visit'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          {site.isBookable ? (
            <Link
              href={bookingLink}
              className="btn-gold w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 group-hover:shadow-gold-glow"
            >
              <span>Book Priority Pass</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <Link
              href={siteLink}
              className="w-full py-2.5 px-4 rounded-xl border border-white/[0.12] hover:border-gold-400/40 bg-white/[0.04] hover:bg-white/[0.08] text-ivory-100 text-sm font-medium flex items-center justify-center gap-2 transition-all"
            >
              <span>Explore Monument</span>
              <ArrowRight className="w-4 h-4 text-gold-400 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
