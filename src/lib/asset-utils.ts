
import type { AssetType, FormData } from '@/types'; // Assuming FormData might be used or adapted

export const assetTypeConfigPlaceholders: Record<AssetType, { param1: string, param2: string }> = {
  Server: { param1: 'Server IP Address (e.g., 192.168.1.100)', param2: 'Node Exporter Port (e.g., 9100)' },
  Network: { param1: 'Device IP / Hostname', param2: 'SNMP Community String' },
  Application: { param1: 'Metrics Endpoint URL (e.g., http://app/metrics)', param2: 'Application Port (optional)' },
  Database: { param1: 'Database Host Address', param2: 'Exporter Port (e.g., 9187 for PostgreSQL)' },
  Kubernetes: { param1: 'API Server URL (e.g., https://kube-api.example.com)', param2: 'Bearer Token (optional)' },
  "Ubuntu Server": { param1: 'Ubuntu Server IP (e.g., 192.168.1.101)', param2: 'Node Exporter Port (e.g., 9100)' },
  "Windows Server": { param1: 'Windows Server IP (e.g., 192.168.1.102)', param2: 'Windows Exporter Port (e.g., 9182)' },
  Docker: { param1: 'Docker API or Exporter URL (e.g., cadvisor:8080)', param2: 'Metrics Path (optional, e.g., /metrics)'},
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
  let metricsPath = data.config_param2 && data.type === 'Docker' ? data.config_param2 : '/metrics';

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
        # bearer_token_file: ${data.config_param2 ? '/path/to/token' : 'YOUR_BEARER_TOKEN_FILE_IF_ANY'}
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      # Add more relabel_configs as needed for specific k8s setup
`;
    case 'Ubuntu Server': // Falls through to Server logic
    case 'Server':
      targets = `'${data.config_param1 || 'SERVER_IP'}:${data.config_param2 || '9100'}'`;
      break;
    case 'Windows Server':
      targets = `'${data.config_param1 || 'WINDOWS_SERVER_IP'}:${data.config_param2 || '9182'}'`;
      break;
    case 'Docker':
      targets = `'${data.config_param1 || 'cadvisor:8080'}'`; // Example default for cAdvisor
      return `
scrape_configs:
  - job_name: '${jobName}'
    static_configs:
      - targets: [${targets}]
    metrics_path: ${metricsPath}
`;
    default:
      // For Network, Database - default target format is usually fine.
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
    case 'Ubuntu Server':
      return [
        "Install Node Exporter on the Ubuntu server (e.g., `sudo apt-get install prometheus-node-exporter` or download binary).",
        "Ensure Node Exporter service is running and enabled (e.g., `sudo systemctl start node_exporter && sudo systemctl enable node_exporter`).",
        "Ensure the Node Exporter port (default 9100) is accessible (e.g., `sudo ufw allow 9100/tcp`).",
        "Verify metrics are available at `http://<ubuntu_server_ip>:9100/metrics`.",
        "Add the generated scrape configuration to your `prometheus.yml` file.",
        "Reload your Prometheus configuration."
      ];
    case 'Windows Server':
      return [
        "Download and install `windows_exporter` (MSI recommended) from the official Prometheus community GitHub on the Windows Server.",
        "During installation or by CLI, enable desired collectors (e.g., `cpu,cs,logical_disk,net,os,service,system,memory,tcp`).",
        "Ensure the `windows_exporter` service is running.",
        "Allow the exporter port (default 9182) through Windows Firewall.",
        "Verify metrics at `http://<windows_server_ip>:9182/metrics`.",
        "Add the generated scrape configuration to your `prometheus.yml` file.",
        "Reload Prometheus configuration."
      ];
    case 'Docker':
      return [
        "Ensure your Docker environment is running.",
        "Consider using an exporter like cAdvisor for comprehensive container metrics. Run cAdvisor: `docker run --volume=/:/rootfs:ro --volume=/var/run:/var/run:rw --volume=/sys:/sys:ro --volume=/var/lib/docker/:/var/lib/docker:ro --publish=8080:8080 --detach=true --name=cadvisor gcr.io/cadvisor/cadvisor:latest`.",
        "Alternatively, Docker daemon itself can expose metrics if configured (experimental).",
        "Ensure the metrics endpoint (e.g., cAdvisor's port 8080, typically path `/metrics`) is accessible to Prometheus.",
        "Add the generated scrape configuration to `prometheus.yml`.",
        "Reload Prometheus configuration."
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
