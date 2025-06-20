
import { NextResponse } from 'next/server';
import { query, initializeDatabase, rowToAssetFolder } from '@/lib/db';
import type { AssetFolder } from '@/types';

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const result = await query('SELECT * FROM asset_folders ORDER BY name ASC');
    const folders: AssetFolder[] = result.rows.map(rowToAssetFolder);
    return NextResponse.json(folders, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching folders:", error);
    return NextResponse.json({ error: 'Failed to fetch folders', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const { name, parentId } = body as { name: string; parentId?: string };

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Folder name is required and must be a non-empty string' }, { status: 400 });
    }
    if (parentId && (typeof parentId !== 'string' || parentId.trim() === '')) {
      return NextResponse.json({ error: 'Parent ID must be a non-empty string if provided' }, { status: 400 });
    }

    const newFolderId = `folder-${Date.now()}`;
    const insertQuery = `
      INSERT INTO asset_folders (id, name, parent_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [newFolderId, name.trim(), parentId];
    
    const result = await query(insertQuery, values);
    if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Failed to create folder, no rows returned.' }, { status: 500 });
    }
    const newFolder: AssetFolder = rowToAssetFolder(result.rows[0]);
    return NextResponse.json(newFolder, { status: 201 });

  } catch (error: any) {
    console.error("Failed to create folder:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    // Check for PG specific errors, e.g. foreign key constraint for parentId
    if (error.code === '23503' && error.constraint === 'asset_folders_parent_id_fkey') {
      return NextResponse.json({ error: 'Invalid parent folder ID.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create folder', details: error.message }, { status: 500 });
  }
}
