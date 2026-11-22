'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, CheckCircle, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { DEFAULT_TRYON_CONFIG } from '../../../data/defaults';
import { brandWorkspaceApi } from '../../../services';
import { Product } from '../../../types';
import { SafeImage } from '../../../components/shared/UiPrimitives';
import { Button } from '../../../components/ui/button';
import { BrandLook, resolveBrandLook } from '../../../lib/brand-look';
import { layoutIdFor } from '../../../lib/try-on-layouts';

// Sample photos, one for each choice, used until the shopper uploads their own.
const SAMPLE_PHOTO = {
  female:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  male: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
} as const;

type Gender = 'female' | 'male';

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const sizeRank = (size: string) => SIZE_ORDER.indexOf(size.trim().toUpperCase());

const TIPS = [
  'Stand straight and face the camera.',
  'Show your whole body, head to feet.',
  'Use good light and a plain background.',
  'Wear fitted clothes so the garment looks right.',
];

/** Which shoppers a garment is meant for, read from its tags, sub-category and category. */
function garmentAudience(p: Product): Gender | 'all' {
  const text = [...(p.tags || []), p.subCategory || '', p.category || ''].join(' ').toLowerCase();
  if (/\b(unisex|all genders)\b/.test(text)) return 'all';
  if (/\b(women|womens|woman|female|ladies|girls?)\b/.test(text)) return 'female';
  if (/\b(men|mens|man|male|boys?)\b/.test(text)) return 'male';
  return 'all';
}

export default function DedicatedBrandPublicTryOnPage() {
  const params = useParams();
  const brandSlug = String(params.brandSlug || '');
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [look, setLook] = useState<BrandLook>(() => resolveBrandLook(undefined, {}));
  const [eligibleGarments, setEligibleGarments] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  // About you (asked first)
  const [step, setStep] = useState<'about' | 'try'>('about');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [usualSize, setUsualSize] = useState('');

  // The garment choices
  // What the shopper tapped, remembered per garment. The defaults below fill in anything not chosen yet.
  const [sizePick, setSizePick] = useState<{ id: string; value: string } | null>(null);
  const [colorPick, setColorPick] = useState<{ id: string; value: string } | null>(null);

  // The photo and the result
  const [personImg, setPersonImg] = useState<string>(SAMPLE_PHOTO.female);
  const [uploadedOwn, setUploadedOwn] = useState(false);
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'processing' | 'done' | 'error'>('ready');
  const [resultUrl, setResultUrl] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // The brand's saved try-on settings (look, consent text, on/off). Defaults apply until they load.
  const [tryOnCfg, setTryOnCfg] = useState(DEFAULT_TRYON_CONFIG);
  const appearance = tryOnCfg.appearance;
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
    async function loadBrandScope() {
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
        const list = res.products.filter((p) => p.isTryOnEligible && p.brandStorefrontPublished);
        setEligibleGarments(list);
        if (list[0]) setSelectedId(list[0].id);
        setLoading(false);
        return;
      } catch {
        // Not found / backend unavailable
      }

      setNotFoundFlag(true);
      setLoading(false);
    }
    loadBrandScope();
  }, [brandSlug]);

  // Garments meant for the shopper's choice. If the brand did not mark any, show everything.
  const visibleGarments = useMemo(() => {
    if (!gender) return eligibleGarments;
    const matching = eligibleGarments.filter((p) => {
      const a = garmentAudience(p);
      return a === 'all' || a === gender;
    });
    return matching.length > 0 ? matching : eligibleGarments;
  }, [eligibleGarments, gender]);

  const activeGarment = visibleGarments.find((p) => p.id === selectedId) || visibleGarments[0];

  const variants = useMemo(() => activeGarment?.variants || [], [activeGarment]);
  const sizes = useMemo(() => {
    const seen = new Map<string, boolean>();
    for (const v of variants) {
      if (!v.size) continue;
      const inStock = (v.stockQuantity ?? 0) > 0;
      seen.set(v.size, (seen.get(v.size) || false) || inStock);
    }
    return Array.from(seen.entries())
      .map(([size, inStock]) => ({ size, inStock }))
      .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
  }, [variants]);
  const colours = useMemo(() => {
    const seen = new Map<string, { color: string; hex?: string; image?: string }>();
    for (const v of variants) {
      if (v.color && !seen.has(v.color)) seen.set(v.color, { color: v.color, hex: v.colorHex, image: v.imageUrl });
    }
    return Array.from(seen.values());
  }, [variants]);

  const garmentSize =
    sizePick && sizePick.id === activeGarment?.id && sizes.some((s) => s.size === sizePick.value && s.inStock)
      ? sizePick.value
      : sizes.find((s) => s.inStock)?.size || sizes[0]?.size || '';
  const garmentColor =
    colorPick && colorPick.id === activeGarment?.id && colours.some((c) => c.color === colorPick.value)
      ? colorPick.value
      : colours[0]?.color || '';

  const sizeHint = useMemo(() => {
    if (!usualSize || !garmentSize) return null;
    const a = sizeRank(usualSize);
    const b = sizeRank(garmentSize);
    if (a < 0 || b < 0) return null;
    if (a === b) return 'This is the size you usually wear.';
    const n = Math.abs(b - a);
    const word = `${n} size${n === 1 ? '' : 's'}`;
    return b > a ? `This is ${word} bigger than you usually wear, so it will fit looser.` : `This is ${word} smaller than you usually wear, so it will fit tighter.`;
  }, [usualSize, garmentSize]);

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
        <p className="text-sm text-slate-500 max-w-md">
          {brandName || 'This brand'} has paused its virtual fitting room. Please check back later.
        </p>
        <Link href={`/brands/${brandSlug}`} className="text-sm font-bold underline">
          Back to the store
        </Link>
      </div>
    );
  }

  // The page design the brand picked (Look & Feel). Classic is the side-by-side page.
  const design = layoutIdFor(appearance.previewLayout, appearance.gridStyle);
  const wide = design === 'showcase' || design === 'editorial';
  const garmentGrid =
    design === 'grid'
      ? 'grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1'
      : design === 'showcase'
        ? 'grid grid-cols-2 sm:grid-cols-4 gap-3'
        : design === 'editorial'
          ? 'grid grid-cols-2 sm:grid-cols-3 gap-4'
          : 'space-y-2 max-h-80 overflow-y-auto pr-1';

  const chooseGender = (g: Gender) => {
    setGender(g);
    if (!uploadedOwn) setPersonImg(SAMPLE_PHOTO[g]);
  };

  const canContinue = Boolean(gender);

  const handleGenerate = async () => {
    if (tryOnCfg.requireConsent && !consent) {
      setStatusNotice('Please accept the privacy terms first.');
      return;
    }
    if (!activeGarment) return;
    setStatusNotice(null);
    setPhase('processing');

    const colourPhoto = colours.find((c) => c.color === garmentColor)?.image;
    const res = await brandWorkspaceApi.executeTryOn({
      productId: activeGarment.id,
      personImage: personImg,
      garmentImage: colourPhoto || activeGarment.image,
      category: activeGarment.tryOnCategory || 'tops',
    });

    if (res.mode === 'live_ai' && res.resultUrl) {
      setResultUrl(res.resultUrl);
      setPhase('done');
    } else {
      setPhase('error');
      setStatusNotice(res.message || 'The try-on is not available right now. Please try again soon.');
    }
  };

  const chip = (selected: boolean, disabled = false) =>
    `px-3 py-1.5 rounded-full border text-xs font-bold ${
      disabled
        ? 'border-slate-200 text-slate-300 line-through cursor-not-allowed'
        : selected
          ? 'border-slate-950 bg-slate-950 text-white'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
    }`;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: look.background, color: look.text }}>
      <header className="bg-white border-b border-slate-200 px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-slate-200 shrink-0">
            <SafeImage src={brandLogo} alt={brandName} fill className="object-cover" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs sm:text-sm text-slate-950 block truncate">{brandName}</span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider truncate block">Virtual Try-On</span>
          </div>
        </div>
        <Link href={`/brands/${brandSlug}`} className="text-[11px] sm:text-xs font-bold underline text-slate-800 whitespace-nowrap shrink-0">
          <span className="hidden sm:inline">Back to {brandName}</span>
          <span className="sm:hidden">Store</span>
        </Link>
      </header>

      {look.banner && (
        <div className="relative h-24 sm:h-40 w-full overflow-hidden">
          <SafeImage src={look.banner} alt="" fill className="object-cover" />
        </div>
      )}

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8 w-full flex-1 space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-3xl font-extrabold" style={{ color: look.text }}>{appearance.pageTitle}</h1>
          <p className="text-xs sm:text-sm opacity-70">{appearance.pageDescription}</p>
        </div>

        {step === 'about' ? (
          <div className="max-w-xl rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 space-y-5 text-slate-900">
            <div>
              <h2 className="font-bold text-base">First, tell us about you</h2>
              <p className="text-xs text-slate-500 mt-0.5">This helps us show the right garments and sizes.</p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold">Your name (optional)</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahim"
                maxLength={40}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </label>

            <div className="space-y-1.5">
              <span className="text-xs font-bold">I am looking for *</span>
              <div className="flex gap-2">
                {([['female', 'Women'], ['male', 'Men']] as Array<[Gender, string]>).map(([g, label]) => (
                  <button key={g} type="button" aria-pressed={gender === g} onClick={() => chooseGender(g)} className={`flex-1 py-2.5 rounded-xl border text-sm font-bold ${gender === g ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold">The size you usually wear (optional)</span>
              <div className="flex flex-wrap gap-2">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                  <button key={s} type="button" aria-pressed={usualSize === s} onClick={() => setUsualSize(usualSize === s ? '' : s)} className={chip(usualSize === s)}>
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">We use this to tell you if a size will fit tighter or looser.</p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5">
              <p className="text-xs font-bold">Before you start</p>
              <ul className="space-y-1 text-[11px] text-slate-600 list-disc pl-4">
                {TIPS.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setStep('try')}
              style={{ backgroundColor: look.accent, borderRadius: look.buttonRadius }}
              className="w-full py-3 text-white text-xs font-bold disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700">
              <span>
                {name.trim() ? `Hi ${name.trim()}. ` : ''}Showing <strong>{gender === 'male' ? "men's" : "women's"}</strong> garments
                {usualSize ? <> · your usual size <strong>{usualSize}</strong></> : null}
              </span>
              <button type="button" onClick={() => setStep('about')} className="font-bold underline">
                Change
              </button>
            </div>

            <div className={`grid grid-cols-1 gap-4 sm:gap-6 items-start ${wide ? '' : 'lg:grid-cols-12'}`}>
              {/* 1. Upload your photo (the result shows here too) */}
              <div className={`${wide ? 'w-full max-w-xl mx-auto' : 'lg:col-span-5'} rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 space-y-4 text-slate-900`}>
                <h2 className="font-bold text-sm">1. Upload your photo</h2>
                <p className="text-xs text-slate-500">{appearance.uploadInstructions}</p>

                {phase === 'processing' ? (
                  <div className="aspect-[3/4] rounded-2xl bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-2">
                    <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
                    <p className="text-sm font-bold">{appearance.loadingText}</p>
                  </div>
                ) : phase === 'done' && resultUrl ? (
                  <div className="space-y-2">
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-emerald-300">
                      <SafeImage src={resultUrl} alt="Your try-on" fill className="object-cover" />
                    </div>
                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> {appearance.successText}
                    </p>
                    {activeGarment && (
                      <p className="text-[11px] text-slate-500">
                        {activeGarment.name}
                        {garmentSize ? ` · size ${garmentSize}` : ''}
                        {garmentColor ? ` · ${garmentColor}` : ''}
                      </p>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { setPhase('ready'); setStatusNotice(null); }}>
                      {appearance.retryBtnText}
                    </Button>
                  </div>
                ) : phase === 'error' ? (
                  <div className="aspect-[3/4] rounded-2xl bg-rose-50/50 border border-rose-200 p-6 flex flex-col items-center justify-center text-center space-y-2 text-xs">
                    <AlertTriangle className="w-8 h-8 text-rose-600" />
                    <p className="font-bold text-slate-900">{appearance.errorText}</p>
                    {statusNotice && <p className="text-slate-500">{statusNotice}</p>}
                    <Button size="sm" variant="outline" onClick={() => { setPhase('ready'); setStatusNotice(null); }}>
                      {appearance.retryBtnText}
                    </Button>
                  </div>
                ) : (
                  <>
                    {tryOnCfg.requireConsent ? (
                      <label className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 rounded accent-slate-950" />
                        <span>{tryOnCfg.dataProcessingNotice}</span>
                      </label>
                    ) : (
                      <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">{tryOnCfg.dataProcessingNotice}</p>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const up = await brandWorkspaceApi.uploadMediaFile(f);
                        if (up.ok && up.url) {
                          setPersonImg(up.url);
                          setUploadedOwn(true);
                        }
                      }}
                    />
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      <SafeImage src={personImg} alt="Your photo" fill className="object-cover" />
                    </div>
                    {!uploadedOwn && <p className="text-[11px] text-slate-500">This is a sample photo. Upload your own for a real try-on.</p>}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="flex-1 min-w-[140px] gap-1.5">
                        <Upload className="w-3.5 h-3.5" /> {appearance.uploadBtnText}
                      </Button>
                      {uploadedOwn && gender && (
                        <Button size="sm" variant="outline" onClick={() => { setPersonImg(SAMPLE_PHOTO[gender]); setUploadedOwn(false); }}>
                          Use sample
                        </Button>
                      )}
                    </div>
                    {statusNotice && <p className="text-xs font-semibold text-rose-600">{statusNotice}</p>}
                  </>
                )}
              </div>

              {/* 2. Select a garment, with its size and colour */}
              <div className={`${wide ? 'w-full' : 'lg:col-span-7'} rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 space-y-4 text-slate-900`}>
                <h2 className="font-bold text-sm flex items-center justify-between">
                  <span>2. Choose a garment</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </h2>

                {visibleGarments.length === 0 ? (
                  <p className="text-xs text-slate-500">No garments are ready for try-on yet. Please check back soon.</p>
                ) : (
                  <div className={`${garmentGrid} text-xs`}>
                    {visibleGarments.map((item) =>
                      design === 'classic' ? (
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
                              {appearance.showPrices ? `৳${item.price} • ` : ''}{item.category}
                            </p>
                          </div>
                        </button>
                      ) : (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className={`text-left rounded-xl border overflow-hidden bg-white ${
                            activeGarment?.id === item.id ? 'border-slate-950 ring-2 ring-slate-950/20' : 'border-slate-200'
                          }`}
                        >
                          <div className={`relative w-full ${design === 'editorial' ? 'aspect-[3/4]' : 'aspect-[4/5]'} bg-slate-100`}>
                            <SafeImage src={item.image} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="p-2.5">
                            <p className={`truncate text-slate-900 ${design === 'editorial' ? 'font-bold text-sm' : 'font-semibold'}`}>{item.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {appearance.showPrices ? `৳${item.price} • ` : ''}{item.category}
                            </p>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                )}

                {activeGarment && (sizes.length > 0 || colours.length > 0) && (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                    {sizes.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold">Size</p>
                        <div className="flex flex-wrap gap-2">
                          {sizes.map(({ size, inStock }) => (
                            <button key={size} type="button" disabled={!inStock} aria-pressed={garmentSize === size} onClick={() => setSizePick({ id: activeGarment.id, value: size })} className={chip(garmentSize === size, !inStock)}>
                              {size}
                            </button>
                          ))}
                        </div>
                        {sizeHint && <p className="text-[11px] text-slate-600">{sizeHint}</p>}
                      </div>
                    )}
                    {colours.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold">Colour{garmentColor ? `: ${garmentColor}` : ''}</p>
                        <div className="flex flex-wrap gap-2">
                          {colours.map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              aria-label={c.color}
                              aria-pressed={garmentColor === c.color}
                              onClick={() => setColorPick({ id: activeGarment.id, value: c.color })}
                              className={`h-7 w-7 rounded-full border-2 ${garmentColor === c.color ? 'border-slate-950' : 'border-slate-200'}`}
                              style={{ backgroundColor: c.hex || '#e2e8f0' }}
                              title={c.color}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!activeGarment || phase === 'processing'}
                  style={{ backgroundColor: look.accent, borderRadius: look.buttonRadius }}
                  className="w-full py-3 text-white text-xs font-bold flex items-center justify-center gap-2 shadow disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  {appearance.generateBtnText}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
