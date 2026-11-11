'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, CheckCircle, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { DEMO_BRAND_PROFILE, DEMO_PRODUCTS, DEMO_TRYON_CONFIG } from '../../../data/brandDemoSeed';
import { brandWorkspaceApi } from '../../../services';
import { Product } from '../../../types';
import { SafeImage } from '../../../components/shared/UiPrimitives';
import { Button } from '../../../components/ui/button';

const SAMPLE_MODELS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
];

export default function DedicatedBrandPublicTryOnPage() {
  const params = useParams();
  const brandSlug = String(params.brandSlug || '');
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [accentColor, setAccentColor] = useState('#0F172A');
  const [eligibleGarments, setEligibleGarments] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [personImg, setPersonImg] = useState<string>(SAMPLE_MODELS[0]);
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'processing' | 'done' | 'error'>('ready');
  const [resultUrl, setResultUrl] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  const appearance = DEMO_TRYON_CONFIG.appearance;

  useEffect(() => {
    async function loadBrandScope() {
      setLoading(true);
      try {
        const res = await brandWorkspaceApi.getPublicStorefront(brandSlug);
        setBrandName(res.tenant.name);
        setBrandLogo(res.tenant.logoUrl || DEMO_BRAND_PROFILE.logo);
        setAccentColor(res.tenant.storefrontSettings?.accentColor || '#0F172A');
        const list = res.products.filter((p) => p.isTryOnEligible && p.brandStorefrontPublished);
        setEligibleGarments(list);
        if (list[0]) setSelectedId(list[0].id);
        setLoading(false);
        return;
      } catch {
        // Fallback strictly when slug matches demo brand
      }

      if (brandSlug === DEMO_BRAND_PROFILE.slug) {
        setBrandName(DEMO_BRAND_PROFILE.name);
        setBrandLogo(DEMO_BRAND_PROFILE.logo);
        setAccentColor(DEMO_BRAND_PROFILE.primaryColor);
        const list = DEMO_PRODUCTS.filter((p) => p.isTryOnEligible && p.brandStorefrontPublished);
        setEligibleGarments(list);
        if (list[0]) setSelectedId(list[0].id);
      } else {
        setNotFoundFlag(true);
      }
      setLoading(false);
    }
    loadBrandScope();
  }, [brandSlug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading brand try-on studio...</div>;
  }

  if (notFoundFlag) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">Brand Try-On Page Not Found</h1>
        <p className="text-xs text-slate-500">No active public brand exists at <code>/try/{brandSlug}</code>.</p>
      </div>
    );
  }

  const activeGarment = eligibleGarments.find((p) => p.id === selectedId) || eligibleGarments[0];

  const handleGenerate = async () => {
    if (!consent) {
      setStatusNotice('Please accept privacy terms before generating your look.');
      return;
    }
    if (!activeGarment) return;
    setStatusNotice(null);
    setPhase('processing');

    const res = await brandWorkspaceApi.executeTryOn({
      productId: activeGarment.id,
      personImage: personImg,
      garmentImage: activeGarment.image,
      category: activeGarment.tryOnCategory || 'tops',
    });

    if (res.mode === 'live_ai' && res.resultUrl) {
      setResultUrl(res.resultUrl);
      setPhase('done');
    } else {
      setPhase('error');
      setStatusNotice(res.message || 'Live AI try-on service is unavailable right now.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: appearance.backgroundColor }}>
      {/* Customer Header Strictly Isolated to This Brand */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200">
            <SafeImage src={brandLogo} alt={brandName} fill className="object-cover" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-950 block">{brandName}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Dedicated Virtual Try-On</span>
          </div>
        </div>
        <Link href={`/brands/${brandSlug}`} className="text-xs font-bold underline text-slate-800">
          Back to {brandName} Storefront
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">{brandName} Virtual Fitting Room</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Browse and try on {eligibleGarments.length} eligible garments belonging exclusively to {brandName}.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Photo & Consent */}
          <div className="lg:col-span-4 rounded-3xl bg-white border border-slate-200 p-5 space-y-4">
            <h2 className="font-bold text-sm text-slate-900">1. Upload Customer Photo</h2>
            <label className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 rounded accent-slate-950" />
              <span>{DEMO_TRYON_CONFIG.dataProcessingNotice}</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const up = await brandWorkspaceApi.uploadMediaFile(f);
                if (up.ok && up.url) setPersonImg(up.url);
              }}
            />
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <SafeImage src={personImg} alt="Subject" fill className="object-cover" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="flex-1 gap-1.5">
                <Upload className="w-3.5 h-3.5" /> {appearance.uploadBtnText}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPersonImg(personImg === SAMPLE_MODELS[0] ? SAMPLE_MODELS[1] : SAMPLE_MODELS[0])}>
                Preset
              </Button>
            </div>
          </div>

          {/* Center: Result Stage */}
          <div className="lg:col-span-4 rounded-3xl bg-white border border-slate-200 p-5 space-y-4">
            <h2 className="font-bold text-sm text-slate-900">2. Try-On Result</h2>
            {phase === 'processing' ? (
              <div className="aspect-[3/4] rounded-2xl bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
                <p className="text-sm font-bold">{appearance.loadingText}</p>
              </div>
            ) : phase === 'done' && resultUrl ? (
              <div className="space-y-2">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-emerald-300">
                  <SafeImage src={resultUrl} alt="Virtual Try-On Result" fill className="object-cover" />
                </div>
                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> {appearance.successText}
                </p>
              </div>
            ) : phase === 'error' ? (
              <div className="aspect-[3/4] rounded-2xl bg-rose-50/50 border border-rose-200 p-6 flex flex-col items-center justify-center text-center space-y-2 text-xs">
                <AlertTriangle className="w-8 h-8 text-rose-600" />
                <p className="font-bold text-slate-900">Could Not Complete Live Generation</p>
                <p className="text-slate-600">{statusNotice}</p>
              </div>
            ) : (
              <div className="aspect-[3/4] rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center p-6 text-center text-xs text-slate-500">
                Choose a {brandName} garment on the right and click {appearance.generateBtnText}.
              </div>
            )}
            {statusNotice && phase === 'ready' && (
              <p className="text-xs font-semibold text-rose-600">{statusNotice}</p>
            )}
          </div>

          {/* Right: Strictly Isolated Garment Selector */}
          <div className="lg:col-span-4 rounded-3xl bg-white border border-slate-200 p-5 space-y-4">
            <h2 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>3. Select {brandName} Garment</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
              {eligibleGarments.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-2.5 rounded-xl border flex items-center gap-3 ${
                    activeGarment?.id === item.id ? 'border-slate-950 bg-slate-100 font-bold' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="relative w-11 h-14 rounded-lg overflow-hidden shrink-0">
                    <SafeImage src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-slate-900">{item.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {appearance.showPrices ? `$${item.price} • ` : ''}{item.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              style={{ backgroundColor: accentColor }}
              className="w-full py-3 rounded-full text-white text-xs font-bold flex items-center justify-center gap-2 shadow"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {appearance.generateBtnText}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

