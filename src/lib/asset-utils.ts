
import type { AssetType, FormData } from '@/types'; // Assuming FormData might be used or adapted

export const assetTypeConfigPlaceholders: Record<AssetType, { param1: string, param2: string }> = {
  Server: { param1: 'Server IP Address (e.g., 192.168.1.100)', param2: 'Node Exporter Port (e.g., 9100)' },
  Network: { param1: 'Device IP / Hostname', param2: 'SNMP Community String' },
  Application: { param1: 'Metrics Endpoint URL (e.g., http://app/metrics)', param2: 'Application Port (optional)' },
  Database: { param1: 'Database Host Address', param2: 'Exporter Port (e.g., 9187 for PostgreSQL)' },
  Kubernetes: { param1: 'API Server URL (e.g., https://kube-api.example.com)', param2: 'Bearer Token (optional)' },
};

// Note: FormData here is a simplified version for config generation.
// In a real scenario, you might have a more specific type for these params.
interface ConfigGenerationParams {
  name?: string;
  type?: AssetType;
  config_param1?: string;
  config_param2?: string;
}

export const getMockPrometheusConfig = (data: ConfigGenerationParams): string => {
  if (!data.type || !data.name) return `# Incomplete configuration`;
  const jobName = data.name.toLowerCase().replace(/\s+/g, '_');
  let targets = `'${data.config_param1 || 'TARGET_IP_OR_HOSTNAME'}:${data.config_param2 || 'PORT'}'`;
  
  switch (data.type) {
    case 'Application':
      targets = `'${data.config_param1 || 'METRICS_ENDPOINT'}'`;
      break;
    case 'Kubernetes':
      return `
scrape_configs:
  - job_name: '${jobName}'
    kubernetes_sd_configs:
      - role: pod # Example role, could be node, service, etc.
        api_server: ${data.config_param1 || 'YOUR_K8S_API_SERVER'}
        # bearer_token: ${data.config_param2 || 'YOUR_BEARER_TOKEN_IF_ANY'}
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      # Add more relabel_configs as needed for specific k8s setup
`;
    default:
      // For Server, Network, Database - default target format is usually fine.
      // Network might use SNMP exporter which has a different config structure,
      // but for this mock, we'll keep it simple.
      break;
  }

  return `
scrape_configs:
  - job_name: '${jobName}'
    static_configs:
      - targets: [${targets}]
    # metrics_path: /metrics (default, can be overridden)
    # scheme: http (default, can be https)
`;
};

export const getMockInstructions = (type?: AssetType): string[] => {
  if (!type) return ["Select an asset type to see specific instructions."];
  switch (type) {
    case 'Server':
      return [
        "Install Node Exporter on the target server.",
        "Ensure the Node Exporter port (default 9100) is accessible from your Prometheus server.",
        "Verify Node Exporter is serving metrics at `/metrics` endpoint (e.g., `http://<server_ip>:9100/metrics`).",
        "Add the generated scrape configuration to your `prometheus.yml` file.",
        "Reload your Prometheus configuration (e.g., `kill -HUP <prometheus_pid>` or via API endpoint)."
      ];
    case 'Application':
      return [
        "Ensure your application exposes a Prometheus metrics endpoint (commonly `/metrics`).",
        "If using a client library (e.g., prometheus-client for Python/Java, prom-client for Node.js), configure it appropriately.",
        "Verify the metrics endpoint is accessible from your Prometheus server.",
        "Add the generated scrape configuration to your `prometheus.yml` file.",
        "Reload your Prometheus configuration."
      ];
    case 'Network': // Assuming SNMP Exporter use-case
      return [
        "Ensure SNMP is enabled on the network device.",
        "Set up an SNMP Exporter instance if you don't have one already.",
        "Configure the SNMP Exporter to query your target network device (e.g., using a module like `if_mib`).",
        "The Prometheus scrape job should target the SNMP Exporter's `/snmp` endpoint, passing the device target and module as parameters.",
        "Example SNMP Exporter target: `http://<snmp_exporter_host>:<port>/snmp?module=if_mib&target=<network_device_ip>`.",
        "Add the generated scrape configuration to `prometheus.yml` (pointing to the SNMP Exporter).",
        "Reload your Prometheus configuration."
      ];
    case 'Database':
        return [
            "Install the appropriate Prometheus exporter for your database type (e.g., `pg_exporter` for PostgreSQL, `mysqld_exporter` for MySQL).",
            "Configure the exporter with connection details for your database instance (usually via environment variables or a config file for the exporter).",
            "Ensure the exporter port (e.g., 9187 for PostgreSQL, 9104 for MySQL) is accessible from Prometheus.",
            "Verify the exporter is serving metrics at its `/metrics` endpoint.",
            "Add the generated scrape configuration to your `prometheus.yml` file.",
            "Reload your Prometheus configuration."
        ];
    case 'Kubernetes':
        return [
            "Ensure your Kubernetes cluster's API server is accessible by Prometheus.",
            "Prometheus typically uses Service Discovery (`kubernetes_sd_configs`) to find targets in Kubernetes.",
            "Choose the appropriate role for service discovery (e.g., `pod`, `service`, `endpoints`, `node`, `ingress`).",
            "If your cluster requires authentication, configure `bearer_token_file` or TLS settings in the Prometheus job.",
            "Ensure Prometheus has the necessary RBAC permissions (e.g., ClusterRole, ClusterRoleBinding) to access Kubernetes API for discovery.",
            "Use `relabel_configs` to filter and modify discovered targets (e.g., scrape based on annotations like `prometheus.io/scrape: 'true'`).",
            "Add the scrape configuration to your `prometheus.yml` file and reload Prometheus."
        ];
    default:
      return [
        "Ensure the asset exposes Prometheus-compatible metrics on a reachable HTTP endpoint.",
        "Add the generated scrape configuration to your `prometheus.yml` file.",
        "Reload Prometheus configuration (e.g., `kill -HUP <prometheus_pid>` or via API endpoint)."
      ];
  }
};
