'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Landmark, Mail, Lock, User, Phone, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
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

  // Simple client-side checks for instant feedback
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
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sandstone-700 mx-auto flex items-center justify-center text-ivory-50 shadow-md">
            <Landmark className="w-6 h-6 text-gold-300" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
            Create Your Account
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500">
            Register with your personal email to explore monuments and book official passes.
          </p>
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
                Full Name
              </label>
              <div className="flex items-center px-3.5 py-2.5 bg-ivory-50 rounded-xl border border-sandstone-300 focus-within:border-sandstone-600">
                <User className="w-4 h-4 text-sandstone-600 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Varid Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  placeholder="At least 8 characters (A-Z, a-z, 0-9)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
              {/* Password requirement hints */}
              <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-charcoal-500">
                <span className={hasMinLength ? 'text-emerald-700 font-semibold' : ''}>
                  • 8+ chars
                </span>
                <span className={hasUpper && hasLower ? 'text-emerald-700 font-semibold' : ''}>
                  • Upper & lowercase
                </span>
                <span className={hasNumber ? 'text-emerald-700 font-semibold' : ''}>
                  • Number
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Confirm Password
              </label>
              <div className="flex items-center px-3.5 py-2.5 bg-ivory-50 rounded-xl border border-sandstone-300 focus-within:border-sandstone-600">
                <Lock className="w-4 h-4 text-sandstone-600 mr-2 flex-shrink-0" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
              {formData.confirmPassword && (
                <p className={`mt-1 text-[11px] font-medium ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Mobile Number (Optional)
              </label>
              <div className="flex items-center px-3.5 py-2.5 bg-ivory-50 rounded-xl border border-sandstone-300 focus-within:border-sandstone-600">
                <Phone className="w-4 h-4 text-sandstone-600 mr-2 flex-shrink-0" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 disabled:opacity-50 text-ivory-50 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>{isLoading ? 'Creating Account...' : 'Register Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-sandstone-100 text-center">
            <p className="text-xs text-charcoal-500">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-sandstone-700 hover:text-sandstone-900 underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
