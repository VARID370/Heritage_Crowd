'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect after a short moment
    const timer = setTimeout(() => {
      router.push('/');
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-sandstone-200 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-charcoal-900">
          Account Ready & Active
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-600">
          Email verification is no longer required. You have immediate access to all features.
        </p>
        <div className="pt-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Proceed to HeritageConnect</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
