import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-5 glass-card p-8 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/25 mx-auto flex items-center justify-center text-gold-400 shadow-gold-glow">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-ivory-50">
          404 — Historic Site Not Found
        </h1>
        <p className="text-sm text-charcoal-300 leading-relaxed font-light">
          The heritage pathway or page you are looking for does not exist or may have been relocated.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="btn-gold inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-navy-950" />
            <span>Return to Safe Ground</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
