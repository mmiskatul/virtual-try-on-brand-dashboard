'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, ImagePlus, Loader2, Plus, Upload, X } from 'lucide-react';
import { SafeImage } from '../../components/shared/UiPrimitives';
import { PRODUCT_LIMITS } from '../../lib/productContract';
import { Button } from '../../components/ui/button';
import {
  COLOR_PRESETS,
  NO_COLOR,
  SIZE_PRESETS,
  SWATCHES,
  SizeLine,
  VariantPlan,
  cleanDigits,
  colorKey,
  planColors,
  planProblem,
  sizeColorTotal,
  sizesTotal,
  sortColorNames,
  sortSizeNames,
  splitEvenlyInto,
  toNum,
} from './variantPlan';

export type { VariantPlan } from './variantPlan';

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
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            {groups.map((g) => (
              <div key={g.group} className="mb-2">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{g.group}</p>
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
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{customLabel}</p>
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

// ─── Photo for one colour ────────────────────────────────────────────────────

function ColorPhotoTile({
  color,
  imageUrl,
  busy,
  onFile,
  onRemove,
}: {
  color: string;
  imageUrl: string;
  busy: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 font-semibold text-slate-700">
        {SWATCHES[color] && <span className="h-3 w-3 rounded-full border border-slate-300" style={{ backgroundColor: SWATCHES[color] }} />}
        {color}
      </p>
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
      <div className="group relative h-40 w-full overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
        {imageUrl ? (
          <>
            <SafeImage src={imageUrl} alt={`${color} photo`} fill className="object-contain p-1.5" />
            <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-slate-950/50 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} aria-label={`Replace ${color} photo`} className="rounded-lg bg-white px-2 py-1 font-bold text-slate-900">
                <Upload className="h-3.5 w-3.5" />
              </button>
              <button type="button" disabled={busy} onClick={onRemove} aria-label={`Remove ${color} photo`} className="rounded-lg bg-white px-2 py-1 font-bold text-rose-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        ) : (
          <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-500">
            <ImagePlus className="h-5 w-5" />
            <span className="font-semibold">Upload photo</span>
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
  onUploadColorPhoto,
  uploadingColor,
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
  onUploadColorPhoto: (color: string, file: File) => void;
  uploadingColor: string | null;
}) {
  const assigned = sizesTotal(plan);
  const left = totalStock - assigned;
  const problem = useMemo(() => planProblem(plan, totalStock), [plan, totalStock]);
  const colorsInPlan = useMemo(() => planColors(plan), [plan]);

  const setSizes = (names: string[]) => {
    const kept = new Map(plan.sizes.map((s) => [s.size.toLowerCase(), s]));
    const next = sortSizeNames(names).map((name) => kept.get(name.toLowerCase()) ?? { size: name, qty: '0', price: '', lowStock: '', colors: [] });
    onChange({ ...plan, sizes: next });
  };
  const patchSize = (size: string, patch: Partial<SizeLine>) =>
    onChange({ ...plan, sizes: plan.sizes.map((s) => (s.size === size ? { ...s, ...patch } : s)) });

  const setColors = (size: string, names: string[]) => {
    const line = plan.sizes.find((s) => s.size === size);
    if (!line) return;
    const kept = new Map(line.colors.map((c) => [c.color.toLowerCase(), c]));
    const colors = sortColorNames(names).map((name) => kept.get(name.toLowerCase()) ?? { color: name, qty: '0' });
    patchSize(size, { colors });
  };

  const splitSizes = () => {
    const parts = splitEvenlyInto(plan.sizes.length, totalStock);
    onChange({ ...plan, sizes: plan.sizes.map((s, i) => ({ ...s, qty: String(parts[i]) })) });
  };
  const splitColors = (size: string) => {
    const line = plan.sizes.find((s) => s.size === size);
    if (!line || line.colors.length === 0) return;
    const parts = splitEvenlyInto(line.colors.length, toNum(line.qty));
    patchSize(size, { colors: line.colors.map((c, i) => ({ ...c, qty: String(parts[i]) })) });
  };
  /** Same colours for every size; each size shares its own pieces evenly across them. */
  const copyColorsToAll = (fromSize: string) => {
    const source = plan.sizes.find((s) => s.size === fromSize);
    if (!source) return;
    onChange({
      ...plan,
      sizes: plan.sizes.map((s) => {
        const parts = splitEvenlyInto(source.colors.length, toNum(s.qty));
        return { ...s, colors: source.colors.map((c, i) => ({ color: c.color, qty: String(parts[i]) })) };
      }),
    });
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Where the numbers come from */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-3 ${
          totalStock <= 0 ? 'border-amber-200 bg-amber-50' : plan.sizes.length > 0 && !problem ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
        }`}
      >
        {totalStock <= 0 ? (
          <p className="font-semibold text-amber-800">
            First enter your Total stock on the Price &amp; stock step. It is shared out across sizes, then colours, here.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>
              Total stock <strong className="text-sm text-slate-950">{totalStock}</strong>
            </span>
            <span>
              Assigned to sizes <strong className="text-sm text-slate-950">{assigned}</strong>
            </span>
            {plan.sizes.length > 0 && (
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
          {totalStock > 0 && plan.sizes.length > 0 && (
            <>
              <Button type="button" size="sm" variant="outline" onClick={splitSizes}>
                Split evenly across sizes
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onChange({ ...plan, sizes: plan.sizes.map((s) => ({ ...s, qty: '0', colors: s.colors.map((c) => ({ ...c, qty: '0' })) })) })}
              >
                Reset to 0
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Step 1: sizes */}
      <MultiSelect
        label="1. Which sizes?"
        placeholder="Select one or more sizes"
        selected={plan.sizes.map((s) => s.size)}
        onChange={setSizes}
        groups={SIZE_PRESETS}
        customLabel="Add your own size"
        maxLength={PRODUCT_LIMITS.variantSizeMax}
        showChips={false}
      />

      {/* Step 2: per size, how many, then which colours */}
      {plan.sizes.length > 0 && (
        <div className="space-y-3">
          <p className="font-bold text-slate-700">2. How many of each size, and in which colours?</p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {plan.sizes.map((line) => {
              const qty = toNum(line.qty);
              const colored = sizeColorTotal(line);
              const colorLeft = qty - colored;
              return (
                <div key={line.size} className="rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-950 px-2 py-0.5 text-[11px] font-bold text-white">{line.size}</span>
                      <button
                        type="button"
                        aria-label={`Remove size ${line.size}`}
                        onClick={() => setSizes(plan.sizes.map((s) => s.size).filter((s) => s !== line.size))}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                    <label className="flex items-center gap-2 text-slate-500">
                      pieces
                      <input
                        inputMode="numeric"
                        aria-label={`Pieces of size ${line.size}`}
                        value={line.qty}
                        onChange={(e) => patchSize(line.size, { qty: cleanDigits(e.target.value) })}
                        onFocus={(e) => e.currentTarget.select()}
                        className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right font-bold tabular-nums text-slate-900"
                      />
                    </label>
                  </div>

                  <div className="space-y-2 p-3">
                    <label className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-2.5 py-1.5">
                      <span className="font-semibold text-slate-600">Price for {line.size}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-400">৳</span>
                        <input
                          inputMode="decimal"
                          aria-label={`Price for size ${line.size}`}
                          value={line.price}
                          onChange={(e) => patchSize(line.size, { price: e.target.value.replace(/[^0-9.]/g, '') })}
                          placeholder={basePrice > 0 ? `Same as ${basePrice}` : 'Same as product'}
                          className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right tabular-nums"
                        />
                      </span>
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-2.5 py-1.5">
                      <span className="font-semibold text-slate-600">Low-stock alert for {line.size}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-400">below</span>
                        <input
                          inputMode="numeric"
                          aria-label={`Low-stock alert for size ${line.size}`}
                          value={line.lowStock}
                          onChange={(e) => patchSize(line.size, { lowStock: cleanDigits(e.target.value) })}
                          placeholder="No alert"
                          className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right tabular-nums"
                        />
                      </span>
                    </label>
                    {line.lowStock !== '' && qty < toNum(line.lowStock) && (
                      <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 font-semibold text-amber-800">
                        Already below the alert level: {qty} pieces, alert at {toNum(line.lowStock)}.
                      </p>
                    )}
                    <MultiSelect
                      compact
                      showChips={false}
                      placeholder={`Colours for ${line.size} (optional)`}
                      selected={line.colors.map((c) => c.color)}
                      onChange={(names) => setColors(line.size, names)}
                      groups={[{ group: 'Colours', options: COLOR_PRESETS.map((c) => c.name) }]}
                      swatches={SWATCHES}
                      customLabel="Add your own colour"
                      maxLength={PRODUCT_LIMITS.variantColorMax}
                    />

                    {line.colors.length > 0 && (
                      <>
                        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                          {line.colors.map((c) => (
                            <li key={c.color} className="flex items-center justify-between gap-3 px-2.5 py-1.5">
                              <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                                {SWATCHES[c.color] && <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300" style={{ backgroundColor: SWATCHES[c.color] }} />}
                                <span className="truncate">{c.color}</span>
                              </span>
                              <input
                                inputMode="numeric"
                                aria-label={`Pieces of ${line.size} in ${c.color}`}
                                value={c.qty}
                                onChange={(e) =>
                                  patchSize(line.size, {
                                    colors: line.colors.map((x) => (x.color === c.color ? { ...x, qty: cleanDigits(e.target.value) } : x)),
                                  })
                                }
                                onFocus={(e) => e.currentTarget.select()}
                                className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right tabular-nums"
                              />
                            </li>
                          ))}
                        </ul>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={colorLeft === 0 ? 'font-bold text-emerald-700' : colorLeft < 0 ? 'font-bold text-rose-600' : 'font-bold text-amber-700'}>
                            {colorLeft === 0 ? `All ${qty} assigned ✓` : colorLeft > 0 ? `${colorLeft} of ${qty} left to assign` : `${-colorLeft} too many`}
                          </span>
                          <span className="flex gap-1.5">
                            <Button type="button" size="sm" variant="outline" onClick={() => splitColors(line.size)}>
                              Split evenly
                            </Button>
                            {plan.sizes.length > 1 && (
                              <Button type="button" size="sm" variant="outline" onClick={() => copyColorsToAll(line.size)} title="Use these colours for every size">
                                <Copy className="h-3.5 w-3.5" /> Same for all sizes
                              </Button>
                            )}
                          </span>
                        </div>
                      </>
                    )}
                    {line.colors.length === 0 && <p className="text-[11px] text-slate-400">No colours picked: these {qty} pieces are saved as one colour, &quot;{NO_COLOR}&quot;.</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: one photo per colour */}
      {colorsInPlan.length > 0 && (
        <div className="space-y-2">
          <div>
            <p className="font-bold text-slate-700">3. A photo for each colour</p>
            <p className="text-[11px] text-slate-500">
              Shoppers see this photo when they pick the colour, and the try-on uses it. It is used for every size of that colour.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {colorsInPlan.map((color) => (
              <ColorPhotoTile
                key={color}
                color={color}
                imageUrl={plan.colorImages[colorKey(color)] || ''}
                busy={uploadingColor === color}
                onFile={(file) => onUploadColorPhoto(color, file)}
                onRemove={() => {
                  const next = { ...plan.colorImages };
                  delete next[colorKey(color)];
                  onChange({ ...plan, colorImages: next });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {(problem || error) && (
        <p role="alert" className="font-medium text-rose-600">
          {problem || error}
        </p>
      )}
      {plan.sizes.length === 0 && <p className="text-slate-500">Skip this step if the product comes in a single size and colour.</p>}
    </div>
  );
}
