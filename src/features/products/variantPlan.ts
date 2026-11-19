import { ProductVariant } from '../../types';
import { PRODUCT_LIMITS } from '../../lib/productContract';

// Pure allocation logic for sizes and colours (no UI), so it can be tested on its own.

/**
 * Stock is shared out top-down, and every level adds up to the level above:
 *
 *   Total stock (100)
 *     └─ per size:   XL = 20, L = 30, M = 50           (sizes add up to the total)
 *          └─ per colour inside a size: XL → Red 12, Black 8   (colours add up to that size)
 *
 * Quantities are kept as text while typing. `planToVariants` turns the plan into the flat size × colour
 * list the backend stores.
 */
export interface ColorLine {
  color: string;
  qty: string;
}
export interface SizeLine {
  size: string;
  qty: string;
  colors: ColorLine[];
}
export interface VariantPlan {
  sizes: SizeLine[];
}

export const EMPTY_PLAN: VariantPlan = { sizes: [] };

/** Used when a size has no colours picked. */
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

// ─── Numbers ───

export const toNum = (text: string | undefined): number => Math.max(0, Math.floor(Number(text || 0)) || 0);
export const cleanDigits = (text: string) => text.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');

export const sizeColorTotal = (line: SizeLine): number => line.colors.reduce((sum, c) => sum + toNum(c.qty), 0);
export const sizesTotal = (plan: VariantPlan): number => plan.sizes.reduce((sum, s) => sum + toNum(s.qty), 0);

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

// ─── Plan <-> variants ───

const skuPart = (text: string, max: number) => text.replace(/[^A-Za-z0-9]/g, '').slice(0, max).toUpperCase() || 'X';

/** The flat size × colour list the backend stores, with unique SKUs built from the master SKU. */
export function planToVariants(plan: VariantPlan, masterSku: string): ProductVariant[] {
  const used = new Set<string>();
  const base = masterSku.trim();
  const out: ProductVariant[] = [];
  for (const line of plan.sizes) {
    const entries = line.colors.length > 0 ? line.colors.map((c) => ({ color: c.color, qty: toNum(c.qty) })) : [{ color: NO_COLOR, qty: toNum(line.qty) }];
    for (const entry of entries) {
      const stem = `${base}-${skuPart(entry.color, 4)}-${skuPart(line.size, 6)}`;
      let sku = stem;
      let n = 2;
      while (used.has(sku.toLowerCase())) sku = `${stem}-${n++}`;
      used.add(sku.toLowerCase());
      out.push({ id: `var_${out.length + 1}`, sku, size: line.size, color: entry.color, stockQuantity: entry.qty, available: entry.qty > 0 });
    }
  }
  return out;
}

/** Rebuilds the plan when an existing product is opened for editing. */
export function variantsToPlan(variants: ProductVariant[] | undefined): VariantPlan {
  if (!variants || variants.length === 0) return EMPTY_PLAN;
  const bySize = new Map<string, ColorLine[]>();
  for (const v of variants) {
    const list = bySize.get(v.size) ?? [];
    list.push({ color: v.color, qty: String(v.stockQuantity ?? 0) });
    bySize.set(v.size, list);
  }
  const sizes: SizeLine[] = sortSizeNames([...bySize.keys()]).map((size) => {
    const lines = bySize.get(size)!;
    const colors = lines.length === 1 && lines[0].color === NO_COLOR ? [] : sortColorNames(lines.map((l) => l.color)).map((c) => lines.find((l) => l.color === c)!);
    return { size, qty: String(lines.reduce((sum, l) => sum + toNum(l.qty), 0)), colors };
  });
  return { sizes };
}

/** What is wrong with the plan, in plain words (or nothing). Used to lock the step until it adds up. */
export function planProblem(plan: VariantPlan, totalStock: number): string | undefined {
  if (plan.sizes.length === 0) return undefined;
  const assigned = sizesTotal(plan);
  if (assigned !== totalStock) {
    return assigned < totalStock
      ? `Assign all ${totalStock} items to sizes (${totalStock - assigned} left).`
      : `Sizes add up to ${assigned}, which is ${assigned - totalStock} more than the total stock of ${totalStock}.`;
  }
  for (const line of plan.sizes) {
    if (line.colors.length === 0) continue;
    const colored = sizeColorTotal(line);
    const qty = toNum(line.qty);
    if (colored !== qty) {
      return colored < qty
        ? `Size ${line.size}: assign all ${qty} pieces to colours (${qty - colored} left).`
        : `Size ${line.size}: colours add up to ${colored}, which is ${colored - qty} more than ${qty}.`;
    }
  }
  const combos = plan.sizes.reduce((n, s) => n + Math.max(1, s.colors.length), 0);
  if (combos > PRODUCT_LIMITS.variantsMax) return `That is ${combos} size and colour combinations. The most allowed is ${PRODUCT_LIMITS.variantsMax}.`;
  return undefined;
}

