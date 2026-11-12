'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { requireBrandServerAction } from '@/lib/server-auth';

/**
 * Server Action for Server-Driven Data Cache Invalidation
 * Purges Next.js fetch cache by tag on brand data mutations.
 */
export async function revalidateBrandCatalog(tag: string = 'brand-products') {
  try {
    await requireBrandServerAction();
    revalidateTag(tag);
    revalidatePath('/');
    return {
      success: true,
      tag,
      revalidatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Tag revalidation failed',
    };
  }
}
