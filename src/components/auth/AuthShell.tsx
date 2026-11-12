'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  badge?: string;
  authTab?: 'login' | 'register';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({
  title,
  subtitle,
  badge,
  authTab,
  children,
  footer,
}: AuthShellProps) {
  const marketplaceUrl = process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 grid grid-cols-1 lg:grid-cols-12">
      {/* Minimal Editorial Brand Panel (Desktop) */}
      <aside className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-stone-950 text-white p-10 xl:p-12 flex-col justify-between relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/[0.04] blur-3xl" />
          <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-amber-500/[0.05] blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center">
          <Link href="/login" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-white text-stone-950 flex items-center justify-center font-serif font-extrabold text-base shadow-sm group-hover:scale-105 transition-transform">
              V
            </div>
            <span className="font-serif font-bold tracking-[0.16em] text-sm text-white leading-none">
              V-TRY <span className="text-[11px] font-sans tracking-wider text-stone-400 font-semibold">BRANDS</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-3 my-auto">
          <h2 className="font-serif text-3xl xl:text-4xl font-bold tracking-tight leading-[1.15] text-white max-w-sm">
            Your fashion studio, unified.
          </h2>
          <p className="text-sm text-stone-400 max-w-xs">
            Catalog, AI try-on &amp; orders in one place.
          </p>
        </div>

        <div className="relative z-10 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-stone-400">
          <span>V-TRY Studio</span>
          <a
            href={marketplaceUrl}
            className="inline-flex items-center gap-1 text-stone-200 hover:text-white font-medium transition-colors"
          >
            <span>Marketplace</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>

      {/* Right Authentication Workspace */}
      <main className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center py-5 sm:py-8 px-3 sm:px-8 relative">
        <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-5">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between gap-2">
            <Link href="/login" className="flex items-center gap-2 sm:gap-2.5 lg:hidden min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-950 text-white flex items-center justify-center font-serif font-bold text-sm sm:text-base shadow-sm shrink-0">
                V
              </div>
              <span className="font-serif font-bold tracking-[0.12em] sm:tracking-[0.14em] text-xs sm:text-sm text-stone-950 leading-none truncate">
                V-TRY <span className="text-[10px] font-sans text-stone-500 font-bold">BRANDS</span>
              </span>
            </Link>

            <a
              href={marketplaceUrl}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-950 transition-colors shrink-0"
            >
              <span>Marketplace</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card */}
          <div className="rounded-2xl sm:rounded-3xl bg-white border border-stone-200/90 shadow-xl shadow-stone-900/5 p-5 sm:p-8 space-y-5">
            {authTab && (
              <div
                role="tablist"
                aria-label="Authentication mode"
                className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-100 border border-stone-200"
              >
                <Link
                  href="/login"
                  role="tab"
                  aria-selected={authTab === 'login'}
                  className={`h-9 rounded-lg text-xs font-bold inline-flex items-center justify-center transition-all ${
                    authTab === 'login'
                      ? 'bg-white text-stone-950 shadow-sm border border-stone-200/80'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  role="tab"
                  aria-selected={authTab === 'register'}
                  className={`h-9 rounded-lg text-xs font-bold inline-flex items-center justify-center transition-all ${
                    authTab === 'register'
                      ? 'bg-white text-stone-950 shadow-sm border border-stone-200/80'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Register Brand
                </Link>
              </div>
            )}

            {(badge || title || subtitle) && (
              <div className="space-y-1">
                {badge && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
                    {badge}
                  </span>
                )}
                <h1 className="font-serif text-2xl font-bold text-stone-950 tracking-tight">{title}</h1>
                {subtitle && <p className="text-xs text-stone-500 leading-relaxed">{subtitle}</p>}
              </div>
            )}

            {children}
          </div>

          {footer && <div className="text-center text-xs text-stone-500">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
