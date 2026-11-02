'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Landmark, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      router.push(redirect);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500/20 to-navy-900 border border-gold-400/30 mx-auto flex items-center justify-center text-gold-400 shadow-gold-glow">
            <Landmark className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ivory-50">
            Sign In to HeritageConnect
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-300 font-light max-w-sm mx-auto leading-relaxed">
            Enter your personal email and password to access your bookings and verified passes.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2.5 backdrop-blur-md">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="glass-panel p-7 sm:p-8 rounded-3xl border border-white/[0.08] shadow-glass-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1.5 uppercase tracking-wider">
                Personal Email Address
              </label>
              <div className="flex items-center px-3.5 py-3 bg-navy-950/70 rounded-xl border border-white/[0.1] focus-within:border-gold-500/50 transition-colors">
                <Mail className="w-4 h-4 text-gold-400 mr-2.5 flex-shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none text-ivory-50 placeholder-charcoal-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="flex items-center px-3.5 py-3 bg-navy-950/70 rounded-xl border border-white/[0.1] focus-within:border-gold-500/50 transition-colors">
                <Lock className="w-4 h-4 text-gold-400 mr-2.5 flex-shrink-0" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none text-ivory-50 placeholder-charcoal-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold w-full py-3.5 px-4 rounded-xl disabled:opacity-50 text-sm font-semibold flex items-center justify-center gap-2 group cursor-pointer mt-2"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
            <p className="text-xs text-charcoal-300 font-light">
              Don&apos;t have an account yet?{' '}
              <Link href="/register" className="font-semibold text-gold-400 hover:text-gold-300 underline ml-1">
                Create personal account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
