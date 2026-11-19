import { ProductVariant } from '../../types';
import { PRODUCT_LIMITS } from '../../lib/productContract';

// Pure allocation logic for colours and sizes (no UI), so it can be tested on its own.

/**
 * Colour-first. The brand picks colours; every colour gets its own section with its own photos and sizes:
 *
 *   Total stock (100)
 *     ├─ Black   photos + sizes:  S 10, M 20, L 10        (40)
 *     ├─ Red     photos + sizes:  S 10, M 20             (30)
 *     └─ Navy    photos + sizes:  M 15, L 15              (30)
 *
 * A price and a low-stock alert belong to a size (the same for every colour), so they live in one small
 * table of "size settings". Quantities are kept as text while typing; `planToVariants` turns the plan into
 * the flat size × colour list the backend stores.
 */
export interface ColorSizeLine {
  size: string;
  qty: string;
}
export interface ColorSection {
  color: string;
  /** Store photo of this colour, shown to shoppers. Empty means "use the product's main photo". */
  photo: string;
  /** Clear flat photo of this colour for the AI try-on. Empty means "use the product's AI reference photo". */
  aiPhoto: string;
  sizes: ColorSizeLine[];
}
export interface SizeSetting {
  /** As typed. Empty means "same as the product price". */
  price: string;
  /** As typed. Empty means "no alert for this size". */
  lowStock: string;
}
export interface VariantPlan {
  colors: ColorSection[];
  /** Keyed by the size in lower case. */
  sizeSettings: Record<string, SizeSetting>;
}

export const EMPTY_PLAN: VariantPlan = { colors: [], sizeSettings: {} };

/** Used when the product has a single colour. */
export const NO_COLOR = 'Standard';

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

export const SWATCHES: Record<string, string> = Object.fromEntries(COLOR_PRESETS.map((c) => [c.name, c.hex]));

// ─── Sorting: sizes small → large, colours in the standard order, your own values last ───

const SIZE_ORDER = SIZE_PRESETS.flatMap((g) => g.options).map((s) => s.toLowerCase());
const COLOR_ORDER = COLOR_PRESETS.map((c) => c.name.toLowerCase());

function rank(order: string[], value: string): number {
  const index = order.indexOf(value.toLowerCase());
  return index === -1 ? order.length : index;
}

export function sortSizeNames(names: string[]): string[] {
  return [...names].sort((a, b) => rank(SIZE_ORDER, a) - rank(SIZE_ORDER, b) || a.localeCompare(b, undefined, { numeric: true }));
}
export function sortColorNames(names: string[]): string[] {
  return [...names].sort((a, b) => rank(COLOR_ORDER, a) - rank(COLOR_ORDER, b) || a.localeCompare(b));
}

export const sizeKey = (size: string) => size.toLowerCase();

// ─── Numbers ───

export const toNum = (text: string | undefined): number => Math.max(0, Math.floor(Number(text || 0)) || 0);
export const cleanDigits = (text: string) => text.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');

/** Price from text: empty means "same as the product price"; anything else is parsed as typed. */
export function parsePrice(text: string | undefined): number | undefined {
  const trimmed = (text || '').trim();
  if (trimmed === '') return undefined;
  const value = Number(trimmed);
  return Number.isNaN(value) ? Number.NaN : value;
}

/** Alert level from text: empty means "no alert for this size". */
export function parseAlert(text: string | undefined): number | undefined {
  const trimmed = (text || '').trim();
  if (trimmed === '') return undefined;
  const value = Number(trimmed);
  return Number.isNaN(value) ? Number.NaN : value;
}

/** Shares `total` evenly. What does not divide equally goes one-by-one to the first lines, so nothing is lost. */
export function splitEvenlyInto(count: number, total: number): number[] {
  if (count === 0) return [];
  const base = Math.floor(total / count);
  let remainder = total - base * count;
  return Array.from({ length: count }, () => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return base + extra;
  });
}

// ─── Reading the plan ───

export const sectionTotal = (section: ColorSection): number => section.sizes.reduce((sum, s) => sum + toNum(s.qty), 0);
export const assignedTotal = (plan: VariantPlan): number => plan.colors.reduce((sum, c) => sum + sectionTotal(c), 0);

/** Every size used anywhere in the plan, small to large. */
export function usedSizes(plan: VariantPlan): string[] {
  const seen = new Map<string, string>();
  for (const c of plan.colors) for (const s of c.sizes) if (!seen.has(sizeKey(s.size))) seen.set(sizeKey(s.size), s.size);
  return sortSizeNames([...seen.values()]);
}

/** Pieces of one size added up across all colours. */
export function sizeTotal(plan: VariantPlan, size: string): number {
  return plan.colors.reduce((sum, c) => sum + c.sizes.filter((s) => sizeKey(s.size) === sizeKey(size)).reduce((n, s) => n + toNum(s.qty), 0), 0);
}

/** Share the total evenly over every colour × size row. */
export function splitPlanEvenly(plan: VariantPlan, total: number): VariantPlan {
  const rows = plan.colors.reduce((n, c) => n + c.sizes.length, 0);
  const parts = splitEvenlyInto(rows, total);
  let i = 0;
  return { ...plan, colors: plan.colors.map((c) => ({ ...c, sizes: c.sizes.map((s) => ({ ...s, qty: String(parts[i++]) })) })) };
}

export function resetQuantities(plan: VariantPlan): VariantPlan {
  return { ...plan, colors: plan.colors.map((c) => ({ ...c, sizes: c.sizes.map((s) => ({ ...s, qty: '0' })) })) };
}

// ─── Plan <-> variants ───

const skuPart = (text: string, max: number) => text.replace(/[^A-Za-z0-9]/g, '').slice(0, max).toUpperCase() || 'X';

/** The flat size × colour list the backend stores, with unique SKUs built from the master SKU. */
export function planToVariants(plan: VariantPlan, masterSku: string): ProductVariant[] {
  const used = new Set<string>();
  const base = masterSku.trim();
  const out: ProductVariant[] = [];
  for (const section of plan.colors) {
    for (const line of section.sizes) {
      const stem = `${base}-${skuPart(section.color, 4)}-${skuPart(line.size, 6)}`;
      let sku = stem;
      let n = 2;
      while (used.has(sku.toLowerCase())) sku = `${stem}-${n++}`;
      used.add(sku.toLowerCase());
      const qty = toNum(line.qty);
      const setting = plan.sizeSettings[sizeKey(line.size)];
      const price = parsePrice(setting?.price);
      const alert = parseAlert(setting?.lowStock);
      out.push({
        id: `var_${out.length + 1}`,
        sku,
        size: line.size,
        color: section.color,
        stockQuantity: qty,
        available: qty > 0,
        ...(price !== undefined ? { price } : {}),
        ...(section.photo ? { imageUrl: section.photo } : {}),
        ...(alert !== undefined ? { lowStockThreshold: alert } : {}),
        ...(section.aiPhoto ? { aiImageUrl: section.aiPhoto } : {}),
      });
    }
  }
  return out;
}

/** Rebuilds the plan when an existing product is opened for editing. */
export function variantsToPlan(variants: ProductVariant[] | undefined): VariantPlan {
  if (!variants || variants.length === 0) return EMPTY_PLAN;
  const byColor = new Map<string, ColorSection>();
  const sizeSettings: Record<string, SizeSetting> = {};
  for (const v of variants) {
    const section = byColor.get(v.color) ?? { color: v.color, photo: '', aiPhoto: '', sizes: [] };
    if (v.imageUrl) section.photo = v.imageUrl;
    if (v.aiImageUrl) section.aiPhoto = v.aiImageUrl;
    section.sizes.push({ size: v.size, qty: String(v.stockQuantity ?? 0) });
    byColor.set(v.color, section);
    const existing = sizeSettings[sizeKey(v.size)] ?? { price: '', lowStock: '' };
    if (typeof v.price === 'number') existing.price = String(v.price);
    if (typeof v.lowStockThreshold === 'number') existing.lowStock = String(v.lowStockThreshold);
    sizeSettings[sizeKey(v.size)] = existing;
  }
  const colors = sortColorNames([...byColor.keys()]).map((name) => {
    const section = byColor.get(name)!;
    return { ...section, sizes: sortSizeNames(section.sizes.map((s) => s.size)).map((size) => section.sizes.find((s) => s.size === size)!) };
  });
  return { colors, sizeSettings };
}

/** What is wrong with the plan, in plain words (or nothing). Used to lock the step until it is right. */
export function planProblem(plan: VariantPlan, totalStock: number): string | undefined {
  if (plan.colors.length === 0) return undefined;

  for (const section of plan.colors) {
    if (section.sizes.length === 0) {
      return section.color === NO_COLOR
        ? 'Add at least one size.'
        : `${section.color}: add at least one size, or remove this colour.`;
    }
  }

  for (const size of usedSizes(plan)) {
    const setting = plan.sizeSettings[sizeKey(size)];
    const price = parsePrice(setting?.price);
    if (price !== undefined && (Number.isNaN(price) || price <= 0 || Math.round(price * 100) / 100 !== price || price > PRODUCT_LIMITS.priceMax)) {
      return `Size ${size}: enter a price above 0 with at most 2 decimals, or leave it empty to use the product price.`;
    }
    const alert = parseAlert(setting?.lowStock);
    if (alert !== undefined && (Number.isNaN(alert) || !Number.isInteger(alert) || alert < 0 || alert > PRODUCT_LIMITS.lowStockMax)) {
      return `Size ${size}: enter a whole number of pieces for the low-stock alert, or leave it empty for no alert.`;
    }
  }

  const assigned = assignedTotal(plan);
  if (assigned !== totalStock) {
    return assigned < totalStock
      ? `Assign all ${totalStock} items to colours and sizes (${totalStock - assigned} left).`
      : `Colours and sizes add up to ${assigned}, which is ${assigned - totalStock} more than the total stock of ${totalStock}.`;
  }

  const combos = plan.colors.reduce((n, c) => n + c.sizes.length, 0);
  if (combos > PRODUCT_LIMITS.variantsMax) {
    return `That is ${combos} colour and size combinations. The most allowed is ${PRODUCT_LIMITS.variantsMax}.`;
  }
  return undefined;
}

/** Sizes that are below the alert level set for them (all colours of a size added up). */
export function lowSizesOfVariants(variants: ProductVariant[] | undefined): Array<{ size: string; stock: number; threshold: number }> {
  const totals = new Map<string, number>();
  const levels = new Map<string, number>();
  for (const v of variants || []) {
    totals.set(v.size, (totals.get(v.size) ?? 0) + (v.stockQuantity || 0));
    if (typeof v.lowStockThreshold === 'number') levels.set(v.size, v.lowStockThreshold);
  }
  const out: Array<{ size: string; stock: number; threshold: number }> = [];
  for (const [size, stock] of totals) {
    const threshold = levels.get(size);
    if (threshold !== undefined && stock < threshold) out.push({ size, stock, threshold });
  }
  return out;
}
