
import { NextResponse } from 'next/server';
import { query, initializeDatabase, rowToAssetFolder, getClient } from '@/lib/db';
import type { AssetFolder } from '@/types';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await initializeDatabase();
    const folderId = params.id;
    const result = await query('SELECT * FROM asset_folders WHERE id = $1', [folderId]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }
    const folder: AssetFolder = rowToAssetFolder(result.rows[0]);
    return NextResponse.json(folder, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching folder:", error);
    return NextResponse.json({ error: 'Failed to fetch folder', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await initializeDatabase();
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

    // Basic circular dependency check (can be more robust for deeper nesting with recursive CTE in SQL)
    if (parentId) {
        let currentParentCheck = parentId;
        const visited = new Set<string>([folderId]);
        while(currentParentCheck) {
            if (visited.has(currentParentCheck)) {
                return NextResponse.json({ error: 'Circular parent folder dependency detected' }, { status: 400 });
            }
            visited.add(currentParentCheck);
            const parentFolderResult = await query('SELECT parent_id FROM asset_folders WHERE id = $1', [currentParentCheck]);
            if (parentFolderResult.rows.length > 0) {
                currentParentCheck = parentFolderResult.rows[0].parent_id;
            } else {
                 // ParentId provided does not exist, or broken chain
                return NextResponse.json({ error: 'Invalid parent folder ID in chain.' }, { status: 400 });
            }
        }
    }

    const updateQuery = `
      UPDATE asset_folders
      SET name = $1, parent_id = $2
      WHERE id = $3
      RETURNING *;
    `;
    const values = [name.trim(), parentId, folderId];

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Folder not found or failed to update' }, { status: 404 });
    }
    const updatedFolder: AssetFolder = rowToAssetFolder(result.rows[0]);
    return NextResponse.json(updatedFolder, { status: 200 });

  } catch (error: any) {
    console.error("Failed to update folder:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    if (error.code === '23503' && error.constraint === 'asset_folders_parent_id_fkey') {
      return NextResponse.json({ error: 'Invalid parent folder ID.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update folder', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await initializeDatabase();
    const folderId = params.id;

    // Check if folder exists
    const folderCheck = await query('SELECT id FROM asset_folders WHERE id = $1', [folderId]);
    if (folderCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }
    
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Set folder_id = NULL for assets in the folder to be deleted
      await client.query('UPDATE assets SET folder_id = NULL WHERE folder_id = $1', [folderId]);

      // Set parent_id = NULL for direct child folders
      // For a more robust solution, you might re-parent them or delete them recursively if allowed.
      await client.query('UPDATE asset_folders SET parent_id = NULL WHERE parent_id = $1', [folderId]);
      
      // Delete the folder
      const deleteResult = await client.query('DELETE FROM asset_folders WHERE id = $1', [folderId]);

      await client.query('COMMIT');

      if (deleteResult.rowCount > 0) {
        return NextResponse.json({ message: 'Folder deleted successfully' }, { status: 200 });
      } else {
        // Should have been caught by the initial check, but as a safeguard
        return NextResponse.json({ error: 'Folder not found during delete, possibly already deleted' }, { status: 404 });
      }
    } catch (transactionError: any) {
      await client.query('ROLLBACK');
      console.error("Transaction error deleting folder:", transactionError);
      return NextResponse.json({ error: 'Failed to delete folder due to a transaction error', details: transactionError.message }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error("Failed to delete folder:", error);
    return NextResponse.json({ error: 'Failed to delete folder', details: error.message }, { status: 500 });
  }
}
