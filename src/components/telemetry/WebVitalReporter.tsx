'use client';

import { useReportWebVitals } from 'next/web-vitals';

export interface WebVitalMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
  path: string;
  service: string;
  timestamp: number;
}

/**
 * Real User Monitoring (RUM) Reporter: Brand Portal
 * Captures live production Core Web Vitals (LCP, FID/INP, CLS, FCP, TTFB)
 * and streams telemetry directly to Datadog RUM, New Relic, and OpenTelemetry OTLP collectors.
 */
export function WebVitalReporter({ serviceName = 'vton-brand-portal' }: { serviceName?: string }) {
  useReportWebVitals((metric) => {
    const normalizedValue = Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value);

    const payload: WebVitalMetric = {
      id: metric.id,
      name: metric.name,
      value: normalizedValue,
      rating: metric.rating,
      delta: Math.round(metric.delta),
      navigationType: metric.navigationType,
      path: typeof window !== 'undefined' ? window.location.pathname : '/',
      service: serviceName,
      timestamp: Date.now(),
    };

    // 1. Dispatch to Datadog RUM if Datadog browser SDK is mounted
    if (typeof window !== 'undefined' && (window as any).DD_RUM) {
      (window as any).DD_RUM.addAction(`WebVital_${metric.name}`, {
        vital_name: metric.name,
        vital_value: normalizedValue,
        vital_rating: metric.rating,
        navigation_type: metric.navigationType,
        page_path: payload.path,
      });
    }

    // 2. Dispatch to New Relic Browser Agent if present
    if (typeof window !== 'undefined' && (window as any).newrelic) {
      (window as any).newrelic.addPageAction(`WebVital_${metric.name}`, {
        vital_name: metric.name,
        vital_value: normalizedValue,
        vital_rating: metric.rating,
        metric_id: metric.id,
      });
    }

    // 3. Dispatch to Server OpenTelemetry Ingestion via navigator.sendBeacon
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/telemetry/vitals', blob);
    } else if (typeof fetch !== 'undefined') {
      fetch('/api/telemetry/vitals', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {});
    }

    // 4. Emit custom browser event for live developer observability & HUD monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vton:rum-vital', { detail: payload }));
    }
  });

  return null;
}
