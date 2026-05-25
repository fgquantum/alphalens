'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Stock Page Error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-20 h-20 bg-bear/10 rounded-full flex items-center justify-center mb-6 border border-bear/20">
        <AlertTriangle className="w-10 h-10 text-bear" />
      </div>
      
      <h1 className="text-2xl font-black text-foreground mb-3">Analysis Interrupted</h1>
      <p className="text-muted-2 max-w-md mx-auto mb-8">
        We encountered an issue while retrieving market data for this ticker. 
        This is usually temporary due to upstream provider volume or an invalid symbol.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-light text-white font-bold text-sm transition-all shadow-lg shadow-accent/20"
        >
          <RefreshCcw className="w-4 h-4" /> Try Again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-2 border border-border/50 hover:bg-surface-3 text-foreground font-bold text-sm transition-all"
        >
          <Home className="w-4 h-4" /> Return Home
        </Link>
      </div>
      
      <p className="mt-12 text-[10px] text-muted-2 uppercase tracking-widest">
        Error Digest: {error.digest || 'Internal Runtime Failure'}
      </p>
    </div>
  );
}
