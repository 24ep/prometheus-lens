
export type AssetType = "Server" | "Network" | "Application" | "Database" | "Kubernetes" | "Docker" | "Ubuntu Server" | "Windows Server";

export const assetTypes: AssetType[] = ["Server", "Network", "Application", "Database", "Kubernetes", "Docker", "Ubuntu Server", "Windows Server"];

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
