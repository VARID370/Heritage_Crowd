'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MailCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Compass,
  Ticket,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';
  const sentParam = searchParams.get('sent');

  const { verifyEmailWithToken, verifyOtpCode, resendVerificationEmail } = useAuth();

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenVerifying, setIsTokenVerifying] = useState(!!tokenParam);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState(null);

  const autoVerifiedRef = useRef(false);

  // Auto-verify if ?token=... is present in the link
  useEffect(() => {
    if (tokenParam && !autoVerifiedRef.current) {
      autoVerifiedRef.current = true;
      setIsTokenVerifying(true);
      setError(null);

      verifyEmailWithToken(tokenParam)
        .then(() => {
          setIsSuccess(true);
          setSuccessMessage('Your email address has been successfully verified! You now have full access to ticket bookings and crowd passes.');
        })
        .catch((err) => {
          setError(err.message || 'Verification token is invalid or has expired. Please enter your 6-digit code or request a new one.');
        })
        .finally(() => {
          setIsTokenVerifying(false);
        });
    }
  }, [tokenParam, verifyEmailWithToken]);

  // Cooldown timer interval
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !otp.trim()) {
      setError('Please provide your email address and the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await verifyOtpCode(email.trim(), otp.trim());
      setIsSuccess(true);
      setSuccessMessage('Your email address has been successfully verified! You now have full access to ticket bookings.');
    } catch (err) {
      setError(err.message || 'Invalid or expired 6-digit verification code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Please enter your email address to resend the verification code.');
      return;
    }

    setError(null);
    setResendStatus(null);
    setIsLoading(true);

    try {
      const res = await resendVerificationEmail(email.trim());
      setResendStatus(res.message || 'A fresh verification code has been generated.');
      setCooldown(60); // 60 seconds cooldown
    } catch (err) {
      if (err.data?.secondsRemaining) {
        setCooldown(err.data.secondsRemaining);
      }
      setError(err.message || 'Could not resend verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-sandstone-700 mx-auto flex items-center justify-center text-ivory-50 shadow-md">
            {isSuccess ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            ) : (
              <MailCheck className="w-7 h-7 text-gold-300" />
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
            {isSuccess ? 'Email Verified!' : 'Verify Your Email'}
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500">
            {isSuccess
              ? 'Your account is now active and verified.'
              : 'Enter the 6-digit verification code or click the link sent to your personal email.'}
          </p>
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div className="bg-white p-7 rounded-3xl border border-sandstone-200 shadow-sm space-y-5 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
              <p className="font-semibold">{successMessage}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/sites"
                className="py-3 px-4 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Monuments</span>
              </Link>
              <Link
                href="/my-bookings"
                className="py-3 px-4 rounded-xl bg-sandstone-100 hover:bg-sandstone-200 text-charcoal-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Ticket className="w-4 h-4" />
                <span>My Bookings</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Verification Form View */
          <div className="bg-white p-7 rounded-3xl border border-sandstone-200 shadow-sm space-y-5">
            {/* Auto token verification loading */}
            {isTokenVerifying && (
              <div className="p-4 rounded-2xl bg-sandstone-50 border border-sandstone-200 text-charcoal-800 text-xs flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-sandstone-700 animate-spin flex-shrink-0" />
                <span>Verifying your single-use email token with the server...</span>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Resend status alert */}
            {resendStatus && (
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{resendStatus}</span>
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-ivory-50 rounded-xl border border-sandstone-300 focus-within:border-sandstone-600 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  6-Digit Verification Code
                </label>
                <div className="flex items-center px-3.5 py-2.5 bg-ivory-50 rounded-xl border border-sandstone-300 focus-within:border-sandstone-600">
                  <KeyRound className="w-4 h-4 text-sandstone-600 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-transparent text-lg font-mono tracking-widest text-center focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-charcoal-500">
                  Check your inbox for the code. It remains valid for 15 minutes.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || isTokenVerifying || otp.length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 disabled:opacity-50 text-ivory-50 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>{isLoading ? 'Verifying Code...' : 'Verify Code & Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Resend Action */}
            <div className="pt-4 border-t border-sandstone-100 flex items-center justify-between text-xs">
              <span className="text-charcoal-500">Didn&apos;t receive the code?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading || cooldown > 0}
                className="font-semibold text-sandstone-700 hover:text-sandstone-900 disabled:opacity-50 underline transition-colors"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
