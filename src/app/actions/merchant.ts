'use server';

import { getTaintedMerchantRecord, sanitizeMerchantToDTO, PublicMerchantDTO } from '@/lib/server-merchant';
import { requireBrandServerAction } from '@/lib/server-auth';

/**
 * Server Action: Safely retrieve merchant tenant profile.
 * Even if an engineer mistakenly tries to return the raw tainted object,
 * React's experimental taint system blocks it from reaching the client!
 */
export async function fetchMerchantProfile(tenantId: string = 'tenant_aura'): Promise<{
  success: boolean;
  profile?: PublicMerchantDTO;
  error?: string;
}> {
  try {
    const session = await requireBrandServerAction(tenantId);
    const resolvedTenantId = session.tenantId || tenantId;
    const rawTaintedMerchant = await getTaintedMerchantRecord(resolvedTenantId);

    // Secure DTO Sanitization: Strips apiKey, payoutIban, taxRegistrationNumber
    const publicProfile = sanitizeMerchantToDTO(rawTaintedMerchant);

    return {
      success: true,
      profile: publicProfile,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch merchant profile safely',
    };
  }
}
