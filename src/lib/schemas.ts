import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Product title must be at least 3 characters')
    .max(100, 'Product title must be under 100 characters'),
  category: z.enum(['Tops', 'Bottoms', 'Dresses', 'Outerwear']),
  price: z
    .number()
    .positive('Price must be greater than ৳0')
    .max(100000, 'Price exceeds maximum allowable threshold (৳100,000)'),
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

// Strict, ASCII-only email format: local@domain.tld (no spaces, emoji, or non-Latin characters).
const EMAIL_FORMAT =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,24}$/;

export const emailField = z
  .string()
  .trim()
  .min(1, 'Email address is required')
  .max(254, 'Email address is too long')
  .regex(/^[\x21-\x7E]+$/, 'Email can only contain standard letters, numbers and symbols (no spaces or emoji)')
  .refine((v) => v.includes('@'), 'Email must include an "@" (example: name@company.com)')
  .refine(
    (v) => !v.includes('@') || v.split('@').length === 2,
    'Email must contain only one "@"',
  )
  .refine(
    (v) => {
      const local = v.split('@')[0] || '';
      return !local.startsWith('.') && !local.endsWith('.') && !v.includes('..');
    },
    'Email cannot start or end with a dot or contain consecutive dots',
  )
  .refine((v) => EMAIL_FORMAT.test(v), 'Please enter a valid email like name@company.com');

// Passwords: printable ASCII only (letters, numbers, symbols). No spaces, no emoji, no non-Latin characters.
export const strongPasswordField = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .refine((v) => !/\s/.test(v), 'Password cannot contain spaces')
  .refine(
    (v) => /^[\x21-\x7E]*$/.test(v) || /\s/.test(v),
    'Password can only use letters, numbers and symbols (no emoji or special-language characters)',
  )
  .regex(/[A-Za-z]/, 'Password must include at least one letter')
  .regex(/[0-9]/, 'Password must include at least one number');

const brandNameField = z
  .string()
  .trim()
  .min(1, 'Brand name is required')
  .min(2, 'Brand name must be at least 2 characters')
  .max(80, 'Brand name cannot exceed 80 characters')
  .regex(
    /^[\p{L}\p{N}][\p{L}\p{M}\p{N}\s.&'’,-]*$/u,
    'Brand name can only contain letters, numbers, spaces and . & \' , - (no emoji)',
  );

const ownerNameField = z
  .string()
  .trim()
  .min(1, 'Owner full name is required')
  .min(2, 'Owner full name must be at least 2 characters')
  .max(80, 'Owner full name cannot exceed 80 characters')
  .regex(
    /^[\p{L}][\p{L}\p{M}\s.'’-]*$/u,
    'Name can only contain letters, spaces and . \' - (no numbers or emoji)',
  );

export const brandLoginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password cannot exceed 128 characters'),
});

export type BrandLoginFormValues = z.infer<typeof brandLoginSchema>;

export const brandRegisterSchema = z
  .object({
    brandName: brandNameField,
    ownerName: ownerNameField,
    email: emailField,
    password: strongPasswordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type BrandRegisterFormValues = z.infer<typeof brandRegisterSchema>;

export const verifyEmailSchema = z.object({
  email: emailField,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
});

export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

