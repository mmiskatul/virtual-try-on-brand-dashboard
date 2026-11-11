'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { RefreshCw, User, LogOut } from 'lucide-react';
import { logoutBrand } from '../../lib/logout';
import { BrandProfile } from '../../types';

interface HeaderProps {
  activeTab: string;
  brand: BrandProfile;
  onRefresh: () => void;
}

export function BrandHeader({ activeTab, brand, onRefresh }: HeaderProps) {
  const { data: session } = useSession();

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
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 capitalize">
          {titles[activeTab] || 'Brand Command Center'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Authoritative tenant workspace for {brand.name} ({brand.slug})
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Tenant Active
        </span>

        {/* NextAuth Session Indicator */}
        {session?.user ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-black" />
            )}
            <span className="font-semibold text-gray-900">{session.user.name || brand.owner}</span>
            <button
              onClick={() => logoutBrand({ callbackUrl: '/login' })}
              title="Sign Out"
              className="ml-1 text-gray-500 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Merchant Sign In</span>
          </Link>
        )}

        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-gray-100/80 hover:bg-gray-100 text-gray-700 hover:text-black transition-colors border border-gray-300"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
