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

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const sizeRank = (size: string) => SIZE_ORDER.indexOf(size.trim().toUpperCase());
const price = (n: number) => `৳${n.toLocaleString()}`;

const TIPS = ['Stand straight', 'Show your full body', 'Use good light', 'Wear fitted clothes'];

/** Which shoppers a garment is meant for, read from its tags, sub-category and category. */
function garmentAudience(p: Product): Gender | 'all' {
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

  // About you (asked first)
  const [step, setStep] = useState<'about' | 'try'>('about');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [usualSize, setUsualSize] = useState('');

  // Garment choices
  const [selectedId, setSelectedId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sizePick, setSizePick] = useState<{ id: string; value: string } | null>(null);
  const [colorPick, setColorPick] = useState<{ id: string; value: string } | null>(null);

  // Photo and result
  const [personImg, setPersonImg] = useState<string>(SAMPLE_PHOTO.female);
  const [uploadedOwn, setUploadedOwn] = useState(false);
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'processing' | 'done' | 'error'>('ready');
  const [resultUrl, setResultUrl] = useState('');
  const [view, setView] = useState<'photo' | 'result'>('photo');
  const [notice, setNotice] = useState<string | null>(null);

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
        const list = res.products.filter((p) => p.isTryOnEligible && p.brandStorefrontPublished);
        setEligibleGarments(list);
        if (list[0]) setSelectedId(list[0].id);
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

  // Garments meant for the shopper's choice. If the brand did not mark any, show everything.
  const forShopper = useMemo(() => {
    if (!gender) return eligibleGarments;
    const matching = eligibleGarments.filter((p) => {
      const a = garmentAudience(p);
      return a === 'all' || a === gender;
    });
    return matching.length > 0 ? matching : eligibleGarments;
  }, [eligibleGarments, gender]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(forShopper.map((p) => p.category).filter(Boolean)))], [forShopper]);
  const visibleGarments = useMemo(
    () => (categoryFilter === 'All' ? forShopper : forShopper.filter((p) => p.category === categoryFilter)),
    [forShopper, categoryFilter]
  );
  const activeGarment = visibleGarments.find((p) => p.id === selectedId) || visibleGarments[0];

  const variants = useMemo(() => activeGarment?.variants || [], [activeGarment]);
  const sizes = useMemo(() => {
    const seen = new Map<string, boolean>();
    for (const v of variants) {
      if (!v.size) continue;
      seen.set(v.size, (seen.get(v.size) || false) || (v.stockQuantity ?? 0) > 0);
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
    return b > a
      ? `This is ${word} bigger than you usually wear, so it will fit looser.`
      : `This is ${word} smaller than you usually wear, so it will fit tighter.`;
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
        <p className="text-sm text-slate-500 max-w-md">{brandName || 'This brand'} has paused its virtual fitting room. Please check back later.</p>
        <Link href={`/brands/${brandSlug}`} className="text-sm font-bold underline">Back to the store</Link>
      </div>
    );
  }

  const ink = look.text;
  const accentBtn = { backgroundColor: look.accent, borderColor: look.accent, borderRadius: look.buttonRadius } as const;

  const chooseGender = (g: Gender) => {
    setGender(g);
    setCategoryFilter('All');
    if (!uploadedOwn) setPersonImg(SAMPLE_PHOTO[g]);
  };

  const handleGenerate = async () => {
    if (tryOnCfg.requireConsent && !consent) {
      setNotice('Please accept the privacy terms first.');
      setView('photo');
      return;
    }
    if (!activeGarment) return;
    setNotice(null);
    setPhase('processing');
    setView('photo');

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
      setView('result');
    } else {
      setPhase('error');
      setNotice(res.message || 'The try-on is not available right now. Please try again soon.');
    }
  };

  const stepIndex = step === 'about' ? 0 : phase === 'done' ? 3 : uploadedOwn ? 2 : 1;
  const stepLabels = ['About you', 'Your photo', 'Pick & try'];

  const chip = (on: boolean, disabled = false) =>
    `min-w-[46px] text-center px-3 py-2 rounded-xl border text-[13px] font-bold ${
      disabled ? 'border-stone-200 bg-stone-50 text-stone-300 line-through cursor-not-allowed' : on ? 'border-slate-950 bg-slate-950 text-white' : 'border-stone-200 bg-white text-slate-800 hover:border-slate-400'
    }`;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: look.background, color: ink }}>
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

      {look.banner && (
        <div className="relative h-24 sm:h-36 w-full overflow-hidden">
          <SafeImage src={look.banner} alt="" fill className="object-cover" />
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-8 pb-14">
        <div className="pt-8 sm:pt-10 pb-2">
          <h1 className="text-[26px] sm:text-4xl font-extrabold tracking-tight">Try it on, before you buy</h1>
          <p className="mt-1.5 text-sm sm:text-base opacity-70">See how our clothes look on you in about 20 seconds.</p>
          <ol className="mt-5 flex flex-wrap gap-2.5" aria-label="Steps">
            {stepLabels.map((label, i) => {
              const done = i < stepIndex;
              const on = i === stepIndex;
              return (
                <li
                  key={label}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold ${on ? 'text-white' : done ? 'bg-white' : 'bg-white text-slate-500 border-stone-200'}`}
                  style={on ? { backgroundColor: look.accent, borderColor: look.accent } : done ? { color: look.accent, borderColor: '#e7e5e4' } : undefined}
                >
                  <span
                    className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs ${on ? 'bg-white' : done ? 'text-white' : 'bg-stone-200 text-slate-500'}`}
                    style={on ? { color: look.accent } : done ? { backgroundColor: look.accent } : undefined}
                  >
                    {done ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  {label}
                </li>
              );
            })}
          </ol>
        </div>

        {step === 'about' ? (
          <div className="mx-auto mt-6 max-w-xl rounded-[20px] border border-stone-200 bg-white p-6 sm:p-8 text-slate-900 shadow-[0_12px_32px_-18px_rgba(20,20,30,0.18)]">
            <h2 className="text-2xl font-bold tracking-tight">First, tell us about you</h2>
            <p className="mt-1 mb-6 text-sm text-slate-500">This helps us show the right clothes and sizes.</p>

            <label className="mb-5 block">
              <span className="mb-2 block text-[13px] font-bold">Your name <span className="font-semibold text-slate-400">(optional)</span></span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahim" maxLength={40} className="w-full rounded-2xl border border-stone-200 px-4 py-3.5 text-[15px]" />
            </label>

            <div className="mb-5">
              <span className="mb-2 block text-[13px] font-bold">I am looking for</span>
              <div className="grid grid-cols-2 gap-3.5">
                {([['female', 'Women', 'Dresses, tops, kurtas'], ['male', 'Men', 'Shirts, pants, jackets']] as Array<[Gender, string, string]>).map(([g, label, hint]) => {
                  const on = gender === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={on}
                      onClick={() => chooseGender(g)}
                      className={`rounded-[18px] border-[1.5px] px-4 py-4 text-center font-bold ${on ? 'bg-emerald-50/70' : 'border-stone-200 bg-white'}`}
                      style={on ? { borderColor: look.accent, color: look.accent } : undefined}
                    >
                      <User className="mx-auto mb-1.5 h-9 w-9" strokeWidth={1.6} />
                      {label}
                      <span className="mt-0.5 block text-xs font-medium text-slate-500">{hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <span className="mb-2 block text-[13px] font-bold">The size you usually wear <span className="font-semibold text-slate-400">(optional)</span></span>
              <div className="flex flex-wrap gap-2">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                  <button key={s} type="button" aria-pressed={usualSize === s} onClick={() => setUsualSize(usualSize === s ? '' : s)} className={chip(usualSize === s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 rounded-2xl bg-stone-100 p-4">
              <p className="text-[13px] font-bold">Before you start</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-slate-600">
                <li>Stand straight and face the camera</li>
                <li>Show your whole body, head to feet</li>
                <li>Use good light and a plain background</li>
                <li>Wear fitted clothes so the garment looks right</li>
              </ul>
            </div>

            <button type="button" disabled={!gender} onClick={() => setStep('try')} style={accentBtn} className="w-full border py-4 text-base font-bold text-white disabled:opacity-40">
              Continue
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5 mb-5 flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-[13px]" style={{ color: look.accent }}>
              <span>
                {name.trim() ? <>Hi <b>{name.trim()}</b>. </> : null}Showing <b>{gender === 'male' ? "men's" : "women's"}</b> clothes
                {usualSize ? <> · your usual size <b>{usualSize}</b></> : null}
              </span>
              <button type="button" onClick={() => setStep('about')} className="font-bold underline">Change</button>
            </div>

            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
              {/* Left: your photo and the result */}
              <section className="rounded-[20px] border border-stone-200 bg-white p-4 text-slate-900 shadow-[0_12px_32px_-18px_rgba(20,20,30,0.18)] lg:col-span-5">
                <div className="mb-3.5 flex rounded-xl bg-stone-100 p-1" role="tablist">
                  {([['photo', 'Your photo'], ['result', 'Result']] as Array<['photo' | 'result', string]>).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      role="tab"
                      aria-selected={view === k}
                      disabled={k === 'result' && phase !== 'done'}
                      onClick={() => setView(k)}
                      className={`flex-1 rounded-[9px] py-2.5 text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-40 ${view === k ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

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
                      setPhase('ready');
                      setView('photo');
                    }
                  }}
                />

                {view === 'result' && phase === 'done' && resultUrl ? (
                  <div className="space-y-3">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100">
                      <SafeImage src={resultUrl} alt="Your try-on" fill className="object-cover" />
                      <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-md" style={{ color: look.accent }}>
                        <Check className="h-3.5 w-3.5" /> Looks great
                      </span>
                    </div>
                    {activeGarment && (
                      <p className="text-[13px] text-slate-500">
                        {activeGarment.name}{garmentSize ? ` · size ${garmentSize}` : ''}{garmentColor ? ` · ${garmentColor}` : ''}
                      </p>
                    )}
                    <div className="flex gap-2.5">
                      <button type="button" onClick={() => setView('photo')} className="flex-1 rounded-full border border-stone-200 bg-white py-3 text-sm font-bold">Try another</button>
                      <Link href={`/brands/${brandSlug}`} style={accentBtn} className="flex-1 border py-3 text-center text-sm font-bold text-white">View in store</Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded-2xl text-center ${uploadedOwn ? 'bg-stone-100' : 'border-2 border-dashed border-stone-300 bg-stone-50'}`}>
                      {uploadedOwn ? (
                        <SafeImage src={personImg} alt="Your photo" fill className="object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2.5 px-6">
                          <User className="h-20 w-20 text-stone-300" strokeWidth={1.2} />
                          <p className="text-base font-bold">Add your photo</p>
                          <p className="max-w-[16rem] text-[13px] text-slate-500">Drag it here, or choose one from your phone or computer.</p>
                          <button type="button" onClick={() => fileRef.current?.click()} style={accentBtn} className="mt-1 inline-flex items-center gap-2 border px-6 py-3 text-sm font-bold text-white">
                            <Upload className="h-4 w-4" /> Upload photo
                          </button>
                          <button type="button" onClick={() => { setUploadedOwn(true); setPersonImg(SAMPLE_PHOTO[gender || 'female']); }} className="text-xs text-slate-500 underline">
                            or use a sample photo
                          </button>
                        </div>
                      )}
                      {phase === 'processing' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 text-white">
                          <Sparkles className="h-9 w-9 animate-pulse text-amber-300" />
                          <p className="text-sm font-bold">Creating your look…</p>
                        </div>
                      )}
                    </div>

                    {uploadedOwn && phase !== 'processing' && (
                      <button type="button" onClick={() => fileRef.current?.click()} className="mt-3 w-full rounded-full border border-stone-200 bg-white py-2.5 text-[13px] font-bold">
                        Change photo
                      </button>
                    )}

                    {tryOnCfg.requireConsent ? (
                      <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl bg-stone-100 p-3 text-xs text-slate-700">
                        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 rounded accent-slate-950" />
                        <span>{tryOnCfg.dataProcessingNotice}</span>
                      </label>
                    ) : (
                      <p className="mt-3 rounded-xl bg-stone-100 p-3 text-xs text-slate-600">{tryOnCfg.dataProcessingNotice}</p>
                    )}

                    {phase === 'error' && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{notice || 'The try-on did not work. Please try again.'}</span>
                      </div>
                    )}
                    {notice && phase !== 'error' && <p className="mt-3 text-xs font-semibold text-rose-600">{notice}</p>}

                    <div className="mt-3.5 grid grid-cols-2 gap-2">
                      {TIPS.map((t, i) => (
                        <div key={t} className="flex items-center gap-2 rounded-xl bg-stone-100 px-2.5 py-2 text-xs text-slate-600">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold" style={{ color: look.accent }}>{i + 1}</span>
                          {t}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* Right: choose a garment */}
              <section className="rounded-[20px] border border-stone-200 bg-white p-5 text-slate-900 shadow-[0_12px_32px_-18px_rgba(20,20,30,0.18)] sm:p-6 lg:col-span-7">
                <h2 className="text-xl font-bold tracking-tight">Choose a garment</h2>
                <p className="mb-3.5 mt-0.5 text-[13px] text-slate-500">Tap one, then pick your size and colour.</p>

                {categories.length > 2 && (
                  <div className="mb-3.5 flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button key={c} type="button" aria-pressed={categoryFilter === c} onClick={() => setCategoryFilter(c)} className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${categoryFilter === c ? 'border-slate-950 bg-slate-950 text-white' : 'border-stone-200 bg-white text-slate-700'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                {visibleGarments.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">No clothes are ready for try-on yet. Please check back soon.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
                    {visibleGarments.map((item) => {
                      const sel = activeGarment?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-pressed={sel}
                          onClick={() => setSelectedId(item.id)}
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

                {activeGarment && (
                  <div className="mt-5 space-y-4 border-t border-stone-200 pt-5">
                    {sizes.length > 0 && (
                      <div>
                        <p className="mb-2 flex justify-between text-[13px] font-bold">Size <span className="font-semibold text-slate-500">{activeGarment.name}</span></p>
                        <div className="flex flex-wrap gap-2">
                          {sizes.map(({ size, inStock }) => (
                            <button key={size} type="button" disabled={!inStock} aria-pressed={garmentSize === size} onClick={() => setSizePick({ id: activeGarment.id, value: size })} className={chip(garmentSize === size, !inStock)}>
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {colours.length > 0 && (
                      <div>
                        <p className="mb-2 flex justify-between text-[13px] font-bold">Colour <span className="font-semibold text-slate-500">{garmentColor}</span></p>
                        <div className="flex gap-2.5">
                          {colours.map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              title={c.color}
                              aria-label={c.color}
                              aria-pressed={garmentColor === c.color}
                              onClick={() => setColorPick({ id: activeGarment.id, value: c.color })}
                              className="h-[30px] w-[30px] rounded-full border-[3px] border-white"
                              style={{ backgroundColor: c.hex || '#e2e8f0', boxShadow: garmentColor === c.color ? `0 0 0 2px ${look.accent}` : '0 0 0 1.5px #e7e5e4' }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {sizeHint && <div className="rounded-xl bg-amber-50 px-3.5 py-3 text-[13px] text-amber-900">{sizeHint}</div>}

                    <div>
                      <button type="button" onClick={handleGenerate} disabled={phase === 'processing' || !uploadedOwn} style={accentBtn} className="flex w-full items-center justify-center gap-2 border py-4 text-base font-bold text-white disabled:opacity-45">
                        <Sparkles className="h-5 w-5" /> Try it on
                      </button>
                      <p className="mt-2.5 text-center text-xs text-slate-500">
                        {uploadedOwn ? 'Takes about 20 seconds. Your photo is kept private.' : 'Add your photo on the left first.'}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
