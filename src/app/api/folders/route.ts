
import { NextResponse } from 'next/server';
import { mockFoldersData, addFolder as addMockFolder } from '@/lib/mock-data';
import type { AssetFolder } from '@/types';

export async function GET(request: Request) {
  // In a real backend, you'd fetch from your PostgreSQL database here
  // For now, we return the mock data
  try {
    return NextResponse.json(mockFoldersData, { status: 200 });
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, parentId } = body as { name: string; parentId?: string };

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Folder name is required and must be a non-empty string' }, { status: 400 });
    }
    if (parentId && (typeof parentId !== 'string' || parentId.trim() === '')) {
      return NextResponse.json({ error: 'Parent ID must be a non-empty string if provided' }, { status: 400 });
    }

    // In a real backend, you'd insert into your PostgreSQL database here
    // For now, we use the existing mock function which updates the in-memory array
    const newFolder = addMockFolder(name, parentId);

    return NextResponse.json(newFolder, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create folder:", error);
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create folder', details: error.message }, { status: 500 });
  }
}
