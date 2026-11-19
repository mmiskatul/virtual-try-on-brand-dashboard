import { z } from 'zod';

/**
 * THE PRODUCT CONTRACT (dashboard side).
 *
 * An exact mirror of the backend's `src/routes/brand/product.contract.ts`. The same limits and rules run
 * here (so the form tells you straight away what is wrong) and on the server (which always has the final
 * say). If a number changes in one place it must change in the other: GET /api/v1/products/contract
 * returns the backend's numbers so the two can be compared.
 */
export const PRODUCT_LIMITS = {
  nameMin: 2,
  nameMax: 120,
  categoryMax: 80,
  subCategoryMax: 80,
  collectionMax: 80,
  shortDescriptionMax: 160,
  descriptionMax: 4000,
  tagsMax: 20,
  tagMax: 30,
  imagesMax: 12,
  skuMin: 3,
  skuMax: 64,
  priceMax: 10_000_000,
  stockMax: 1_000_000,
  lowStockMax: 100_000,
  warehouseMax: 80,
  variantsMax: 100,
  variantSizeMax: 40,
  variantColorMax: 60,
  specsMax: 30,
  specKeyMax: 40,
  specValueMax: 120,
} as const;

export const TRY_ON_CATEGORIES = ['tops', 'bottoms', 'dresses', 'outerwear', 'all'] as const;
export const CATALOG_STATUSES = ['ACTIVE', 'DRAFT', 'ARCHIVED'] as const;
export type TryOnCategory = (typeof TRY_ON_CATEGORIES)[number];
export type CatalogStatus = (typeof CATALOG_STATUSES)[number];

/** Letters, numbers, dot, dash, underscore. No spaces, no emoji. */
export const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
/** Tags: letters (any language), numbers, spaces, dash, underscore. No emoji or symbols. */
export const TAG_PATTERN = /^[\p{L}\p{N} _-]+$/u;
const SPEC_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9 _-]*$/;

const twoDecimals = (value: number) => Math.round(value * 100) / 100 === value;

const requiredNumber = (label: string) =>
  z.number({ error: `${label} is required and must be a number.` }).finite(`${label} must be a number.`);

// ─── FIELD RULES (same as the backend) ────────────────────────────────────────

const name = z
  .string()
  .trim()
  .min(PRODUCT_LIMITS.nameMin, `Product title must be at least ${PRODUCT_LIMITS.nameMin} characters.`)
  .max(PRODUCT_LIMITS.nameMax, `Product title cannot exceed ${PRODUCT_LIMITS.nameMax} characters.`);

const category = z
  .string()
  .trim()
  .min(1, 'Please select a category.')
  .max(PRODUCT_LIMITS.categoryMax, `Category cannot exceed ${PRODUCT_LIMITS.categoryMax} characters.`);

const subCategory = z.string().trim().max(PRODUCT_LIMITS.subCategoryMax, `Sub-category cannot exceed ${PRODUCT_LIMITS.subCategoryMax} characters.`);
const collection = z.string().trim().max(PRODUCT_LIMITS.collectionMax, `Collection cannot exceed ${PRODUCT_LIMITS.collectionMax} characters.`);
const shortDescription = z
  .string()
  .trim()
  .max(PRODUCT_LIMITS.shortDescriptionMax, `Short summary cannot exceed ${PRODUCT_LIMITS.shortDescriptionMax} characters.`);
const description = z
  .string()
  .trim()
  .max(PRODUCT_LIMITS.descriptionMax, `Description cannot exceed ${PRODUCT_LIMITS.descriptionMax} characters.`);

const tags = z
  .array(
    z
      .string()
      .trim()
      .min(1, 'Tags cannot be empty.')
      .max(PRODUCT_LIMITS.tagMax, `Each tag can be at most ${PRODUCT_LIMITS.tagMax} characters.`)
      .regex(TAG_PATTERN, 'Tags can only contain letters, numbers, spaces, "-" and "_".')
  )
  .max(PRODUCT_LIMITS.tagsMax, `Use at most ${PRODUCT_LIMITS.tagsMax} tags.`);

const images = z.array(z.string().trim().min(1)).max(PRODUCT_LIMITS.imagesMax, `Use at most ${PRODUCT_LIMITS.imagesMax} images.`);

const sku = z
  .string()
  .trim()
  .min(PRODUCT_LIMITS.skuMin, `SKU must be at least ${PRODUCT_LIMITS.skuMin} characters.`)
  .max(PRODUCT_LIMITS.skuMax, `SKU cannot exceed ${PRODUCT_LIMITS.skuMax} characters.`)
  .regex(SKU_PATTERN, 'SKU can only contain letters, numbers, ".", "-" and "_" (no spaces).');

const price = requiredNumber('Selling price')
  .gt(0, 'Selling price must be greater than 0.')
  .max(PRODUCT_LIMITS.priceMax, `Price cannot exceed ${PRODUCT_LIMITS.priceMax}.`)
  .refine(twoDecimals, 'Price can have at most 2 decimal places.');

const compareAtPrice = z
  .number()
  .finite()
  .gt(0, 'Compare-at price must be greater than 0.')
  .max(PRODUCT_LIMITS.priceMax)
  .refine(twoDecimals, 'Compare-at price can have at most 2 decimal places.')
  .nullable();

const costPrice = z
  .number()
  .finite()
  .min(0, 'Cost price cannot be negative.')
  .max(PRODUCT_LIMITS.priceMax)
  .refine(twoDecimals, 'Cost price can have at most 2 decimal places.')
  .nullable();

const stock = requiredNumber('Stock')
  .int('Stock must be a whole number.')
  .min(0, 'Stock cannot be negative.')
  .max(PRODUCT_LIMITS.stockMax, `Stock cannot exceed ${PRODUCT_LIMITS.stockMax}.`);

const lowStockThreshold = requiredNumber('Low-stock alert')
  .int('Low-stock alert must be a whole number.')
  .min(0, 'Low-stock alert cannot be negative.')
  .max(PRODUCT_LIMITS.lowStockMax);

const warehouseLocation = z
  .string()
  .trim()
  .max(PRODUCT_LIMITS.warehouseMax, `Warehouse cannot exceed ${PRODUCT_LIMITS.warehouseMax} characters.`);

const specs = z
  .record(
    z
      .string()
      .max(PRODUCT_LIMITS.specKeyMax)
      .regex(SPEC_KEY_PATTERN, 'Specification names must start with a letter.'),
    z.string().trim().max(PRODUCT_LIMITS.specValueMax, `Specification values can be at most ${PRODUCT_LIMITS.specValueMax} characters.`)
  )
  .refine((v) => Object.keys(v).length <= PRODUCT_LIMITS.specsMax, `Use at most ${PRODUCT_LIMITS.specsMax} specifications.`);

export const productVariantSchema = z.object({
  id: z.string().trim().min(1).max(120).optional(),
  sku,
  size: z.string().trim().min(1, 'Size is required.').max(PRODUCT_LIMITS.variantSizeMax, `Size can be at most ${PRODUCT_LIMITS.variantSizeMax} characters.`),
  color: z.string().trim().min(1, 'Colour is required.').max(PRODUCT_LIMITS.variantColorMax, `Colour can be at most ${PRODUCT_LIMITS.variantColorMax} characters.`),
  stockQuantity: stock,
  available: z.boolean(),
  /** Price for this size. Leave out to use the product price. */
  price: price.optional(),
  /** Photo of this colour. */
  imageUrl: z.string().trim().min(1).optional(),
  /** Alert when this size (all colours together) falls below this many pieces. Leave out for no size alert. */
  lowStockThreshold: lowStockThreshold.optional(),
  /** Clear flat photo of this colour for the AI try-on (never shown to shoppers). */
  aiImageUrl: z.string().trim().min(1).optional(),
});

const variants = z
  .array(productVariantSchema)
  .max(PRODUCT_LIMITS.variantsMax, `Use at most ${PRODUCT_LIMITS.variantsMax} variants.`)
  .superRefine((list, ctx) => {
    const combos = new Set<string>();
    const skus = new Set<string>();
    list.forEach((variant, index) => {
      const combo = `${variant.size.toLowerCase()}|${variant.color.toLowerCase()}`;
      if (combos.has(combo)) {
        ctx.addIssue({ code: 'custom', path: [index, 'size'], message: `Size ${variant.size} / ${variant.color} is listed twice.` });
      }
      combos.add(combo);
      const key = variant.sku.toLowerCase();
      if (skus.has(key)) {
        ctx.addIssue({ code: 'custom', path: [index, 'sku'], message: `Variant SKU ${variant.sku} is used twice.` });
      }
      skus.add(key);
    });

    // One price per size and one photo per colour, whichever colour or size it is combined with.
    const priceBySize = new Map<string, number | undefined>();
    const alertBySize = new Map<string, number | undefined>();
    const photoByColor = new Map<string, string | undefined>();
    const aiPhotoByColor = new Map<string, string | undefined>();
    list.forEach((variant, index) => {
      const sizeKey = variant.size.toLowerCase();
      if (priceBySize.has(sizeKey) && priceBySize.get(sizeKey) !== variant.price) {
        ctx.addIssue({ code: 'custom', path: [index, 'price'], message: `Size ${variant.size} has two different prices. Use one price per size.` });
      }
      priceBySize.set(sizeKey, variant.price);
      if (alertBySize.has(sizeKey) && alertBySize.get(sizeKey) !== variant.lowStockThreshold) {
        ctx.addIssue({ code: 'custom', path: [index, 'lowStockThreshold'], message: `Size ${variant.size} has two different low-stock alerts. Use one alert per size.` });
      }
      alertBySize.set(sizeKey, variant.lowStockThreshold);
      const colorKey = variant.color.toLowerCase();
      if (photoByColor.has(colorKey) && photoByColor.get(colorKey) !== variant.imageUrl) {
        ctx.addIssue({ code: 'custom', path: [index, 'imageUrl'], message: `Colour ${variant.color} has two different photos. Use one photo per colour.` });
      }
      photoByColor.set(colorKey, variant.imageUrl);
      if (aiPhotoByColor.has(colorKey) && aiPhotoByColor.get(colorKey) !== variant.aiImageUrl) {
        ctx.addIssue({ code: 'custom', path: [index, 'aiImageUrl'], message: `Colour ${variant.color} has two different AI photos. Use one AI photo per colour.` });
      }
      aiPhotoByColor.set(colorKey, variant.aiImageUrl);
    });
  });

/** Same wording as the backend. */
export function variantStockMessage(totalStock: number, assigned: number): string | null {
  if (assigned === totalStock) return null;
  return assigned < totalStock
    ? `Assign all ${totalStock} items to sizes and colours (${totalStock - assigned} left).`
    : `Sizes and colours add up to ${assigned}, which is ${assigned - totalStock} more than the total stock of ${totalStock}.`;
}

// ─── THE FORM ─────────────────────────────────────────────────────────────────

export const productFormSchema = z
  .object({
    name,
    category,
    subCategory,
    collection,
    shortDescription,
    description,
    tags,
    images,
    aiReferenceImage: z.string().trim().min(1).nullable(),
    price,
    compareAtPrice,
    costPrice,
    sku,
    stock,
    lowStockThreshold,
    warehouseLocation,
    variants,
    specs,
    brandStorefrontPublished: z.boolean(),
    marketplacePublished: z.boolean(),
    isTryOnEligible: z.boolean(),
    includeInBrandTryOn: z.boolean(),
    includeInMarketplaceTryOn: z.boolean(),
    tryOnCategory: z.enum(TRY_ON_CATEGORIES, { error: 'Please choose the garment type for the AI try-on.' }),
    catalogStatus: z.enum(CATALOG_STATUSES, { error: `Catalog status must be one of: ${CATALOG_STATUSES.join(', ')}.` }),
  })
  .superRefine((data, ctx) => {
    // Sizes & colours share out the total stock: what is assigned to them must add up to it exactly.
    if (data.variants.length > 0) {
      const assigned = data.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
      const message = variantStockMessage(data.stock, assigned);
      if (message) ctx.addIssue({ code: 'custom', path: ['variants'], message });
    }
    if (typeof data.compareAtPrice === 'number' && typeof data.price === 'number' && data.compareAtPrice <= data.price) {
      ctx.addIssue({ code: 'custom', path: ['compareAtPrice'], message: 'Compare-at price must be higher than the selling price.' });
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

/**
 * Exactly what the form sends to POST /products and PUT /products/:id.
 * `null` removes an optional value; an empty string clears a text value.
 */
export type ProductPayload = ProductFormValues;

// ─── WHICH STEP OWNS WHICH FIELD ──────────────────────────────────────────────

export type ProductFieldName = keyof ProductFormValues;

export const PRODUCT_STEP_FIELDS: ProductFieldName[][] = [
  // 1. Basics
  ['name', 'category', 'subCategory', 'collection', 'shortDescription', 'description', 'tags'],
  // 2. Images
  ['images', 'aiReferenceImage'],
  // 3. Price & stock
  ['price', 'compareAtPrice', 'costPrice', 'sku', 'stock', 'lowStockThreshold', 'warehouseLocation', 'specs'],
  // 4. Sizes & colours
  ['variants'],
  // 5. Try-On & publish
  [
    'tryOnCategory',
    'isTryOnEligible',
    'includeInBrandTryOn',
    'includeInMarketplaceTryOn',
    'brandStorefrontPublished',
    'marketplacePublished',
    'catalogStatus',
  ],
];

/** The first error message for each top-level field, e.g. "variants.2.size" is reported under "variants". */
export function collectFieldErrors(error: z.ZodError): Partial<Record<ProductFieldName, string>> {
  const out: Partial<Record<ProductFieldName, string>> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? '') as ProductFieldName;
    if (field && !(field in out)) out[field] = issue.message;
  }
  return out;
}
