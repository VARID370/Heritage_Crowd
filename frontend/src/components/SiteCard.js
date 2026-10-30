'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Ticket, Compass, ArrowRight, ShieldCheck } from 'lucide-react';
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
    <div className="group bg-white rounded-2xl border border-sandstone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative h-52 w-full bg-sandstone-200 overflow-hidden">
        <Image
          src={imageError || !site.imageUrl ? fallbackImage : site.imageUrl}
          alt={site.name}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/80 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/90 backdrop-blur-md text-charcoal-800 shadow-sm">
            {categoryLabels[site.category] || 'Heritage Site'}
          </span>

          {site.isBookable ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600/90 backdrop-blur-md text-white shadow-sm flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5" /> Bookable
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-charcoal-800/80 backdrop-blur-md text-ivory-200 shadow-sm flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Explore Only
            </span>
          )}
        </div>

        {/* Bottom overlay with location */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="flex items-center text-xs text-ivory-200 drop-shadow">
            <MapPin className="w-3.5 h-3.5 mr-1 text-gold-300 flex-shrink-0" />
            <span className="truncate">
              {[site.city, site.state].filter(Boolean).join(', ') || 'India'}
            </span>
          </p>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <Link href={siteLink} className="block">
            <h3 className="font-serif text-lg font-bold text-charcoal-900 group-hover:text-sandstone-700 transition-colors line-clamp-1">
              {site.name}
            </h3>
          </Link>
          <p className="text-xs text-charcoal-500 line-clamp-2 leading-relaxed">
            {site.description || 'Discovered archaeological landmark recorded on OpenStreetMap.'}
          </p>
        </div>

        {/* Crowd Indicator */}
        <div className="pt-2 border-t border-sandstone-100 flex items-center justify-between">
          <CrowdBadge crowdStatus={site.crowdStatus} />
          <div className="text-right">
            <span className="text-[11px] text-charcoal-400 block uppercase font-medium">Entry</span>
            <span className="text-sm font-bold text-charcoal-900">
              {site.isBookable && typeof site.entryFee === 'number'
                ? formatINR(site.entryFee)
                : 'Free/Direct Visit'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          {site.isBookable ? (
            <Link
              href={bookingLink}
              className="w-full py-2.5 px-4 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow group-hover:bg-sandstone-800"
            >
              <span>Book Ticket</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href={siteLink}
              className="w-full py-2.5 px-4 rounded-xl border border-sandstone-300 hover:bg-sandstone-50 text-charcoal-800 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <span>Explore Site</span>
              <ArrowRight className="w-4 h-4 text-sandstone-600" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

