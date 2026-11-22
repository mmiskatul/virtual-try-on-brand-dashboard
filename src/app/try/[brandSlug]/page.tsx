'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, Check, Sparkles, Upload, User } from 'lucide-react';
import { DEFAULT_TRYON_CONFIG } from '../../../data/defaults';
import { brandWorkspaceApi } from '../../../services';
import { Product } from '../../../types';
import { SafeImage } from '../../../components/shared/UiPrimitives';
import { BrandLook, resolveBrandLook } from '../../../lib/brand-look';

// Sample photos, one for each choice, used until the shopper uploads their own.
const SAMPLE_PHOTO = {
  female: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  male: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
} as const;

type Gender = 'female' | 'male';

const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const WAIST_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42'];
const price = (n: number) => `৳${n.toLocaleString()}`;

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const sizeRank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s.trim().toUpperCase());
  return i >= 0 ? i : 1000 + (Number(s) || 0);
};

/** A plain sentence about how the garment's size compares with the shopper's own size. */
function fitNote(mine: string, garment: string): string | null {
  if (!mine || !garment) return null;
  const a = SIZE_ORDER.indexOf(mine);
  const b = SIZE_ORDER.indexOf(garment);
  const waist = /^\d+$/.test(mine) && /^\d+$/.test(garment);
  if ((a < 0 || b < 0) && !waist) return null;
  const step = waist ? Number(garment) - Number(mine) : b - a;
  if (step === 0) return 'Same as your size, so it should fit you true to size.';
  const unit = waist ? (Math.abs(step) === 1 ? 'inch' : 'inches') : Math.abs(step) === 1 ? 'size' : 'sizes';
  return step > 0
    ? `${Math.abs(step)} ${unit} bigger than your size, so it will look looser and longer.`
    : `${Math.abs(step)} ${unit} smaller than your size, so it will look tighter and shorter.`;
}

/**
 * Which shoppers a garment is for. The brand chooses this on the product (Women, Men or Both).
 * Older products without a choice fall back to reading their tags and category, and count as both when unclear.
 */
function garmentAudience(p: Product): Gender | 'all' {
  if (p.audience === 'WOMEN') return 'female';
  if (p.audience === 'MEN') return 'male';
  if (p.audience === 'UNISEX') return 'all';
  const text = [...(p.tags || []), p.subCategory || '', p.category || ''].join(' ').toLowerCase();
  if (/\b(unisex|all genders)\b/.test(text)) return 'all';
  if (/\b(women|womens|woman|female|ladies|girls?)\b/.test(text)) return 'female';
  if (/\b(men|mens|man|male|boys?)\b/.test(text)) return 'male';
  return 'all';
}

export default function BrandTryOnPage() {
  const params = useParams();
  const brandSlug = String(params.brandSlug || '');
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [look, setLook] = useState<BrandLook>(() => resolveBrandLook(undefined, {}));
  const [eligibleGarments, setEligibleGarments] = useState<Product[]>([]);
  const [tryOnCfg, setTryOnCfg] = useState(DEFAULT_TRYON_CONFIG);

  // 1. Man or woman, 2. photo + size + garment, 3. generate
  const [gender, setGender] = useState<Gender | ''>('');
  const [size, setSize] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [garmentSizePick, setGarmentSizePick] = useState<{ id: string; value: string } | null>(null);

  const [personImg, setPersonImg] = useState('');
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'processing' | 'done' | 'error'>('ready');
  const [resultUrl, setResultUrl] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    brandWorkspaceApi
      .getPublicTryOnConfig(brandSlug)
      .then((cfg) => {
        if (!cancelled) setTryOnCfg((prev) => ({ ...prev, ...cfg, appearance: { ...prev.appearance, ...cfg.appearance } }));
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, [brandSlug]);

  useEffect(() => {
    async function loadBrand() {
      setLoading(true);
      try {
        const res = await brandWorkspaceApi.getPublicStorefront(brandSlug);
        setBrandName(res.tenant.name);
        setBrandLogo(res.tenant.logoUrl || '');
        setLook(
          resolveBrandLook(res.tenant.storefrontSettings, {
            logo: res.tenant.logoUrl,
            banner: res.tenant.bannerUrl || res.tenant.storefrontSettings?.bannerImage,
          })
        );
        setEligibleGarments(res.products.filter((p) => p.isTryOnEligible && p.brandStorefrontPublished));
        setLoading(false);
        return;
      } catch {
        // Not found / server unavailable
      }
      setNotFoundFlag(true);
      setLoading(false);
    }
    loadBrand();
  }, [brandSlug]);

  // Only the clothes made for the shopper's choice (plus the ones for both). Men never see women's clothes, and women never see men's.
  const garments = useMemo(() => {
    if (!gender) return eligibleGarments;
    return eligibleGarments.filter((p) => {
      const a = garmentAudience(p);
      return a === 'all' || a === gender;
    });
  }, [eligibleGarments, gender]);

  const activeGarment = garments.find((p) => p.id === selectedId);
  const showWaist = activeGarment?.tryOnCategory === 'bottoms';

  // The sizes this garment comes in (sold-out sizes are shown but cannot be chosen).
  const garmentSizes = useMemo(() => {
    const seen = new Map<string, boolean>();
    for (const v of activeGarment?.variants || []) {
      if (!v.size) continue;
      seen.set(v.size, (seen.get(v.size) || false) || (v.stockQuantity ?? 0) > 0);
    }
    return Array.from(seen.entries())
      .map(([name, inStock]) => ({ name, inStock }))
      .sort((a, b) => sizeRank(a.name) - sizeRank(b.name));
  }, [activeGarment]);

  // What is selected: the shopper's tap, otherwise the garment size that matches their own size, otherwise the first one in stock.
  const garmentSize = (() => {
    if (garmentSizes.length === 0) return '';
    const picked = garmentSizePick && garmentSizePick.id === activeGarment?.id ? garmentSizePick.value : '';
    if (picked && garmentSizes.some((g) => g.name === picked && g.inStock)) return picked;
    if (size && garmentSizes.some((g) => g.name === size && g.inStock)) return size;
    return garmentSizes.find((g) => g.inStock)?.name || '';
  })();
  const compare = fitNote(size, garmentSize);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading the try-on page...</div>;
  }

  if (notFoundFlag) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">Try-on page not found</h1>
        <p className="text-xs text-slate-500">There is no brand at <code>/try/{brandSlug}</code>.</p>
      </div>
    );
  }

  if (!tryOnCfg.enabled || !tryOnCfg.publicPageActive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-3 bg-white">
        <h1 className="text-2xl font-bold text-slate-900">Virtual try-on is not available right now</h1>
        <p className="text-sm text-slate-500 max-w-md">{brandName || 'This brand'} has paused its virtual fitting room. Please check back later.</p>
        <Link href={`/brands/${brandSlug}`} className="text-sm font-bold underline">Back to the store</Link>
      </div>
    );
  }

  const accentBtn = { backgroundColor: look.accent, borderColor: look.accent, borderRadius: look.buttonRadius } as const;

  const chooseGender = (g: Gender) => {
    setGender(g);
    setSelectedId('');
    setSize('');
    setPhase('ready');
    setResultUrl('');
    setNotice(null);
  };

  const onUpload = async (file: File) => {
    setUploading(true);
    setNotice(null);
    const up = await brandWorkspaceApi.uploadMediaFile(file);
    setUploading(false);
    if (up.ok && up.url) {
      setPersonImg(up.url);
      setPhase('ready');
    } else {
      setNotice(up.error || 'That photo could not be uploaded. Please try another one.');
    }
  };

  // What is still missing before the picture can be made
  const missing = !personImg ? 'Add your photo' : !size ? 'Choose your size' : !activeGarment ? 'Choose a garment' : garmentSizes.length > 0 && !garmentSize ? 'Choose the garment size' : tryOnCfg.requireConsent && !consent ? 'Accept the privacy note' : '';

  const handleGenerate = async () => {
    if (missing || !activeGarment || !gender) {
      setNotice(missing || 'Something is missing.');
      return;
    }
    setNotice(null);
    setPhase('processing');
    const res = await brandWorkspaceApi.executeTryOn({
      productId: activeGarment.id,
      personImage: personImg,
      garmentImage: activeGarment.image,
      category: activeGarment.tryOnCategory || 'tops',
      gender,
      size,
      ...(garmentSize ? { garmentSize } : {}),
    });
    if (res.mode === 'live_ai' && res.resultUrl) {
      setResultUrl(res.resultUrl);
      setPhase('done');
    } else {
      setPhase('error');
      setNotice(res.message || 'The try-on is not available right now. Please try again soon.');
    }
  };

  const chip = (on: boolean) =>
    `min-w-[48px] text-center px-3.5 py-2.5 rounded-xl border text-sm font-bold ${
      on ? 'border-slate-950 bg-slate-950 text-white' : 'border-stone-200 bg-white text-slate-800 hover:border-slate-400'
    }`;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: look.background, color: look.text }}>
      <header className="bg-white border-b border-stone-200 h-16 px-4 sm:px-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-stone-100">
            <SafeImage src={brandLogo} alt={brandName} fill className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-slate-950">{brandName}</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Virtual Try-On</p>
          </div>
        </div>
        <Link href={`/brands/${brandSlug}`} className="shrink-0 rounded-full border border-stone-200 px-3.5 py-2 text-[13px] font-semibold text-slate-900">
          <span className="hidden sm:inline">Back to {brandName}</span>
          <span className="sm:hidden">Store</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-8 py-8 sm:py-10">
        {!gender ? (
          /* Step 1: only this */
          <div className="mx-auto mt-6 sm:mt-14 max-w-xl text-center">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Who is this for?</h1>
            <p className="mt-2 text-sm sm:text-base opacity-70">Choose one to start.</p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {([['female', 'Women'], ['male', 'Men']] as Array<[Gender, string]>).map(([g, label]) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => chooseGender(g)}
                  className="rounded-[22px] border-2 border-stone-200 bg-white px-4 py-8 sm:py-12 text-lg font-bold text-slate-900 shadow-[0_12px_32px_-18px_rgba(20,20,30,0.18)] transition hover:-translate-y-0.5 hover:border-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                  <User className="mx-auto mb-3 h-12 w-12" strokeWidth={1.4} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">Try it on</h1>
              <button type="button" onClick={() => chooseGender(gender === 'female' ? 'male' : 'female')} className="rounded-full border border-stone-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-900">
                {gender === 'female' ? 'Women' : 'Men'} · Change
              </button>
            </div>

            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
              {/* Left: your photo and your size (the result shows here too) */}
              <section className="space-y-5 rounded-[20px] border border-stone-200 bg-white p-4 text-slate-900 shadow-[0_12px_32px_-18px_rgba(20,20,30,0.18)] sm:p-5 lg:col-span-5">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onUpload(f);
                    e.target.value = '';
                  }}
                />

                {phase === 'done' && resultUrl ? (
                  <div className="space-y-3">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100">
                      <SafeImage src={resultUrl} alt="Your try-on" fill className="object-cover" />
                      <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-md" style={{ color: look.accent }}>
                        <Check className="h-3.5 w-3.5" /> Looks great
                      </span>
                    </div>
                    {activeGarment && <p className="text-[13px] text-slate-500">{activeGarment.name}{garmentSize ? ` · size ${garmentSize}` : ''} · you wear {size}</p>}
                    <div className="flex gap-2.5">
                      <button type="button" onClick={() => { setPhase('ready'); setNotice(null); }} className="flex-1 rounded-full border border-stone-200 bg-white py-3 text-sm font-bold">Try another</button>
                      <Link href={`/brands/${brandSlug}`} style={accentBtn} className="flex-1 border py-3 text-center text-sm font-bold text-white">View in store</Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-base font-bold">1. Your photo</h2>
                      <p className="text-xs text-slate-500">Stand straight, show your whole body, and use good light.</p>
                    </div>
                    <div className={`relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded-2xl text-center ${personImg ? 'bg-stone-100' : 'border-2 border-dashed border-stone-300 bg-stone-50'}`}>
                      {personImg ? (
                        <SafeImage src={personImg} alt="Your photo" fill className="object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2.5 px-6">
                          <User className="h-16 w-16 text-stone-300" strokeWidth={1.2} />
                          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={accentBtn} className="inline-flex items-center gap-2 border px-6 py-3 text-sm font-bold text-white disabled:opacity-60">
                            <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload photo'}
                          </button>
                          <button type="button" onClick={() => setPersonImg(SAMPLE_PHOTO[gender])} className="text-xs text-slate-500 underline">or use a sample photo</button>
                        </div>
                      )}
                      {phase === 'processing' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 text-white">
                          <Sparkles className="h-9 w-9 animate-pulse text-amber-300" />
                          <p className="text-sm font-bold">Creating your look…</p>
                          <p className="text-xs opacity-70">This can take up to a minute.</p>
                        </div>
                      )}
                    </div>
                    {personImg && phase !== 'processing' && (
                      <button type="button" onClick={() => fileRef.current?.click()} className="w-full rounded-full border border-stone-200 bg-white py-2.5 text-[13px] font-bold">Change photo</button>
                    )}

                    <div className="space-y-2 border-t border-stone-100 pt-4">
                      <div>
                        <h2 className="text-base font-bold">2. Your size</h2>
                        <p className="text-xs text-slate-500">The size you usually wear.</p>
                      </div>
                      <div className="flex flex-wrap gap-2" role="group" aria-label="Your size">
                        {LETTER_SIZES.map((s) => (
                          <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)} className={chip(size === s)}>{s}</button>
                        ))}
                      </div>
                      {showWaist && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-xs font-semibold text-slate-600">Or your waist size (inches)</p>
                          <div className="flex flex-wrap gap-2" role="group" aria-label="Your waist size">
                            {WAIST_SIZES.map((s) => (
                              <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)} className={chip(size === s)}>{s}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {tryOnCfg.requireConsent ? (
                      <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-stone-100 p-3 text-xs text-slate-700">
                        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 rounded accent-slate-950" />
                        <span>{tryOnCfg.dataProcessingNotice}</span>
                      </label>
                    ) : (
                      <p className="rounded-xl bg-stone-100 p-3 text-xs text-slate-600">{tryOnCfg.dataProcessingNotice}</p>
                    )}
                  </div>
                )}
              </section>

              {/* Right: all the garments, then Generate */}
              <section className="rounded-[20px] border border-stone-200 bg-white p-5 text-slate-900 shadow-[0_12px_32px_-18px_rgba(20,20,30,0.18)] sm:p-6 lg:col-span-7">
                <h2 className="text-base font-bold">3. Choose a garment</h2>
                <p className="mb-4 mt-0.5 text-xs text-slate-500">Tap the one you want to try on.</p>

                {garments.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">No {gender === 'male' ? "men's" : "women's"} clothes are ready for try-on yet. Please check back soon.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
                    {garments.map((item) => {
                      const sel = selectedId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-pressed={sel}
                          onClick={() => { setSelectedId(item.id); setSize((cur) => (item.tryOnCategory !== 'bottoms' && /^\d+$/.test(cur) ? '' : cur)); }}
                          className={`relative overflow-hidden rounded-2xl border bg-white text-left ${sel ? 'ring-2' : 'border-stone-200'}`}
                          style={sel ? { borderColor: look.accent, ['--tw-ring-color' as string]: look.accent } : undefined}
                        >
                          {sel && (
                            <span className="absolute right-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ backgroundColor: look.accent }}>
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <div className="relative aspect-[4/5] w-full bg-stone-100">
                            <SafeImage src={item.image} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="px-3 py-2.5">
                            <p className="truncate text-[13px] font-bold">{item.name}</p>
                            <p className="text-xs text-slate-500">{price(item.price)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {activeGarment && garmentSizes.length > 0 && (
                  <div className="mt-5 space-y-2 border-t border-stone-200 pt-5">
                    <div>
                      <h3 className="text-sm font-bold">Garment size</h3>
                      <p className="text-xs text-slate-500">The size of {activeGarment.name} you want to try on.</p>
                    </div>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Garment size">
                      {garmentSizes.map((g) => (
                        <button
                          key={g.name}
                          type="button"
                          disabled={!g.inStock}
                          aria-pressed={garmentSize === g.name}
                          onClick={() => setGarmentSizePick({ id: activeGarment.id, value: g.name })}
                          className={`min-w-[48px] rounded-xl border px-3.5 py-2.5 text-center text-sm font-bold ${
                            !g.inStock
                              ? 'cursor-not-allowed border-stone-200 bg-stone-50 text-stone-300 line-through'
                              : garmentSize === g.name
                                ? 'border-slate-950 bg-slate-950 text-white'
                                : 'border-stone-200 bg-white text-slate-800 hover:border-slate-400'
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                    {size && garmentSize && (
                      <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
                        You wear <strong>{size}</strong> and chose garment size <strong>{garmentSize}</strong>.{compare ? ` ${compare}` : ''}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-5 border-t border-stone-200 pt-5">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={Boolean(missing) || phase === 'processing'}
                    style={accentBtn}
                    className="flex w-full items-center justify-center gap-2 border py-4 text-base font-bold text-white disabled:opacity-45"
                  >
                    <Sparkles className="h-5 w-5" /> {phase === 'processing' ? 'Creating your look…' : 'Generate'}
                  </button>
                  <p className="mt-2.5 text-center text-xs text-slate-500">
                    {missing ? `Next: ${missing.toLowerCase()}.` : 'Takes about half a minute. Your photo is kept private.'}
                  </p>
                  {phase === 'error' && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{notice || 'The try-on did not work. Please try again.'}</span>
                    </div>
                  )}
                  {notice && phase !== 'error' && <p className="mt-3 text-center text-xs font-semibold text-rose-600">{notice}</p>}
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
