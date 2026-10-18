import {
  experimental_taintObjectReference,
  experimental_taintUniqueValue,
} from 'react';
import './server-security';

export interface RawMerchantRecord {
  tenantId: string;
  brandName: string;
  contactEmail: string;
  role: 'BRAND_OWNER' | 'DESIGNER';
  apiKey: string;
  payoutIban: string;
  taxRegistrationNumber: string;
  monthlyRevenueGross: number;
}

export interface PublicMerchantDTO {
  tenantId: string;
  brandName: string;
  contactEmail: string;
  role: 'BRAND_OWNER' | 'DESIGNER';
}

/**
 * Fetch raw merchant record from brand data store with Tainted Data Protection.
 * Protects merchant API keys, banking IBANs, and corporate tax registration numbers.
 */
export async function getTaintedMerchantRecord(tenantId: string = 'tenant_aura'): Promise<RawMerchantRecord> {
  const rawMerchant: RawMerchantRecord = {
    tenantId,
    brandName: 'Aura Atelier',
    contactEmail: 'partnerships@auraatelier.it',
    role: 'BRAND_OWNER',
    apiKey: 'vton_sk_live_9a8b7c6d5e4f3a2b1c0d9e8f7',
    payoutIban: 'IT60X0542811101000000123456',
    taxRegistrationNumber: 'IT12345678901',
    monthlyRevenueGross: 148500,
  };

  // 1. Taint unique sensitive primitives
  experimental_taintUniqueValue(
    'CRITICAL SECURITY ERROR: Attempted to leak live merchant API secret key to client JavaScript!',
    rawMerchant,
    rawMerchant.apiKey
  );

  experimental_taintUniqueValue(
    'CRITICAL SECURITY ERROR: Attempted to leak merchant banking IBAN to client JavaScript!',
    rawMerchant,
    rawMerchant.payoutIban
  );

  experimental_taintUniqueValue(
    'CRITICAL SECURITY ERROR: Attempted to leak corporate tax registration number to client JavaScript!',
    rawMerchant,
    rawMerchant.taxRegistrationNumber
  );

  // 2. Taint the entire raw merchant object reference
  experimental_taintObjectReference(
    'CRITICAL SECURITY ERROR: Raw merchant database object cannot be passed directly to Client Components. Call sanitizeMerchantToDTO() to extract a clean public DTO.',
    rawMerchant
  );

  return rawMerchant;
}

/**
 * Data Transfer Object (DTO) Sanitizer: Safely extract public client-safe fields.
 */
export function sanitizeMerchantToDTO(raw: RawMerchantRecord): PublicMerchantDTO {
  return {
    tenantId: raw.tenantId,
    brandName: raw.brandName,
    contactEmail: raw.contactEmail,
    role: raw.role,
  };
}
