'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Ticket,
  TrendingUp,
  ShieldCheck,
  QrCode,
  Clock,
  Landmark,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import CrowdBadge from '@/components/CrowdBadge';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/admin/dashboard-stats');
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Could not load administrative analytics.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-navy-900/60 rounded-3xl border border-white/[0.06]" />
          ))}
        </div>
        <div className="h-80 bg-navy-900/60 rounded-3xl border border-white/[0.06]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 glass-card rounded-3xl border border-rose-500/30 text-rose-300 space-y-2">
        <h3 className="font-bold text-base flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span>Analytics Load Error</span>
        </h3>
        <p className="text-xs text-rose-300/90 font-light">{error}</p>
      </div>
    );
  }

  const { summary, crowdAnalysis, siteVolume } = data;

  const barChartData = (siteVolume || []).map((s) => ({
    name: s.name.length > 15 ? `${s.name.slice(0, 15)}...` : s.name,
    visitors: s.visitorCount,
    revenue: s.revenue,
  }));

  const COLORS = ['#F6CD55', '#E6A817', '#C8880D', '#10B981', '#38BDF8'];

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="glass-card p-5 sm:p-6 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider block">
              Today&apos;s Booked Visitors
            </span>
            <span className="text-3xl font-serif font-bold text-ivory-50 mt-1 block">
              {summary.todayVisitors}
            </span>
            <span className="text-[11px] text-emerald-300 font-semibold mt-1 block">
              {summary.todayBookings} confirmed booking(s)
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/25 text-gold-400 flex items-center justify-center shadow-gold-glow">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card p-5 sm:p-6 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider block">
              Total Platform Revenue
            </span>
            <span className="text-3xl font-serif font-bold text-gold-gradient mt-1 block">
              {formatINR(summary.totalRevenue)}
            </span>
            <span className="text-[11px] text-charcoal-400 mt-1 block font-light">
              Today: {formatINR(summary.todayRevenue)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card p-5 sm:p-6 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider block">
              Configured Sites
            </span>
            <span className="text-3xl font-serif font-bold text-ivory-50 mt-1 block">
              {summary.totalSites}
            </span>
            <span className="text-[11px] text-gold-300 font-semibold mt-1 block">
              {summary.activeSites} active for booking
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/25 text-gold-400 flex items-center justify-center shadow-gold-glow">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-card p-5 sm:p-6 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider block">
              Gate Admitted Check-ins
            </span>
            <span className="text-3xl font-serif font-bold text-ivory-50 mt-1 block">
              {summary.checkedInBookings}
            </span>
            <span className="text-[11px] text-sky-300 font-semibold mt-1 block">
              {summary.cancelledBookings} cancelled
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-400 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics with Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Site Volume Chart */}
        <div className="lg:col-span-2 glass-card p-6 sm:p-7 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-serif text-lg font-bold text-ivory-50">
                Visitor Booking Volume by Monument
              </h3>
              <p className="text-xs text-charcoal-300 font-light mt-0.5">
                Total confirmed visitors across configured heritage sites.
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip
                    formatter={(val, name) => [val, name === 'visitors' ? 'Visitors' : 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#0C1322',
                      borderColor: 'rgba(246, 205, 85, 0.3)',
                      borderRadius: '12px',
                      color: '#FAF8F5',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="visitors" radius={[6, 6, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-charcoal-400">
                No booking volume data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Quick Gate Action Card */}
        <div className="glass-panel-gold p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-6 shadow-glass-card">
          <div className="space-y-3">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-400/20 text-gold-300 border border-gold-400/30 inline-block shadow-sm">
              Gate Operations
            </span>
            <h3 className="font-serif text-2xl font-bold text-ivory-50">
              Instant Ticket QR Verification
            </h3>
            <p className="text-xs text-charcoal-200 leading-relaxed font-light">
              Verify incoming visitor QR passes using device camera or manual booking reference entry with atomic one-time admission records.
            </p>
          </div>

          <Link
            href="/admin/verify-ticket"
            className="btn-gold w-full py-3.5 px-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5 text-navy-950" />
            <span>Launch Gate Scanner</span>
          </Link>
        </div>
      </div>

      {/* Today's Slot-Wise Crowd Utilization Table */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="font-serif text-lg font-bold text-ivory-50">
              Today&apos;s Time Slot Crowd Management
            </h3>
            <p className="text-xs text-charcoal-300 font-light mt-0.5">
              Live capacity breakdown with standardized server-side crowd classification.
            </p>
          </div>
          <Link
            href="/admin/slots"
            className="text-xs font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
          >
            <span>Manage All Slots</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {crowdAnalysis.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/70 text-charcoal-300 uppercase font-semibold border-b border-white/[0.08]">
                <tr>
                  <th className="py-3 px-4">Monument</th>
                  <th className="py-3 px-4">Slot Window</th>
                  <th className="py-3 px-4">Booked / Capacity</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Utilization</th>
                  <th className="py-3 px-4">Crowd Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {crowdAnalysis.map((slot) => (
                  <tr key={slot.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-ivory-100">
                      {slot.siteName}
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-200 font-mono">
                      {slot.slotTime}
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-300">
                      <span className="font-bold text-ivory-50">{slot.bookedVisitors}</span> / {slot.capacity}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-gold-300">{slot.remainingCapacity}</span>
                    </td>
                    <td className="py-3.5 px-4 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-navy-950 border border-white/[0.08] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              slot.utilizationPercent < 40
                                ? 'bg-emerald-500'
                                : slot.utilizationPercent < 70
                                ? 'bg-sky-500'
                                : slot.utilizationPercent < 85
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${slot.utilizationPercent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-charcoal-400">
                          {slot.utilizationPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <CrowdBadge
                        crowdStatus={{
                          level: slot.crowdLevel,
                          label: slot.crowdLabel,
                          percent: slot.utilizationPercent,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-charcoal-400 font-light">
            No time slots configured for today. Click &quot;Manage All Slots&quot; to add slots.
          </div>
        )}
      </div>
    </div>
  );
}
