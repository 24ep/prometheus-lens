
import { NextResponse } from 'next/server';
import { query, initializeDatabase, rowToAsset } from '@/lib/db';
import type { Asset } from '@/types';
import { formatISO } from 'date-fns';

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const result = await query('SELECT * FROM assets ORDER BY name ASC');
    const assets: Asset[] = result.rows.map(rowToAsset);
    return NextResponse.json(assets, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching assets:", error);
    return NextResponse.json({ error: 'Failed to fetch assets', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const body = await request.json() as Omit<Asset, 'id' | 'lastChecked' | 'status'>;
    
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ error: 'Asset name is required' }, { status: 400 });
    }
    if (!body.type || typeof body.type !== 'string') {
      return NextResponse.json({ error: 'Asset type is required' }, { status: 400 });
    }

    const newAssetId = `asset-${Date.now()}`;
    const lastChecked = formatISO(new Date());
    const status = 'pending'; // Default status for new assets

    const insertQuery = `
      INSERT INTO assets (id, name, type, status, last_checked, grafana_link, configuration, tags, folder_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      newAssetId,
      body.name,
      body.type,
      status,
      lastChecked,
      body.grafanaLink,
      body.configuration || {},
      body.tags || [],
      body.folderId
    ];

    const result = await query(insertQuery, values);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to create asset, no rows returned.' }, { status: 500 });
    }
    const newAsset: Asset = rowToAsset(result.rows[0]);
    return NextResponse.json(newAsset, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create asset:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    // Check for PG specific errors if needed, e.g. unique constraint
    return NextResponse.json({ error: 'Failed to create asset', details: error.message }, { status: 500 });
  }
}
