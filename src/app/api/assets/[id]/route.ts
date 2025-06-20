
import { NextResponse } from 'next/server';
import { query, initializeDatabase, rowToAsset } from '@/lib/db';
import type { Asset } from '@/types';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await initializeDatabase();
    const assetId = params.id;
    const result = await query('SELECT * FROM assets WHERE id = $1', [assetId]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    const asset: Asset = rowToAsset(result.rows[0]);
    return NextResponse.json(asset, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching asset:", error);
    return NextResponse.json({ error: 'Failed to fetch asset', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await initializeDatabase();
    const assetId = params.id;
    const body = await request.json() as { tags?: string[], grafanaLink?: string, folderId?: string | null }; // Added folderId

    // Fetch current asset to merge details
    const currentAssetResult = await query('SELECT * FROM assets WHERE id = $1', [assetId]);
    if (currentAssetResult.rows.length === 0) {
      return NextResponse.json({ error: 'Asset not found to update' }, { status: 404 });
    }
    const currentAsset = rowToAsset(currentAssetResult.rows[0]);

    const tagsToUpdate = body.tags !== undefined ? body.tags : currentAsset.tags;
    const grafanaLinkToUpdate = body.grafanaLink !== undefined ? body.grafanaLink : currentAsset.grafanaLink;
    // Handle folderId: if explicitly passed as null, set it to null. Otherwise, use current value if not provided.
    const folderIdToUpdate = body.folderId === null ? null : (body.folderId !== undefined ? body.folderId : currentAsset.folderId);


    const updateQuery = `
      UPDATE assets
      SET tags = $1, grafana_link = $2, folder_id = $3, last_checked = NOW()
      WHERE id = $4
      RETURNING *;
    `;
    const values = [
      tagsToUpdate,
      grafanaLinkToUpdate,
      folderIdToUpdate,
      assetId
    ];
    
    const result = await query(updateQuery, values);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Asset not found or failed to update details' }, { status: 404 });
    }
    const updatedAsset: Asset = rowToAsset(result.rows[0]);
    return NextResponse.json(updatedAsset, { status: 200 });

  } catch (error: any) {
    console.error("Failed to update asset details:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update asset details', details: error.message }, { status: 500 });
  }
}
