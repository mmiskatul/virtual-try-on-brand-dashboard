import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { trace } from '@opentelemetry/api';
import {
  BRAND_ACCESS_COOKIE,
  BRAND_REFRESH_COOKIE,
  BRAND_SESSION_COOKIE,
  isAllowedBrandRole,
  isValidBrandAccessCookie,
  isValidBrandRefreshCookie,
} from '@/lib/portal-auth';

export const runtime = 'edge';

/**
 * Real User Monitoring (RUM) Telemetry Ingestion Endpoint: Brand Portal
 * Ingests live client Core Web Vitals (LCP, FID, INP, CLS, TTFB, FCP) from boutique storefronts
 * and correlates them into OpenTelemetry spans for Datadog RUM / New Relic observability.
 */
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const userId = typeof token?.id === 'string' ? token.id : typeof token?.sub === 'string' ? token.sub : '';
  const accessToken = request.cookies.get(BRAND_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(BRAND_REFRESH_COOKIE)?.value;
  const sessionCookie = request.cookies.get(BRAND_SESSION_COOKIE)?.value;

  if (
    !token ||
    !isAllowedBrandRole(token.role) ||
    (!isValidBrandAccessCookie(accessToken, userId, sessionCookie) &&
      !isValidBrandRefreshCookie(refreshToken, userId, sessionCookie))
  ) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Merchant authentication and access token required.' },
      { status: 401 },
    );
  }

  try {
    const vital = await request.json();

    const tracer = trace.getTracer('brand-rum-collector');
    const span = tracer.startSpan(`RUM_${vital.name || 'Metric'}`);

    span.setAttribute('rum.metric.name', vital.name || 'UNKNOWN');
    span.setAttribute('rum.metric.value', Number(vital.value) || 0);
    span.setAttribute('rum.metric.rating', vital.rating || 'unrated');
    span.setAttribute('rum.metric.id', vital.id || '');
    span.setAttribute('rum.page.path', vital.path || '/');
    span.setAttribute('rum.navigation.type', vital.navigationType || 'navigate');
    span.setAttribute('service.name', vital.service || 'vton-brand-portal');

    // Datadog APM & RUM Correlation Tags
    span.setAttribute('dd.service', vital.service || 'vton-brand-portal');
    span.setAttribute('dd.env', process.env.NODE_ENV || 'production');
    span.setAttribute('dd.rum.metric', vital.name);
    span.setAttribute('dd.rum.rating', vital.rating);

    // New Relic Browser & APM Correlation Tags
    span.setAttribute('entity.name', vital.service || 'vton-brand-portal');
    span.setAttribute('newrelic.web_vital', vital.name);

    span.end();

    return NextResponse.json({
      success: true,
      ingested: vital.name,
      rating: vital.rating,
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Malformed telemetry packet' }, { status: 400 });
  }
}
