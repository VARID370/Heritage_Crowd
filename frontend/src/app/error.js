'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-5 glass-card p-8 rounded-3xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400 mx-auto flex items-center justify-center shadow-gold-glow">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-ivory-50">
          Something went wrong
        </h1>
        <p className="text-xs text-charcoal-300 leading-relaxed font-light">
          {error?.message || 'An unexpected error occurred while processing this page.'}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-navy-950" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.12] hover:bg-white/[0.06] text-ivory-100 text-xs font-semibold transition-all"
          >
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
