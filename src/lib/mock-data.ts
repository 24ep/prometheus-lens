import type { Asset, AssetFolder } from '@/types';
import { formatISO } from 'date-fns';

export const mockFoldersData: AssetFolder[] = [
  { id: 'folder-1', name: 'Production Servers' },
  { id: 'folder-2', name: 'Staging Applications' },
  { id: 'folder-3', name: 'Core Databases', parentId: 'folder-1' },
  { id: 'folder-4', name: 'Networking Gear'},
];

export const mockAssetsData: Asset[] = [
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
