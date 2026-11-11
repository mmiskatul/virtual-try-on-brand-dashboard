'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Sparkles,
  PackageCheck,
  TrendingUp,
  Globe,
  ExternalLink,
  Store
} from 'lucide-react';
import { BrandProfile } from '../../types';

interface SidebarProps {
  brand: BrandProfile;
  currentBrand: 'aura' | 'vogue';
  setCurrentBrand: (b: 'aura' | 'vogue') => void;
  activeTab: string;
  setActiveTab: (t: any) => void;
  ordersCount: number;
}

export function BrandSidebar({
  brand,
  currentBrand,
  setCurrentBrand,
  activeTab,
  setActiveTab,
  ordersCount
}: SidebarProps) {
  return (
    <aside className="w-72 border-r border-gray-200 bg-white/50 backdrop-blur-xl flex flex-col justify-between p-5">
      <div className="space-y-6">
        {/* Brand Identity */}
        <div className="flex items-center gap-3 pb-5 border-b border-gray-200">
          <Image
            src={brand.logo}
            alt={brand.name}
            width={44}
            height={44}
            className="w-11 h-11 rounded-xl object-cover ring-2 ring-black/20"
          />
          <div>
            <h2 className="font-bold text-base tracking-tight text-gray-900 flex items-center gap-1.5">
              {brand.name}
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-black border border-gray-300">
                {brand.plan}
              </span>
            </h2>
            <p className="text-xs text-gray-500">{brand.owner}</p>
          </div>
        </div>

        {/* Tenant Switcher (Multi-Tenant Demo) */}
        <div className="bg-white/60 p-3 rounded-xl border border-gray-200">
          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 block mb-2">Switch Active Tenant:</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setCurrentBrand('aura')}
              className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all ${
                currentBrand === 'aura' ? 'bg-black text-white font-bold shadow-lg shadow-black/10' : 'text-gray-500 hover:text-black bg-white'
              }`}
            >
              Aura Atelier
            </button>
            <button
              onClick={() => setCurrentBrand('vogue')}
              className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all ${
                currentBrand === 'vogue' ? 'bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20' : 'text-gray-500 hover:text-black bg-white'
              }`}
            >
              Vogue Nova
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'overview' ? 'bg-gray-100 text-black border border-gray-300 shadow-inner' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'products' ? 'bg-gray-100 text-black border border-gray-300' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Products & Publishing
          </button>
          <button
            onClick={() => setActiveTab('fabrics')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'fabrics' ? 'bg-gray-100 text-black border border-gray-300' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
            }`}
          >
            <Layers className="w-4 h-4" /> Fabrics & Materials
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'inventory' ? 'bg-gray-100 text-black border border-gray-300' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Inventory Movements
          </button>
          <button
            onClick={() => setActiveTab('storefront')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'storefront' ? 'bg-gray-100 text-black border border-gray-300' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
            }`}
          >
            <Store className="w-4 h-4" /> Storefront Customizer
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'orders' ? 'bg-gray-100 text-black border border-gray-300' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
            }`}
          >
            <PackageCheck className="w-4 h-4" /> Seller Orders ({ordersCount})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'ai' ? 'bg-gray-100 text-black border border-gray-300' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-black" /> AI Virtual Try-On Studio
          </button>
        </nav>
      </div>

      {/* Storefront Link & Quota Meter */}
      <div className="pt-4 border-t border-gray-200 space-y-3">
        <Link
          href={`/storefront/${brand.slug}`}
          target="_blank"
          className="flex items-center justify-between w-full p-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-100 border border-gray-300 text-black hover:text-gray-700 hover:border-gray-300 transition-all text-xs font-semibold group"
        >
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-black" /> Live Brand Storefront
          </span>
          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>

        <div className="bg-white/60 p-3 rounded-xl border border-gray-200">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500 font-medium">Monthly Try-On Quota</span>
            <span className="text-black font-bold">{brand.quotaUsed} / {brand.quotaMax}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-black to-black h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(brand.quotaUsed / brand.quotaMax) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
