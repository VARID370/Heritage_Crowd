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
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-500',
        label: 'Low Crowd',
      };
    case 'moderate':
      return {
        bg: 'bg-blue-100 text-blue-800 border-blue-300',
        dot: 'bg-blue-500',
        label: 'Moderate Crowd',
      };
    case 'high':
      return {
        bg: 'bg-amber-100 text-amber-800 border-amber-300',
        dot: 'bg-amber-500',
        label: 'High Crowd',
      };
    case 'peak':
      return {
        bg: 'bg-rose-100 text-rose-800 border-rose-300',
        dot: 'bg-rose-500',
        label: 'Peak Crowd',
      };
    default:
      return {
        bg: 'bg-stone-100 text-stone-700 border-stone-300',
        dot: 'bg-stone-400',
        label: 'Crowd data unavailable',
      };
  }
}

