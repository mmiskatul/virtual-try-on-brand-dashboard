import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Product title must be at least 3 characters')
    .max(100, 'Product title must be under 100 characters'),
  category: z.enum(['Tops', 'Bottoms', 'Dresses', 'Outerwear']),
  price: z
    .number()
    .positive('Price must be greater than $0')
    .max(100000, 'Price exceeds maximum allowable threshold ($100,000)'),
  sku: z
    .string()
    .min(3, 'SKU must be at least 3 characters')
    .max(30, 'SKU must be under 30 characters')
    .regex(/^[A-Z0-9_-]+$/i, 'SKU may only contain letters, numbers, underscores, and hyphens'),
  stock: z
    .number()
    .int('Stock must be an integer quantity')
    .min(0, 'Initial stock cannot be negative'),
  brandStorefrontPublished: z.boolean(),
  marketplacePublished: z.boolean(),
  isTryOnEligible: z.boolean(),
  image: z.string().url('Must be a valid image URL').optional()
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const storefrontSchema = z.object({
  announcement: z
    .string()
    .min(5, 'Announcement banner text must be at least 5 characters')
    .max(160, 'Announcement banner cannot exceed 160 characters'),
  banner: z
    .string()
    .url('Hero banner must be a valid HTTPS URL'),
  primaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Primary color must be a valid hex color code (e.g. #0ea5e9)')
});

export type StorefrontFormValues = z.infer<typeof storefrontSchema>;

export const fabricSchema = z.object({
  name: z.string().min(2, 'Fabric name must be at least 2 characters'),
  composition: z.string().min(3, 'Composition details required (e.g. 100% Organic Silk)'),
  stretch: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']),
  thickness: z.enum(['LIGHT', 'MEDIUM', 'HEAVY']),
  care: z.string().min(3, 'Care instructions required')
});

export type FabricFormValues = z.infer<typeof fabricSchema>;
