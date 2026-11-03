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
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-sandstone-200 dark:border-white/[0.08] shadow-glass-card text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-charcoal-900 dark:text-ivory-50">
          Account Ready & Active
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-600 dark:text-charcoal-300 font-light leading-relaxed">
          Email verification is no longer required. You have immediate access to all features.
        </p>
        <div className="pt-3">
          <Link
            href="/"
            className="btn-gold inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold shadow-sm"
          >
            <span>Proceed to HeritageConnect</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
