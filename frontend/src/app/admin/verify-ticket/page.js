'use client';

import { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Camera,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Landmark,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function GateVerificationPage() {
  const [manualReference, setManualReference] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState(null);

  const scannerRef = useRef(null);
  const html5QrCodeInstance = useRef(null);

  // Fetch recent verification audit logs
  const fetchLogs = async () => {
    try {
      const res = await api.get('/verify/logs?limit=10');
      if (res.success && Array.isArray(res.data)) {
        setRecentLogs(res.data);
      }
    } catch (e) {
      console.warn('Error fetching logs', e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeInstance.current) {
        html5QrCodeInstance.current
          .stop()
          .catch(() => {})
          .then(() => {
            html5QrCodeInstance.current?.clear();
          });
      }
    };
  }, []);

  const handleStartScanner = async () => {
    setScannerError(null);
    setScannerActive(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (!html5QrCodeInstance.current) {
        html5QrCodeInstance.current = new Html5Qrcode('qr-reader-container');
      }

      await html5QrCodeInstance.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Successfully scanned code
          await submitVerification({ token: decodedText, method: 'qr_scan' });
          // Stop scanner after detection
          handleStopScanner();
        },
        () => {}
      );
    } catch (err) {
      console.error('Camera QR start error:', err);
      setScannerError(err.message || 'Camera access not permitted or camera not found on this device.');
      setScannerActive(false);
    }
  };

  const handleStopScanner = async () => {
    if (html5QrCodeInstance.current) {
      try {
        await html5QrCodeInstance.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setScannerActive(false);
  };

  const submitVerification = async (payload) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const res = await api.post('/verify/scan', payload);
      setVerificationResult({
        success: true,
        outcome: res.outcome,
        message: res.message,
        data: res.data,
      });
      fetchLogs();
    } catch (err) {
      setVerificationResult({
        success: false,
        outcome: err.data?.outcome || 'invalid',
        message: err.message || 'Verification rejected',
        data: err.data?.data || null,
      });
      fetchLogs();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualReference.trim()) return;
    submitVerification({
      bookingReference: manualReference.trim(),
      method: 'manual',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
          Gate Ticket Verification & Admission
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-charcoal-600">
          Scan the visitor&apos;s digital ticket pass or enter their booking reference for one-time admission verification.
        </p>
      </div>

      {/* Main Verification Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Scanner Panel */}
        <div className="bg-white p-6 rounded-3xl border border-sandstone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-charcoal-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-sandstone-700" />
              <span>Camera QR Scanner</span>
            </h3>
            {scannerActive && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Camera
              </span>
            )}
          </div>

          <p className="text-xs text-charcoal-500">
            Use device webcam or mobile camera to scan ticket pass QR codes at monument gates.
          </p>

          {/* Scanner Container */}
          <div className="overflow-hidden rounded-2xl bg-charcoal-900 min-h-[260px] flex flex-col items-center justify-center p-2 text-white relative">
            <div id="qr-reader-container" className="w-full h-full" />
            {!scannerActive && (
              <div className="text-center p-6 space-y-3">
                <QrCode className="w-16 h-16 text-sandstone-300 mx-auto opacity-70" />
                <p className="text-xs text-ivory-200">Camera scanner is currently standby.</p>
                <button
                  type="button"
                  onClick={handleStartScanner}
                  className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-charcoal-900 font-bold text-xs shadow-md transition-all"
                >
                  Start Camera Scanner
                </button>
              </div>
            )}
          </div>

          {scannerActive && (
            <button
              type="button"
              onClick={handleStopScanner}
              className="w-full py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
            >
              Stop Camera Scanner
            </button>
          )}

          {scannerError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              {scannerError}
            </div>
          )}
        </div>

        {/* Manual Fallback Entry Panel */}
        <div className="bg-white p-6 rounded-3xl border border-sandstone-200 shadow-sm space-y-4">
          <h3 className="font-serif text-base font-bold text-charcoal-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-sandstone-700" />
            <span>Manual Reference Fallback</span>
          </h3>
          <p className="text-xs text-charcoal-500">
            If the visitor&apos;s screen is unreadable or camera is unavailable, enter the Booking Reference directly.
          </p>

          <form onSubmit={handleManualSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Booking Reference Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. HC-20261029-XXXX"
                value={manualReference}
                onChange={(e) => setManualReference(e.target.value)}
                className="w-full font-mono uppercase px-4 py-3 rounded-xl border border-sandstone-300 bg-ivory-50 text-sm font-bold text-charcoal-900 focus:outline-none focus:border-sandstone-600"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying || !manualReference.trim()}
              className="w-full py-3 px-4 rounded-xl bg-sandstone-700 hover:bg-sandstone-800 disabled:opacity-50 text-ivory-50 text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <span>Checking Database...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Admit Visitor</span>
                </>
              )}
            </button>
          </form>

          <div className="p-4 rounded-2xl bg-sandstone-50 border border-sandstone-200 text-[11px] text-charcoal-600 space-y-1">
            <p className="font-semibold text-charcoal-800">Gate Verification Protocol:</p>
            <p>1. Check that primary visitor name matches valid photo ID.</p>
            <p>2. Verify total admitted visitor count matches pass.</p>
            <p>3. Successful admission permanently records turnstile entry.</p>
          </div>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 ${
            verificationResult.outcome === 'valid'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
              : verificationResult.outcome === 'already_used'
              ? 'bg-blue-50 border-blue-500 text-blue-950'
              : verificationResult.outcome === 'not_yet_valid'
              ? 'bg-amber-50 border-amber-500 text-amber-950'
              : 'bg-rose-50 border-rose-500 text-rose-950'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {verificationResult.outcome === 'valid' && (
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              )}
              {verificationResult.outcome === 'already_used' && (
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                  <Clock className="w-7 h-7" />
                </div>
              )}
              {verificationResult.outcome === 'not_yet_valid' && (
                <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center">
                  <AlertCircle className="w-7 h-7" />
                </div>
              )}
              {(verificationResult.outcome === 'cancelled' || verificationResult.outcome === 'invalid') && (
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center">
                  <XCircle className="w-7 h-7" />
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-white/80 border">
                  Outcome: {verificationResult.outcome.toUpperCase()}
                </span>
                <span className="text-xs font-semibold opacity-70">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>

              <h2 className="font-serif text-xl sm:text-2xl font-bold">
                {verificationResult.message}
              </h2>

              {verificationResult.data && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-black/10 text-xs">
                  {verificationResult.data.visitorName && (
                    <div>
                      <span className="opacity-70 block font-semibold">Visitor Name</span>
                      <span className="font-bold text-sm">{verificationResult.data.visitorName}</span>
                    </div>
                  )}

                  {verificationResult.data.visitorCount && (
                    <div>
                      <span className="opacity-70 block font-semibold">Visitors Admitted</span>
                      <span className="font-bold text-sm">{verificationResult.data.visitorCount} Person(s)</span>
                    </div>
                  )}

                  {verificationResult.data.slotTime && (
                    <div>
                      <span className="opacity-70 block font-semibold">Slot Window</span>
                      <span className="font-bold text-sm">{verificationResult.data.slotTime}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Verification Log Table */}
      <div className="bg-white p-6 rounded-3xl border border-sandstone-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-serif text-lg font-bold text-charcoal-900">
            Recent Gate Verification Audit Trail
          </h3>
          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg border border-sandstone-200 hover:bg-sandstone-50 text-charcoal-600"
            title="Refresh Log"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sandstone-50 text-charcoal-600 uppercase font-semibold border-b border-sandstone-200">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Outcome</th>
                  <th className="py-2.5 px-3">Gate Officer</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sandstone-100">
                {recentLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-sandstone-50/50">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-charcoal-500 whitespace-nowrap">
                      {new Date(log.verifiedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-charcoal-900">
                      {log.bookingReference}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-sandstone-100 text-[10px] font-semibold uppercase">
                        {log.method}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.outcome === 'valid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.outcome === 'already_used'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.outcome}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-charcoal-700">
                      {log.verifiedByName || 'Staff Officer'}
                    </td>
                    <td className="py-2.5 px-3 text-charcoal-500 text-[11px] truncate max-w-xs">
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-charcoal-400 text-center py-6">
            No gate verification records logged yet.
          </p>
        )}
      </div>
    </div>
  );
}

