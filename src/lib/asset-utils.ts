
import type { AssetType, FormData } from '@/types'; // Assuming FormData might be used or adapted

export const assetTypeConfigPlaceholders: Record<AssetType, { param1: string, param2: string }> = {
  Server: { param1: 'Server IP Address (e.g., 192.168.1.100)', param2: 'Node Exporter Port (e.g., 9100)' },
  Network: { param1: 'Device IP / Hostname', param2: 'SNMP Community String (for SNMP Exporter)' },
  Application: { param1: 'Metrics Endpoint URL (e.g., http://app/metrics)', param2: 'Application Port (optional, if not in URL)' },
  Database: { param1: 'Database Host Address', param2: 'Exporter Port (e.g., 9187 for PostgreSQL)' },
  Kubernetes: { param1: 'API Server URL (e.g., https://kube-api.example.com)', param2: 'Bearer Token File Path (optional, e.g., /var/run/secrets/kubernetes.io/serviceaccount/token)' },
  "Ubuntu Server": { param1: 'Ubuntu Server IP (e.g., 192.168.1.101)', param2: 'Node Exporter Port (e.g., 9100)' },
  "Windows Server": { param1: 'Windows Server IP (e.g., 192.168.1.102)', param2: 'Windows Exporter Port (e.g., 9182)' },
  Docker: { param1: 'Docker Host API or Exporter URL (e.g., cadvisor:8080 or unix:///var/run/docker.sock)', param2: 'Metrics Path (optional, e.g., /metrics for cAdvisor)'},
};

interface ConfigGenerationParams {
  name?: string;
  type?: AssetType;
  config_param1?: string;
  config_param2?: string;
}

export const getMockPrometheusConfig = (data: ConfigGenerationParams): string => {
  if (!data.type || !data.name) return `# Incomplete configuration: Name and Type are required.`;
  
  const jobName = data.name.toLowerCase().replace(/\s+/g, '_') || 'new_asset_job';
  let targets = data.config_param1 || 'TARGET_IP_OR_HOSTNAME';
  let port = data.config_param2;

  let scrapeConfigBody = '';

  switch (data.type) {
    case 'Application':
      targets = data.config_param1 || 'http://app-host/metrics'; // Expect full URL here
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}']`;
      if (data.config_param2) { // If port is given separately for app, implies non-standard metrics URL maybe?
        scrapeConfigBody += ` # Note: Port ${data.config_param2} provided, ensure it's part of the target URL if needed.`;
      }
      break;
    case 'Kubernetes':
      scrapeConfigBody = `
    kubernetes_sd_configs:
      - role: pod # Example role, adjust as needed (node, service, endpoints, ingress)
        api_server: ${data.config_param1 ? `'${data.config_param1}'` : 'YOUR_K8S_API_SERVER_URL'}
        ${data.config_param2 ? `bearer_token_file: '${data.config_param2}'`: '# bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token (if in-cluster)'}
        # namespace: default # Optional: specify namespace
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_container_port_name]
        action: keep
        regex: metrics # Or your specific metrics port name
      # Add more relabel_configs as needed
      # Example: discover pods in a specific namespace
      # - source_labels: [__meta_kubernetes_namespace]
      #   action: keep
      #   regex: my-namespace
      # Example: relabel labels for better metric organization
      # - source_labels: [__meta_kubernetes_pod_label_app]
      #   target_label: app`;
      break;
    case 'Server':
    case 'Ubuntu Server':
      port = port || '9100'; // Default Node Exporter port
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}:${port}']`;
      break;
    case 'Windows Server':
      port = port || '9182'; // Default Windows Exporter port
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}:${port}']`;
      break;
    case 'Docker':
      // Assumes cAdvisor or similar exporter; Docker daemon metrics are different
      targets = data.config_param1 || 'cadvisor_or_exporter_host:port'; 
      const metricsPath = data.config_param2 || '/metrics';
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}']
    metrics_path: ${metricsPath}`;
      break;
    case 'Database':
      port = port || '9187'; // Example for pg_exporter, adjust for others
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}:${port}']`;
      break;
    case 'Network': // Typically SNMP Exporter
      targets = data.config_param1 || 'NETWORK_DEVICE_IP_OR_HOSTNAME';
      const snmpModule = data.config_param2 || 'if_mib'; // Example module
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}'] # This target is for the SNMP Exporter to query
    params:
      module: ['${snmpModule}']
    # This job should target your SNMP Exporter, not the device directly.
    # The actual target for Prometheus to scrape will be the SNMP exporter itself.
    # Example: http://snmp_exporter_host:9116/snmp
    # The 'targets' above will be passed as a parameter to the SNMP exporter.
    # You'll need another job definition if Prometheus scrapes SNMP Exporter directly:
    # - job_name: 'snmp_exporter'
    #   static_configs:
    #     - targets: ['localhost:9116'] # Address of your SNMP exporter
    metrics_path: /snmp`;
      break;
    default:
      scrapeConfigBody = `
    # Configuration for ${data.type} type is generic.
    # Please adapt based on the specific exporter or metrics endpoint.
    static_configs:
      - targets: ['${targets}${port ? `:${port}` : ''}']`;
      break;
  }

  return `scrape_configs:
  - job_name: '${jobName}'
    # scrape_interval: 15s (default, can be overridden)
    # scrape_timeout: 10s (default, can be overridden)
    # metrics_path: /metrics (default, can be overridden unless specified below)
    # scheme: http (default, can be https)
${scrapeConfigBody}
`;
};

export const getMockInstructions = (type?: AssetType): string[] => {
  if (!type) return ["Select an asset type to see specific instructions."];
  switch (type) {
    case 'Server': // Generic server, assumes Node Exporter
      return [
        "1. **Install Node Exporter**: Download the latest Node Exporter from `https://prometheus.io/download/#node_exporter`. Extract and run it. For Linux, consider creating a systemd service.",
        "   Example systemd service (`/etc/systemd/system/node_exporter.service`):",
        "   ```yaml\n   [Unit]\n   Description=Node Exporter\n   Wants=network-online.target\n   After=network-online.target\n\n   [Service]\n   User=node_exporter\n   Group=node_exporter\n   Type=simple\n   ExecStart=/usr/local/bin/node_exporter\n\n   [Install]\n   WantedBy=multi-user.target\n   ```",
        "   Then: `sudo useradd -rs /bin/false node_exporter` (if user doesn't exist), `sudo systemctl daemon-reload`, `sudo systemctl enable --now node_exporter`.",
        "2. **Firewall**: Ensure port (default 9100) is open. E.g., `sudo ufw allow 9100/tcp` or cloud firewall rules.",
        "3. **Verify Metrics**: Access `http://<server_ip>:9100/metrics` via browser or `curl`.",
        "4. **Prometheus Configuration**: Add the generated YAML to your `prometheus.yml` under `scrape_configs`.",
        "5. **Reload Prometheus**: `curl -X POST http://<prometheus_host>:9090/-/reload` or send SIGHUP."
      ];
    case 'Ubuntu Server':
      return [
        "1. **Install Node Exporter**: `sudo apt-get update && sudo apt-get install prometheus-node-exporter -y` (if available in repos) or download binary from `https://prometheus.io/download/`.",
        "   If installed via package: `sudo systemctl start prometheus-node-exporter`, `sudo systemctl enable prometheus-node-exporter`.",
        "   If binary, follow generic Server instructions for systemd service.",
        "2. **Firewall**: Port 9100 is typical. `sudo ufw allow 9100/tcp`.",
        "3. **Verify Metrics**: Check `http://<ubuntu_server_ip>:9100/metrics`.",
        "4. **Prometheus Configuration**: Use the generated YAML in your `prometheus.yml`.",
        "5. **Reload Prometheus**: `curl -X POST http://<prometheus_host>:9090/-/reload`."
      ];
    case 'Windows Server':
      return [
        "1. **Install Windows Exporter**: Download `windows_exporter` MSI from `https://github.com/prometheus-community/windows_exporter/releases`.",
        "2. **Configure Collectors**: During MSI install or via command line: `windows_exporter.exe --collectors.enabled=\"cpu,cs,logical_disk,net,os,service,system,memory,tcp,process,iis\"` (choose relevant collectors). Default port is 9182.",
        "3. **Firewall**: Allow port 9182. In PowerShell: `New-NetFirewallRule -DisplayName \"Windows Exporter\" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 9182`.",
        "4. **Verify Metrics**: Check `http://<windows_server_ip>:9182/metrics`.",
        "5. **Prometheus Configuration**: Add generated YAML to `prometheus.yml`.",
        "6. **Reload Prometheus**: `curl -X POST http://<prometheus_host>:9090/-/reload`."
      ];
    case 'Docker':
      return [
        "1. **Choose Exporter**: For container metrics, cAdvisor is common. For Docker daemon metrics, Docker itself can expose them (experimental, check Docker docs). This guide assumes cAdvisor.",
        "2. **Run cAdvisor**: `docker run --volume=/:/rootfs:ro --volume=/var/run:/var/run:rw --volume=/sys:/sys:ro --volume=/var/lib/docker/:/var/lib/docker:ro --publish=8080:8080 --detach=true --name=cadvisor gcr.io/cadvisor/cadvisor:latest` (adjust port if needed).",
        "3. **Verify cAdvisor**: Check `http://<docker_host_ip>:8080/metrics`.",
        "4. **Prometheus Configuration**: Add generated YAML (targeting cAdvisor endpoint) to `prometheus.yml`.",
        "5. **Reload Prometheus**: `curl -X POST http://<prometheus_host>:9090/-/reload`."
      ];
    case 'Application':
      return [
        "1. **Expose Metrics**: Ensure your application uses a Prometheus client library (e.g., `prometheus-client` for Python/Java, `prom-client` for Node.js) to expose metrics on an HTTP endpoint (typically `/metrics`).",
        "2. **Verify Endpoint**: Confirm the metrics endpoint (`http://<app_host>:<app_port>/metrics`) is accessible and serving Prometheus-formatted metrics.",
        "3. **Firewall**: Ensure any firewalls allow Prometheus to reach the application's metrics port.",
        "4. **Prometheus Configuration**: Add the generated YAML to `prometheus.yml`.",
        "5. **Reload Prometheus**: `curl -X POST http://<prometheus_host>:9090/-/reload`."
      ];
    case 'Network': // Assuming SNMP Exporter
      return [
        "1. **SNMP on Device**: Enable SNMP (v2c or v3) on your network device. Note the community string or v3 credentials.",
        "2. **SNMP Exporter**: Set up an SNMP Exporter instance (e.g., `prom/snmp-exporter`). Configure `snmp.yml` for your device type/modules (e.g., `if_mib`).",
        "   Example `snmp.yml` entry for `if_mib` (often default):",
        "   ```yaml\n   if_mib:\n     walk: [ifDescr, ifType, ifSpeed, ifPhysAddress, ifAdminStatus, ifOperStatus, ifInOctets, ifInUcastPkts, ifInNUcastPkts, ifInDiscards, ifInErrors, ifOutOctets, ifOutUcastPkts, ifOutNUcastPkts, ifOutDiscards, ifOutErrors, ifHCInOctets, ifHCOutOctets]\n     lookups:\n       - OID: 1.3.6.1.2.1.2.2.1.6 # ifPhysAddress\n         type: DisplayString\n   ```",
        "   Run SNMP Exporter: `docker run -d -p 9116:9116 -v ./snmp.yml:/etc/snmp_exporter/snmp.yml prom/snmp-exporter`.",
        "3. **Test SNMP Exporter**: `curl \"http://<snmp_exporter_host>:9116/snmp?module=<your_module>&target=<network_device_ip>\"`.",
        "4. **Prometheus Configuration**: The generated YAML job targets the *SNMP Exporter*, passing the device IP as a parameter. Ensure the job name and target in `prometheus.yml` point to your SNMP Exporter instance.",
        "   The generated YAML is for a job that would look like:",
        "   ```yaml\n   # This job scrapes the SNMP exporter, passing the actual network device as a parameter.\n   - job_name: 'your_network_device_job_name'\n     scrape_interval: 60s \n     static_configs:\n       - targets:\n         - <network_device_ip> # This is NOT scraped directly by Prometheus\n     metrics_path: /snmp\n     params:\n       module: [if_mib] # Or your specified module\n     relabel_configs:\n       - source_labels: [__address__]\n         target_label: __param_target\n       - source_labels: [__param_target]\n         target_label: instance\n       - target_label: __address__\n         replacement: snmp-exporter:9116 # Address of your SNMP exporter\n   ```",
        "5. **Reload Prometheus**: `curl -X POST http://<prometheus_host>:9090/-/reload`."
      ];
    case 'Database':
        return [
            "1. **Install Exporter**: Choose the correct exporter for your database (e.g., `pg_exporter` or `postgres_exporter` for PostgreSQL, `mysqld_exporter` for MySQL/MariaDB, `oracledb_exporter` for Oracle).",
            "   - PostgreSQL: `https://github.com/prometheus-community/postgres_exporter`",
            "   - MySQL: `https://github.com/prometheus/mysqld_exporter`",
            "2. **Configure Exporter**: Set connection details (DB host, port, user, password) typically via environment variables (e.g., `DATA_SOURCE_NAME` for `postgres_exporter` and `mysqld_exporter`).",
            "   `DATA_SOURCE_NAME=\"postgresql://user:password@host:port/database?sslmode=disable\"`",
            "3. **Run Exporter**: Start the exporter service. Ensure it has network access to the database.",
            "4. **Firewall**: Open the exporter's port (e.g., 9187 for `postgres_exporter`, 9104 for `mysqld_exporter`) from Prometheus.",
            "5. **Verify Metrics**: Check `http://<exporter_host>:<exporter_port>/metrics`.",
            "6. **Prometheus Configuration**: Add the generated YAML to `prometheus.yml`.",
            "7. **Reload Prometheus**: `curl -X POST http://<prometheus_host>:9090/-/reload`."
        ];
    case 'Kubernetes':
        return [
            "1. **Accessibility**: Ensure Prometheus can reach the Kubernetes API server. If running Prometheus outside the cluster, configure `api_server` URL and authentication.",
            "2. **Service Discovery Role**: Choose the `role` for `kubernetes_sd_configs` (e.g., `pod`, `service`, `endpoints`, `node`, `ingress`). `pod` is common for app metrics.",
            "3. **Authentication**: If in-cluster, Prometheus typically uses the service account token mounted at `/var/run/secrets/kubernetes.io/serviceaccount/token`. If external, provide `bearer_token_file` or other auth methods.",
            "4. **RBAC Permissions**: Prometheus needs permissions to list and watch resources. Create `ClusterRole` and `ClusterRoleBinding` (or `Role` and `RoleBinding` for namespace-specific).",
            "   Example `ClusterRole`:",
            "   ```yaml\n   apiVersion: rbac.authorization.k8s.io/v1\n   kind: ClusterRole\n   metadata:\n     name: prometheus\n   rules:\n   - apiGroups: [\"\"]\n     resources: [nodes, nodes/metrics, services, endpoints, pods, configmaps]\n     verbs: [get, list, watch]\n   - apiGroups: [extensions, networking.k8s.io]\n     resources: [ingresses]\n     verbs: [get, list, watch]\n   - nonResourceURLs: [\"/metrics\"]\n     verbs: [get]\n   ```",
            "5. **Relabeling**: Use `relabel_configs` extensively to filter targets (e.g., scrape pods with `prometheus.io/scrape: 'true'` annotation) and shape labels.",
            "   Example to scrape annotated pods on a specific port:",
            "   ```yaml\n   relabel_configs:\n   - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]\n     action: keep\n     regex: true\n   - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]\n     action: replace\n     target_label: __metrics_path__\n     regex: (.+)\n   - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]\n     action: replace\n     regex: ([^:]+)(?::\\d+)?;(\\d+)\n     replacement: $$1:$$2\n     target_label: __address__\n   ```",
            "6. **Prometheus Configuration**: Add the generated (and potentially further customized) scrape config to `prometheus.yml`.",
            "7. **Reload Prometheus**: `curl -X POST http://<prometheus_host>:9090/-/reload`."
        ];
    default:
      return [
        "1. **Expose Metrics**: Ensure the asset exposes Prometheus-compatible metrics on a reachable HTTP endpoint (often `/metrics`).",
        "2. **Network Access**: Confirm Prometheus can reach this endpoint over the network (check firewalls, routing).",
        "3. **Prometheus Configuration**: Add the generated scrape configuration to your `prometheus.yml` file.",
        "4. **Reload Prometheus**: `curl -X POST http://<prometheus_host>:9090/-/reload` or send SIGHUP to the process."
      ];
  }
};
