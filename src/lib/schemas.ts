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

const strongPasswordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[A-Za-z]/, 'Password must include at least one letter')
  .regex(/[0-9]/, 'Password must include at least one number');

export const brandLoginSchema = z.object({
  email: z.string().email('Please enter a valid business email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type BrandLoginFormValues = z.infer<typeof brandLoginSchema>;

export const brandRegisterSchema = z
  .object({
    brandName: z.string().min(2, 'Brand name must be at least 2 characters').max(80),
    slug: z
      .string()
      .min(2, 'Storefront slug must be at least 2 characters')
      .max(50)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must use lowercase letters, numbers, and hyphens only'),
    ownerName: z.string().min(2, 'Owner full name must be at least 2 characters').max(80),
    email: z.string().email('Please enter a valid business email address'),
    password: strongPasswordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type BrandRegisterFormValues = z.infer<typeof brandRegisterSchema>;

export const verifyEmailSchema = z.object({
  email: z.string().email('Please enter your business email address'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
});

export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid business email address'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

