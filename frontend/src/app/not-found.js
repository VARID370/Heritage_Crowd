import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-sandstone-100 border border-sandstone-300 mx-auto flex items-center justify-center text-sandstone-700 shadow-sm">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">
          404 — Historic Site Not Found
        </h1>
        <p className="text-sm text-charcoal-600 leading-relaxed">
          The heritage pathway or page you are looking for does not exist or may have been relocated.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sandstone-700 hover:bg-sandstone-800 text-ivory-50 text-sm font-semibold shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Safe Ground</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

