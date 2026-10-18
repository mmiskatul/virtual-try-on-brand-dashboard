import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

// Public paths that do not require Brand Owner authentication
const PUBLIC_PREFIXES = [
  '/storefront',
  '/api/edge/storefront',
  '/api/auth',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
];

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
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// --- Strict Edge CORS Configuration ---
const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/([a-z0-9-]+\.)?vton-platform\.io$/,
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // Server-to-server or same-origin
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
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt <= now) rateLimitStore.delete(k);
    }
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
  const origin = request.headers.get('origin');
  const clientIp = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  // 1. Edge-Level Strict CORS Preflight & Origin Verification
  if (pathname.startsWith('/api/')) {
    if (origin && !isOriginAllowed(origin)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Cross-origin request blocked by Edge CORS policy' },
        { status: 403 }
      );
    }

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id, x-client-version',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
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

  const isPublic = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // If public route (e.g. public brand boutique storefront for shoppers), allow through with CSP headers
  if (isPublic) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);
    requestHeaders.set('x-edge-routed', 'true');
    requestHeaders.set('x-edge-runtime', 'vercel-edge-v8');

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('x-nonce', nonce);
    response.headers.set('x-content-type-options', 'nosniff');
    response.headers.set('x-frame-options', 'DENY');
    response.headers.set('x-xss-protection', '1; mode=block');
    response.headers.set('x-edge-runtime', 'vercel-edge-v8');
    response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimit.reset));
    if (origin && isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    return response;
  }

  // 4. Edge Token Verification using NextAuth JWT
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'vton-brand-dashboard-fallback-secret-key-32chars',
  });

  // 5. Block unauthorized merchant requests at the edge
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Merchant authentication token required at edge routing layer.',
          code: 'EDGE_MERCHANT_AUTH_REQUIRED',
        },
        {
          status: 401,
          headers: {
            'Content-Security-Policy': cspHeader,
            'x-nonce': nonce,
          },
        }
      );
    }

    const signInUrl = new URL('/api/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 6. Inject verified merchant headers & cryptographic nonce downstream
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);
  requestHeaders.set('x-edge-routed', 'true');
  requestHeaders.set('x-edge-runtime', 'vercel-edge-v8');
  requestHeaders.set('x-auth-user-id', (token.id as string) || (token.sub as string) || '');
  requestHeaders.set('x-auth-tenant-id', (token.tenantId as string) || 'tenant_aura');
  requestHeaders.set('x-auth-role', (token.role as string) || 'BRAND_OWNER');
  requestHeaders.set('x-auth-verified-edge', 'true');

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('x-nonce', nonce);
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('x-xss-protection', '1; mode=block');
  response.headers.set('x-edge-runtime', 'vercel-edge-v8');
  response.headers.set('x-auth-tenant-id', (token.tenantId as string) || 'tenant_aura');

  // Rate Limiting headers
  response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
  response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
  response.headers.set('X-RateLimit-Reset', String(rateLimit.reset));

  // Strict CORS headers for allowed origins
  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}
