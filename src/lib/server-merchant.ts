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
  const runtimeSuffix = crypto.randomUUID().replace(/-/g, '');
  const rawMerchant: RawMerchantRecord = {
    tenantId,
    brandName: 'Aura Atelier',
    contactEmail: 'partnerships@auraatelier.it',
    role: 'BRAND_OWNER',
    apiKey: process.env.BRAND_API_KEY || `ephemeral_merchant_${runtimeSuffix}`,
    payoutIban: process.env.MERCHANT_PAYOUT_IBAN || `EPHEMERAL_IBAN_${runtimeSuffix}`,
    taxRegistrationNumber: process.env.MERCHANT_TAX_REG || `EPHEMERAL_TAX_${runtimeSuffix}`,
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
