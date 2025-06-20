
import { NextResponse } from 'next/server';
import { query, initializeDatabase, rowToAsset } from '@/lib/db';
import type { Asset } from '@/types';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await initializeDatabase();
    const assetId = params.id;
    const newConfiguration = await request.json() as Record<string, any>;

    if (!newConfiguration || typeof newConfiguration !== 'object') {
        return NextResponse.json({ error: 'Invalid configuration payload. Expected a JSON object.' }, { status: 400 });
    }

    const updateQuery = `
      UPDATE assets
      SET configuration = $1, last_checked = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const values = [newConfiguration, assetId];

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Asset not found or failed to update configuration' }, { status: 404 });
    }
    const updatedAsset: Asset = rowToAsset(result.rows[0]);
    return NextResponse.json(updatedAsset, { status: 200 });

  } catch (error: any) {
    console.error("Failed to update asset configuration:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update asset configuration', details: error.message }, { status: 500 });
  }
}
