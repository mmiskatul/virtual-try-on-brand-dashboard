'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { RefreshCw, User, LogOut } from 'lucide-react';
import { BrandProfile } from '../../types';

interface HeaderProps {
  activeTab: string;
  brand: BrandProfile;
  onRefresh: () => void;
}

export function BrandHeader({ activeTab, brand, onRefresh }: HeaderProps) {
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (session?.backendToken) {
      localStorage.setItem('brand_token', session.backendToken);
    }
  }, [session?.backendToken]);

  const titles: Record<string, string> = {
    overview: 'Brand Command Center',
    products: 'Garment Catalog & Dual Publishing',
    fabrics: 'Material Specs & Fabric Library',
    inventory: 'Inventory Control & Concurrency Logs',
    storefront: 'Custom Storefront Appearance',
    orders: 'Fulfillment & Seller Orders',
    ai: 'AI Virtual Try-On Pipeline & Telemetry'
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white capitalize">
          {titles[activeTab] || 'Brand Command Center'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Authoritative tenant workspace for {brand.name} ({brand.slug})
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Tenant Active
        </span>

        {/* NextAuth Session Indicator */}
        {session?.user ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-sky-400" />
            )}
            <span className="font-semibold text-white">{session.user.name || brand.owner}</span>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') localStorage.removeItem('brand_token');
                signOut({ callbackUrl: '/login' });
              }}
              title="Sign Out"
              className="ml-1 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Merchant Sign In</span>
          </Link>
        )}

        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
