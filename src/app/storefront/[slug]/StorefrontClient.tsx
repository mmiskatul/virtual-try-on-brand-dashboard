'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ArrowLeft, Check } from 'lucide-react';

interface StorefrontClientProps {
  brand: {
    name: string;
    slug: string;
    tagline: string;
    banner: string;
    logo: string;
    announcement: string;
    about: string;
    accent: string;
  };
  products: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    image: string;
    tryOn: boolean;
  }>;
}

export function StorefrontClient({ brand, products }: StorefrontClientProps) {
  const [filter, setFilter] = useState('All');
  const [activeTryOnModal, setActiveTryOnModal] = useState<any | null>(null);
  const [tryOnStep, setTryOnStep] = useState<'upload' | 'processing' | 'done'>('upload');

  const filtered = filter === 'All' ? products : products.filter(p => p.category === filter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Announcement bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-2 text-center text-xs text-slate-300 font-medium border-b border-slate-800">
        ✨ {brand.announcement}
      </div>

      {/* Brand Storefront Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-3">
            <Image
              src={brand.logo}
              alt={brand.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-sky-500/50"
            />
            <span className="font-extrabold tracking-wider uppercase text-sm text-white">{brand.name}</span>
          </div>
        </div>

        <nav className="flex items-center gap-6 text-xs font-semibold text-slate-300">
          <button onClick={() => setFilter('All')} className={`hover:text-white transition-colors ${filter === 'All' ? 'text-sky-400 font-bold' : ''}`}>Collection</button>
          <button onClick={() => setFilter('Dresses')} className={`hover:text-white transition-colors ${filter === 'Dresses' ? 'text-sky-400 font-bold' : ''}`}>Dresses</button>
          <button onClick={() => setFilter('Tops')} className={`hover:text-white transition-colors ${filter === 'Tops' ? 'text-sky-400 font-bold' : ''}`}>Tops</button>
          <button onClick={() => setFilter('Bottoms')} className={`hover:text-white transition-colors ${filter === 'Bottoms' ? 'text-sky-400 font-bold' : ''}`}>Bottoms</button>
          <button onClick={() => setFilter('Outerwear')} className={`hover:text-white transition-colors ${filter === 'Outerwear' ? 'text-sky-400 font-bold' : ''}`}>Outerwear</button>
        </nav>
      </header>

      {/* Hero Banner */}
      <section className="relative h-96 w-full overflow-hidden flex items-center justify-center">
        <Image
          src={brand.banner}
          alt={brand.name}
          fill
          priority
          sizes="100vw"
          className="object-cover filter brightness-[0.4]"
        />
        <div className="relative z-10 text-center max-w-2xl px-6 space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-sky-500/20 text-sky-400 border border-sky-500/30">
            Exclusive Brand Storefront
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">{brand.name}</h1>
          <p className="text-sm text-slate-300 leading-relaxed">{brand.tagline}</p>
        </div>
      </section>

      {/* Product Catalog */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-xl font-black text-white">Current Storefront Offerings ({filtered.length})</h2>
          <span className="text-xs text-slate-400">Authentic luxury apparel verified by {brand.name}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filtered.map(product => (
            <div key={product.id} className="group glass-card rounded-2xl overflow-hidden border border-slate-800/80 hover:border-sky-500/50 transition-all flex flex-col justify-between">
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-900">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.tryOn && (
                  <button
                    onClick={() => {
                      setActiveTryOnModal(product);
                      setTryOnStep('upload');
                    }}
                    className="absolute bottom-3 left-3 right-3 py-2.5 rounded-xl bg-slate-950/80 hover:bg-sky-500 hover:text-slate-950 text-white font-bold text-xs backdrop-blur-md border border-white/10 flex items-center justify-center gap-2 transition-all shadow-xl"
                  >
                    <Sparkles className="w-4 h-4 text-sky-400 group-hover:text-slate-950" />
                    AI Virtual Try-On
                  </button>
                )}
              </div>

              <div className="p-5 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-white">{product.name}</h3>
                  <span className="font-extrabold text-sm text-sky-400">${product.price}</span>
                </div>
                <p className="text-xs text-slate-400">{product.category}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Virtual Try-On Simulation Modal */}
      {activeTryOnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-sm text-white">AI Virtual Try-On Studio</h3>
              </div>
              <button onClick={() => setActiveTryOnModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {tryOnStep === 'upload' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <Image
                    src={activeTryOnModal.image}
                    alt={activeTryOnModal.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-bold text-white">{activeTryOnModal.name}</p>
                    <p className="text-slate-400">${activeTryOnModal.price} • Category: {activeTryOnModal.category}</p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-2xl p-6 text-center space-y-2 cursor-pointer transition-colors">
                  <Sparkles className="w-8 h-8 text-sky-400 mx-auto" />
                  <p className="font-semibold text-slate-200">Upload Full Body or Portrait Photo</p>
                  <p className="text-[11px] text-slate-500">PNG, JPG, or WEBP up to 10MB</p>
                </div>

                <button
                  onClick={() => {
                    setTryOnStep('processing');
                    setTimeout(() => setTryOnStep('done'), 1800);
                  }}
                  className="w-full py-2.5 rounded-xl bg-sky-500 text-slate-950 font-bold hover:bg-sky-400 transition-colors"
                >
                  Synthesize Fitting with VITON-HD
                </button>
              </div>
            )}

            {tryOnStep === 'processing' && (
              <div className="py-8 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-white">Synthesizing High-Resolution Garment Alignment...</p>
                <p className="text-[11px] text-slate-400">Performing posture segmentation & fabric texture preservation</p>
              </div>
            )}

            {tryOnStep === 'done' && (
              <div className="space-y-4 text-xs text-center">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden ring-2 ring-emerald-500/50">
                  <Image
                    src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80"
                    alt="Try-on Result"
                    fill
                    sizes="400px"
                    className="object-cover"
                  />
                  <div className="absolute top-2 right-2 px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded-full text-[10px] flex items-center gap-1 z-10">
                    <Check className="w-3 h-3" /> Fit Rendered
                  </div>
                </div>
                <p className="text-slate-300 font-medium">Inference completed in 32ms with ProductionVitonHDAdapter.</p>
                <button
                  onClick={() => setActiveTryOnModal(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700"
                >
                  Close Fitting Room
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 {brand.name}. Powered by Multi-Tenant Virtual Try-On Infrastructure.</p>
      </footer>
    </div>
  );
}
