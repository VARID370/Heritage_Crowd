import { getCrowdBadge } from '@/lib/utils';
import { Users, Info } from 'lucide-react';

export default function CrowdBadge({ crowdStatus, showPercent = true, className = '' }) {
  if (!crowdStatus) return null;

  const style = getCrowdBadge(crowdStatus.level);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${className}`}
      title={crowdStatus.description || style.label}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`} />
      <Users className="w-3.5 h-3.5 opacity-80" />
      <span>{crowdStatus.label || style.label}</span>
      {showPercent && crowdStatus.percent > 0 && (
        <span className="font-semibold opacity-90">({crowdStatus.percent}%)</span>
      )}
    </div>
  );
}

