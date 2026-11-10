'use client';

import React from 'react';
import Link from 'next/link';
import { Store, ArrowUpRight } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({ title, subtitle, badge = 'Brand Merchant Portal', children, footer }: AuthShellProps) {
  const marketplaceUrl = process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex flex-col justify-center py-10 px-4">
      {/* Ambient Sky Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-sky-500/25">
              B
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-base text-white block leading-none">
                V-TRY <span className="text-xs text-sky-400 font-bold">BRANDS</span>
              </span>
              <span className="text-[10px] text-slate-400">Multi-Tenant Merchant Workspace</span>
            </div>
          </Link>

          <a
            href={marketplaceUrl}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <span>Marketplace</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="glass-panel rounded-3xl p-7 shadow-2xl border border-slate-800/90 space-y-5">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/25">
              <Store className="w-3 h-3" />
              {badge}
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight pt-1">{title}</h1>
            <p className="text-xs text-slate-400 leading-relaxed">{subtitle}</p>
          </div>

          {children}
        </div>

        {footer && <div className="text-center text-xs text-slate-400">{footer}</div>}
      </div>
    </div>
  );
}

