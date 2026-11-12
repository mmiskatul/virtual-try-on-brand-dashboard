'use client';

import React, { useMemo, useRef } from 'react';
import {
  ArrowLeftRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Layout,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  STOREFRONT_HEADER_STYLES,
  StorefrontHeaderStyle,
} from '../../features/onboarding/onboardingPresets';

export type ShowcaseAssetSlot = 'logo' | 'banner' | 'lightLogo' | 'socialImage';

export const DESIGN_LAYOUT_GUIDANCE: Record<
  StorefrontHeaderStyle,
  {
    primarySlots: ShowcaseAssetSlot[];
    summary: string;
    heroUsesBanner: boolean;
    usesLightWatermark: boolean;
  }
> = {
  split: {
    primarySlots: ['logo', 'banner', 'socialImage', 'lightLogo'],
    summary: 'Editorial Split places your Brand Name & CTA left and your Showcase Banner right.',
    heroUsesBanner: true,
    usesLightWatermark: false,
  },
  'split-reverse': {
    primarySlots: ['banner', 'logo', 'socialImage', 'lightLogo'],
    summary: 'Mirrored Split leads with your Showcase Banner on the left and Brand Story right.',
    heroUsesBanner: true,
    usesLightWatermark: false,
  },
  minimal: {
    primarySlots: ['logo', 'socialImage', 'lightLogo', 'banner'],
    summary: 'Clean Typography leads with header emblem Logo, accent rule, and product grid—no heavy hero banner required.',
    heroUsesBanner: false,
    usesLightWatermark: false,
  },
  centered: {
    primarySlots: ['logo', 'socialImage', 'lightLogo', 'banner'],
    summary: 'Centered Atelier places your circular Emblem Logo and headline above a subtle tinted backdrop.',
    heroUsesBanner: false,
    usesLightWatermark: false,
  },
  cover: {
    primarySlots: ['banner', 'logo', 'lightLogo', 'socialImage'],
    summary: 'Full Cover Hero stretches your Hero Banner edge-to-edge behind your Brand Emblem Logo.',
    heroUsesBanner: true,
    usesLightWatermark: true,
  },
  magazine: {
    primarySlots: ['banner', 'logo', 'socialImage', 'lightLogo'],
    summary: 'Lookbook Editorial pairs an oversized masthead with a wide horizontal editorial photo frame.',
    heroUsesBanner: true,
    usesLightWatermark: false,
  },
  'grid-showcase': {
    primarySlots: ['banner', 'logo', 'socialImage', 'lightLogo'],
    summary: 'Bento Boutique pairs a gradient brand story tile beside a structured feature photo tile.',
    heroUsesBanner: true,
    usesLightWatermark: false,
  },
  'noir-boutique': {
    primarySlots: ['lightLogo', 'banner', 'logo', 'socialImage'],
    summary: 'Runway Noir Stage highlights a Light Watermark Logo on dark slate alongside a framed runway hero.',
    heroUsesBanner: true,
    usesLightWatermark: true,
  },
};

const PREVIEW_CATALOG_ITEMS = [
  { name: 'Structured Linen Blazer', price: '৳3,850', tag: 'New' },
  { name: 'Cotton Pleat Shirt', price: '৳1,950', tag: 'Try-On' },
  { name: 'Tailored Wide Trousers', price: '৳2,450', tag: 'Popular' },
] as const;

export interface ShopMockupPreviewProps {
  styleId: StorefrontHeaderStyle;
  brandName: string;
  storefrontTitle: string;
  slogan: string;
  announcement: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor: string;
  backgroundColor?: string;
  textColor?: string;
  headingFont?: string;
  bodyFont?: string;
  buttonStyle?: 'pill' | 'rounded' | 'square';
  logoUrl: string;
  lightLogoUrl?: string;
  bannerUrl: string;
  uploadingSlot?: ShowcaseAssetSlot | null;
  onUploadSlot?: (slot: ShowcaseAssetSlot) => void;
  onRemoveSlot?: (slot: ShowcaseAssetSlot) => void;
}

export function ShopDesignThumbnail({
  styleId,
  brandName,
  primaryColor,
  accentColor,
  logoUrl,
  bannerUrl,
}: Pick<
  ShopMockupPreviewProps,
  'styleId' | 'brandName' | 'primaryColor' | 'accentColor' | 'logoUrl' | 'bannerUrl'
>) {
  const initial = (brandName.trim() || 'B').charAt(0).toUpperCase();
  const displayName = brandName.trim() || 'Your Shop';

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] text-slate-900">
      <div className="px-2 py-1 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        </div>
        <span className="text-[8px] font-semibold text-slate-500 truncate max-w-[110px]">
          {displayName}
        </span>
      </div>

      <div className="px-2 py-1.5 border-b border-slate-100 flex items-center justify-between gap-1 bg-white">
        <div className="flex items-center gap-1 min-w-0">
          <span className="w-3.5 h-3.5 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center text-[7px] font-bold shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </span>
          <span className="text-[8px] font-bold truncate uppercase">{displayName}</span>
        </div>
        <span
          className="px-1.5 py-0.5 rounded-full text-[7px] font-bold text-white shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          Try-On
        </span>
      </div>

      {styleId === 'split' && (
        <div className="p-2 space-y-2 bg-slate-50/50">
          <div className="grid grid-cols-12 gap-1.5 items-center bg-white rounded-lg p-1.5 border border-slate-100">
            <div className="col-span-7 space-y-1">
              <span
                className="inline-block h-1.5 w-8 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <p className="text-[9px] font-extrabold leading-tight text-slate-900 truncate">
                {displayName}
              </p>
              <span
                className="inline-block px-1.5 py-0.5 rounded text-[7px] font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Shop Now
              </span>
            </div>
            <div
              className="col-span-5 h-11 rounded-md overflow-hidden border border-slate-200"
              style={{ backgroundColor: `${primaryColor}18` }}
            >
              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full opacity-85"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="rounded-md bg-white border border-slate-100 p-1 space-y-1">
                <div className="h-7 rounded bg-slate-100" />
                <div className="h-1 w-full rounded bg-slate-200" />
                <div className="h-1 w-6 rounded bg-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {styleId === 'minimal' && (
        <div className="bg-white border-t-2 p-2 space-y-2" style={{ borderTopColor: primaryColor }}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="space-y-0.5 min-w-0">
              <p className="text-[9px] font-black tracking-tight text-slate-950 truncate">
                {displayName} Studio
              </p>
              <div className="flex gap-1">
                <span className="px-1 py-0.5 rounded bg-slate-900 text-white text-[6px] font-bold">
                  All
                </span>
                <span className="px-1 py-0.5 rounded bg-slate-100 text-slate-600 text-[6px]">
                  New
                </span>
              </div>
            </div>
            <span
              className="w-4 h-4 rounded-md shrink-0"
              style={{ backgroundColor: `${primaryColor}20` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[0, 1].map((idx) => (
              <div key={idx} className="space-y-1">
                <div className="h-12 rounded-lg bg-slate-100 border border-slate-200/70" />
                <div className="flex justify-between items-center">
                  <span className="h-1 w-8 rounded bg-slate-300" />
                  <span
                    className="h-1.5 w-4 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {styleId === 'centered' && (
        <div className="bg-white">
          <div
            className="px-2 py-2.5 text-center space-y-1"
            style={{ background: `linear-gradient(180deg, ${primaryColor}16 0%, #ffffff 100%)` }}
          >
            <div className="w-5 h-5 mx-auto rounded-full overflow-hidden border border-white shadow-sm bg-white flex items-center justify-center text-[8px] font-extrabold">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <p className="text-[9px] font-extrabold text-slate-950 truncate">{displayName}</p>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[6px] font-bold text-white"
              style={{ backgroundColor: accentColor }}
            >
              Boutique Collection
            </span>
          </div>
          <div className="px-2 pb-2 grid grid-cols-3 gap-1">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="rounded-lg bg-slate-50 border border-slate-100 p-1 space-y-1">
                <div className="h-7 rounded-md bg-slate-200/70" />
                <div className="h-2 rounded text-center" style={{ backgroundColor: primaryColor }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {styleId === 'cover' && (
        <div className="bg-white">
          <div
            className="relative h-14 px-2 pb-1.5 flex items-end overflow-hidden text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
            <div className="relative z-10 flex items-center gap-1 min-w-0">
              <span className="w-4 h-4 rounded bg-white text-slate-950 text-[7px] font-extrabold flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </span>
              <p className="text-[8px] font-extrabold truncate">{displayName}</p>
            </div>
          </div>
          <div className="p-2 grid grid-cols-3 gap-1">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="rounded border border-slate-200 p-1 space-y-1">
                <div className="h-6 rounded-sm bg-slate-100" />
                <div className="h-1 w-full rounded bg-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {styleId === 'split-reverse' && (
        <div className="p-2 space-y-2 bg-slate-50/50">
          <div className="grid grid-cols-12 gap-1.5 items-center bg-white rounded-lg p-1.5 border border-slate-100">
            <div
              className="col-span-5 h-11 rounded-md overflow-hidden border border-slate-200"
              style={{ backgroundColor: `${primaryColor}18` }}
            >
              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full opacity-85"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})` }}
                />
              )}
            </div>
            <div className="col-span-7 space-y-1 text-right">
              <div
                className="inline-block px-1.5 py-0.5 rounded-full text-[6px] font-bold text-white"
                style={{ backgroundColor: accentColor }}
              >
                Mirrored
              </div>
              <p className="text-[9px] font-extrabold leading-tight text-slate-900 truncate">
                {displayName}
              </p>
              <span
                className="inline-block px-1.5 py-0.5 rounded text-[7px] font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Explore
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="rounded-md bg-white border border-slate-100 p-1 space-y-1">
                <div className="h-7 rounded bg-slate-100" />
                <div className="h-1 w-full rounded bg-slate-200" />
                <div className="h-1 w-6 rounded bg-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {styleId === 'magazine' && (
        <div className="bg-[#FAF9F6] p-2 space-y-1.5">
          <div className="flex items-end justify-between border-b border-slate-200 pb-1">
            <p className="text-[9px] font-black uppercase tracking-tight text-slate-950 truncate">
              {displayName}
            </p>
            <span className="text-[6px] font-bold uppercase" style={{ color: accentColor }}>
              Issue 01
            </span>
          </div>
          <div className="h-10 rounded-md overflow-hidden border border-slate-200 bg-white">
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full"
                style={{ background: `linear-gradient(120deg, ${primaryColor}, ${accentColor})` }}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="h-4 rounded bg-white border border-slate-200" />
            <div className="h-4 rounded bg-white border border-slate-200" />
          </div>
        </div>
      )}

      {styleId === 'grid-showcase' && (
        <div className="bg-white p-2 space-y-1.5">
          <div className="grid grid-cols-12 gap-1.5">
            <div
              className="col-span-6 rounded-md p-1.5 text-white flex flex-col justify-between h-14"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
            >
              <span className="text-[6px] uppercase font-bold opacity-80">Bento</span>
              <p className="text-[8px] font-extrabold leading-tight truncate">{displayName}</p>
            </div>
            <div className="col-span-6 grid grid-rows-2 gap-1 h-14">
              <div className="rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                {bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ backgroundColor: `${primaryColor}20` }} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="rounded bg-slate-100" />
                <div className="rounded" style={{ backgroundColor: `${accentColor}30` }} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="h-5 rounded bg-slate-50 border border-slate-100" />
            ))}
          </div>
        </div>
      )}

      {styleId === 'noir-boutique' && (
        <div className="bg-slate-950 text-white p-2 space-y-1.5">
          <div className="flex items-center justify-between gap-1.5 rounded-md bg-white/5 border border-white/10 p-1.5">
            <div className="min-w-0 space-y-1">
              <span
                className="inline-block px-1.5 py-0.5 rounded-full text-[6px] font-bold uppercase text-white"
                style={{ backgroundColor: accentColor }}
              >
                Noir
              </span>
              <p className="text-[9px] font-extrabold truncate">{displayName}</p>
            </div>
            <div className="w-10 h-9 rounded overflow-hidden border border-white/15 shrink-0 bg-slate-900">
              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="rounded bg-white/10 border border-white/10 p-1 space-y-1">
                <div className="h-5 rounded-sm bg-white/15" />
                <div className="h-1 w-full rounded bg-white/30" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface StorefrontDesignCarouselProps {
  selectedStyle: StorefrontHeaderStyle;
  onSelectStyle: (styleId: StorefrontHeaderStyle) => void;
  brandName: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  bannerUrl: string;
  headingText?: string;
}

export function StorefrontDesignCarousel({
  selectedStyle,
  onSelectStyle,
  brandName,
  primaryColor,
  accentColor,
  logoUrl,
  bannerUrl,
  headingText = 'Choose How Your Shop Should Look (Swap Left ↔ Right Across 8 UI Designs)',
}: StorefrontDesignCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const activeIndex = useMemo(() => {
    const idx = STOREFRONT_HEADER_STYLES.findIndex((item) => item.id === selectedStyle);
    return idx >= 0 ? idx : 0;
  }, [selectedStyle]);

  const scrollToIndex = (index: number) => {
    const container = carouselRef.current;
    if (!container) return;
    const cards = container.querySelectorAll<HTMLElement>('[data-design-card="true"]');
    const targetCard = cards[index];
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handleSelect = (styleId: StorefrontHeaderStyle, index?: number) => {
    onSelectStyle(styleId);
    const resolved =
      typeof index === 'number'
        ? index
        : STOREFRONT_HEADER_STYLES.findIndex((item) => item.id === styleId);
    if (resolved >= 0) scrollToIndex(resolved);
  };

  const handleSwap = (direction: 'left' | 'right') => {
    const total = STOREFRONT_HEADER_STYLES.length;
    const nextIdx =
      direction === 'left'
        ? (activeIndex - 1 + total) % total
        : (activeIndex + 1) % total;
    const nextOption = STOREFRONT_HEADER_STYLES[nextIdx];
    if (nextOption) handleSelect(nextOption.id, nextIdx);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5" />
            {headingText}
          </p>
          <p className="text-[11px] text-slate-500">
            Selected ({activeIndex + 1} of {STOREFRONT_HEADER_STYLES.length}):{' '}
            <strong className="text-slate-900">
              {STOREFRONT_HEADER_STYLES[activeIndex]?.label}
            </strong>{' '}
            — {STOREFRONT_HEADER_STYLES[activeIndex]?.tagline}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(selectedStyle === 'split' || selectedStyle === 'split-reverse') && (
            <button
              type="button"
              onClick={() =>
                handleSelect(selectedStyle === 'split' ? 'split-reverse' : 'split')
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-bold text-slate-800 transition-colors"
              title="Swap hero text and photo between left and right"
            >
              <ArrowLeftRight className="w-3 h-3" />
              Swap Left ↔ Right
            </button>
          )}
          <button
            type="button"
            aria-label="Swap previous design left"
            onClick={() => handleSwap('left')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-bold text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>
          <button
            type="button"
            aria-label="Swap next design right"
            onClick={() => handleSwap('right')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-950 bg-slate-950 hover:bg-slate-800 text-[11px] font-bold text-white transition-colors"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={carouselRef}
        className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-1 px-1"
      >
        {STOREFRONT_HEADER_STYLES.map((option, idx) => {
          const selected = selectedStyle === option.id;
          return (
            <button
              key={option.id}
              data-design-card="true"
              type="button"
              onClick={() => handleSelect(option.id, idx)}
              className={`w-[225px] sm:w-[245px] shrink-0 snap-start p-2.5 rounded-2xl border text-left transition-all space-y-2.5 ${
                selected
                  ? 'border-slate-950 ring-2 ring-slate-950 bg-slate-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <ShopDesignThumbnail
                styleId={option.id}
                brandName={brandName}
                primaryColor={primaryColor}
                accentColor={accentColor}
                logoUrl={logoUrl}
                bannerUrl={bannerUrl}
              />
              <div className="flex items-start justify-between gap-2 px-0.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-950 leading-tight">{option.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {option.tagline}
                  </p>
                </div>
                {selected && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-950 text-white text-[10px] font-bold shrink-0">
                    <Check className="w-2.5 h-2.5" />
                    Active
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
        {STOREFRONT_HEADER_STYLES.map((option, idx) => {
          const active = selectedStyle === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id, idx)}
              className={`h-2 rounded-full transition-all ${
                active ? 'w-6 bg-slate-950' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              title={`${idx + 1}. ${option.label}`}
              aria-label={`Select ${option.label}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function InteractiveMediaBadge({
  slot,
  hasAsset,
  label,
  uploadingSlot,
  onUploadSlot,
  onRemoveSlot,
  dark = false,
}: {
  slot: ShowcaseAssetSlot;
  hasAsset: boolean;
  label: string;
  uploadingSlot?: ShowcaseAssetSlot | null;
  onUploadSlot?: (slot: ShowcaseAssetSlot) => void;
  onRemoveSlot?: (slot: ShowcaseAssetSlot) => void;
  dark?: boolean;
}) {
  if (!onUploadSlot) return null;
  const isBusy = uploadingSlot === slot;
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={isBusy}
        onClick={(e) => {
          e.stopPropagation();
          onUploadSlot(slot);
        }}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm transition-colors ${
          dark
            ? 'bg-slate-950/90 text-white hover:bg-slate-900 border border-white/25'
            : 'bg-white/95 text-slate-900 hover:bg-slate-100 border border-slate-300'
        }`}
      >
        {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        {isBusy ? 'Saving...' : hasAsset ? `Replace ${label}` : `Upload ${label}`}
      </button>
      {hasAsset && onRemoveSlot && (
        <button
          type="button"
          disabled={isBusy}
          onClick={(e) => {
            e.stopPropagation();
            onRemoveSlot(slot);
          }}
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white shadow-sm transition-colors"
          title={`Remove ${label}`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function FullShopLivePreview({
  styleId,
  brandName,
  storefrontTitle,
  slogan,
  announcement,
  primaryColor,
  accentColor,
  backgroundColor,
  textColor,
  headingFont,
  bodyFont,
  buttonStyle = 'pill',
  logoUrl,
  lightLogoUrl,
  bannerUrl,
  uploadingSlot,
  onUploadSlot,
  onRemoveSlot,
}: ShopMockupPreviewProps) {
  const initial = (brandName.trim() || 'B').charAt(0).toUpperCase();
  const displayBrand = brandName.trim() || 'Your Brand';
  const displayTitle = storefrontTitle.trim() || 'Shop Page Title';
  const displaySlogan = slogan.trim() || 'Your brand tagline & short description';
  const interactive = Boolean(onUploadSlot);
  const btnRadiusClass =
    buttonStyle === 'pill' ? 'rounded-full' : buttonStyle === 'square' ? 'rounded-none' : 'rounded-xl';

  const renderBannerBox = (heightClass: string, gradientFallback: string, labelText = 'Hero Banner Slot') => (
    <div className={`relative ${heightClass} rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center group`}>
      {bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bannerUrl} alt="Showcase Preview" className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-white"
          style={{ background: gradientFallback }}
        >
          <Sparkles className="w-5 h-5 mb-1 opacity-90" />
          <span className="text-xs font-bold">{labelText}</span>
          <span className="text-[10px] opacity-80">
            {interactive ? 'Click Upload Banner below to set this slot' : 'Upload a photo or keep color card'}
          </span>
        </div>
      )}
      {interactive && (
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <InteractiveMediaBadge
            slot="banner"
            hasAsset={Boolean(bannerUrl)}
            label="Banner"
            uploadingSlot={uploadingSlot}
            onUploadSlot={onUploadSlot}
            onRemoveSlot={onRemoveSlot}
            dark
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm text-slate-900"
      style={{
        backgroundColor: backgroundColor || '#FAF9F6',
        color: textColor || '#0F172A',
        fontFamily: bodyFont || undefined,
      }}
    >
      {announcement.trim() && (
        <div
          className="px-4 py-1.5 text-center text-[11px] font-bold text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {announcement}
        </div>
      )}

      {/* Storefront Top Navbar Preview with inline Logo slot trigger */}
      <div className="px-4 sm:px-5 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center font-extrabold text-xs text-slate-900 shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Brand Mark" className="w-full h-full object-cover" />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wide truncate text-slate-900">
            {displayBrand}
          </span>
          {interactive && (
            <InteractiveMediaBadge
              slot="logo"
              hasAsset={Boolean(logoUrl)}
              label="Logo"
              uploadingSlot={uploadingSlot}
              onUploadSlot={onUploadSlot}
              onRemoveSlot={onRemoveSlot}
            />
          )}
        </div>
        <div className="hidden md:flex items-center gap-4 text-[11px] font-semibold text-slate-500">
          <span className="text-slate-950 font-bold">Shop All</span>
          <span>New Arrivals</span>
          <span>Collections</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 ${btnRadiusClass} text-[11px] font-bold text-white shrink-0`}
          style={{ backgroundColor: accentColor }}
        >
          <Sparkles className="w-3 h-3" />
          Try-On Studio
        </span>
      </div>

      {styleId === 'split' && (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-5 sm:p-6 items-center bg-white border-b border-slate-200">
          <div className="sm:col-span-7 space-y-2.5 min-w-0">
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: accentColor }}
            >
              {displayBrand}
            </span>
            <h3
              className="text-lg sm:text-xl font-extrabold text-slate-950 leading-tight truncate"
              style={{ fontFamily: headingFont || undefined }}
            >
              {displayTitle}
            </h3>
            <p className="text-xs text-slate-600 line-clamp-2">{displaySlogan}</p>
            <div className="pt-1 flex flex-wrap gap-1.5">
              <span
                className={`px-3.5 py-1.5 ${btnRadiusClass} text-[11px] font-bold text-white`}
                style={{ backgroundColor: primaryColor }}
              >
                Browse Collection
              </span>
              <span className={`px-3.5 py-1.5 ${btnRadiusClass} text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-700`}>
                Try On Online
              </span>
            </div>
          </div>
          <div className="sm:col-span-5">
            {renderBannerBox('h-36 sm:h-40', `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, 'Editorial Split Photo')}
          </div>
        </div>
      )}

      {styleId === 'split-reverse' && (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-5 sm:p-6 items-center bg-white border-b border-slate-200">
          <div className="sm:col-span-5">
            {renderBannerBox('h-36 sm:h-40', `linear-gradient(135deg, ${accentColor}, ${primaryColor})`, 'Mirrored Hero Photo')}
          </div>
          <div className="sm:col-span-7 space-y-2.5 min-w-0">
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: accentColor }}
            >
              {displayBrand}
            </span>
            <h3
              className="text-lg sm:text-xl font-extrabold text-slate-950 leading-tight truncate"
              style={{ fontFamily: headingFont || undefined }}
            >
              {displayTitle}
            </h3>
            <p className="text-xs text-slate-600 line-clamp-2">{displaySlogan}</p>
            <div className="pt-1 flex flex-wrap gap-1.5">
              <span
                className={`px-3.5 py-1.5 ${btnRadiusClass} text-[11px] font-bold text-white`}
                style={{ backgroundColor: primaryColor }}
              >
                Browse Collection
              </span>
              <span className={`px-3.5 py-1.5 ${btnRadiusClass} text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-700`}>
                Try On Online
              </span>
            </div>
          </div>
        </div>
      )}

      {styleId === 'minimal' && (
        <div
          className="p-5 sm:p-6 bg-white border-b border-slate-200 border-t-4"
          style={{ borderTopColor: primaryColor }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <span
                className="text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: accentColor }}
              >
                {displayBrand}
              </span>
              <h3
                className="text-lg sm:text-xl font-extrabold text-slate-950 truncate"
                style={{ fontFamily: headingFont || undefined }}
              >
                {displayTitle}
              </h3>
              <p className="text-xs text-slate-500 truncate">{displaySlogan}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-3 py-1.5 ${btnRadiusClass} bg-slate-100 text-slate-700 text-[11px] font-bold`}>
                All Items
              </span>
              <span
                className={`px-3.5 py-1.5 ${btnRadiusClass} text-white text-[11px] font-bold`}
                style={{ backgroundColor: primaryColor }}
              >
                Virtual Fitting Room
              </span>
            </div>
          </div>
        </div>
      )}

      {styleId === 'centered' && (
        <div
          className="px-5 py-6 sm:py-7 text-center flex flex-col items-center justify-center gap-2.5 border-b border-slate-200"
          style={{ background: `linear-gradient(180deg, ${primaryColor}14 0%, #ffffff 100%)` }}
        >
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white text-slate-950 flex items-center justify-center font-extrabold text-base">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Brand Mark" className="w-full h-full object-cover" />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          {interactive && (
            <InteractiveMediaBadge
              slot="logo"
              hasAsset={Boolean(logoUrl)}
              label="Emblem Logo"
              uploadingSlot={uploadingSlot}
              onUploadSlot={onUploadSlot}
              onRemoveSlot={onRemoveSlot}
            />
          )}
          <span
            className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: accentColor }}
          >
            {displayBrand}
          </span>
          <h3
            className="text-lg font-extrabold text-slate-950 max-w-xl"
            style={{ fontFamily: headingFont || undefined }}
          >
            {displayTitle}
          </h3>
          <p className="text-xs text-slate-600 max-w-md">{displaySlogan}</p>
        </div>
      )}

      {styleId === 'cover' && (
        <div
          className="relative h-44 sm:h-52 flex items-end p-5 text-white overflow-hidden"
          style={{ backgroundColor: primaryColor }}
        >
          {bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerUrl}
              alt="Storefront Hero Preview"
              className="absolute inset-0 w-full h-full object-cover opacity-55"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
          {interactive && (
            <div className="absolute top-3 right-3 z-10">
              <InteractiveMediaBadge
                slot="banner"
                hasAsset={Boolean(bannerUrl)}
                label="Cover Banner"
                uploadingSlot={uploadingSlot}
                onUploadSlot={onUploadSlot}
                onRemoveSlot={onRemoveSlot}
                dark
              />
            </div>
          )}
          <div className="relative z-10 flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/80 bg-white text-slate-950 flex items-center justify-center font-extrabold text-lg shrink-0">
              {lightLogoUrl || logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lightLogoUrl || logoUrl} alt="Brand Logo Preview" className="w-full h-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="min-w-0">
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white mb-1"
                style={{ backgroundColor: accentColor }}
              >
                {displayBrand}
              </span>
              <h3
                className="text-base sm:text-lg font-extrabold leading-tight truncate"
                style={{ fontFamily: headingFont || undefined }}
              >
                {displayTitle}
              </h3>
              <p className="text-xs text-slate-200 truncate">{displaySlogan}</p>
            </div>
          </div>
        </div>
      )}

      {styleId === 'magazine' && (
        <div className="p-5 sm:p-6 bg-[#FAF9F6] border-b border-slate-200 space-y-3.5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
                Lookbook Issue • {displayBrand}
              </span>
              <h3
                className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 truncate"
                style={{ fontFamily: headingFont || undefined }}
              >
                {displayTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-600 max-w-xs line-clamp-2">{displaySlogan}</p>
          </div>
          {renderBannerBox('h-36 sm:h-40', `linear-gradient(120deg, ${primaryColor}, ${accentColor})`, 'Lookbook Feature Banner')}
        </div>
      )}

      {styleId === 'grid-showcase' && (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 p-5 sm:p-6 bg-white border-b border-slate-200 items-stretch">
          <div
            className="sm:col-span-6 rounded-2xl p-4 sm:p-5 text-white flex flex-col justify-between"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
          >
            <span className="inline-block w-fit px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
              {displayBrand}
            </span>
            <div className="space-y-1 mt-4">
              <h3
                className="text-base sm:text-lg font-extrabold truncate"
                style={{ fontFamily: headingFont || undefined }}
              >
                {displayTitle}
              </h3>
              <p className="text-xs text-white/90 line-clamp-2">{displaySlogan}</p>
            </div>
          </div>
          <div className="sm:col-span-6 grid grid-cols-2 gap-2.5">
            <div className="col-span-2">
              {renderBannerBox('h-28', `linear-gradient(135deg, ${primaryColor}35, ${accentColor}35)`, 'Bento Spotlight Banner')}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">Studio Mode</p>
              <p className="text-[11px] font-extrabold text-slate-900">Try-On Enabled</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">Pricing</p>
              <p className="text-[11px] font-extrabold text-slate-900">BDT (৳)</p>
            </div>
          </div>
        </div>
      )}

      {styleId === 'noir-boutique' && (
        <div className="relative p-5 sm:p-6 bg-slate-950 text-white border-b border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-7 space-y-2.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center font-extrabold text-xs shrink-0">
                {lightLogoUrl || logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lightLogoUrl || logoUrl} alt="Light Mark" className="w-full h-full object-cover" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <span
                className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
                style={{ backgroundColor: accentColor }}
              >
                {displayBrand} Noir
              </span>
              {interactive && (
                <InteractiveMediaBadge
                  slot="lightLogo"
                  hasAsset={Boolean(lightLogoUrl)}
                  label="Light Logo"
                  uploadingSlot={uploadingSlot}
                  onUploadSlot={onUploadSlot}
                  onRemoveSlot={onRemoveSlot}
                  dark
                />
              )}
            </div>
            <h3
              className="text-lg sm:text-xl font-extrabold truncate"
              style={{ fontFamily: headingFont || undefined }}
            >
              {displayTitle}
            </h3>
            <p className="text-xs text-slate-300 line-clamp-2">{displaySlogan}</p>
          </div>
          <div className="sm:col-span-5">
            {renderBannerBox('h-36', `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, 'Runway Stage Banner')}
          </div>
        </div>
      )}

      {/* Sample Storefront Catalog Preview */}
      <div className="p-4 sm:p-5 space-y-3 bg-[#FAF9F6]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">Featured Clothes Preview</span>
          <span className="text-[11px] text-slate-500">All prices in BDT (৳)</span>
        </div>
        <div
          className={`grid gap-3 ${
            styleId === 'minimal' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'
          }`}
        >
          {PREVIEW_CATALOG_ITEMS.slice(0, styleId === 'minimal' ? 2 : 3).map((item) => (
            <div
              key={item.name}
              className={`bg-white border border-slate-200 overflow-hidden flex flex-col justify-between ${
                styleId === 'centered' ? 'rounded-2xl' : 'rounded-xl'
              }`}
            >
              <div
                className="h-20 flex items-start justify-between p-2.5"
                style={{
                  background: `linear-gradient(145deg, ${primaryColor}10, ${accentColor}16)`,
                }}
              >
                <span className="px-2 py-0.5 rounded-full bg-white/90 text-slate-800 text-[10px] font-bold border border-slate-200">
                  {item.tag}
                </span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                  <span className="text-xs font-extrabold text-slate-950 shrink-0">{item.price}</span>
                </div>
                <div
                  className={`w-full py-1.5 ${btnRadiusClass} text-center text-[11px] font-bold text-white`}
                  style={{ backgroundColor: accentColor }}
                >
                  Try On Virtually
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

