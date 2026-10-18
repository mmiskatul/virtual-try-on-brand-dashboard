import { trace, DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';

export interface TelemetryConfig {
  serviceName: string;
  environment: string;
  version: string;
}

/**
 * Initialize Server-Side OpenTelemetry & Datadog / New Relic APM Bridge
 * Runs inside Node.js Server Runtime when Next.js boots up (via register() in instrumentation.ts).
 */
export async function initNodeTelemetry(config: TelemetryConfig): Promise<void> {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);
  }

  const tracer = trace.getTracer(config.serviceName, config.version);
  const bootSpan = tracer.startSpan('nextjs.brand_portal.boot');

  bootSpan.setAttribute('service.name', config.serviceName);
  bootSpan.setAttribute('service.version', config.version);
  bootSpan.setAttribute('deployment.environment', config.environment);
  bootSpan.setAttribute('telemetry.sdk.name', 'opentelemetry');
  bootSpan.setAttribute('telemetry.sdk.language', 'nodejs');

  // Datadog APM Standard Semantic Attributes
  bootSpan.setAttribute('dd.service', config.serviceName);
  bootSpan.setAttribute('dd.version', config.version);
  bootSpan.setAttribute('dd.env', config.environment);

  // New Relic Standard Semantic Attributes
  bootSpan.setAttribute('entity.name', config.serviceName);
  bootSpan.setAttribute('entity.type', 'SERVICE');

  bootSpan.end();

  if (isDev) {
    console.log(
      `[OpenTelemetry & Datadog/NewRelic APM] Brand Portal server instrumentation initialized for "${config.serviceName}" (${config.environment})`
    );
  }
}
