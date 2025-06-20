export type AssetType = "Server" | "Network" | "Application" | "Database" | "Kubernetes";

export const assetTypes: AssetType[] = ["Server", "Network", "Application", "Database", "Kubernetes"];

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  status: "connected" | "disconnected" | "error" | "pending";
  lastChecked: string; // ISO date string
  grafanaLink?: string;
  configuration: Record<string, any>; // Prometheus YAML or structured config
  tags?: string[];
  folderId?: string;
}

export interface AssetFolder {
  id: string;
  name: string;
  parentId?: string;
}
