
export type AssetType = "Server" | "Network" | "Application" | "PostgreSQL" | "MySQL" | "MongoDB" | "Kubernetes" | "Docker" | "Ubuntu Server" | "Windows Server";

export const assetTypes: AssetType[] = ["Server", "Network", "Application", "PostgreSQL", "MySQL", "MongoDB", "Kubernetes", "Docker", "Ubuntu Server", "Windows Server"];

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  status: "connected" | "disconnected" | "error" | "pending";
  lastChecked: string; // ISO date string
  grafanaLink?: string;
  configuration: Record<string, any>; // Prometheus YAML or structured config, typically one job definition
  tags?: string[];
  folderId?: string;
}

export interface AssetFolder {
  id: string;
  name: string;
  parentId?: string;
}

// For AssetConnectionWizard form
export interface FormData {
  name: string;
  type: AssetType;
  folderId?: string;
  tags?: string; // Comma-separated
  config_param1?: string; // e.g. IP/Hostname or API Endpoint
  config_param2?: string; // e.g. Port or Token for K8s
  // prometheus_config is generated, not a direct form field
}

// Permission Type
export interface Permission {
  id: string;
  name: string;
  description: string;
}

// User and Group Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer'; // Example roles
  groupIds?: string[]; // IDs of groups the user belongs to
  permissionIds?: string[]; // IDs of specific permissions granted to the user
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  // permissions could be an array of strings or a more complex object
}

