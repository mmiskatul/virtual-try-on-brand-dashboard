/**
 * Next.js Framework Instrumentation: Brand Portal
 * Integrates OpenTelemetry with Datadog APM & New Relic directly into the Next.js runtime.
 * Automatically triggered by Next.js on server startup in Node.js and Edge runtimes.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initNodeTelemetry } = await import('./lib/telemetry/otel-server');
    await initNodeTelemetry({
      serviceName: 'vton-brand-portal',
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.0',
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const { initEdgeTelemetry } = await import('./lib/telemetry/otel-edge');
    await initEdgeTelemetry({
      serviceName: 'vton-brand-portal-edge',
      environment: process.env.NODE_ENV || 'production',
    });
  }
}
