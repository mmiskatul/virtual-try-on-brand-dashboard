'use client';

import { useEffect, useRef } from 'react';
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

/** Sign-in pages have no session, so uploading telemetry from them would only return 401. */
const PUBLIC_AUTH_PAGE =
  /^\/(login|register|verify-email|forgot-password|forget-password|reset-password|accept-invite)(\/|$)/;

/** Most one upload per page view keeps the number of /api requests per page load low. */
const MAX_BATCH = 20;

/**
 * Real User Monitoring (RUM) Reporter: Brand Portal
 * Captures live Core Web Vitals (LCP, INP, CLS, FCP, TTFB), forwards them to Datadog RUM / New Relic when
 * those agents are present, and uploads them to the server in ONE batched beacon when the page is hidden
 * or unloaded (instead of one request per metric).
 */
export function WebVitalReporter({ serviceName = 'vton-brand-portal' }: { serviceName?: string }) {
  const queue = useRef<WebVitalMetric[]>([]);

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

    // 1. Datadog RUM, if the browser SDK is present
    if (typeof window !== 'undefined' && (window as any).DD_RUM) {
      (window as any).DD_RUM.addAction(`WebVital_${metric.name}`, {
        vital_name: metric.name,
        vital_value: normalizedValue,
        vital_rating: metric.rating,
        navigation_type: metric.navigationType,
        page_path: payload.path,
      });
    }

    // 2. New Relic Browser agent, if present
    if (typeof window !== 'undefined' && (window as any).newrelic) {
      (window as any).newrelic.addPageAction(`WebVital_${metric.name}`, {
        vital_name: metric.name,
        vital_value: normalizedValue,
        vital_rating: metric.rating,
        metric_id: metric.id,
      });
    }

    // 3. Queue for the batched server upload (sent when the page is hidden)
    queue.current.push(payload);

    // 4. Custom browser event for live developer observability and HUD monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vton:rum-vital', { detail: payload }));
    }
  });

  useEffect(() => {
    const flush = () => {
      const batch = queue.current.splice(0).filter((m) => !PUBLIC_AUTH_PAGE.test(m.path)).slice(0, MAX_BATCH);
      if (batch.length === 0) return;
      const body = JSON.stringify({ metrics: batch });
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/telemetry/vitals', new Blob([body], { type: 'application/json' }));
      } else if (typeof fetch !== 'undefined') {
        fetch('/api/telemetry/vitals', {
          method: 'POST',
          body,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch(() => {});
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  return null;
}
