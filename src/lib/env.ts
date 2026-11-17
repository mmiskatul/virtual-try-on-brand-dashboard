import { z } from 'zod';

/**
 * Validates required environment variables. Called from instrumentation at server
 * start so a misconfigured production deploy fails fast instead of at first login.
 */
const schema = z.object({
  NEXT_PUBLIC_BACKEND_API_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().optional(),
});

export function validateEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`[env] Invalid production configuration: ${issues}`);
  }
}
