// @ts-ignore: next/server type error workaround
import { NextResponse } from 'next/server';
import { query, initializeDatabase } from '@/lib/db';
import type { Asset } from '@/types';
// @ts-ignore: fs/promises type error workaround
import fs from 'fs/promises';

const PROMETHEUS_CONFIG_PATH = '/app/prometheus.yml';
const PROMETHEUS_RELOAD_URL = 'http://prometheus:9090/-/reload';

function buildPrometheusConfig(assets: Asset[]) {
  // Only include assets with valid configuration
  const scrape_configs = assets
    .filter(asset => asset.configuration && Object.keys(asset.configuration).length > 0)
    .map(asset => asset.configuration);
  return {
    global: {
      scrape_interval: '15s',
      evaluation_interval: '15s',
    },
    scrape_configs,
    alerting: {
      alertmanagers: [
        { static_configs: [{ targets: ['alertmanager:9093'] }] }
      ]
    }
  };
}

export async function POST() {
  try {
    await initializeDatabase();
    const result = await query('SELECT * FROM assets');
    const assets: Asset[] = result.rows;
    // @ts-ignore: require usage in ESM
    const yaml = require('js-yaml');
    const config = buildPrometheusConfig(assets);
    const configYaml = yaml.dump(config, { noRefs: true });
    await fs.writeFile(PROMETHEUS_CONFIG_PATH, configYaml, 'utf8');

    // Reload Prometheus
    const reloadRes = await fetch(PROMETHEUS_RELOAD_URL, { method: 'POST' });
    if (!reloadRes.ok) {
      throw new Error(`Prometheus reload failed: ${reloadRes.statusText}`);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 