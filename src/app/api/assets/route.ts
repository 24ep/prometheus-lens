
import { NextResponse } from 'next/server';
import { mockAssetsData, addAsset as addMockAsset } from '@/lib/mock-data';
import type { Asset } from '@/types';

export async function GET(request: Request) {
  try {
    // Return a copy to prevent direct modification of the mock data array by reference
    return NextResponse.json([...mockAssetsData], { status: 200 });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Omit<Asset, 'id' | 'lastChecked' | 'status'>;
    
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ error: 'Asset name is required' }, { status: 400 });
    }
    if (!body.type || typeof body.type !== 'string') {
      return NextResponse.json({ error: 'Asset type is required' }, { status: 400 });
    }
    // Add more validation as needed for other fields

    const newAsset = addMockAsset(body);
    return NextResponse.json(newAsset, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create asset:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create asset', details: error.message }, { status: 500 });
  }
}
