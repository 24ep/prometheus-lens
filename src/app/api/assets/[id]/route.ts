
import { NextResponse } from 'next/server';
import { mockAssetsData, updateAssetDetails as updateMockAssetDetails } from '@/lib/mock-data';
import type { Asset } from '@/types';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const assetId = params.id;
    const asset = mockAssetsData.find(a => a.id === assetId);
    if (asset) {
      return NextResponse.json(asset, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching asset:", error);
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const assetId = params.id;
    const body = await request.json() as { tags?: string[], grafanaLink?: string };

    // Add any specific validation for tags or grafanaLink if needed
    // For example, ensure tags is an array of strings, grafanaLink is a valid URL, etc.

    const updatedAsset = updateMockAssetDetails(assetId, body);

    if (updatedAsset) {
      return NextResponse.json(updatedAsset, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Asset not found or failed to update details' }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Failed to update asset details:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update asset details', details: error.message }, { status: 500 });
  }
}
