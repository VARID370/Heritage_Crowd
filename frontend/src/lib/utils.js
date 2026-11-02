import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency safely in Indian Rupees (INR)
 * Guarantees no `₹undefined` or `₹NaN`
 */
export function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Free / Not specified';
  }
  const numeric = Number(amount);
  if (numeric === 0) return 'Free Entry';
  return `₹${numeric.toLocaleString('en-IN')}`;
}

/**
 * Format date string "YYYY-MM-DD" to human readable "29 Oct 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Crowd level UI styling metadata
 */
export function getCrowdBadge(level) {
  switch (level?.toLowerCase()) {
    case 'low':
      return {
        bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.15)]',
        dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
        label: 'Low Crowd',
      };
    case 'moderate':
      return {
        bg: 'bg-sky-500/15 text-sky-300 border-sky-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(14,165,233,0.15)]',
        dot: 'bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.8)]',
        label: 'Moderate Crowd',
      };
    case 'high':
      return {
        bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.15)]',
        dot: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
        label: 'High Crowd',
      };
    case 'peak':
      return {
        bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(244,63,94,0.15)]',
        dot: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
        label: 'Peak Crowd',
      };
    default:
      return {
        bg: 'bg-white/[0.06] text-charcoal-300 border-white/[0.1] backdrop-blur-md',
        dot: 'bg-charcoal-400',
        label: 'Crowd status',
      };
  }
}
