'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Globe, ShieldCheck, Sparkles, Store } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  badge?: string;
  authTab?: 'login' | 'register';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({
  title,
  subtitle,
  badge = 'Brand Merchant Portal',
  authTab,
  children,
  footer,
}: AuthShellProps) {
  const marketplaceUrl = process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 grid grid-cols-1 lg:grid-cols-12">
      {/* Editorial Brand Showcase Panel (Desktop) */}
      <aside className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-stone-950 text-white p-10 xl:p-12 flex-col justify-between relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/[0.04] blur-3xl" />
          <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-amber-500/[0.06] blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white text-stone-950 flex items-center justify-center font-serif font-extrabold text-lg shadow-sm group-hover:scale-105 transition-transform">
              V
            </div>
            <div>
              <span className="font-serif font-bold tracking-[0.16em] text-base text-white block leading-none">
                V-TRY <span className="text-[11px] font-sans tracking-wider text-stone-300 font-semibold">BRANDS</span>
              </span>
              <span className="text-[11px] text-stone-400">Merchant Command Center</span>
            </div>
          </Link>
        </div>

        <div className="relative z-10 space-y-8 my-auto py-10">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold uppercase tracking-widest text-amber-200">
              <Sparkles className="w-3 h-3" />
              Multi-Tenant Atelier Suite
            </span>
            <h2 className="font-serif text-3xl xl:text-4xl font-bold tracking-tight leading-[1.15] text-white">
              Elevate Your Fashion Label with AI Virtual Try-On.
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed max-w-md">
              Launch your isolated digital boutique, publish collections selectively to the V-TRY marketplace, and manage orders from one unified workspace.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                icon: Globe,
                title: 'Dual Storefront & Marketplace Publishing',
                desc: 'Keep boutique drops exclusive or feature key styles in global discovery.',
              },
              {
                icon: Sparkles,
                title: 'Real-Time AI Garment Fitting',
                desc: 'Dedicated virtual try-on links calibrated per fabric, silhouette, and category.',
              },
              {
                icon: ShieldCheck,
                title: 'Verified Tenant Isolation & RBAC',
                desc: 'Enterprise role controls, inventory locking, and audited staff activity.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/10 text-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{item.title}</p>
                    <p className="text-[11px] text-stone-400 leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-stone-400">
          <span>V-TRY Studio • Brand Edition</span>
          <a
            href={marketplaceUrl}
            className="inline-flex items-center gap-1 text-stone-200 hover:text-white font-semibold transition-colors"
          >
            <span>Open Marketplace</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>

      {/* Right Authentication Workspace */}
      <main className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center py-8 px-4 sm:px-8 relative">
        <div className="w-full max-w-md mx-auto space-y-5">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between">
            <Link href="/login" className="flex items-center gap-2.5 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-stone-950 text-white flex items-center justify-center font-serif font-bold text-base shadow-sm">
                V
              </div>
              <div>
                <span className="font-serif font-bold tracking-[0.14em] text-sm text-stone-950 block leading-none">
                  V-TRY <span className="text-[10px] font-sans text-stone-600 font-bold">BRANDS</span>
                </span>
                <span className="text-[10px] text-stone-500">Merchant Workspace</span>
              </div>
            </Link>

            <a
              href={marketplaceUrl}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-950 transition-colors"
            >
              <span>Back to Marketplace</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card */}
          <div className="rounded-3xl bg-white border border-stone-200/90 shadow-xl shadow-stone-900/5 p-6 sm:p-8 space-y-5">
            {authTab && (
              <div
                role="tablist"
                aria-label="Merchant authentication mode"
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

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-900 border border-stone-200">
                <Store className="w-3 h-3" />
                {badge}
              </span>
              <h1 className="font-serif text-2xl font-bold text-stone-950 tracking-tight pt-1">{title}</h1>
              <p className="text-xs text-stone-500 leading-relaxed">{subtitle}</p>
            </div>

            {children}
          </div>

          {footer && <div className="text-center text-xs text-stone-500">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
