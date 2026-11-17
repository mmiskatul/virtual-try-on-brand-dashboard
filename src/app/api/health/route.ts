import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Liveness probe for load balancers / Docker HEALTHCHECK. Public, no secrets. */
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'brand-dashboard', time: new Date().toISOString() });
}
