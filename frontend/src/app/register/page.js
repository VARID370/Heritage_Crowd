'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Landmark, Mail, Lock, User, Phone, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Client-side instant visual feedback
  const hasMinLength = formData.password.length >= 8;
  const hasLower = /[a-z]/.test(formData.password);
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (!hasMinLength || !hasLower || !hasUpper || !hasNumber) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, and a number.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone.trim() || undefined,
      });

      // Immediate redirect to homepage / dashboard
      router.push('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check the details entered.');
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
            Create Your Account
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-300 font-light max-w-sm mx-auto leading-relaxed">
            Register with your personal email to explore monuments and book official passes.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2 backdrop-blur-md">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="glass-panel p-7 sm:p-8 rounded-3xl border border-white/[0.08] shadow-glass-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <div className="flex items-center px-3.5 py-3 bg-navy-950/70 rounded-xl border border-white/[0.1] focus-within:border-gold-500/50 transition-colors">
                <User className="w-4 h-4 text-gold-400 mr-2.5 flex-shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Varid Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-transparent text-sm focus:outline-none text-ivory-50 placeholder-charcoal-500 font-medium"
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-transparent text-sm focus:outline-none text-ivory-50 placeholder-charcoal-500 font-medium"
                />
              </div>

              {/* Password requirement hints */}
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-charcoal-400">
                <span className={`px-2 py-0.5 rounded-full border ${hasMinLength ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-navy-950/60 border-white/[0.08]'}`}>
                  8+ chars
                </span>
                <span className={`px-2 py-0.5 rounded-full border ${hasUpper && hasLower ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-navy-950/60 border-white/[0.08]'}`}>
                  Upper & lower
                </span>
                <span className={`px-2 py-0.5 rounded-full border ${hasNumber ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-navy-950/60 border-white/[0.08]'}`}>
                  Number
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1.5 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="flex items-center px-3.5 py-3 bg-navy-950/70 rounded-xl border border-white/[0.1] focus-within:border-gold-500/50 transition-colors">
                <Lock className="w-4 h-4 text-gold-400 mr-2.5 flex-shrink-0" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-transparent text-sm focus:outline-none text-ivory-50 placeholder-charcoal-500 font-medium"
                />
              </div>
              {formData.confirmPassword && (
                <p className={`mt-1.5 text-[11px] font-medium ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1.5 uppercase tracking-wider">
                Mobile Number (Optional)
              </label>
              <div className="flex items-center px-3.5 py-3 bg-navy-950/70 rounded-xl border border-white/[0.1] focus-within:border-gold-500/50 transition-colors">
                <Phone className="w-4 h-4 text-gold-400 mr-2.5 flex-shrink-0" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-transparent text-sm focus:outline-none text-ivory-50 placeholder-charcoal-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold w-full py-3.5 px-4 rounded-xl disabled:opacity-50 text-sm font-semibold flex items-center justify-center gap-2 group cursor-pointer mt-2"
            >
              <span>{isLoading ? 'Creating Account...' : 'Register Account'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
            <p className="text-xs text-charcoal-300 font-light">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-gold-400 hover:text-gold-300 underline ml-1">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
