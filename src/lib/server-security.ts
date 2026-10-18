import {
  experimental_taintUniqueValue,
  experimental_taintObjectReference,
} from 'react';

/**
 * Tainted Data Protection: Backend Security Keys
 * Uses React's experimental_taintUniqueValue to permanently block internal secrets,
 * merchant API keys, and private webhook secrets from ever being leaked across the
 * React Server Component (RSC) boundary into client-side JavaScript.
 */
export function taintServerSecret(
  secretValue: string | undefined | null,
  secretIdentifier: string
): void {
  if (!secretValue || typeof secretValue !== 'string') {
    return;
  }

  try {
    experimental_taintUniqueValue(
      `[SECURITY ERROR] Merchant Security Violation: Backend secret "${secretIdentifier}" cannot be leaked to client-side JavaScript bundles.`,
      globalThis,
      secretValue
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Taint Warning] Failed to taint merchant secret "${secretIdentifier}":`, error);
    }
  }
}

/**
 * Tainted Data Protection: Raw Merchant & Billing Objects
 * Uses React's experimental_taintObjectReference to lock down raw merchant database records,
 * banking details, and revenue contracts. If passed directly to a Client Component,
 * React immediately throws a build/runtime boundary exception.
 */
export function taintRawUserData<T extends object>(
  rawData: T,
  resourceName: string = 'Raw Merchant Account Record'
): T {
  if (!rawData || typeof rawData !== 'object') {
    return rawData;
  }

  try {
    experimental_taintObjectReference(
      `[SECURITY ERROR] Data Leak Violation: ${resourceName} contains sensitive merchant credentials, payout IBANs, or tax numbers and cannot be passed directly to Client Components. Extract a sanitized Public DTO first.`,
      rawData
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Taint Warning] Failed to taint object reference for "${resourceName}":`, error);
    }
  }

  return rawData;
}

/**
 * Tainted Data Protection: Specific Unique Merchant PII Fields
 */
export function taintSensitiveUserField(
  fieldValue: string | undefined | null,
  fieldName: string,
  lifetime: object = globalThis
): void {
  if (!fieldValue || typeof fieldValue !== 'string') {
    return;
  }

  try {
    experimental_taintUniqueValue(
      `[SECURITY ERROR] PII Violation: Sensitive merchant field "${fieldName}" cannot be transmitted to client components.`,
      lifetime,
      fieldValue
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Taint Warning] Failed to taint unique merchant field "${fieldName}":`, error);
    }
  }
}

// Automatically taint merchant platform secrets on module load
const MERCHANT_SECRETS_TO_PROTECT: Array<[string | undefined, string]> = [
  [process.env.NEXTAUTH_SECRET, 'NEXTAUTH_SECRET'],
  [process.env.BRAND_API_KEY, 'BRAND_API_KEY'],
  [process.env.STRIPE_CONNECT_SECRET, 'STRIPE_CONNECT_SECRET'],
  [process.env.INTERNAL_SERVICE_KEY, 'INTERNAL_SERVICE_KEY'],
  [process.env.DATABASE_URL, 'DATABASE_URL'],
];

for (const [secret, name] of MERCHANT_SECRETS_TO_PROTECT) {
  if (secret) {
    taintServerSecret(secret, name);
  }
}
