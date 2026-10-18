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
    <aside className="w-72 border-r border-slate-800/80 bg-slate-900/50 backdrop-blur-xl flex flex-col justify-between p-5">
      <div className="space-y-6">
        {/* Brand Identity */}
        <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
          <Image
            src={brand.logo}
            alt={brand.name}
            width={44}
            height={44}
            className="w-11 h-11 rounded-xl object-cover ring-2 ring-sky-500/40"
          />
          <div>
            <h2 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              {brand.name}
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {brand.plan}
              </span>
            </h2>
            <p className="text-xs text-slate-400">{brand.owner}</p>
          </div>
        </div>

        {/* Tenant Switcher (Multi-Tenant Demo) */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-2">Switch Active Tenant:</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setCurrentBrand('aura')}
              className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all ${
                currentBrand === 'aura' ? 'bg-sky-500 text-slate-950 font-bold shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:text-white bg-slate-900'
              }`}
            >
              Aura Atelier
            </button>
            <button
              onClick={() => setCurrentBrand('vogue')}
              className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all ${
                currentBrand === 'vogue' ? 'bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-white bg-slate-900'
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
              activeTab === 'overview' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'products' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Products & Publishing
          </button>
          <button
            onClick={() => setActiveTab('fabrics')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'fabrics' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" /> Fabrics & Materials
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'inventory' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Inventory Movements
          </button>
          <button
            onClick={() => setActiveTab('storefront')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'storefront' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Store className="w-4 h-4" /> Storefront Customizer
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'orders' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <PackageCheck className="w-4 h-4" /> Seller Orders ({ordersCount})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'ai' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-sky-400" /> AI Virtual Try-On Studio
          </button>
        </nav>
      </div>

      {/* Storefront Link & Quota Meter */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <Link
          href={`/storefront/${brand.slug}`}
          target="_blank"
          className="flex items-center justify-between w-full p-3 rounded-xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/30 text-sky-300 hover:text-sky-200 hover:border-sky-500/60 transition-all text-xs font-semibold group"
        >
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" /> Live Brand Storefront
          </span>
          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>

        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Monthly Try-On Quota</span>
            <span className="text-sky-400 font-bold">{brand.quotaUsed} / {brand.quotaMax}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(brand.quotaUsed / brand.quotaMax) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
