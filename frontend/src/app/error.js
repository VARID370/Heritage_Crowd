'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-5 bg-white p-8 rounded-3xl border border-sandstone-200 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-charcoal-900">
          Something went wrong
        </h1>
        <p className="text-xs text-charcoal-600 leading-relaxed">
          {error?.message || 'An unexpected error occurred while processing this page.'}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-sandstone-300 hover:bg-sandstone-50 text-charcoal-800 text-xs font-semibold transition-colors"
          >
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

