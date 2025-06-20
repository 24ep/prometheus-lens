
import { NextResponse } from 'next/server';
import { mockFoldersData, updateFolder as updateMockFolder, deleteFolder as deleteMockFolderData, mockAssetsData } from '@/lib/mock-data';
import type { AssetFolder } from '@/types';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const folderId = params.id;
    const folder = mockFoldersData.find(f => f.id === folderId);
    if (folder) {
      return NextResponse.json(folder, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching folder:", error);
    return NextResponse.json({ error: 'Failed to fetch folder' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const folderId = params.id;
    const body = await request.json();
    const { name, parentId } = body as { name: string; parentId?: string };

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Folder name is required and must be a non-empty string' }, { status: 400 });
    }
     if (parentId && (typeof parentId !== 'string' || parentId.trim() === '')) {
      return NextResponse.json({ error: 'Parent ID must be a non-empty string if provided' }, { status: 400 });
    }
    if (parentId === folderId) {
      return NextResponse.json({ error: 'A folder cannot be its own parent' }, { status: 400 });
    }

    // Basic circular dependency check (can be more robust for deeper nesting)
    let currentParentCheck = parentId;
    const visited = new Set<string>([folderId]);
    while(currentParentCheck) {
        if (visited.has(currentParentCheck)) {
            return NextResponse.json({ error: 'Circular parent folder dependency detected' }, { status: 400 });
        }
        visited.add(currentParentCheck);
        const parentFolder = mockFoldersData.find(f => f.id === currentParentCheck);
        currentParentCheck = parentFolder?.parentId;
    }


    const updatedFolder = updateMockFolder(folderId, name, parentId);

    if (updatedFolder) {
      return NextResponse.json(updatedFolder, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Folder not found or failed to update' }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Failed to update folder:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update folder', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const folderId = params.id;
    const success = deleteMockFolderData(folderId); // This mock function also handles unassigning assets

    if (success) {
      return NextResponse.json({ message: 'Folder deleted successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Folder not found or failed to delete' }, { status: 404 });
    }
  } catch (error) {
    console.error("Failed to delete folder:", error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
