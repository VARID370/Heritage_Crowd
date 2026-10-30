import { Landmark } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-sandstone-100 border border-sandstone-300 mx-auto flex items-center justify-center text-sandstone-700 animate-bounce shadow-sm">
          <Landmark className="w-7 h-7 text-sandstone-700" />
        </div>
        <p className="font-serif text-sm font-semibold text-charcoal-700">
          Loading Heritage Data...
        </p>
      </div>
    </div>
  );
}

