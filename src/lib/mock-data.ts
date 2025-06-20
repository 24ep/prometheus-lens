import type { Asset, AssetFolder } from '@/types';
import { formatISO } from 'date-fns';

export let mockFoldersData: AssetFolder[] = [
  { id: 'folder-1', name: 'Production Servers' },
  { id: 'folder-2', name: 'Staging Applications' },
  { id: 'folder-3', name: 'Core Databases', parentId: 'folder-1' },
  { id: 'folder-4', name: 'Networking Gear'},
];

export let mockAssetsData: Asset[] = [
  {
    id: 'asset-1',
    name: 'Alpha Web Server Cluster',
    type: 'Server',
    status: 'connected',
    lastChecked: formatISO(new Date(Date.now() - 1000 * 60 * 5)), // 5 mins ago
    grafanaLink: 'https://grafana.example.com/d/abcdef/alpha-web-server',
    configuration: { job_name: 'alpha_web', scrape_interval: '15s', metrics_path: '/metrics', static_configs: [{ targets: ['alpha-node-1:9100', 'alpha-node-2:9100']}] },
    tags: ['web', 'nginx', 'critical'],
    folderId: 'folder-1',
  },
  {
    id: 'asset-2',
    name: 'Beta API Gateway',
    type: 'Application',
    status: 'disconnected',
    lastChecked: formatISO(new Date(Date.now() - 1000 * 60 * 60 * 2)), // 2 hours ago
    configuration: { job_name: 'beta_api', static_configs: [{ targets: ['beta-api-instance:8080']}]},
    tags: ['api', 'nodejs', 'staging'],
    folderId: 'folder-2',
  },
  {
    id: 'asset-3',
    name: 'Core Network Switch - Datacenter A',
    type: 'Network',
    status: 'error',
    lastChecked: formatISO(new Date(Date.now() - 1000 * 60 * 15)), // 15 mins ago
    configuration: { job_name: 'network_switch_dc_a', snmp_community: 's3cr3t', static_configs: [{ targets: ['10.0.1.1']}]},
    tags: ['core', 'snmp', 'cisco'],
    folderId: 'folder-4',
  },
  {
    id: 'asset-4',
    name: 'Production PostgreSQL DB',
    type: 'Database',
    status: 'connected',
    lastChecked: formatISO(new Date(Date.now() - 1000 * 60 * 1)), // 1 min ago
    grafanaLink: 'https://grafana.example.com/d/ghijkl/prod-db',
    configuration: { job_name: 'prod_postgres', static_configs: [{ targets: ['postgres-primary:9187']}]},
    tags: ['db', 'postgres', 'critical', 'rds'],
    folderId: 'folder-3',
  },
  {
    id: 'asset-5',
    name: 'Staging Kubernetes Cluster',
    type: 'Kubernetes',
    status: 'pending',
    lastChecked: formatISO(new Date(Date.now() - 1000 * 60 * 30)), // 30 mins ago
    configuration: { job_name: 'staging_k8s', kubernetes_sd_configs: [{ api_server: 'https://k8s.staging.example.com', role: 'node'}] },
    tags: ['k8s', 'staging', 'microservices'],
    folderId: 'folder-2',
  },
  {
    id: 'asset-6',
    name: 'Legacy App Server',
    type: 'Server',
    status: 'connected',
    lastChecked: formatISO(new Date(Date.now() - 1000 * 60 * 120)), // 120 mins ago
    configuration: { job_name: 'legacy_app', static_configs: [{ targets: ['legacy-app:8000']}]},
    tags: ['java', 'tomcat'],
  },
];

// Folder CRUD operations
export const addFolder = (name: string, parentId?: string): AssetFolder => {
  const newFolder: AssetFolder = {
    id: `folder-${Date.now()}`, // Simple unique ID generation
    name,
    parentId,
  };
  mockFoldersData = [...mockFoldersData, newFolder];
  return newFolder;
};

export const updateFolder = (folderId: string, newName: string): AssetFolder | undefined => {
  let updatedFolder: AssetFolder | undefined;
  mockFoldersData = mockFoldersData.map(folder => {
    if (folder.id === folderId) {
      updatedFolder = { ...folder, name: newName };
      return updatedFolder;
    }
    return folder;
  });
  return updatedFolder;
};

export const deleteFolder = (folderId: string): boolean => {
  const folderExists = mockFoldersData.some(folder => folder.id === folderId);
  if (!folderExists) return false;

  mockFoldersData = mockFoldersData.filter(folder => folder.id !== folderId);
  // Un-assign assets from the deleted folder
  mockAssetsData = mockAssetsData.map(asset => {
    if (asset.folderId === folderId) {
      return { ...asset, folderId: undefined };
    }
    return asset;
  });
  // Also handle child folders if any (simple case: unassign parentId)
   mockFoldersData = mockFoldersData.map(folder => {
    if (folder.parentId === folderId) {
      return { ...folder, parentId: undefined };
    }
    return folder;
  });
  return true;
};

// Asset Tag Management
export const updateAssetTags = (assetId: string, newTags: string[]): Asset | undefined => {
  let updatedAsset: Asset | undefined;
  mockAssetsData = mockAssetsData.map(asset => {
    if (asset.id === assetId) {
      updatedAsset = { ...asset, tags: newTags };
      return updatedAsset;
    }
    return asset;
  });
  return updatedAsset;
};
