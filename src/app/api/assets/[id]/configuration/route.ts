
import { NextResponse } from 'next/server';
import { updateAssetConfiguration as updateMockAssetConfiguration } from '@/lib/mock-data';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const assetId = params.id;
    const newConfiguration = await request.json() as Record<string, any>;

    if (!newConfiguration || typeof newConfiguration !== 'object') {
        return NextResponse.json({ error: 'Invalid configuration payload. Expected a JSON object.' }, { status: 400 });
    }
    // Add more specific validation for the configuration object structure if needed

    const updatedAsset = updateMockAssetConfiguration(assetId, newConfiguration);

    if (updatedAsset) {
      return NextResponse.json(updatedAsset, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Asset not found or failed to update configuration' }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Failed to update asset configuration:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update asset configuration', details: error.message }, { status: 500 });
  }
}
