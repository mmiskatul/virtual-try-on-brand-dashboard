'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Image as ImageIcon,
  Layers,
  Layout,
  Loader2,
  Lock,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import { PageHeader, SectionCard, StatusBadge } from '../../components/shared/UiPrimitives';
import { brandWorkspaceApi } from '../../services/brandService';
import { useUiStore } from '../../stores/useUiStore';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { BrandProfile } from '../../types';
import {
  BRAND_COLOR_PRESETS,
  BUSINESS_TYPE_OPTIONS,
  CATEGORY_FOCUS_OPTIONS,
  CURRENCY_OPTIONS,
  ONBOARDING_STEPS,
  OnboardingFormState,
  STOREFRONT_HEADER_STYLES,
  StorefrontHeaderStyle,
  buildSampleBrandFormValues,
  createInitialOnboardingForm,
  isValidImageSource,
  normalizeBusinessType,
  parseCategorySelection,
  toBrandSlug,
} from './onboardingPresets';

const FIELD_INPUT_CLASS =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10';

interface ImageUploadCardProps {
  label: string;
  helperText: string;
  imageUrl: string;
  uploading: boolean;
  emptyActionLabel: string;
  aspectClassName?: string;
  onUploadFile: (file: File | undefined) => void;
  onRemove: () => void;
}

function ImageUploadCard({
  label,
  helperText,
  imageUrl,
  uploading,
  emptyActionLabel,
  aspectClassName = 'h-32',
  onUploadFile,
  onRemove,
}: ImageUploadCardProps) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onUploadFile(dropped);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`space-y-3 p-4 rounded-2xl border transition-colors ${
        dragging
          ? 'border-slate-950 bg-slate-100/80'
          : 'border-slate-200 bg-slate-50/70'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <ImageIcon className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            <span>{label}</span>
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {imageUrl && (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-[11px] font-bold transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          )}
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer transition-colors">
            {uploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            <span>
              {uploading ? 'Uploading...' : imageUrl ? 'Change Photo' : emptyActionLabel}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                onUploadFile(e.target.files?.[0]);
                e.currentTarget.value = '';
              }}
            />
          </label>
        </div>
      </div>

      {imageUrl ? (
        <div
          className={`relative w-full ${aspectClassName} rounded-xl overflow-hidden border border-slate-200 bg-white`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/80 text-white text-[10px] font-bold backdrop-blur-sm">
            Uploaded Ready
          </span>
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center text-center gap-1.5 w-full ${aspectClassName} rounded-xl border-2 border-dashed border-slate-300 bg-white hover:border-slate-500 hover:bg-slate-50/70 cursor-pointer transition-colors px-4`}
        >
          <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </span>
          <span className="text-xs font-bold text-slate-900">
            {uploading ? 'Uploading image...' : 'Click or drag & drop an image here'}
          </span>
          <span className="text-[11px] text-slate-500">
            PNG, JPG or WebP · Up to 10 MB
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              onUploadFile(e.target.files?.[0]);
              e.currentTarget.value = '';
            }}
          />
        </label>
      )}
    </div>
  );
}

const PREVIEW_CATALOG_ITEMS = [
  { name: 'Structured Linen Blazer', price: '৳3,850', tag: 'New' },
  { name: 'Cotton Pleat Shirt', price: '৳1,950', tag: 'Try-On' },
  { name: 'Tailored Wide Trousers', price: '৳2,450', tag: 'Popular' },
] as const;

interface ShopMockupPreviewProps {
  styleId: StorefrontHeaderStyle;
  brandName: string;
  storefrontTitle: string;
  slogan: string;
  announcement: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  bannerUrl: string;
}

function ShopDesignThumbnail({
  styleId,
  brandName,
  primaryColor,
  accentColor,
  logoUrl,
  bannerUrl,
}: Pick<ShopMockupPreviewProps, 'styleId' | 'brandName' | 'primaryColor' | 'accentColor' | 'logoUrl' | 'bannerUrl'>) {
  const initial = (brandName.trim() || 'B').charAt(0).toUpperCase();
  const displayName = brandName.trim() || 'Your Shop';

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] text-slate-900">
      {/* Mini Browser Strip */}
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

      {/* Mini Storefront Nav */}
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

      {/* Distinct Shop UI Body */}
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
                <div
                  className="h-2 rounded text-center"
                  style={{ backgroundColor: primaryColor }}
                />
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

function FullShopLivePreview({
  styleId,
  brandName,
  storefrontTitle,
  slogan,
  announcement,
  primaryColor,
  accentColor,
  logoUrl,
  bannerUrl,
}: ShopMockupPreviewProps) {
  const initial = (brandName.trim() || 'B').charAt(0).toUpperCase();
  const displayBrand = brandName.trim() || 'Your Brand';
  const displayTitle = storefrontTitle.trim() || 'Shop Page Title';
  const displaySlogan = slogan.trim() || 'Add a short tagline in Step 1';

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-[#FAF9F6] text-slate-900">
      {announcement.trim() && (
        <div
          className="px-4 py-1.5 text-center text-[11px] font-bold text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {announcement}
        </div>
      )}

      {/* Storefront Top Navbar Preview */}
      <div className="px-4 sm:px-5 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center font-extrabold text-xs text-slate-900 shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Brand Mark" className="w-full h-full object-cover" />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wide truncate">{displayBrand}</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px] font-semibold text-slate-500">
          <span className="text-slate-950 font-bold">Shop All</span>
          <span>New Arrivals</span>
          <span>Collections</span>
        </div>
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold text-white shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          <Sparkles className="w-3 h-3" />
          Try-On Studio
        </span>
      </div>

      {/* Hero Section Based on Chosen Shop Design */}
      {styleId === 'split' && (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-5 sm:p-6 items-center bg-white border-b border-slate-200">
          <div className="sm:col-span-7 space-y-2.5 min-w-0">
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: accentColor }}
            >
              {displayBrand}
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-950 leading-tight truncate">
              {displayTitle}
            </h3>
            <p className="text-xs text-slate-600 line-clamp-2">{displaySlogan}</p>
            <div className="pt-1 flex flex-wrap gap-1.5">
              <span
                className="px-3.5 py-1.5 rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Browse Collection
              </span>
              <span className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-700">
                Try On Online
              </span>
            </div>
          </div>
          <div className="sm:col-span-5">
            <div className="relative h-36 sm:h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerUrl} alt="Showcase Preview" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-white"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                >
                  <Sparkles className="w-5 h-5 mb-1 opacity-90" />
                  <span className="text-xs font-bold">Featured Lookbook Card</span>
                  <span className="text-[10px] opacity-80">Upload a photo or keep color card</span>
                </div>
              )}
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
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-950 truncate">
                {displayTitle}
              </h3>
              <p className="text-xs text-slate-500 truncate">{displaySlogan}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                All Items
              </span>
              <span
                className="px-3.5 py-1.5 rounded-full text-white text-[11px] font-bold"
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
          className="px-5 py-6 sm:py-7 text-center flex flex-col items-center justify-center gap-2 border-b border-slate-200"
          style={{ background: `linear-gradient(180deg, ${primaryColor}14 0%, #ffffff 100%)` }}
        >
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white text-slate-950 flex items-center justify-center font-extrabold text-base">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Brand Mark" className="w-full h-full object-cover" />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <span
            className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: accentColor }}
          >
            {displayBrand}
          </span>
          <h3 className="text-lg font-extrabold text-slate-950 max-w-xl">{displayTitle}</h3>
          <p className="text-xs text-slate-600 max-w-md">{displaySlogan}</p>
        </div>
      )}

      {styleId === 'cover' && (
        <div
          className="relative h-40 sm:h-44 flex items-end p-5 text-white overflow-hidden"
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
          <div className="relative z-10 flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/80 bg-white text-slate-950 flex items-center justify-center font-extrabold text-lg shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Brand Logo Preview" className="w-full h-full object-cover" />
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
              <h3 className="text-base sm:text-lg font-extrabold leading-tight truncate">
                {displayTitle}
              </h3>
              <p className="text-xs text-slate-200 truncate">{displaySlogan}</p>
            </div>
          </div>
        </div>
      )}

      {styleId === 'split-reverse' && (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-5 sm:p-6 items-center bg-white border-b border-slate-200">
          <div className="sm:col-span-5">
            <div className="relative h-36 sm:h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerUrl} alt="Showcase Preview" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center p-4 text-center text-white text-xs font-bold"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})` }}
                >
                  {displayBrand} Feature Photo
                </div>
              )}
            </div>
          </div>
          <div className="sm:col-span-7 space-y-2.5 min-w-0">
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: accentColor }}
            >
              {displayBrand}
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-950 leading-tight truncate">
              {displayTitle}
            </h3>
            <p className="text-xs text-slate-600 line-clamp-2">{displaySlogan}</p>
            <div className="pt-1 flex flex-wrap gap-1.5">
              <span
                className="px-3.5 py-1.5 rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Browse Collection
              </span>
              <span className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-700">
                Try On Online
              </span>
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
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 truncate">
                {displayTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-600 max-w-xs line-clamp-2">{displaySlogan}</p>
          </div>
          <div className="h-32 sm:h-36 rounded-2xl overflow-hidden border border-slate-200 bg-white">
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="Lookbook Cover" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: `linear-gradient(120deg, ${primaryColor}, ${accentColor})` }}
              >
                {displayBrand} Lookbook Showcase
              </div>
            )}
          </div>
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
              <h3 className="text-base sm:text-lg font-extrabold truncate">{displayTitle}</h3>
              <p className="text-xs text-white/90 line-clamp-2">{displaySlogan}</p>
            </div>
          </div>
          <div className="sm:col-span-6 grid grid-cols-2 gap-2.5">
            <div className="col-span-2 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerUrl} alt="Boutique Tile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-slate-500">
                  Showcase Banner Tile
                </div>
              )}
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
          <div className="sm:col-span-7 space-y-2 min-w-0">
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
              style={{ backgroundColor: accentColor }}
            >
              {displayBrand} Noir
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold truncate">{displayTitle}</h3>
            <p className="text-xs text-slate-300 line-clamp-2">{displaySlogan}</p>
          </div>
          <div className="sm:col-span-5">
            <div className="relative h-32 rounded-2xl overflow-hidden border border-white/15 bg-slate-900">
              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerUrl} alt="Noir Runway" className="w-full h-full object-cover opacity-85" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                >
                  Runway Stage
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sample Storefront Catalog Section */}
      <div className="p-4 sm:p-5 space-y-3 bg-[#FAF9F6]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">Featured Clothes Preview</span>
          <span className="text-[11px] text-slate-500">All prices in BDT (৳)</span>
        </div>
        <div className={`grid gap-3 ${styleId === 'minimal' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {PREVIEW_CATALOG_ITEMS.slice(0, styleId === 'minimal' ? 2 : 3).map((item) => (
            <div
              key={item.name}
              className={`bg-white border border-slate-200 overflow-hidden flex flex-col justify-between ${
                styleId === 'centered' ? 'rounded-2xl' : styleId === 'minimal' ? 'rounded-xl' : 'rounded-xl'
              }`}
            >
              <div
                className="h-24 flex items-start justify-between p-2.5"
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
                  className="w-full py-1.5 rounded-lg text-center text-[11px] font-bold text-white"
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

export interface GettingStartedWizardProps {
  embeddedInModal?: boolean;
  verifiedTenantId?: string;
  verifiedName?: string | null;
  verifiedEmail?: string | null;
  onCompleted?: () => void;
}

export function GettingStartedWizard({
  embeddedInModal = false,
  verifiedTenantId,
  verifiedName,
  verifiedEmail,
  onCompleted,
}: GettingStartedWizardProps = {}) {
  const { data: session } = useSession();

  const profile = useWorkspaceStore((s) => s.profile);
  const tryOnConfig = useWorkspaceStore((s) => s.tryOnConfig);
  const updateTryOnConfig = useWorkspaceStore((s) => s.updateTryOnConfig);
  const onboardingStepByTenant = useWorkspaceStore((s) => s.onboardingStepByTenant);
  const onboardingCompletedStepsByTenant = useWorkspaceStore(
    (s) => s.onboardingCompletedStepsByTenant
  );
  const setStep = useWorkspaceStore((s) => s.setOnboardingStep);
  const markOnboardingStepCompleted = useWorkspaceStore((s) => s.markOnboardingStepCompleted);
  const completedIds = useWorkspaceStore((s) => s.onboardingCompletedIds);
  const toggleChecklist = useWorkspaceStore((s) => s.toggleOnboardingChecklist);
  const onboardedTenantIds = useWorkspaceStore((s) => s.onboardedTenantIds);
  const onboardingProfileDrafts = useWorkspaceStore((s) => s.onboardingProfileDrafts);
  const saveOnboardingProfileForTenant = useWorkspaceStore((s) => s.saveOnboardingProfileForTenant);
  const restoreOnboardingDraftSnapshot = useWorkspaceStore((s) => s.restoreOnboardingDraftSnapshot);
  const markOnboardingCompleted = useWorkspaceStore((s) => s.markOnboardingCompleted);
  const setBackendOnboardingStatus = useWorkspaceStore((s) => s.setBackendOnboardingStatus);
  const updateProfile = useWorkspaceStore((s) => s.updateProfile);
  const isLiveBackend = useWorkspaceStore((s) => s.isLiveBackend);

  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);

  const activeTenantId = String(
    session?.user?.tenantId || verifiedTenantId || profile.id || 'tenant_aura'
  ).trim();
  const resolvedSessionEmail = session?.user?.email ?? verifiedEmail;
  const isAlreadyOnboarded = Boolean(activeTenantId && onboardedTenantIds.includes(activeTenantId));

  const savedTenantDraft = onboardingProfileDrafts[activeTenantId];
  const completedStepsForTenant = onboardingCompletedStepsByTenant[activeTenantId] || [];
  const step1Done =
    isAlreadyOnboarded ||
    (completedStepsForTenant.includes(1) &&
      Boolean(savedTenantDraft?.name?.trim() && savedTenantDraft?.seo?.title?.trim()));
  const step2Done =
    isAlreadyOnboarded ||
    (step1Done &&
      completedStepsForTenant.includes(2) &&
      Boolean(savedTenantDraft?.email?.trim()));
  const step3Done = isAlreadyOnboarded || (step2Done && completedStepsForTenant.includes(3));
  const maxUnlockedStep = step3Done ? 4 : step2Done ? 3 : step1Done ? 2 : 1;

  const rawTenantStep = onboardingStepByTenant[activeTenantId] || 1;
  const step = Math.min(Math.max(rawTenantStep, 1), maxUnlockedStep);

  const [storeHydrated, setStoreHydrated] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStage, setSaveStage] = useState<'idle' | 'saving' | 'verifying' | 'redirecting' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [canUndoExample, setCanUndoExample] = useState(false);
  const [uploadingField, setUploadingField] = useState<'logo' | 'banner' | null>(null);
  const designCarouselRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState<OnboardingFormState>(() =>
    createInitialOnboardingForm({
      tenantId: activeTenantId,
      profile,
      savedDraft: savedTenantDraft,
      isOnboarded: isAlreadyOnboarded,
      sessionEmail: resolvedSessionEmail,
    })
  );

  const initializedTenantRef = useRef<string | null>(null);
  const liveSyncedTenantRef = useRef<string | null>(null);
  const previousSnapshotRef = useRef<{
    form: OnboardingFormState;
    draft: Partial<BrandProfile> | null;
    isDirty: boolean;
  } | null>(null);

  useEffect(() => {
    setStoreHydrated(useWorkspaceStore.persist.hasHydrated());
    const unsub = useWorkspaceStore.persist.onFinishHydration(() => {
      setStoreHydrated(true);
    });
    return () => {
      unsub();
    };
  }, []);

  // Re-sync local form state cleanly once Zustand localStorage rehydrates and/or live profile resolves
  useEffect(() => {
    if (!storeHydrated) return;
    const savedDraft = onboardingProfileDrafts[activeTenantId];
    const tenantChanged = initializedTenantRef.current !== activeTenantId;
    const liveArrived =
      profile.id === activeTenantId && liveSyncedTenantRef.current !== activeTenantId;

    if (!tenantChanged && !(liveArrived && !isDirty)) return;

    initializedTenantRef.current = activeTenantId;
    if (tenantChanged) {
      previousSnapshotRef.current = null;
      setCanUndoExample(false);
    }
    if (profile.id === activeTenantId) {
      liveSyncedTenantRef.current = activeTenantId;
    }

    setForm(
      createInitialOnboardingForm({
        tenantId: activeTenantId,
        profile,
        savedDraft,
        isOnboarded: isAlreadyOnboarded,
        sessionEmail: resolvedSessionEmail,
      })
    );
  }, [
    storeHydrated,
    activeTenantId,
    profile,
    onboardingProfileDrafts,
    isAlreadyOnboarded,
    resolvedSessionEmail,
    isDirty,
  ]);

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3200);
  };

  const markChecklist = (id: string) => {
    if (!completedIds.includes(id)) {
      toggleChecklist(id);
    }
  };

  const updateField = <K extends keyof OnboardingFormState>(key: K, value: OnboardingFormState[K]) => {
    setIsDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (category: string) => {
    setIsDirty(true);
    setForm((prev) => {
      const current = parseCategorySelection(prev.categories);
      const next = current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category];
      return {
        ...prev,
        categories: next,
        categoryFocus: next.join(', '),
      };
    });
  };

  const setAllCategories = (next: string[]) => {
    setIsDirty(true);
    setForm((prev) => ({
      ...prev,
      categories: next,
      categoryFocus: next.join(', '),
    }));
  };

  const computedSlug = useMemo(
    () => (profile.id === activeTenantId && profile.slug ? profile.slug : toBrandSlug(form.brandName)),
    [profile.id, profile.slug, activeTenantId, form.brandName]
  );

  const selectedCategories = useMemo(
    () => parseCategorySelection(form.categories),
    [form.categories]
  );

  const normalizedBusinessType = useMemo(
    () => normalizeBusinessType(form.businessType),
    [form.businessType]
  );

  // Count how many starter setup sections are filled cleanly
  const readiness = useMemo(() => {
    const completedSections = [
      step1Done,
      step2Done,
      step3Done,
      isAlreadyOnboarded,
    ];
    const totalDone = completedSections.filter(Boolean).length;
    return {
      totalDone,
      pct: Math.round((totalDone / 4) * 100),
    };
  }, [step1Done, step2Done, step3Done, isAlreadyOnboarded]);

  const activeDesignIndex = useMemo(() => {
    const idx = STOREFRONT_HEADER_STYLES.findIndex((item) => item.id === form.headerStyle);
    return idx >= 0 ? idx : 0;
  }, [form.headerStyle]);

  const scrollDesignCarouselToIndex = (index: number) => {
    const container = designCarouselRef.current;
    if (!container) return;
    const cards = container.querySelectorAll<HTMLElement>('[data-design-card="true"]');
    const targetCard = cards[index];
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handleSelectDesign = (styleId: StorefrontHeaderStyle, index?: number) => {
    updateField('headerStyle', styleId);
    const resolvedIdx =
      typeof index === 'number'
        ? index
        : STOREFRONT_HEADER_STYLES.findIndex((item) => item.id === styleId);
    if (resolvedIdx >= 0) {
      scrollDesignCarouselToIndex(resolvedIdx);
    }
  };

  const handleSwapDesign = (direction: 'left' | 'right') => {
    const total = STOREFRONT_HEADER_STYLES.length;
    const nextIdx =
      direction === 'left'
        ? (activeDesignIndex - 1 + total) % total
        : (activeDesignIndex + 1) % total;
    const nextOption = STOREFRONT_HEADER_STYLES[nextIdx];
    if (nextOption) {
      handleSelectDesign(nextOption.id, nextIdx);
    }
  };

  const persistBrandForm = async (
    formToSave: OnboardingFormState,
    syncBackend: boolean,
    options?: { markCompleted?: boolean }
  ): Promise<{ backendSaved: boolean; error?: string }> => {
    const cleanName = formToSave.brandName.trim() || 'My Brand Studio';
    const cleanTitle =
      formToSave.storefrontTitle.trim() || `${cleanName} — Online Shop`;
    const cleanSlug = profile.id === activeTenantId && profile.slug ? profile.slug : toBrandSlug(cleanName);
    const cleanDesc = formToSave.brandStory.trim() || formToSave.shortDescription.trim();
    const cleanCategories = parseCategorySelection(formToSave.categories);
    const cleanCategoryFocus =
      cleanCategories.length > 0 ? cleanCategories.join(', ') : CATEGORY_FOCUS_OPTIONS[0];
    const cleanBusinessType = normalizeBusinessType(formToSave.businessType);

    saveOnboardingProfileForTenant(activeTenantId, {
      id: activeTenantId,
      name: cleanName,
      slug: cleanSlug,
      owner: formToSave.ownerName.trim() || (options?.markCompleted ? session?.user?.name || '' : ''),
      email: formToSave.bizEmail.trim() || session?.user?.email || profile.email,
      legalName: formToSave.legalName.trim(),
      businessType: cleanBusinessType,
      phone: formToSave.phone.trim(),
      city: formToSave.city.trim(),
      country: formToSave.country.trim(),
      address: formToSave.address.trim(),
      categoryFocus: cleanCategoryFocus,
      specialties: cleanCategories,
      slogan: formToSave.slogan.trim(),
      announcement: formToSave.announcement.trim(),
      shortDescription: formToSave.shortDescription.trim(),
      description: cleanDesc,
      brandStory: formToSave.brandStory.trim() || cleanDesc,
      primaryColor: formToSave.primaryColor,
      accentColor: formToSave.accentColor,
      headerStyle: formToSave.headerStyle,
      logo: formToSave.logoUrl.trim(),
      banner: formToSave.bannerUrl.trim(),
      socialLinks: {
        ...(profile.socialLinks || {}),
        instagram: formToSave.instagram.trim(),
        website: formToSave.website.trim(),
      },
      seo: {
        ...(profile.seo || {
          title: cleanTitle,
          description: formToSave.shortDescription.trim() || cleanDesc,
          canonicalUrl: `https://vton.store/brands/${cleanSlug}`,
          ogImage: isValidImageSource(formToSave.bannerUrl) ? formToSave.bannerUrl.trim() : '',
          allowIndexing: true,
        }),
        title: cleanTitle,
        description: formToSave.shortDescription.trim() || cleanDesc,
      },
      settings: {
        ...(profile.settings || {
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          language: 'English',
          currency: 'BDT',
          taxRatePercent: 0,
          taxInclusive: false,
          freeShippingThreshold: 150,
          defaultShippingFee: 12,
          emailNotifications: true,
          orderNotifications: true,
          inventoryNotifications: true,
          tryOnNotifications: true,
          billingNotifications: true,
          twoFactorEnabled: false,
        }),
        currency: 'BDT',
      },
    });

    updateTryOnConfig({
      appearance: {
        ...tryOnConfig.appearance,
        pageTitle: `${cleanName} Virtual Try-On Studio`,
        pageDescription:
          formToSave.slogan.trim() ||
          `Preview ${cleanName} silhouettes in real time before ordering.`,
        accentColor: formToSave.primaryColor || tryOnConfig.appearance.accentColor,
      },
    });

    if (!syncBackend) return { backendSaved: false };

    const safeLogo = isValidImageSource(formToSave.logoUrl) ? formToSave.logoUrl.trim() : '';
    const safeBanner = isValidImageSource(formToSave.bannerUrl) ? formToSave.bannerUrl.trim() : '';

    const storefrontSettingsPayload: Record<string, any> = {
      primaryColor: formToSave.primaryColor,
      accentColor: formToSave.accentColor,
      headerStyle: formToSave.headerStyle,
      announcement: formToSave.announcement.trim(),
      aboutText: formToSave.brandStory.trim() || formToSave.shortDescription.trim(),
      storefrontTitle: cleanTitle,
      slogan: formToSave.slogan.trim(),
      shortDescription: formToSave.shortDescription.trim(),
      categoryFocus: cleanCategoryFocus,
      categories: cleanCategories,
      ownerName:
        formToSave.ownerName.trim() ||
        (options?.markCompleted ? session?.user?.name || '' : ''),
      legalName: formToSave.legalName.trim(),
      businessType: cleanBusinessType,
      phone: formToSave.phone.trim(),
      city: formToSave.city.trim(),
      country: formToSave.country.trim(),
      address: formToSave.address.trim(),
      currency: 'BDT',
      socialLinks: {
        instagram: formToSave.instagram.trim(),
        website: formToSave.website.trim(),
      },
      bannerImage: safeBanner,
      ...(options?.markCompleted
        ? { onboardingCompleted: true, onboardingCompletedAt: Date.now() }
        : {}),
    };

    try {
      await brandWorkspaceApi.updateProfile({
        name: cleanName,
        ...(cleanDesc ? { description: cleanDesc } : {}),
        contactEmail: formToSave.bizEmail.trim() || undefined,
        logoUrl: safeLogo,
        bannerUrl: safeBanner,
        storefrontSettings: storefrontSettingsPayload,
      });
      return { backendSaved: true };
    } catch (err) {
      return {
        backendSaved: false,
        error: err instanceof Error ? err.message : 'Unable to save setup to backend.',
      };
    }
  };

  const handleApplySampleBrand = () => {
    if (!canUndoExample) {
      previousSnapshotRef.current = {
        form: {
          ...form,
          categories: [...form.categories],
        },
        draft: savedTenantDraft
          ? {
              ...savedTenantDraft,
              ...(savedTenantDraft.specialties
                ? { specialties: [...savedTenantDraft.specialties] }
                : {}),
              ...(savedTenantDraft.seo ? { seo: { ...savedTenantDraft.seo } } : {}),
              ...(savedTenantDraft.socialLinks
                ? { socialLinks: { ...savedTenantDraft.socialLinks } }
                : {}),
              ...(savedTenantDraft.settings ? { settings: { ...savedTenantDraft.settings } } : {}),
            }
          : null,
        isDirty,
      };
    }

    const sampled = buildSampleBrandFormValues(form);
    setForm(sampled);
    setIsDirty(true);
    setCanUndoExample(true);
    saveOnboardingProfileForTenant(activeTenantId, {
      name: sampled.brandName,
      slogan: sampled.slogan,
      announcement: sampled.announcement,
      categoryFocus: sampled.categoryFocus,
      specialties: sampled.categories,
      shortDescription: sampled.shortDescription,
      description: sampled.brandStory,
      brandStory: sampled.brandStory,
      seo: {
        ...(profile.seo || {
          title: sampled.storefrontTitle,
          description: sampled.shortDescription,
          canonicalUrl: '',
          ogImage: '',
          allowIndexing: true,
        }),
        title: sampled.storefrontTitle,
        description: sampled.shortDescription,
      },
    });
    notify('Example shop info filled for Step 1! Click "Undo Example" anytime to restore your previous data.');
  };

  const handleUndoSampleBrand = () => {
    const snap = previousSnapshotRef.current;
    if (!snap) return;
    setForm({
      ...snap.form,
      categories: [...snap.form.categories],
    });
    setIsDirty(snap.isDirty);
    restoreOnboardingDraftSnapshot(activeTenantId, snap.draft);
    previousSnapshotRef.current = null;
    setCanUndoExample(false);
    notify('Previous form data restored.');
  };

  const handleSaveStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brandName.trim()) {
      notify('Please type your Brand Name first.');
      return;
    }
    if (!form.storefrontTitle.trim()) {
      notify('Please type a Shop Page Title first.');
      return;
    }
    if (selectedCategories.length === 0) {
      notify('Please pick at least one category for your shop.');
      return;
    }
    setSaving(true);
    const { backendSaved } = await persistBrandForm(form, true);
    markChecklist('chk_profile');
    markOnboardingStepCompleted(activeTenantId, 1);
    setSaving(false);
    setStep(2, activeTenantId);
    notify(
      backendSaved
        ? 'Brand name and shop details saved.'
        : 'Brand details saved on this device.'
    );
  };

  const handleSaveStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bizEmail.trim() || !form.bizEmail.includes('@')) {
      notify('Please enter a valid contact email.');
      return;
    }
    setSaving(true);
    const { backendSaved } = await persistBrandForm(form, true);
    markChecklist('chk_business');
    markOnboardingStepCompleted(activeTenantId, 2);
    setSaving(false);
    setStep(3, activeTenantId);
    notify(
      backendSaved
        ? 'Contact details saved.'
        : 'Contact details saved on this device.'
    );
  };

  const handleSaveStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { backendSaved } = await persistBrandForm(form, true);
    markChecklist('chk_identity');
    markOnboardingStepCompleted(activeTenantId, 3);
    setSaving(false);
    setStep(4, activeTenantId);
    notify(
      backendSaved
        ? 'Brand colors, logo, and banner synced to storefront.'
        : 'Brand identity saved locally for storefront preview.'
    );
  };

  const handleUploadAsset = async (
    field: 'logo' | 'banner',
    file: File | undefined
  ) => {
    if (!file) return;
    setUploadingField(field);
    const res = await brandWorkspaceApi.uploadMediaFile(file);
    setUploadingField(null);
    if (!res.ok || !res.url) {
      notify(res.error || 'Could not process image upload.');
      return;
    }
    if (field === 'logo') {
      updateField('logoUrl', res.url);
    } else {
      updateField('bannerUrl', res.url);
    }
    notify(
      res.provider === 'local_preview'
        ? 'Image attached in local preview mode.'
        : 'Image uploaded successfully.'
    );
  };

  const handleCompleteOnboarding = async () => {
    if (!form.brandName.trim() || !form.storefrontTitle.trim()) {
      setStep(1, activeTenantId);
      notify('Please complete your Brand Name and Storefront Title before saving setup.');
      return;
    }
    if (!form.bizEmail.trim() || !form.bizEmail.includes('@')) {
      setStep(2, activeTenantId);
      notify('Please enter a valid business contact email before saving setup.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveStage('saving');

    const saveRes = await persistBrandForm(form, true, { markCompleted: true });
    if (!saveRes.backendSaved) {
      const msg = saveRes.error || 'Could not save your onboarding setup to the backend.';
      setSaveError(msg);
      setSaveStage('error');
      setSaving(false);
      notify(msg);
      return;
    }

    setSaveStage('verifying');
    try {
      const verifiedProfile = await brandWorkspaceApi.getProfile();
      if (!verifiedProfile?.onboardingCompleted) {
        const msg = 'Backend reload check did not confirm onboarding completion. Please retry Save.';
        setSaveError(msg);
        setSaveStage('error');
        setSaving(false);
        notify(msg);
        return;
      }

      updateProfile({
        ...verifiedProfile,
        owner: verifiedProfile.owner || form.ownerName.trim() || session?.user?.name || '',
      });
      setBackendOnboardingStatus(verifiedProfile.id || activeTenantId, true);
      markOnboardingCompleted(verifiedProfile.id || activeTenantId);
      previousSnapshotRef.current = null;
      setCanUndoExample(false);

      setSaveStage('redirecting');
      notify('Brand setup saved and verified from backend. Redirecting to Brand Dashboard...');
      onCompleted?.();

      if (typeof window !== 'undefined') {
        window.location.assign('/dashboard');
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? `Backend reload check failed: ${err.message}`
          : 'Backend reload verification failed. Please retry Save.';
      setSaveError(msg);
      setSaveStage('error');
      setSaving(false);
      notify(msg);
    }
  };

  const handleStepSwitch = (targetStep: number) => {
    if (targetStep > maxUnlockedStep) {
      notify(
        step === 1
          ? 'Please enter and save your Brand Name & Storefront Title first.'
          : 'Complete the current step first before continuing.'
      );
      return;
    }
    if (step1Done) {
      void persistBrandForm(form, false);
    }
    setStep(targetStep, activeTenantId);
  };

  return (
    <div className={embeddedInModal ? 'space-y-5' : 'space-y-6 pb-8'}>
      {embeddedInModal ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs sm:text-sm font-extrabold text-slate-950">
              Complete Your Shop Info &amp; Basic Settings
            </p>
            <p className="text-[11px] sm:text-xs text-slate-600">
              Add your brand name, shop title, contact details, colors, and shop design to open your dashboard.
            </p>
          </div>
          {step === 1 && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {canUndoExample && (
                <button
                  type="button"
                  onClick={handleUndoSampleBrand}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Undo Example
                </button>
              )}
              <button
                type="button"
                onClick={handleApplySampleBrand}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5 text-slate-700" />
                Fill Example Info
              </button>
            </div>
          )}
        </div>
      ) : (
        <PageHeader
          eyebrow="Shop Setup"
          title={
            isAlreadyOnboarded
              ? `Shop Setup Guide — ${form.brandName || profile.name}`
              : 'Set Up Your Brand & Shop Details'
          }
          subtitle="Add your brand name, shop title, contact info, colors, and storefront layout."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={isAlreadyOnboarded ? 'ACTIVE' : 'PENDING'} />
              {step === 1 && canUndoExample && (
                <button
                  type="button"
                  onClick={handleUndoSampleBrand}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Undo Example
                </button>
              )}
              {step === 1 && (
                <button
                  type="button"
                  onClick={handleApplySampleBrand}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5 text-slate-700" />
                  Fill Example Info
                </button>
              )}
              {isAlreadyOnboarded && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  Open Dashboard
                </Link>
              )}
            </div>
          }
        />
      )}

      {/* Setup Readiness Progress Strip */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-slate-900 shrink-0" />
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Setup Progress: {readiness.totalDone} of 4 sections completed ({readiness.pct}%)
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {isLiveBackend ? 'Connected to Server' : 'Saved on This Device'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-slate-950 transition-all duration-300"
            style={{ width: `${readiness.pct}%` }}
          />
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ONBOARDING_STEPS.map((label, idx) => {
          const stepNum = idx + 1;
          const active = step === stepNum;
          const locked = stepNum > maxUnlockedStep;
          const done =
            (stepNum === 1 && step1Done) ||
            (stepNum === 2 && step2Done) ||
            (stepNum === 3 && step3Done) ||
            (stepNum === 4 && isAlreadyOnboarded);
          return (
            <button
              key={label}
              type="button"
              disabled={locked}
              onClick={() => handleStepSwitch(stepNum)}
              className={`px-3 py-2.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between gap-1.5 ${
                active
                  ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                  : locked
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-70'
                  : done
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{label}</span>
              {done && !active && <Check className="w-3.5 h-3.5 shrink-0 text-emerald-700" />}
              {locked && !active && <Lock className="w-3 h-3 shrink-0 text-slate-400" />}
            </button>
          );
        })}
      </div>

      {/* STEP 1: BRAND PROFILE & TITLE */}
      {step === 1 && (
        <SectionCard
          title="1. Your Brand Name & Shop Info"
          subtitle="Tell customers who you are. You can edit any of these later from Settings."
          right={
            <div className="flex items-center gap-3">
              {canUndoExample && (
                <button
                  type="button"
                  onClick={handleUndoSampleBrand}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4"
                >
                  <RotateCcw className="w-3 h-3" />
                  Undo Example
                </button>
              )}
              <button
                type="button"
                onClick={handleApplySampleBrand}
                className="text-xs font-bold text-slate-700 hover:text-slate-950 underline underline-offset-4"
              >
                Fill Example Info
              </button>
            </div>
          }
        >
          <form onSubmit={handleSaveStep1} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800 block">Brand Name *</span>
                <input
                  type="text"
                  required
                  value={form.brandName}
                  onChange={(e) => updateField('brandName', e.target.value)}
                  placeholder="e.g. Sunny Wear"
                  className={FIELD_INPUT_CLASS}
                />
                <span className="text-[11px] font-normal text-slate-500 block">
                  The short name customers see on your shop and products.
                </span>
              </label>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-800">Shop Page Title *</span>
                  {form.brandName.trim() && (
                    <button
                      type="button"
                      onClick={() => updateField('storefrontTitle', `${form.brandName.trim()} Shop`)}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-950 underline underline-offset-2"
                    >
                      Use Brand Name
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={form.storefrontTitle}
                  onChange={(e) => updateField('storefrontTitle', e.target.value)}
                  placeholder="e.g. Sunny Wear Online Shop"
                  className={FIELD_INPUT_CLASS}
                />
                <span className="text-[11px] font-normal text-slate-500 block">
                  Shown as the main heading at the top of your shop page.
                </span>
              </div>

              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800 block">Short Tagline</span>
                <input
                  type="text"
                  value={form.slogan}
                  onChange={(e) => updateField('slogan', e.target.value)}
                  placeholder="e.g. Comfortable clothes made to fit well"
                  className={FIELD_INPUT_CLASS}
                />
                <span className="text-[11px] font-normal text-slate-500 block">
                  A short catchphrase under your shop title (optional).
                </span>
              </label>

              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800 block">Top Notice Bar</span>
                <input
                  type="text"
                  value={form.announcement}
                  onChange={(e) => updateField('announcement', e.target.value)}
                  placeholder="e.g. Free shipping on orders over ৳1,500"
                  className={FIELD_INPUT_CLASS}
                />
                <span className="text-[11px] font-normal text-slate-500 block">
                  Optional banner message at the very top of your shop page.
                </span>
              </label>

              <div className="space-y-2 md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">Category *</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                      {selectedCategories.length} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAllCategories([...CATEGORY_FOCUS_OPTIONS])}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-950 underline underline-offset-2"
                    >
                      Select All
                    </button>
                    {selectedCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAllCategories([])}
                        className="text-[11px] font-bold text-slate-500 hover:text-rose-600 underline underline-offset-2"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_FOCUS_OPTIONS.map((opt) => {
                    const active = selectedCategories.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleCategory(opt)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                          active
                            ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] font-normal text-slate-500 block">
                  Tap one or more categories to show what your shop sells.
                </span>
              </div>

              <label className="block space-y-1.5 md:col-span-2">
                <span className="font-bold text-slate-800 block">Short Summary</span>
                <input
                  type="text"
                  value={form.shortDescription}
                  onChange={(e) => updateField('shortDescription', e.target.value)}
                  placeholder="e.g. Everyday shirts, dresses, and jackets with Virtual Try-On."
                  className={FIELD_INPUT_CLASS}
                />
                <span className="text-[11px] font-normal text-slate-500 block">
                  One short line shown on search results and shop cards.
                </span>
              </label>

              <label className="block space-y-1.5 md:col-span-2">
                <span className="font-bold text-slate-800 block">About Your Brand</span>
                <textarea
                  rows={3}
                  value={form.brandStory}
                  onChange={(e) => updateField('brandStory', e.target.value)}
                  placeholder="Tell customers about your clothes, style, and quality..."
                  className={`${FIELD_INPUT_CLASS} resize-y`}
                />
                <span className="text-[11px] font-normal text-slate-500 block">
                  Shown in the About section of your shop page.
                </span>
              </label>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  Your Shop Link: <strong className="font-mono text-slate-950">/brands/{computedSlug}</strong>
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Try-On: /try/{computedSlug}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplySampleBrand}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800"
                >
                  Fill Example Info
                </button>
                {canUndoExample && (
                  <button
                    type="button"
                    onClick={handleUndoSampleBrand}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-900"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Undo Example
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold transition-colors"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Next: Contact Info
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* STEP 2: BUSINESS & CONTACT INFO */}
      {step === 2 && (
        <SectionCard
          title="2. Owner & Contact Info"
          subtitle="Add your name, contact email, currency, and address so orders and receipts work properly."
        >
          <form onSubmit={handleSaveStep2} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800 block">Your Full Name</span>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => updateField('ownerName', e.target.value)}
                  placeholder="e.g. Sarah Ahmed"
                  className={FIELD_INPUT_CLASS}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800 block">Company / Legal Name</span>
                <input
                  type="text"
                  value={form.legalName}
                  onChange={(e) => updateField('legalName', e.target.value)}
                  placeholder="e.g. Sunny Wear Ltd. (optional)"
                  className={FIELD_INPUT_CLASS}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800 block">Shop Type</span>
                <select
                  value={normalizedBusinessType}
                  onChange={(e) => updateField('businessType', e.target.value)}
                  className={FIELD_INPUT_CLASS}
                >
                  <option value="">Select shop type...</option>
                  {BUSINESS_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800 block">Contact Email *</span>
                <input
                  type="email"
                  required
                  value={form.bizEmail}
                  onChange={(e) => updateField('bizEmail', e.target.value)}
                  placeholder="e.g. hello@sunnywear.com"
                  className={FIELD_INPUT_CLASS}
                />
                <span className="text-[11px] font-normal text-slate-500 block">
                  Used for order alerts and customer messages.
                </span>
              </label>

              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800 block">Phone Number</span>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="e.g. +88017XXXXXXXX"
                  className={FIELD_INPUT_CLASS}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800 block">Price Currency</span>
                <select
                  value="BDT"
                  onChange={() => updateField('currency', 'BDT')}
                  className={FIELD_INPUT_CLASS}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c} (৳ Taka)
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800 block">City</span>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="e.g. Dhaka / London / New York"
                  className={FIELD_INPUT_CLASS}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800 block">Country</span>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  placeholder="e.g. Bangladesh "
                  className={FIELD_INPUT_CLASS}
                />
              </label>

              <label className="block space-y-1.5 md:col-span-2">
                <span className="font-bold text-slate-800 block">Street Address</span>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Building, street name, and zip code (optional)"
                  className={FIELD_INPUT_CLASS}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800 block">Instagram</span>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => updateField('instagram', e.target.value)}
                  placeholder="e.g. @yourbrand"
                  className={FIELD_INPUT_CLASS}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="font-bold text-slate-800 block">Website Link</span>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="e.g. https://yourbrand.com"
                  className={FIELD_INPUT_CLASS}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleStepSwitch(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold transition-colors"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Next: Colors &amp; Photos
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* STEP 3: STOREFRONT DESIGN, COLORS & MEDIA UPLOADS */}
      {step === 3 && (
        <SectionCard
          title="3. Shop Design, Colors & Brand Photos"
          subtitle="Pick a storefront layout style, choose your colors, and upload optional photos. Preview how your shop header looks below."
        >
          <form onSubmit={handleSaveStep3} className="space-y-6">
            {/* Storefront Design Picker (8 UI Designs with Left-to-Right Swap Carousel) */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layout className="w-3.5 h-3.5" />
                    Choose How Your Shop Should Look (Swap Left ↔ Right Across 8 UI Designs)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Selected ({activeDesignIndex + 1} of {STOREFRONT_HEADER_STYLES.length}):{' '}
                    <strong className="text-slate-900">
                      {STOREFRONT_HEADER_STYLES[activeDesignIndex]?.label}
                    </strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(form.headerStyle === 'split' || form.headerStyle === 'split-reverse') && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectDesign(form.headerStyle === 'split' ? 'split-reverse' : 'split')
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
                    onClick={() => handleSwapDesign('left')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-bold text-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>
                  <button
                    type="button"
                    aria-label="Swap next design right"
                    onClick={() => handleSwapDesign('right')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-950 bg-slate-950 hover:bg-slate-800 text-[11px] font-bold text-white transition-colors"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div
                ref={designCarouselRef}
                className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-1 px-1"
              >
                {STOREFRONT_HEADER_STYLES.map((option, idx) => {
                  const selected = form.headerStyle === option.id;
                  return (
                    <button
                      key={option.id}
                      data-design-card="true"
                      type="button"
                      onClick={() => handleSelectDesign(option.id, idx)}
                      className={`w-[225px] sm:w-[245px] shrink-0 snap-start p-2.5 rounded-2xl border text-left transition-all space-y-2.5 ${
                        selected
                          ? 'border-slate-950 ring-2 ring-slate-950 bg-slate-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <ShopDesignThumbnail
                        styleId={option.id}
                        brandName={form.brandName}
                        primaryColor={form.primaryColor}
                        accentColor={form.accentColor}
                        logoUrl={form.logoUrl}
                        bannerUrl={form.bannerUrl}
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
                            Selected
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
                {STOREFRONT_HEADER_STYLES.map((option, idx) => {
                  const active = form.headerStyle === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectDesign(option.id, idx)}
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

            {/* Color Palette Selection */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Color Themes &amp; Custom Colors
              </p>
              <div className="flex flex-wrap gap-2">
                {BRAND_COLOR_PRESETS.map((preset) => {
                  const selected =
                    form.primaryColor.toLowerCase() === preset.primaryColor.toLowerCase();
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        updateField('primaryColor', preset.primaryColor);
                        updateField('accentColor', preset.accentColor);
                      }}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                        selected
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/40"
                        style={{ backgroundColor: preset.primaryColor }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">Main Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => updateField('primaryColor', e.target.value)}
                      className="w-11 h-10 rounded-xl border border-slate-200 cursor-pointer bg-white p-1"
                    />
                    <input
                      type="text"
                      value={form.primaryColor}
                      onChange={(e) => updateField('primaryColor', e.target.value)}
                      className={`${FIELD_INPUT_CLASS} flex-1 font-mono`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">Button &amp; Badge Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={(e) => updateField('accentColor', e.target.value)}
                      className="w-11 h-10 rounded-xl border border-slate-200 cursor-pointer bg-white p-1"
                    />
                    <input
                      type="text"
                      value={form.accentColor}
                      onChange={(e) => updateField('accentColor', e.target.value)}
                      className={`${FIELD_INPUT_CLASS} flex-1 font-mono`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Image Upload Cards (Upload-Only, Zero URL Inputs) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ImageUploadCard
                label="Brand Mark / Emblem (Optional)"
                helperText="Upload a square logo or monogram mark for your shop header."
                imageUrl={form.logoUrl}
                uploading={uploadingField === 'logo'}
                emptyActionLabel="Upload Logo"
                aspectClassName="h-36"
                onUploadFile={(file) => void handleUploadAsset('logo', file)}
                onRemove={() => updateField('logoUrl', '')}
              />

              <ImageUploadCard
                label="Showcase / Feature Photo (Optional)"
                helperText={
                  form.headerStyle === 'split'
                    ? 'Displayed as your framed feature card beside your brand intro.'
                    : form.headerStyle === 'cover'
                    ? 'Displayed as your full-width hero backdrop photo.'
                    : 'Used on lookbook cards and subtle header accents.'
                }
                imageUrl={form.bannerUrl}
                uploading={uploadingField === 'banner'}
                emptyActionLabel="Upload Photo"
                aspectClassName="h-36"
                onUploadFile={(file) => void handleUploadAsset('banner', file)}
                onRemove={() => updateField('bannerUrl', '')}
              />
            </div>

            {/* Live Full Shop UI Preview Matching Selected Design */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-700">
                  Live Shop UI Preview —{' '}
                  {STOREFRONT_HEADER_STYLES.find((s) => s.id === form.headerStyle)?.label}
                </p>
                <span className="text-[11px] text-slate-500">Updates instantly as you customize</span>
              </div>
              <FullShopLivePreview
                styleId={form.headerStyle}
                brandName={form.brandName}
                storefrontTitle={form.storefrontTitle}
                slogan={form.slogan}
                announcement={form.announcement}
                primaryColor={form.primaryColor}
                accentColor={form.accentColor}
                logoUrl={form.logoUrl}
                bannerUrl={form.bannerUrl}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleStepSwitch(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold transition-colors"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Next: Review &amp; Save
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* STEP 4: REVIEW & FINAL SAVE */}
      {step === 4 && (
        <SectionCard
          title="4. Check Details & Save"
          subtitle="Look over your shop details below. Click Save to store everything on the server and open your dashboard."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Store className="w-4 h-4" />
                    Brand &amp; Shop Title
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStepSwitch(1)}
                    className="text-[11px] font-bold text-slate-700 underline"
                  >
                    Edit
                  </button>
                </div>
                <p>
                  <span className="text-slate-500">Brand Name:</span>{' '}
                  <strong className="text-slate-950">{form.brandName || 'Not set'}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Shop Page Title:</span>{' '}
                  <strong className="text-slate-950">{form.storefrontTitle || 'Not set'}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Tagline:</span>{' '}
                  <span className="text-slate-800">{form.slogan || '—'}</span>
                </p>
                <p>
                  <span className="text-slate-500">Categories:</span>{' '}
                  <span className="text-slate-800">
                    {selectedCategories.length > 0 ? selectedCategories.join(', ') : form.categoryFocus || '—'}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Shop Design:</span>{' '}
                  <span className="text-slate-800 font-semibold">
                    {STOREFRONT_HEADER_STYLES.find((s) => s.id === form.headerStyle)?.label || 'Editorial Split'}
                  </span>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    Contact Info
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStepSwitch(2)}
                    className="text-[11px] font-bold text-slate-700 underline"
                  >
                    Edit
                  </button>
                </div>
                <p>
                  <span className="text-slate-500">Owner Name:</span>{' '}
                  <strong className="text-slate-950">{form.ownerName || 'Shop Owner'}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Company Name:</span>{' '}
                  <span className="text-slate-800">{form.legalName || '—'}</span>
                </p>
                <p>
                  <span className="text-slate-500">Email:</span>{' '}
                  <strong className="text-slate-950">{form.bizEmail || 'Not set'}</strong>
                </p>
                <p>
                  <span className="text-slate-500">Location &amp; Currency:</span>{' '}
                  <span className="text-slate-800">
                    {[form.city, form.country].filter(Boolean).join(', ') || 'Global'} (BDT ৳)
                  </span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  Colors, Photos &amp; Shop Design
                </p>
                <button
                  type="button"
                  onClick={() => handleStepSwitch(3)}
                  className="text-[11px] font-bold text-slate-700 underline"
                >
                  Edit Design
                </button>
              </div>
              <p className="text-slate-600">
                Design:{' '}
                <strong className="text-slate-900">
                  {STOREFRONT_HEADER_STYLES.find((s) => s.id === form.headerStyle)?.label || 'Editorial Split'}
                </strong>{' '}
                • Main Color <strong className="font-mono">{form.primaryColor}</strong> • Brand Logo{' '}
                <strong>{form.logoUrl ? 'Uploaded' : 'Not uploaded'}</strong> • Feature Photo{' '}
                <strong>{form.bannerUrl ? 'Uploaded' : 'Not uploaded'}</strong>
              </p>
            </div>

            {saveError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900">
                <strong className="font-bold">Could Not Save: </strong>
                {saveError}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleStepSwitch(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleCompleteOnboarding}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {saveStage === 'saving'
                  ? 'Saving to Server...'
                  : saveStage === 'verifying'
                  ? 'Checking Saved Data...'
                  : saveStage === 'redirecting'
                  ? 'Done! Opening Dashboard...'
                  : 'Save & Open Dashboard'}
              </button>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
