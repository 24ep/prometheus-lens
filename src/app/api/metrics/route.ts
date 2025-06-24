// @ts-ignore: prom-client is a CJS module
import client from 'prom-client';
// @ts-ignore: next/server type error workaround
import { NextResponse } from 'next/server';

// Register default metrics only once
const register = client.register;
// @ts-ignore: custom global property for metrics registration
if (!globalThis.__PROM_CLIENT_METRICS_REGISTERED__) {
  client.collectDefaultMetrics({ register });
  // @ts-ignore: custom global property for metrics registration
  globalThis.__PROM_CLIENT_METRICS_REGISTERED__ = true;
}

export async function GET() {
  try {
    const metrics = await register.metrics();
    return new Response(metrics, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to collect metrics', details: err.message }, { status: 500 });
  }
} 