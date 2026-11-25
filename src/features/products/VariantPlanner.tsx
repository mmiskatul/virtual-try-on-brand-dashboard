'use client';

import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, ChevronDown, Copy, ImagePlus, Loader2, Plus, Upload, X } from 'lucide-react';
import { PRODUCT_LIMITS } from '../../lib/productContract';
import { Button } from '../../components/ui/button';
import { SafeImage } from '../../components/shared/UiPrimitives';
import { resolveImageSrc } from '../../lib/draftStore';
import {
  COLOR_PRESETS,
  ColorSection,
  NO_COLOR,
  SIZE_PRESETS,
  SWATCHES,
  VariantPlan,
  assignedTotal,
  cleanDigits,
  planProblem,
  resetQuantities,
  sectionTotal,
  sizeKey,
  sizeTotal,
  sortColorNames,
  sortSizeNames,
  splitPlanEvenly,
  toNum,
  usedSizes,
} from './variantPlan';

export type { VariantPlan } from './variantPlan';

export type PhotoKind = 'store' | 'ai';

// ─── Multi-select dropdown ───────────────────────────────────────────────────

function MultiSelect({
  label,
  placeholder,
  selected,
  onChange,
  groups,
  swatches,
  customLabel,
  maxLength,
  compact = false,
  showChips = true,
}: {
  label?: string;
  placeholder: string;
  selected: string[];
  onChange: (next: string[]) => void;
  groups: Array<{ group: string; options: string[] }>;
  swatches?: Record<string, string>;
  customLabel: string;
  maxLength: number;
  compact?: boolean;
  showChips?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const has = (value: string) => selected.some((s) => s.toLowerCase() === value.toLowerCase());
  const toggle = (value: string) =>
    onChange(has(value) ? selected.filter((s) => s.toLowerCase() !== value.toLowerCase()) : [...selected, value]);
  const addCustom = () => {
    const value = custom.trim().slice(0, maxLength);
    if (value && !has(value)) onChange([...selected, value]);
    setCustom('');
  };

  return (
    <div className="relative">
      {label && <label className="mb-1 block font-bold text-slate-700">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white text-left ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}
      >
        <span className={selected.length === 0 ? 'text-slate-400' : 'font-semibold text-slate-800'}>
          {selected.length === 0 ? placeholder : `${selected.length} selected`}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <>
          <div aria-hidden="true" className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            {groups.map((g) => (
              <div key={g.group} className="mb-2">
                <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{g.group}</p>
                <div className="grid grid-cols-2 gap-1">
                  {g.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={has(option)}
                      onClick={() => toggle(option)}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50 ${has(option) ? 'bg-slate-100 font-bold' : ''}`}
                    >
                      <span className={`flex h-4 w-4 items-center justify-center rounded border ${has(option) ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300'}`}>
                        {has(option) && <Check className="h-3 w-3" />}
                      </span>
                      {swatches?.[option] && <span className="h-3.5 w-3.5 rounded-full border border-slate-300" style={{ backgroundColor: swatches[option] }} />}
                      <span className="truncate">{option}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-2">
              <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{customLabel}</p>
              <div className="flex gap-1.5">
                <input
                  value={custom}
                  maxLength={maxLength}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                  placeholder="Type and press Enter"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5"
                />
                <Button type="button" size="sm" variant="outline" onClick={addCustom} disabled={!custom.trim()}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {showChips && selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((value) => (
            <span key={value} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-2.5 pr-1.5 font-semibold text-slate-800">
              {swatches?.[value] && <span className="h-3 w-3 rounded-full border border-slate-300" style={{ backgroundColor: swatches[value] }} />}
              {value}
              <button type="button" aria-label={`Remove ${value}`} onClick={() => toggle(value)} className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── A photo slot ────────────────────────────────────────────────────────────

function PhotoSlot({
  title,
  hint,
  imageUrl,
  busy,
  onFile,
  onRemove,
}: {
  title: string;
  hint: string;
  imageUrl: string;
  busy: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <div>
        <p className="font-bold text-slate-800">{title}</p>
        <p className="text-[11px] leading-snug text-slate-500">{hint}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.currentTarget.value = '';
        }}
      />
      <div className="group relative h-52 w-full overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
        {imageUrl ? (
          <>
            <SafeImage src={resolveImageSrc(imageUrl)} alt={title} fill className="object-contain p-2" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/50 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 font-bold text-slate-900">
                <Upload className="h-3.5 w-3.5" /> Replace
              </button>
              <button type="button" disabled={busy} onClick={onRemove} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 font-bold text-rose-600">
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </>
        ) : (
          <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-500">
            <ImagePlus className="h-5 w-5" />
            <span className="font-semibold">Upload photo</span>
            <span className="text-[11px] text-slate-400">PNG, JPG or WEBP</span>
          </button>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/85">
            <Loader2 className="h-5 w-5 animate-spin text-slate-900" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── The planner ─────────────────────────────────────────────────────────────

export function VariantPlanner({
  plan,
  onChange,
  totalStock,
  basePrice,
  error,
  onGoToStock,
  onUploadPhoto,
  uploading,
}: {
  plan: VariantPlan;
  onChange: (next: VariantPlan) => void;
  /** The "Total stock" typed on the Price & stock step. This is what gets shared out. */
  totalStock: number;
  /** The product's selling price. Sizes without their own price use this. */
  basePrice: number;
  error?: string;
  onGoToStock: () => void;
  /** Uploads a photo for a colour. The editor puts the finished link into the plan. */
  onUploadPhoto: (color: string, kind: PhotoKind, file: File) => void;
  /** "Colour|kind" of the photo being uploaded right now. */
  uploading: string | null;
}) {
  const [activeColor, setActiveColor] = useState<string>(plan.colors[0]?.color ?? '');
  const active = plan.colors.find((c) => c.color === activeColor) ?? plan.colors[0];
  const assigned = assignedTotal(plan);
  const left = totalStock - assigned;
  const problem = useMemo(() => planProblem(plan, totalStock), [plan, totalStock]);
  const sizes = useMemo(() => usedSizes(plan), [plan]);

  const patchColor = (color: string, patch: Partial<ColorSection>) =>
    onChange({ ...plan, colors: plan.colors.map((c) => (c.color === color ? { ...c, ...patch } : c)) });

  /** Picking colours opens one section per colour. Sections that stay keep everything typed into them. */
  const setColors = (names: string[]) => {
    const kept = new Map(plan.colors.map((c) => [c.color.toLowerCase(), c]));
    const next = sortColorNames(names).map((name) => kept.get(name.toLowerCase()) ?? { color: name, photo: '', aiPhoto: '', sizes: [] });
    onChange({ ...plan, colors: next });
    const added = next.find((c) => !kept.has(c.color.toLowerCase()));
    if (added) setActiveColor(added.color);
    else if (!next.some((c) => c.color === activeColor)) setActiveColor(next[0]?.color ?? '');
  };

  const setSizesFor = (color: string, names: string[]) => {
    const section = plan.colors.find((c) => c.color === color);
    if (!section) return;
    const kept = new Map(section.sizes.map((s) => [sizeKey(s.size), s]));
    patchColor(color, { sizes: sortSizeNames(names).map((name) => kept.get(sizeKey(name)) ?? { size: name, qty: '0' }) });
  };

  /** Same sizes for every colour. Counts already typed are kept; new rows start at 0. */
  const copySizesToAll = (fromColor: string) => {
    const source = plan.colors.find((c) => c.color === fromColor);
    if (!source) return;
    onChange({
      ...plan,
      colors: plan.colors.map((c) => {
        const kept = new Map(c.sizes.map((s) => [sizeKey(s.size), s]));
        return { ...c, sizes: source.sizes.map((s) => kept.get(sizeKey(s.size)) ?? { size: s.size, qty: '0' }) };
      }),
    });
  };

  const setSizeSetting = (size: string, patch: Partial<{ price: string; lowStock: string }>) => {
    const current = plan.sizeSettings[sizeKey(size)] ?? { price: '', lowStock: '' };
    onChange({ ...plan, sizeSettings: { ...plan.sizeSettings, [sizeKey(size)]: { ...current, ...patch } } });
  };

  const colorStatus = (section: ColorSection) => (section.sizes.length === 0 ? 'empty' : 'ok');

  return (
    <div className="space-y-5 text-xs">
      {/* Where the numbers come from */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-3 ${
          totalStock <= 0 ? 'border-amber-200 bg-amber-50' : plan.colors.length > 0 && !problem ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
        }`}
      >
        {totalStock <= 0 ? (
          <p className="font-semibold text-amber-800">First enter your Total stock on the Price &amp; stock step. It is shared out across colours and sizes here.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>
              Total stock <strong className="text-sm text-slate-950">{totalStock}</strong>
            </span>
            <span>
              Assigned <strong className="text-sm text-slate-950">{assigned}</strong>
            </span>
            {plan.colors.length > 0 && (
              <span className={left === 0 ? 'font-bold text-emerald-700' : left < 0 ? 'font-bold text-rose-600' : 'font-bold text-amber-700'}>
                {left === 0 ? 'All assigned ✓' : left > 0 ? `${left} left to assign` : `${-left} too many`}
              </span>
            )}
          </div>
        )}
        <div className="flex gap-2">
          {totalStock <= 0 && (
            <Button type="button" size="sm" variant="outline" onClick={onGoToStock}>
              Go to Price &amp; stock
            </Button>
          )}
          {totalStock > 0 && plan.colors.some((c) => c.sizes.length > 0) && (
            <>
              <Button type="button" size="sm" variant="outline" onClick={() => onChange(splitPlanEvenly(plan, totalStock))}>
                Split evenly
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => onChange(resetQuantities(plan))}>
                Reset to 0
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 1. Colours */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-[240px] flex-1">
            <MultiSelect
              label="1. Which colours does it come in?"
              placeholder="Select one or more colours"
              selected={plan.colors.filter((c) => c.color !== NO_COLOR).map((c) => c.color)}
              onChange={setColors}
              groups={[{ group: 'Colours', options: COLOR_PRESETS.map((c) => c.name) }]}
              swatches={SWATCHES}
              customLabel="Add your own colour"
              maxLength={PRODUCT_LIMITS.variantColorMax}
              showChips={false}
            />
          </div>
          {plan.colors.length === 0 && (
            <Button type="button" size="sm" variant="outline" onClick={() => setColors([NO_COLOR])}>
              Only one colour
            </Button>
          )}
        </div>
        {plan.colors.length === 0 && <p className="text-slate-500">Skip this step if the product comes in a single size and colour.</p>}
      </div>

      {/* 2. One tab per colour */}
      {plan.colors.length > 0 && active && (
        <div className="space-y-3">
          <p className="font-bold text-slate-700">2. Set up each colour</p>

          <div role="tablist" aria-label="Colours" className="flex gap-2 overflow-x-auto pb-1">
            {plan.colors.map((section) => {
              const isActive = section.color === active.color;
              const status = colorStatus(section);
              return (
                <button
                  key={section.color}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveColor(section.color)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 font-bold transition-colors ${
                    isActive ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {SWATCHES[section.color] ? (
                    <span className="h-3.5 w-3.5 rounded-full border border-slate-300" style={{ backgroundColor: SWATCHES[section.color] }} />
                  ) : (
                    <span className="h-3.5 w-3.5 rounded-full border border-slate-300 bg-slate-200" />
                  )}
                  {section.color === NO_COLOR ? 'Your product' : section.color}
                  <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>{sectionTotal(section)}</span>
                  {status === 'ok' ? (
                    <CheckCircle2 className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-300' : 'text-emerald-500'}`} />
                  ) : (
                    <AlertCircle className={`h-3.5 w-3.5 ${isActive ? 'text-amber-300' : 'text-amber-500'}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* The open colour */}
          <div role="tabpanel" className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-950">
                {SWATCHES[active.color] && <span className="h-4 w-4 rounded-full border border-slate-300" style={{ backgroundColor: SWATCHES[active.color] }} />}
                {active.color === NO_COLOR ? 'Sizes' : active.color}
              </p>
              <p className="text-slate-500">
                <strong className="text-slate-900">{sectionTotal(active)}</strong> pieces in this colour
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Sizes and how many */}
              <div className="space-y-3">
                <MultiSelect
                  label="Sizes in this colour"
                  placeholder="Select the sizes you have"
                  selected={active.sizes.map((s) => s.size)}
                  onChange={(names) => setSizesFor(active.color, names)}
                  groups={SIZE_PRESETS}
                  customLabel="Add your own size"
                  maxLength={PRODUCT_LIMITS.variantSizeMax}
                  showChips={false}
                />

                {active.sizes.length > 0 ? (
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {active.sizes.map((line) => (
                      <li key={line.size} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-950 px-2 py-0.5 text-[11px] font-bold text-white">{line.size}</span>
                          <button
                            type="button"
                            aria-label={`Remove size ${line.size} from ${active.color}`}
                            onClick={() => setSizesFor(active.color, active.sizes.map((s) => s.size).filter((s) => s !== line.size))}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                        <label className="flex items-center gap-2 text-slate-500">
                          pieces
                          <input
                            inputMode="numeric"
                            aria-label={`Pieces of ${line.size} in ${active.color}`}
                            value={line.qty}
                            onChange={(e) =>
                              patchColor(active.color, { sizes: active.sizes.map((s) => (s.size === line.size ? { ...s, qty: cleanDigits(e.target.value) } : s)) })
                            }
                            onFocus={(e) => e.currentTarget.select()}
                            className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right font-bold tabular-nums text-slate-900"
                          />
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-3 font-semibold text-amber-800">Pick the sizes this colour comes in.</p>
                )}

                {active.sizes.length > 0 && plan.colors.length > 1 && (
                  <Button type="button" size="sm" variant="outline" onClick={() => copySizesToAll(active.color)} title="Give every colour these sizes">
                    <Copy className="h-3.5 w-3.5" /> Same sizes for every colour
                  </Button>
                )}
              </div>

              {/* Photos of this colour */}
              <div className="grid grid-cols-2 gap-3">
                <PhotoSlot
                  title="Store photo"
                  hint="Shoppers see this when they pick this colour."
                  imageUrl={active.photo}
                  busy={uploading === `${active.color}|store`}
                  onFile={(file) => onUploadPhoto(active.color, 'store', file)}
                  onRemove={() => patchColor(active.color, { photo: '' })}
                />
                <PhotoSlot
                  title="AI photo"
                  hint="Flat, front view, plain background. Not shown to shoppers."
                  imageUrl={active.aiPhoto}
                  busy={uploading === `${active.color}|ai`}
                  onFile={(file) => onUploadPhoto(active.color, 'ai', file)}
                  onRemove={() => patchColor(active.color, { aiPhoto: '' })}
                />
                <p className="col-span-2 text-[11px] text-slate-500">Optional. Without them, the product&apos;s main photos from the Images step are used.</p>
              </div>
            </div>
          </div>

          {/* Price and alert per size (shared by every colour) */}
          {sizes.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="font-bold text-slate-800">3. Price and low-stock alert for each size</p>
                <p className="text-[11px] text-slate-500">These apply to a size in every colour. Leave a price empty to use the product price.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-2">Size</th>
                      <th className="px-2 py-2">In stock</th>
                      <th className="px-2 py-2">Price (৳)</th>
                      <th className="px-4 py-2">Alert when below</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sizes.map((size) => {
                      const setting = plan.sizeSettings[sizeKey(size)] ?? { price: '', lowStock: '' };
                      const inStock = sizeTotal(plan, size);
                      const belowAlert = setting.lowStock !== '' && inStock < toNum(setting.lowStock);
                      return (
                        <tr key={size}>
                          <td className="px-4 py-2">
                            <span className="rounded-md bg-slate-950 px-2 py-0.5 text-[11px] font-bold text-white">{size}</span>
                          </td>
                          <td className="px-2 py-2 font-semibold tabular-nums text-slate-700">
                            {inStock}
                            {belowAlert && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">below alert</span>}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              inputMode="decimal"
                              aria-label={`Price for size ${size}`}
                              value={setting.price}
                              onChange={(e) => setSizeSetting(size, { price: e.target.value.replace(/[^0-9.]/g, '') })}
                              placeholder={basePrice > 0 ? `Same as ${basePrice}` : 'Same as product'}
                              className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-right tabular-nums"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              inputMode="numeric"
                              aria-label={`Low-stock alert for size ${size}`}
                              value={setting.lowStock}
                              onChange={(e) => setSizeSetting(size, { lowStock: cleanDigits(e.target.value) })}
                              placeholder="No alert"
                              className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-right tabular-nums"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {(problem || error) && (
        <p role="alert" className="font-medium text-rose-600">
          {problem || error}
        </p>
      )}
    </div>
  );
}
