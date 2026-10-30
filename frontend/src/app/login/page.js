'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Landmark, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const { login } = useAuth();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUnverified, setIsUnverified] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setIsUnverified(false);

    try {
      await login(email, password);
      router.push(redirect);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
      if (err.data?.isUnverified || err.message?.toLowerCase().includes('not verified')) {
        setIsUnverified(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sandstone-700 mx-auto flex items-center justify-center text-ivory-50 shadow-md">
            <Landmark className="w-6 h-6 text-gold-300" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
            Sign In to HeritageConnect
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500">
            Enter your personal email and password to access your bookings and verified passes.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
            {isUnverified && (
              <div className="pt-2 border-t border-rose-200 flex justify-end">
                <Link
                  href={`/verify-email?email=${encodeURIComponent(email)}`}
                  className="font-bold underline text-rose-900 hover:text-rose-950 flex items-center gap-1"
                >
                  Verify your email now <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white p-7 rounded-3xl border border-sandstone-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Personal Email Address
              </label>
              <div className="flex items-center px-3.5 py-2.5 bg-ivory-50 rounded-xl border border-sandstone-300 focus-within:border-sandstone-600">
                <Mail className="w-4 h-4 text-sandstone-600 mr-2 flex-shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Password
              </label>
              <div className="flex items-center px-3.5 py-2.5 bg-ivory-50 rounded-xl border border-sandstone-300 focus-within:border-sandstone-600">
                <Lock className="w-4 h-4 text-sandstone-600 mr-2 flex-shrink-0" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 disabled:opacity-50 text-ivory-50 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-sandstone-100 text-center">
            <p className="text-xs text-charcoal-500">
              Don&apos;t have an account yet?{' '}
              <Link href="/register" className="font-semibold text-sandstone-700 hover:text-sandstone-900 underline">
                Create personal account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
