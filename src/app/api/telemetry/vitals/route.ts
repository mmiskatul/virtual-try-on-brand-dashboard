import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { trace } from '@opentelemetry/api';

export const runtime = 'edge';

/**
 * Real User Monitoring (RUM) Telemetry Ingestion Endpoint: Brand Portal
 * Ingests live client Core Web Vitals (LCP, FID, INP, CLS, TTFB, FCP) from boutique storefronts
 * and correlates them into OpenTelemetry spans for Datadog RUM / New Relic observability.
 */
export async function POST(request: NextRequest) {
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
