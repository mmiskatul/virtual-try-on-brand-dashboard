import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  BRAND_ACCESS_COOKIE,
  BRAND_REFRESH_COOKIE,
  BRAND_SESSION_COOKIE,
  buildBrandCookieHeader,
  exchangeBrandOAuthCodeFromBackend,
  isAllowedBrandRole,
  isValidBrandAccessCookie,
  isValidBrandRefreshCookie,
  refreshBrandSessionFromBackend,
  sanitizeBrandCallbackUrl,
  verifyBrandSessionWithBackend,
} from './lib/portal-auth';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

const AUTH_ENTRY_PATHS = ['/login', '/register'];
const PUBLIC_AUTH_FLOW_PREFIXES = [
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/forget-password',
  '/reset-password',
];
const PUBLIC_STOREFRONT_PREFIXES = ['/storefront', '/brands', '/try', '/api/edge/storefront'];
const PUBLIC_META_PREFIXES = [
  '/api/auth',
  '/api/telemetry',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
];

function buildMergedCookieHeader(rawCookie: string | null, setCookies: string[]): string {
  const cookieMap = new Map<string, string>();
  if (rawCookie) {
    for (const part of rawCookie.split(';')) {
      const idx = part.indexOf('=');
      if (idx > 0) {
        const k = part.slice(0, idx).trim();
        const v = part.slice(idx + 1).trim();
        if (k) cookieMap.set(k, v);
      }
    }
  }
  for (const sc of setCookies) {
    const first = sc.split(';')[0]?.trim() || '';
    const idx = first.indexOf('=');
    if (idx > 0) {
      const k = first.slice(0, idx).trim();
      const v = first.slice(idx + 1).trim();
      if (!v || /;\s*Max-Age=0\b/i.test(sc)) {
        cookieMap.delete(k);
      } else {
        cookieMap.set(k, v);
      }
    }
  }
  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

/**
 * Generate a strict, dynamic Content Security Policy (CSP) with a cryptographic nonce.
 * Protects merchant inventory, revenue metrics, and boutique storefronts against XSS attacks.
 */
function createContentSecurityPolicy(nonce: string) {
  const isDev = process.env.NODE_ENV !== 'production';

  return `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ''} https:;
    style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https:;
    img-src 'self' blob: data: https://images.unsplash.com https:;
    font-src 'self' data: https:;
    connect-src 'self' http://localhost:* ws://localhost:* https:;
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://accounts.google.com;
    frame-ancestors 'none';
    ${isDev ? '' : 'block-all-mixed-content; upgrade-insecure-requests;'}
  `
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// --- Strict Edge CORS Configuration ---
const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/([a-z0-9-]+\.)?vton-platform\.io$/,
];

function isOriginAllowed(origin: string | null, requestOrigin?: string): boolean {
  if (!origin) return true; // Server-to-server or same-origin
  if (requestOrigin && origin === requestOrigin) return true;
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredSiteUrl) {
    try {
      if (origin === new URL(configuredSiteUrl).origin) return true;
    } catch {
      // Ignore invalid URL env
    }
  }
  return ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));
}

// --- Edge Sliding-Window Rate Limiting ---
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
let lastCleanup = Date.now();

function checkEdgeRateLimit(
  clientIp: string,
  pathname: string
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  if (now - lastCleanup > 300000) {
    lastCleanup = now;
    rateLimitStore.forEach((v, k) => {
      if (v.resetAt <= now) rateLimitStore.delete(k);
    });
  }

  const isSensitive = pathname.startsWith('/api/inventory') || pathname.startsWith('/api/auth');
  const limit = isSensitive ? 30 : 120;
  const windowMs = 60000;

  const key = `${clientIp}:${isSensitive ? 'sensitive' : 'standard'}`;
  let record = rateLimitStore.get(key);

  if (!record || record.resetAt <= now) {
    record = { count: 1, resetAt: now + windowMs };
    rateLimitStore.set(key, record);
    return { success: true, limit, remaining: limit - 1, reset: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count += 1;
  const remaining = Math.max(0, limit - record.count);
  const reset = Math.ceil((record.resetAt - now) / 1000);

  if (record.count > limit) {
    return { success: false, limit, remaining: 0, reset };
  }

  return { success: true, limit, remaining, reset };
}

/**
 * Edge Runtime Middleware with Token Verification, Strict CORS & Edge Rate Limiting: Brand Portal
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/forget-password') {
    return NextResponse.redirect(new URL('/forgot-password', request.url));
  }
  const origin = request.headers.get('origin');
  const clientIp = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  // 1. Edge-Level Strict CORS Preflight & Origin Verification
  if (pathname.startsWith('/api/')) {
    if (origin && !isOriginAllowed(origin, request.nextUrl.origin)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Cross-origin request blocked by Edge CORS policy' },
        { status: 403 }
      );
    }

    if (request.method === 'OPTIONS') {
      const preflightHeaders: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id, x-client-version',
        'Access-Control-Max-Age': '86400',
      };
      if (origin && isOriginAllowed(origin, request.nextUrl.origin)) {
        preflightHeaders['Access-Control-Allow-Origin'] = origin;
        preflightHeaders['Access-Control-Allow-Credentials'] = 'true';
      }
      return new NextResponse(null, {
        status: 204,
        headers: preflightHeaders,
      });
    }
  }

  // 2. Edge-Level Sliding-Window Rate Limiting
  const rateLimit = checkEdgeRateLimit(clientIp, pathname);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'TooManyRequests',
        code: 'EDGE_RATE_LIMIT_EXCEEDED',
        message: `Too many requests from this client. Please retry after ${rateLimit.reset} seconds.`,
        retryAfter: rateLimit.reset,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.reset),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.reset),
        },
      }
    );
  }

  // 3. Generate Cryptographic Nonce using Web Crypto
  const nonce = btoa(crypto.randomUUID());
  const cspHeader = createContentSecurityPolicy(nonce);

  let clearStaleAuthCookies = false;

  const applyResponseHeaders = (
    res: NextResponse,
    setCookiesToForward: string[] = [],
    tenantId?: unknown,
  ) => {
    res.headers.set('Content-Security-Policy', cspHeader);
    res.headers.set('x-nonce', nonce);
    res.headers.set('x-content-type-options', 'nosniff');
    res.headers.set('x-frame-options', 'DENY');
    res.headers.set('x-xss-protection', '1; mode=block');
    res.headers.set('x-edge-runtime', 'vercel-edge-v8');
    if (tenantId) {
      res.headers.set('x-auth-tenant-id', String(tenantId));
    }
    res.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
    res.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    res.headers.set('X-RateLimit-Reset', String(rateLimit.reset));
    if (origin && isOriginAllowed(origin)) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      res.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    if (clearStaleAuthCookies) {
      res.cookies.delete(BRAND_ACCESS_COOKIE);
      res.cookies.delete(BRAND_REFRESH_COOKIE);
      res.cookies.delete(BRAND_SESSION_COOKIE);
      res.cookies.delete('next-auth.session-token');
      res.cookies.delete('__Secure-next-auth.session-token');
    }
    for (const sc of setCookiesToForward) {
      res.headers.append('set-cookie', sc);
    }
    return res;
  };

  const isAlwaysPublic =
    PUBLIC_STOREFRONT_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    PUBLIC_META_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Public brand storefronts and NextAuth/metadata endpoints pass through with CSP headers
  if (isAlwaysPublic) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);
    requestHeaders.set('x-edge-routed', 'true');
    requestHeaders.set('x-edge-runtime', 'vercel-edge-v8');

    return applyResponseHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // 4. Verify BOTH NextAuth session JWT AND backend HttpOnly merchant access/refresh token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const nextAuthUserId =
    typeof token?.id === 'string'
      ? token.id
      : typeof token?.sub === 'string'
        ? token.sub
        : '';
  const hasNextAuthBrand = Boolean(token && nextAuthUserId && isAllowedBrandRole(token.role));

  const accessCookie = request.cookies.get(BRAND_ACCESS_COOKIE)?.value;
  const refreshCookie = request.cookies.get(BRAND_REFRESH_COOKIE)?.value;
  const sessionCookie = request.cookies.get(BRAND_SESSION_COOKIE)?.value;
  let hasValidAccess =
    hasNextAuthBrand && isValidBrandAccessCookie(accessCookie, nextAuthUserId, sessionCookie);

  if (hasValidAccess && accessCookie) {
    const backendSession = await verifyBrandSessionWithBackend(
      buildBrandCookieHeader({ accessToken: accessCookie, sessionToken: sessionCookie }),
      nextAuthUserId,
    );
    if (!backendSession.ok) {
      hasValidAccess = false;
      clearStaleAuthCookies = true;
    }
  }

  const isPrefetchRequest =
    request.headers.has('next-router-prefetch') ||
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('x-middleware-prefetch') === '1';

  let refreshedSetCookies: string[] = [];
  let refreshedOk = false;

  if (
    hasNextAuthBrand &&
    !hasValidAccess &&
    !isPrefetchRequest &&
    isValidBrandRefreshCookie(refreshCookie, nextAuthUserId, sessionCookie)
  ) {
    const refreshResult = await refreshBrandSessionFromBackend(request.headers.get('cookie') || '');
    if (refreshResult.ok) {
      refreshedOk = true;
      clearStaleAuthCookies = false;
      refreshedSetCookies = refreshResult.setCookies;
    } else if (refreshResult.revoked) {
      clearStaleAuthCookies = true;
      refreshedSetCookies = refreshResult.setCookies;
    }
  }

  // Exchange single-use Google OAuth handoff code into HttpOnly cookies on the first post-callback navigation
  if (
    hasNextAuthBrand &&
    !hasValidAccess &&
    !refreshedOk &&
    !isPrefetchRequest &&
    typeof token?.oauthExchangeCode === 'string' &&
    token.oauthExchangeCode
  ) {
    const exchangeResult = await exchangeBrandOAuthCodeFromBackend(token.oauthExchangeCode);
    if (exchangeResult.ok && exchangeResult.setCookies.length > 0) {
      refreshedOk = true;
      clearStaleAuthCookies = false;
      refreshedSetCookies = exchangeResult.setCookies;
    }
  }

  const isAuthenticated = hasNextAuthBrand && (hasValidAccess || refreshedOk);

  const isAuthEntryPage = AUTH_ENTRY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isVerifyWithoutCode =
    pathname.startsWith('/verify-email') &&
    !request.nextUrl.searchParams.has('token') &&
    !request.nextUrl.searchParams.has('code');

  // If already logged in with valid access token, redirect /login or /register straight to Brand Dashboard
  if (isAuthenticated && (isAuthEntryPage || isVerifyWithoutCode)) {
    const targetPath = sanitizeBrandCallbackUrl(
      request.nextUrl.searchParams.get('callbackUrl'),
      '/dashboard',
    );
    return applyResponseHeaders(
      NextResponse.redirect(new URL(targetPath, request.url)),
      refreshedSetCookies,
      token!.tenantId,
    );
  }

  if (PUBLIC_AUTH_FLOW_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);
    requestHeaders.set('x-edge-routed', 'true');
    requestHeaders.set('x-edge-runtime', 'vercel-edge-v8');
    return applyResponseHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      refreshedSetCookies,
    );
  }

  // 5. Block unauthenticated or tokenless requests to any protected dashboard route or API
  if (!isAuthenticated) {
    if (
      Boolean(accessCookie) ||
      Boolean(refreshCookie) ||
      Boolean(sessionCookie) ||
      request.cookies.has('next-auth.session-token') ||
      request.cookies.has('__Secure-next-auth.session-token')
    ) {
      clearStaleAuthCookies = true;
    }
    if (pathname.startsWith('/api/')) {
      return applyResponseHeaders(
        NextResponse.json(
          {
            success: false,
            error: 'Unauthorized: Merchant login and valid access token required at edge routing layer.',
            code: 'EDGE_MERCHANT_AUTH_REQUIRED',
          },
          { status: 401 },
        ),
        refreshedSetCookies,
      );
    }

    const signInUrl = new URL('/login', request.url);
    const requestedPath = `${pathname}${request.nextUrl.search || ''}`;
    if (requestedPath && requestedPath !== '/') {
      signInUrl.searchParams.set('callbackUrl', requestedPath);
    } else {
      signInUrl.searchParams.set('callbackUrl', '/dashboard');
    }
    return applyResponseHeaders(NextResponse.redirect(signInUrl), refreshedSetCookies);
  }

  // Redirect root '/' directly to '/dashboard' for authenticated merchants
  if (pathname === '/') {
    return applyResponseHeaders(
      NextResponse.redirect(new URL('/dashboard', request.url)),
      refreshedSetCookies,
      token!.tenantId,
    );
  }

  // 6. Inject verified merchant headers, merged refreshed cookies & cryptographic nonce downstream
  const requestHeaders = new Headers(request.headers);
  if (refreshedSetCookies.length > 0) {
    requestHeaders.set(
      'cookie',
      buildMergedCookieHeader(request.headers.get('cookie'), refreshedSetCookies),
    );
    requestHeaders.set('x-auth-edge-refreshed', '1');
  }
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);
  requestHeaders.set('x-edge-routed', 'true');
  requestHeaders.set('x-edge-runtime', 'vercel-edge-v8');
  requestHeaders.set('x-auth-user-id', nextAuthUserId);
  if (token!.tenantId) {
    requestHeaders.set('x-auth-tenant-id', token!.tenantId as string);
  }
  requestHeaders.set('x-auth-role', String(token!.role));
  requestHeaders.set('x-auth-verified-edge', 'true');

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return applyResponseHeaders(response, refreshedSetCookies, token!.tenantId);
}
