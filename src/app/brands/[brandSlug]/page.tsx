'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, ShieldCheck, Sparkles } from 'lucide-react';
import { DEMO_BRAND_PROFILE, DEMO_PRODUCTS } from '../../../data/brandDemoSeed';
import { brandWorkspaceApi } from '../../../services';
import { Product } from '../../../types';
import { SafeImage } from '../../../components/shared/UiPrimitives';

export default function PublicBrandStorefrontPage() {
  const params = useParams();
  const brandSlug = String(params.brandSlug || '');

  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandBanner, setBrandBanner] = useState('');
  const [brandDesc, setBrandDesc] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [accentColor, setAccentColor] = useState('#0F172A');
  const [products, setProducts] = useState<Product[]>([]);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await brandWorkspaceApi.getPublicStorefront(brandSlug);
        if (cancelled) return;
        setBrandName(res.tenant.name);
        setBrandLogo(res.tenant.logoUrl || DEMO_BRAND_PROFILE.logo);
        setBrandBanner(res.tenant.bannerUrl || DEMO_BRAND_PROFILE.banner);
        setBrandDesc(res.tenant.description || '');
        setAnnouncement(res.tenant.storefrontSettings?.announcement || '');
        setAccentColor(res.tenant.storefrontSettings?.accentColor || '#0F172A');
        setProducts(res.products.filter((p) => p.brandStorefrontPublished));
        setLoading(false);
        return;
      } catch {
        // Fallback strictly to matching brandSlug if demo storefront
      }

      if (brandSlug === DEMO_BRAND_PROFILE.slug) {
        setBrandName(DEMO_BRAND_PROFILE.name);
        setBrandLogo(DEMO_BRAND_PROFILE.logo);
        setBrandBanner(DEMO_BRAND_PROFILE.banner);
        setBrandDesc(DEMO_BRAND_PROFILE.description || '');
        setAnnouncement(DEMO_BRAND_PROFILE.announcement);
        setAccentColor(DEMO_BRAND_PROFILE.primaryColor);
        setProducts(DEMO_PRODUCTS.filter((p) => p.brandStorefrontPublished));
      } else {
        setNotFoundFlag(true);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [brandSlug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading storefront...</div>;
  }

  if (notFoundFlag) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#FAF9F6]">
        <h1 className="text-2xl font-bold text-slate-900">Brand Storefront Not Found</h1>
        <p className="text-xs text-slate-500">No active public brand storefront exists for <code>/brands/{brandSlug}</code>.</p>
      </div>
    );
  }

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  const visible = products.filter(
    (p) =>
      (category === 'All' || p.category === category) &&
      (!search.trim() || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col">
      {announcement && (
        <div className="py-2 px-4 text-center text-xs font-bold text-white" style={{ backgroundColor: accentColor }}>
          {announcement}
        </div>
      )}

      {/* Clean Customer-Only Header (Zero Admin Links Exposed) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200">
            <SafeImage src={brandLogo} alt={brandName} fill className="object-cover" />
          </div>
          <span className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
            {brandName} <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </span>
        </div>

        <Link
          href={`/try/${brandSlug}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-bold shadow-sm"
          style={{ backgroundColor: accentColor }}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Virtual Try-On Studio
        </Link>
      </header>

      {/* Banner */}
      <section className="relative h-64 sm:h-80 bg-slate-900 flex items-center justify-center text-center text-white px-6">
        <SafeImage src={brandBanner} alt={brandName} fill priority className="object-cover opacity-65" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200 font-bold">
            Dedicated Brand Storefront
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold">{brandName}</h1>
          <p className="text-xs sm:text-sm text-white/90">{brandDesc}</p>
        </div>
      </section>

      {/* Brand Catalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full flex-1 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap ${
                  category === c ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${brandName}...`}
              className="w-full pl-9 pr-3 py-2 rounded-full border border-slate-200 bg-slate-50 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {visible.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between group">
              <div className="relative aspect-[3/4] bg-slate-100">
                <SafeImage src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                {!p.marketplacePublished && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-950 text-white text-[10px] font-bold">
                    Storefront Exclusive
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2.5">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{p.name}</h3>
                  <p className="text-xs font-extrabold text-slate-950 mt-0.5">${p.price}</p>
                </div>
                {p.isTryOnEligible && (
                  <Link
                    href={`/try/${brandSlug}?productId=${encodeURIComponent(p.id)}`}
                    className="w-full py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Try It On
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

