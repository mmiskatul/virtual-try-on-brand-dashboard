export const BRAND_ACCESS_COOKIE = 'vtry_brand_access';
export const BRAND_REFRESH_COOKIE = 'vtry_brand_refresh';
export const BRAND_SESSION_COOKIE = 'vtry_brand_sid';

export const BRAND_ALLOWED_ROLES = new Set<string>([
  'BRAND_OWNER',
  'BRAND_ADMIN',
  'CATALOG_MANAGER',
  'INVENTORY_MANAGER',
  'ORDER_MANAGER',
  'SUPPORT_AGENT',
  'ANALYTICS_VIEWER',
  'STORE_MANAGER',
]);

export function getBackendApiBaseUrl(): string {
  const raw =
    process.env.INTERNAL_BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    'http://localhost:4000';
  return raw.replace(/\/+$/, '');
}

export function isAllowedBrandRole(role: unknown): role is string {
  return typeof role === 'string' && BRAND_ALLOWED_ROLES.has(role);
}

export function decodeJwtPayloadUnsafe(token: string | undefined): Record<string, unknown> | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLen);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function isValidBrandAccessCookie(
  rawJwt: string | undefined,
  expectedUserId?: string,
  expectedSessionId?: string,
): boolean {
  const payload = decodeJwtPayloadUnsafe(rawJwt);
  if (!payload) return false;
  if (payload.tokenType !== 'access') return false;
  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now() + 5000) return false;
  if (!isAllowedBrandRole(payload.role)) return false;

  const claimUserId =
    typeof payload.userId === 'string'
      ? payload.userId
      : typeof payload.sub === 'string'
        ? payload.sub
        : '';
  if (!claimUserId) return false;
  if (expectedUserId && claimUserId !== expectedUserId) return false;
  if (expectedSessionId && typeof payload.sid === 'string' && payload.sid !== expectedSessionId) {
    return false;
  }
  return true;
}

export function isValidBrandRefreshCookie(
  rawJwt: string | undefined,
  expectedUserId?: string,
  expectedSessionId?: string,
): boolean {
  const payload = decodeJwtPayloadUnsafe(rawJwt);
  if (!payload) return false;
  if (payload.tokenType !== 'refresh') return false;
  if (payload.portal !== 'brand') return false;
  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) return false;

  const claimUserId = typeof payload.userId === 'string' ? payload.userId : '';
  if (!claimUserId) return false;
  if (expectedUserId && claimUserId !== expectedUserId) return false;
  if (expectedSessionId && typeof payload.sid === 'string' && payload.sid !== expectedSessionId) {
    return false;
  }
  return true;
}

export function buildBrandCookieHeader(tokens: {
  accessToken?: string;
  sessionToken?: string;
  refreshToken?: string;
}): string {
  return [
    tokens.accessToken ? `${BRAND_ACCESS_COOKIE}=${encodeURIComponent(tokens.accessToken)}` : '',
    tokens.sessionToken ? `${BRAND_SESSION_COOKIE}=${encodeURIComponent(tokens.sessionToken)}` : '',
    tokens.refreshToken ? `${BRAND_REFRESH_COOKIE}=${encodeURIComponent(tokens.refreshToken)}` : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export function sanitizeBrandCallbackUrl(
  raw: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (!raw || typeof raw !== 'string') return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  if (
    raw === '/' ||
    raw.startsWith('/login') ||
    raw.startsWith('/register') ||
    raw.startsWith('/verify-email') ||
    raw.startsWith('/forgot-password') ||
    raw.startsWith('/forget-password') ||
    raw.startsWith('/reset-password') ||
    raw.startsWith('/api/')
  ) {
    return fallback;
  }
  return raw;
}

export function extractSetCookieHeaders(headers: Headers): string[] {
  const anyHeaders = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof anyHeaders.getSetCookie === 'function') {
    return anyHeaders.getSetCookie();
  }
  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

export async function refreshBrandSessionFromBackend(cookieHeader: string): Promise<{
  ok: boolean;
  setCookies: string[];
  revoked: boolean;
}> {
  if (!cookieHeader) {
    return { ok: false, setCookies: [], revoked: false };
  }

  try {
    const res = await fetch(`${getBackendApiBaseUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: cookieHeader,
        'X-Auth-Portal': 'brand',
        'X-Auth-Transport': 'cookie',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      cache: 'no-store',
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      return {
        ok: true,
        setCookies: extractSetCookieHeaders(res.headers),
        revoked: false,
      };
    }

    return {
      ok: false,
      setCookies: extractSetCookieHeaders(res.headers),
      revoked: res.status === 401 || res.status === 403,
    };
  } catch {
    return { ok: false, setCookies: [], revoked: false };
  }
}

export async function exchangeBrandOAuthCodeFromBackend(code: string): Promise<{
  ok: boolean;
  setCookies: string[];
}> {
  if (!code) {
    return { ok: false, setCookies: [] };
  }

  try {
    const res = await fetch(`${getBackendApiBaseUrl()}/api/v1/auth/oauth-exchange`, {
      method: 'POST',
      headers: {
        'X-Auth-Portal': 'brand',
        'X-Auth-Transport': 'cookie',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
      cache: 'no-store',
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) {
      return { ok: false, setCookies: [] };
    }

    return {
      ok: true,
      setCookies: extractSetCookieHeaders(res.headers),
    };
  } catch {
    return { ok: false, setCookies: [] };
  }
}

export async function verifyBrandSessionWithBackend(
  cookieHeader: string,
  expectedUserId?: string,
): Promise<{
  ok: boolean;
  tenantId?: string;
  user?: { id?: string; role?: string };
}> {
  if (!cookieHeader) {
    return { ok: false };
  }

  try {
    const res = await fetch(`${getBackendApiBaseUrl()}/api/v1/auth/session`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        'X-Auth-Portal': 'brand',
        'X-Auth-Transport': 'cookie',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return { ok: false };
    }

    const data = await res.json().catch(() => null);
    if (!data || data.authenticated !== true || !data.user || !isAllowedBrandRole(data.user.role)) {
      return { ok: false };
    }

    if (expectedUserId && data.user.id && data.user.id !== expectedUserId) {
      return { ok: false };
    }

    const tenantId =
      typeof data.user.tenantId === 'string'
        ? data.user.tenantId
        : typeof data.tenant?.id === 'string'
          ? data.tenant.id
          : undefined;

    return {
      ok: true,
      tenantId,
      user: {
        id: typeof data.user.id === 'string' ? data.user.id : undefined,
        role: data.user.role,
      },
    };
  } catch {
    return { ok: false };
  }
}
