import { NextResponse } from 'next/server';
import { query, initializeDatabase } from '@/lib/db';
import type { Asset } from '@/types';

function getMainTarget(asset: Asset): string | null {
  // Try to extract the first target from static_configs
  const staticConfigs = asset.configuration?.static_configs;
  if (Array.isArray(staticConfigs) && staticConfigs.length > 0) {
    const targets = staticConfigs[0].targets;
    if (Array.isArray(targets) && targets.length > 0) {
      let url = targets[0];
      if (!/^https?:\/\//.test(url)) {
        // Assume host:port, default to http
        url = `http://${url}`;
      }
      // Add /metrics if not present
      if (!url.endsWith('/metrics')) {
        url = url.replace(/\/$/, '') + '/metrics';
      }
      return url;
    }
  }
  return null;
}

async function updateAssetStatus(assetId: string, status: string) {
  await query(
    'UPDATE assets SET status = $1, last_checked = NOW() WHERE id = $2',
    [status, assetId]
  );
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await initializeDatabase();
    const assetId = params.id;
    const result = await query('SELECT * FROM assets WHERE id = $1', [assetId]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    const asset: Asset = result.rows[0];
    const targetUrl = getMainTarget(asset);
    if (!targetUrl) {
      await updateAssetStatus(assetId, 'error');
      return NextResponse.json({ status: 'error', message: 'No valid target found in configuration.' }, { status: 400 });
    }
    // Timeout helper
    const fetchWithTimeout = (url: string, ms: number) => {
      return Promise.race([
        fetch(url, { method: 'GET' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
      ]);
    };
    try {
      const res = await fetchWithTimeout(targetUrl, 5000);
      if ((res as Response).ok) {
        await updateAssetStatus(assetId, 'connected');
        return NextResponse.json({ status: 'connected', message: `Target ${targetUrl} is reachable.` });
      } else {
        await updateAssetStatus(assetId, 'disconnected');
        return NextResponse.json({ status: 'disconnected', message: `Target ${targetUrl} returned status ${(res as Response).status}` });
      }
    } catch (err: any) {
      await updateAssetStatus(assetId, 'error');
      return NextResponse.json({ status: 'error', message: `Failed to reach target: ${err.message}` }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
} 