'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Boutique storefront rendering error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400 font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
            Storefront Offline
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight pt-1">
            Unable to Load Boutique
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            This designer storefront is currently undergoing a live catalog update or experienced an unexpected sync issue.
          </p>
        </div>

        {error.digest && (
          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-left">
            <p className="text-[10px] font-mono text-slate-500">Trace Digest:</p>
            <p className="text-xs font-mono text-slate-300 truncate">{error.digest}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-lg shadow-sky-600/20"
          >
            Retry Boutique
          </Button>

          <Link href={process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000'} className="flex-1">
            <Button
              variant="outline"
              type="button"
              className="w-full border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Visit Marketplace
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
