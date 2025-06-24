
import { Pool } from 'pg';
import type { Asset, AssetFolder } from '@/types';
import { formatISO } from 'date-fns';

let pool: Pool;

function getDbPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }
    pool = new Pool({
      connectionString,
      // You might want to add SSL configuration here for production
      // ssl: {
      //   rejectUnauthorized: false, // Or use process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false
      // },
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      // process.exit(-1); // Optional: exit if a db error occurs
    });
  }
  return pool;
}

export async function getClient() {
  const pool = getDbPool();
  return pool.connect();
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const client = await getDbPool().connect();
  try {
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    // console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } finally {
    client.release();
  }
}

const assetFoldersTableDDL = `
CREATE TABLE IF NOT EXISTS asset_folders (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id VARCHAR(255) REFERENCES asset_folders(id) ON DELETE SET NULL
);
`;

const assetsTableDDL = `
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    last_checked TIMESTAMPTZ NOT NULL,
    grafana_link TEXT,
    configuration JSONB,
    tags TEXT[],
    folder_id VARCHAR(255) REFERENCES asset_folders(id) ON DELETE SET NULL
);
`;

// Simple flag to ensure initialization runs only once per app lifecycle
let dbInitialized = false;

export async function initializeDatabase() {
  if (dbInitialized) {
    return;
  }
  try {
    console.log('Attempting to initialize database schema...');
    await query(assetFoldersTableDDL);
    console.log('asset_folders table checked/created.');
    await query(assetsTableDDL);
    console.log('assets table checked/created.');
    dbInitialized = true;
    console.log('Database schema initialization complete.');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    // Depending on the error, you might want to throw it or handle it
    // For now, we'll log it and let the app continue, subsequent queries might fail
  }
}

// Helper to convert DB row to Asset type
export const rowToAsset = (row: any): Asset => ({
  ...row,
  lastChecked: formatISO(new Date(row.last_checked)), // Ensure date is ISO string
  tags: row.tags || [], // Ensure tags is an array
  configuration: row.configuration || {}, // Ensure configuration is an object
});

// Helper to convert DB row to AssetFolder type
export const rowToAssetFolder = (row: any): AssetFolder => ({
  ...row,
});
