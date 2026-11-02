import { Landmark, Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500/20 to-navy-900 border border-gold-400/40 mx-auto flex items-center justify-center text-gold-400 animate-pulse shadow-gold-glow">
          <Landmark className="w-8 h-8" />
        </div>
        <p className="font-serif text-sm font-semibold text-ivory-100 tracking-wide flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-spin" />
          <span>Synchronizing Heritage Registry...</span>
        </p>
      </div>
    </div>
  );
}
