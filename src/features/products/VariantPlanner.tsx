'use client';

import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { ProductVariant } from '../../types';
import { PRODUCT_LIMITS } from '../../lib/productContract';
import { Button } from '../../components/ui/button';

/**
 * What the brand picks: which sizes, which colours, and how many pieces of each combination.
 * Quantities are kept as text while typing and turned into real variants by `planToVariants`.
 */
export interface VariantPlan {
  sizes: string[];
  colors: string[];
  /** Pieces per combination, keyed "size|colour". */
  qty: Record<string, string>;
}

export const EMPTY_PLAN: VariantPlan = { sizes: [], colors: [], qty: {} };

/** Used when only sizes or only colours are chosen. */
const NO_SIZE = 'One Size';
const NO_COLOR = 'Standard';

export const SIZE_PRESETS: Array<{ group: string; options: string[] }> = [
  { group: 'Letter sizes', options: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'] },
  { group: 'Number sizes', options: ['28', '30', '32', '34', '36', '38', '40', '42', '44'] },
  { group: 'Other', options: ['Free Size', 'One Size'] },
];

export const COLOR_PRESETS: Array<{ name: string; hex: string }> = [
  { name: 'Black', hex: '#111827' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Ivory', hex: '#f5efe0' },
  { name: 'Beige', hex: '#d9c7a4' },
  { name: 'Grey', hex: '#9ca3af' },
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Olive', hex: '#6b7a2f' },
  { name: 'Yellow', hex: '#facc15' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Maroon', hex: '#7f1d1d' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Purple', hex: '#7c3aed' },
  { name: 'Brown', hex: '#78350f' },
];

export const variantKey = (size: string, color: string) => `${size}|${color}`;

/** The size × colour combinations the plan describes. */
export function planCombos(plan: VariantPlan): Array<{ size: string; color: string }> {
  if (plan.sizes.length === 0 && plan.colors.length === 0) return [];
  const sizes = plan.sizes.length > 0 ? plan.sizes : [NO_SIZE];
  const colors = plan.colors.length > 0 ? plan.colors : [NO_COLOR];
  const combos: Array<{ size: string; color: string }> = [];
  for (const color of colors) for (const size of sizes) combos.push({ size, color });
  return combos;
}

const skuPart = (text: string, max: number) => text.replace(/[^A-Za-z0-9]/g, '').slice(0, max).toUpperCase() || 'X';

/** Real variants (with unique SKUs built from the master SKU) from what the brand picked. */
export function planToVariants(plan: VariantPlan, masterSku: string): ProductVariant[] {
  const used = new Set<string>();
  const base = masterSku.trim();
  return planCombos(plan).map(({ size, color }, index) => {
    const parts = `${base}-${skuPart(color, 4)}-${skuPart(size, 6)}`;
    let sku = parts;
    let n = 2;
    while (used.has(sku.toLowerCase())) sku = `${parts}-${n++}`;
    used.add(sku.toLowerCase());
    const quantity = Math.max(0, Math.floor(Number(plan.qty[variantKey(size, color)] || 0)) || 0);
    return {
      id: `var_${index + 1}`,
      sku,
      size,
      color,
      stockQuantity: quantity,
      available: quantity > 0,
    };
  });
}

/** Rebuilds the plan when an existing product is opened for editing. */
export function variantsToPlan(variants: ProductVariant[] | undefined): VariantPlan {
  if (!variants || variants.length === 0) return EMPTY_PLAN;
  const sizes: string[] = [];
  const colors: string[] = [];
  const qty: Record<string, string> = {};
  for (const v of variants) {
    if (v.size !== NO_SIZE && !sizes.includes(v.size)) sizes.push(v.size);
    if (v.color !== NO_COLOR && !colors.includes(v.color)) colors.push(v.color);
    qty[variantKey(v.size, v.color)] = String(v.stockQuantity ?? 0);
  }
  return { sizes, colors, qty };
}

export function assignedTotal(plan: VariantPlan): number {
  return planCombos(plan).reduce((sum, c) => sum + (Math.max(0, Math.floor(Number(plan.qty[variantKey(c.size, c.color)] || 0)) || 0)), 0);
}

/** Shares the total evenly. Whatever does not divide equally goes one-by-one to the first combinations, so nothing is lost. */
export function splitEvenly(plan: VariantPlan, total: number): Record<string, string> {
  const combos = planCombos(plan);
  const qty: Record<string, string> = {};
  if (combos.length === 0) return qty;
  const base = Math.floor(total / combos.length);
  let remainder = total - base * combos.length;
  for (const c of combos) {
    qty[variantKey(c.size, c.color)] = String(base + (remainder > 0 ? 1 : 0));
    if (remainder > 0) remainder -= 1;
  }
  return qty;
}

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
}: {
  label: string;
  placeholder: string;
  selected: string[];
  onChange: (next: string[]) => void;
  groups: Array<{ group: string; options: string[] }>;
  swatches?: Record<string, string>;
  customLabel: string;
  maxLength: number;
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
  const customSelected = selected.filter((s) => !groups.some((g) => g.options.some((o) => o.toLowerCase() === s.toLowerCase())));

  return (
    <div className="relative">
      <label className="mb-1 block font-bold text-slate-700">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left"
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
                      {swatches?.[option] && (
                        <span className="h-3.5 w-3.5 rounded-full border border-slate-300" style={{ backgroundColor: swatches[option] }} />
                      )}
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

      {selected.length > 0 && (
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
      {customSelected.length > 0 && <span className="sr-only">{customSelected.length} custom values</span>}
    </div>
  );
}

// ─── The planner ─────────────────────────────────────────────────────────────

export function VariantPlanner({
  plan,
  onChange,
  totalStock,
  error,
  onGoToStock,
}: {
  plan: VariantPlan;
  onChange: (next: VariantPlan) => void;
  /** The "Total stock" typed on the Price & stock step. This is what gets shared out. */
  totalStock: number;
  error?: string;
  onGoToStock: () => void;
}) {
  const combos = useMemo(() => planCombos(plan), [plan]);
  const assigned = assignedTotal(plan);
  const left = totalStock - assigned;
  const swatches = useMemo(() => Object.fromEntries(COLOR_PRESETS.map((c) => [c.name, c.hex])), []);

  /** Changing the sizes or colours keeps the counts of combinations that stay, and gives new ones 0. */
  const update = (next: Partial<VariantPlan>) => {
    const merged = { ...plan, ...next };
    const qty: Record<string, string> = {};
    for (const c of planCombos(merged)) {
      const key = variantKey(c.size, c.color);
      qty[key] = plan.qty[key] ?? '0';
    }
    onChange({ ...merged, qty });
  };

  const setQty = (size: string, color: string, text: string) => {
    const clean = text.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
    onChange({ ...plan, qty: { ...plan.qty, [variantKey(size, color)]: clean } });
  };

  const colorsToShow = plan.colors.length > 0 ? plan.colors : [NO_COLOR];
  const sizesToShow = plan.sizes.length > 0 ? plan.sizes : [NO_SIZE];
  const showColorHeading = plan.colors.length > 0;

  return (
    <div className="space-y-4 text-xs">
      {/* Where the numbers come from */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-3 ${
          totalStock <= 0
            ? 'border-amber-200 bg-amber-50'
            : left === 0
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-slate-200 bg-slate-50'
        }`}
      >
        {totalStock <= 0 ? (
          <p className="font-semibold text-amber-800">
            First enter your Total stock on the Price &amp; stock step. It is shared out across sizes and colours here.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>
              Total stock <strong className="text-sm text-slate-950">{totalStock}</strong>
            </span>
            <span>
              Assigned <strong className="text-sm text-slate-950">{assigned}</strong>
            </span>
            <span className={left === 0 ? 'font-bold text-emerald-700' : left < 0 ? 'font-bold text-rose-600' : 'font-bold text-amber-700'}>
              {left === 0 ? 'All assigned ✓' : left > 0 ? `${left} left to assign` : `${-left} too many`}
            </span>
          </div>
        )}
        <div className="flex gap-2">
          {totalStock <= 0 && (
            <Button type="button" size="sm" variant="outline" onClick={onGoToStock}>
              Go to Price &amp; stock
            </Button>
          )}
          {totalStock > 0 && combos.length > 0 && (
            <>
              <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...plan, qty: splitEvenly(plan, totalStock) })}>
                Split evenly
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...plan, qty: Object.fromEntries(combos.map((c) => [variantKey(c.size, c.color), '0'])) })}>
                Reset to 0
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MultiSelect
          label="Sizes"
          placeholder="Select one or more sizes"
          selected={plan.sizes}
          onChange={(sizes) => update({ sizes })}
          groups={SIZE_PRESETS}
          customLabel="Add your own size"
          maxLength={PRODUCT_LIMITS.variantSizeMax}
        />
        <MultiSelect
          label="Colours"
          placeholder="Select one or more colours"
          selected={plan.colors}
          onChange={(colors) => update({ colors })}
          groups={[{ group: 'Colours', options: COLOR_PRESETS.map((c) => c.name) }]}
          swatches={swatches}
          customLabel="Add your own colour"
          maxLength={PRODUCT_LIMITS.variantColorMax}
        />
      </div>

      {combos.length > PRODUCT_LIMITS.variantsMax && (
        <p role="alert" className="font-medium text-rose-600">
          That is {combos.length} combinations. The most allowed is {PRODUCT_LIMITS.variantsMax}. Remove some sizes or colours.
        </p>
      )}

      {combos.length > 0 && (
        <div className="space-y-3">
          <p className="font-bold text-slate-700">How many of each?</p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {colorsToShow.map((color) => {
              const subtotal = sizesToShow.reduce((sum, size) => sum + (Number(plan.qty[variantKey(size, color)] || 0) || 0), 0);
              return (
                <div key={color} className="rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                    <span className="flex items-center gap-2 font-bold text-slate-900">
                      {showColorHeading && swatches[color] && <span className="h-3.5 w-3.5 rounded-full border border-slate-300" style={{ backgroundColor: swatches[color] }} />}
                      {showColorHeading ? color : 'All sizes'}
                    </span>
                    <span className="text-slate-500">{subtotal} pcs</span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {sizesToShow.map((size) => (
                      <li key={size} className="flex items-center justify-between gap-3 px-3 py-1.5">
                        <span className="font-semibold text-slate-700">{size}</span>
                        <input
                          inputMode="numeric"
                          aria-label={`Pieces of ${size}${showColorHeading ? ` in ${color}` : ''}`}
                          value={plan.qty[variantKey(size, color)] ?? '0'}
                          onChange={(e) => setQty(size, color, e.target.value)}
                          onFocus={(e) => e.currentTarget.select()}
                          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right tabular-nums"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="font-medium text-rose-600">
          {error}
        </p>
      )}
      {combos.length === 0 && <p className="text-slate-500">Skip this step if the product comes in a single size and colour.</p>}
    </div>
  );
}
