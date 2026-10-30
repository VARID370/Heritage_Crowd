'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Landmark, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push(redirect);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
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
            Access your booked tickets, crowd passes, and administrative controls.
          </p>
        </div>

        {/* Demo Viva Helper Box */}
        <div className="p-3.5 rounded-2xl bg-sandstone-50 border border-sandstone-200 text-xs text-charcoal-700 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-sandstone-800">
            <UserCheck className="w-4 h-4 text-sandstone-700" />
            <span>College Viva Demo Accounts:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('visitor@heritageconnect.org', 'Visitor@123456')}
              className="py-1.5 px-2 rounded-lg bg-white hover:bg-sandstone-100 border border-sandstone-300 font-medium text-charcoal-800 text-[11px] transition-colors"
            >
              Visitor
            </button>
            <button
              type="button"
              onClick={() => fillDemo('staff@heritageconnect.org', 'Staff@123456')}
              className="py-1.5 px-2 rounded-lg bg-white hover:bg-gold-50 border border-gold-300 font-medium text-gold-900 text-[11px] transition-colors"
            >
              Gate Staff
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin@heritageconnect.org', 'Admin@123456')}
              className="py-1.5 px-2 rounded-lg bg-white hover:bg-sandstone-200 border border-sandstone-400 font-bold text-charcoal-900 text-[11px] transition-colors"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white p-7 rounded-3xl border border-sandstone-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Email Address
              </label>
              <div className="flex items-center px-3.5 py-2.5 bg-ivory-50 rounded-xl border border-sandstone-300 focus-within:border-sandstone-600">
                <Mail className="w-4 h-4 text-sandstone-600 mr-2 flex-shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
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
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

