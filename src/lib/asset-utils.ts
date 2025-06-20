
import type { AssetType, FormData } from '@/types'; // Assuming FormData might be used or adapted

export const assetTypeConfigPlaceholders: Record<AssetType, { param1: string, param2: string }> = {
  Server: { param1: 'Server IP Address (e.g., 192.168.1.100)', param2: 'Node Exporter Port (e.g., 9100)' },
  Network: { param1: 'Device IP / Hostname', param2: 'SNMP Community String (for SNMP Exporter)' },
  Application: { param1: 'Metrics Endpoint URL (e.g., http://app/metrics)', param2: 'Application Port (optional, if not in URL)' },
  PostgreSQL: { param1: 'Database Host Address (e.g., db.example.com)', param2: 'Exporter Port (e.g., 9187 for postgres_exporter)' },
  MySQL: { param1: 'Database Host Address (e.g., mysql.example.com)', param2: 'Exporter Port (e.g., 9104 for mysqld_exporter)' },
  MongoDB: { param1: 'MongoDB URI (e.g., mongodb://mongo.example.com:27017)', param2: 'Exporter Port (e.g., 9216 for mongodb_exporter)' },
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
      targets = data.config_param1 || 'cadvisor_or_exporter_host:port'; 
      const metricsPath = data.config_param2 || '/metrics';
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}']
    metrics_path: ${metricsPath}`;
      break;
    case 'PostgreSQL':
      port = port || '9187'; // Default postgres_exporter port
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}:${port}']`;
      break;
    case 'MySQL':
      port = port || '9104'; // Default mysqld_exporter port
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}:${port}']`;
      break;
    case 'MongoDB':
      port = port || '9216'; // Default mongodb_exporter port
      scrapeConfigBody = `
    # Note: For MongoDB, the target is often the exporter itself.
    # The MongoDB URI (param1) is used by the exporter to connect to the DB.
    # Ensure param1 is the MongoDB URI, and param2 is the exporter port.
    # The target for Prometheus to scrape is ${targets}:${port} (the exporter).
    static_configs:
      - targets: ['${targets}:${port}']`; // Targets the exporter
      break;
    case 'Network': 
      targets = data.config_param1 || 'NETWORK_DEVICE_IP_OR_HOSTNAME';
      const snmpModule = data.config_param2 || 'if_mib'; 
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}'] 
    params:
      module: ['${snmpModule}']
    metrics_path: /snmp
    # This job targets the SNMP Exporter. The 'targets' above are passed to it.
    # Ensure __address__ below is replaced by your SNMP exporter's actual address.
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: snmp-exporter.example.com:9116 # <-- REPLACE THIS with your SNMP Exporter's host:port`;
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

const formatInstructionStep = (step: string): string => {
    // Enhanced styling for <pre> blocks
    let formattedStep = step.replace(
        /```yaml\n([\s\S]*?)\n```/g,
        '<pre class="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-xs font-code my-2 whitespace-pre-wrap border border-slate-200 dark:border-slate-700 shadow-sm">$1</pre>'
    );
    // Enhanced styling for inline <code>
    formattedStep = formattedStep.replace(
        /`([^`]+)`/g,
        '<code class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-code text-pink-600 dark:text-pink-400">$1</code>'
    );
    return formattedStep;
};


export const getMockInstructions = (type?: AssetType): string[] => {
  let rawInstructions: string[] = [];
  if (!type) {
    rawInstructions = ["Select an asset type to see specific instructions."];
  } else {
    switch (type) {
      case 'Server': 
        rawInstructions = [
          "**1. Install Node Exporter:**",
          "   - Download the latest Node Exporter for your OS from `https://prometheus.io/download/#node_exporter`.",
          "   - Extract and run it. For Linux, consider creating a systemd service for persistence.",
          "   - **Example systemd service (`/etc/systemd/system/node_exporter.service`):**",
          "     ```yaml\n     [Unit]\n     Description=Node Exporter\n     Wants=network-online.target\n     After=network-online.target\n\n     [Service]\n     User=node_exporter\n     Group=node_exporter\n     Type=simple\n     ExecStart=/usr/local/bin/node_exporter\n\n     [Install]\n     WantedBy=multi-user.target\n     ```",
          "   - Then, create user (if not exists): `sudo useradd -rs /bin/false node_exporter`",
          "   - Reload systemd: `sudo systemctl daemon-reload`",
          "   - Enable and start: `sudo systemctl enable --now node_exporter`",
          "**2. Firewall Configuration:**",
          "   - Ensure port (default `9100`) is open on your server's firewall.",
          "   - Example for `ufw` (Ubuntu): `sudo ufw allow 9100/tcp`",
          "   - For cloud providers, adjust security group/firewall rules accordingly.",
          "**3. Verify Metrics Endpoint:**",
          "   - Access `http://<server_ip>:9100/metrics` in a browser or use `curl http://<server_ip>:9100/metrics`.",
          "   - You should see a page full of Prometheus metrics.",
          "**4. Prometheus Configuration:**",
          "   - Add the generated YAML snippet to your `prometheus.yml` file under the `scrape_configs:` section.",
          "**5. Reload Prometheus Configuration:**",
          "   - `curl -X POST http://<prometheus_host>:9090/-/reload` or send a `SIGHUP` signal to the Prometheus process."
        ];
        break;
      case 'Ubuntu Server':
        rawInstructions = [
          "**1. Install Node Exporter:**",
          "   - **Option A (Package Manager):** `sudo apt update && sudo apt install prometheus-node-exporter -y`",
          "     - If installed this way: `sudo systemctl start prometheus-node-exporter` and `sudo systemctl enable prometheus-node-exporter`",
          "   - **Option B (Binary):** Follow the binary installation steps for 'Server' (download, systemd service).",
          "**2. Firewall (UFW):**",
          "   - Allow Node Exporter port (default `9100`): `sudo ufw allow 9100/tcp`",
          "**3. Verify Metrics:**",
          "   - Check `http://<ubuntu_server_ip>:9100/metrics`.",
          "**4. Prometheus Configuration:**",
          "   - Add the generated YAML to your `prometheus.yml`.",
          "**5. Reload Prometheus:**",
          "   - `curl -X POST http://<prometheus_host>:9090/-/reload`."
        ];
        break;
      case 'Windows Server':
        rawInstructions = [
          "**1. Install Windows Exporter:**",
          "   - Download the latest `windows_exporter` MSI installer from `https://github.com/prometheus-community/windows_exporter/releases`.",
          "   - Run the MSI installer.",
          "**2. Configure Collectors (during install or post-install):**",
          "   - The default port is `9182`.",
          "   - During installation, you can select which collectors to enable. Common ones include: `cpu,cs,logical_disk,net,os,service,system,memory,tcp,process`.",
          "   - To change collectors after install, modify the service arguments: `windows_exporter.exe --collectors.enabled=\"cpu,cs,logical_disk,net,os,service,system,memory,tcp,process,iis\"` (example).",
          "**3. Windows Firewall:**",
          "   - Allow port `9182` (or your custom port). Use PowerShell:",
          "     `New-NetFirewallRule -DisplayName \"Windows Exporter\" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 9182`",
          "**4. Verify Metrics:**",
          "   - Check `http://<windows_server_ip>:9182/metrics`.",
          "**5. Prometheus Configuration:**",
          "   - Add generated YAML to `prometheus.yml`.",
          "**6. Reload Prometheus:**",
          "   - `curl -X POST http://<prometheus_host>:9090/-/reload`."
        ];
        break;
      case 'Docker':
        rawInstructions = [
          "**1. Choose Exporter (cAdvisor Recommended for Container Metrics):**",
          "   - This guide assumes you're using cAdvisor for general container metrics. For Docker daemon-specific metrics, consult Docker's official documentation.",
          "**2. Run cAdvisor Container:**",
          "   - Execute the following Docker command:",
          "     ```yaml\n     docker run \\\n       --volume=/:/rootfs:ro \\\n       --volume=/var/run:/var/run:rw \\\n       --volume=/sys:/sys:ro \\\n       --volume=/var/lib/docker/:/var/lib/docker:ro \\\n       --publish=8080:8080 \\\n       --detach=true \\\n       --name=cadvisor \\\n       gcr.io/cadvisor/cadvisor:latest\n     ```",
          "   - Adjust the publish port (`-p 8080:8080`) if port `8080` is already in use on your Docker host.",
          "**3. Verify cAdvisor Metrics:**",
          "   - Access `http://<docker_host_ip>:8080/metrics` (use the host port you published).",
          "**4. Prometheus Configuration:**",
          "   - Add the generated YAML to `prometheus.yml`. Ensure the target in the YAML points to your cAdvisor instance (e.g., `docker_host_ip:8080`).",
          "**5. Reload Prometheus:**",
          "   - `curl -X POST http://<prometheus_host>:9090/-/reload`."
        ];
        break;
      case 'Application':
        rawInstructions = [
          "**1. Instrument Your Application:**",
          "   - Ensure your application uses a Prometheus client library to expose metrics.",
          "   - Examples: `prometheus-client` for Python/Java, `prom-client` for Node.js.",
          "   - Metrics should be exposed on an HTTP endpoint, typically `/metrics`.",
          "**2. Verify Metrics Endpoint:**",
          "   - Confirm that `http://<app_host>:<app_port>/metrics` is accessible and serves Prometheus-formatted metrics.",
          "**3. Firewall/Network Access:**",
          "   - Ensure any firewalls (host-based or network) allow Prometheus to reach the application's metrics port and path.",
          "**4. Prometheus Configuration:**",
          "   - Add the generated YAML to your `prometheus.yml`.",
          "**5. Reload Prometheus:**",
          "   - `curl -X POST http://<prometheus_host>:9090/-/reload`."
        ];
        break;
      case 'Network': 
        rawInstructions = [
          "**1. Enable SNMP on Network Device:**",
          "   - Configure SNMP (v2c or v3) on your target network device (switch, router, firewall).",
          "   - Note the SNMP community string (for v2c) or v3 credentials.",
          "**2. Set Up SNMP Exporter:**",
          "   - Deploy an instance of the Prometheus SNMP Exporter (e.g., `prom/snmp-exporter` Docker image).",
          "   - Configure `snmp.yml` for your device types and desired MIBs/modules. The default `if_mib` module is often a good start.",
          "   - Example `snmp.yml` entry (often included by default or in community examples):",
          "     ```yaml\n     if_mib:\n       walk: [ifDescr, ifType, ifSpeed, ifPhysAddress, ifAdminStatus, ifOperStatus, ifInOctets, ifInUcastPkts, ifInNUcastPkts, ifInDiscards, ifInErrors, ifOutOctets, ifOutUcastPkts, ifOutNUcastPkts, ifOutDiscards, ifOutErrors, ifHCInOctets, ifHCOutOctets]\n       lookups:\n         - OID: 1.3.6.1.2.1.2.2.1.6 # ifPhysAddress\n           type: DisplayString\n     ```",
          "   - Run SNMP Exporter (example using Docker, mapping port `9116`):",
          "     `docker run -d -p 9116:9116 -v ./snmp.yml:/etc/snmp_exporter/snmp.yml prom/snmp-exporter`",
          "**3. Test SNMP Exporter Endpoint:**",
          "   - `curl \"http://<snmp_exporter_host>:9116/snmp?module=<your_module_name>&target=<network_device_ip>\"`",
          "   - Replace `<snmp_exporter_host>`, `<your_module_name>` (e.g., `if_mib`), and `<network_device_ip>`.",
          "**4. Prometheus Configuration:**",
          "   - The generated YAML in `prometheus.yml` targets the **SNMP Exporter itself**, passing the actual network device IP as a parameter.",
          "   - **Crucially, update the `replacement` field in `relabel_configs` to point to your SNMP Exporter's address (e.g., `snmp-exporter.example.com:9116` or `localhost:9116` if local).**",
          "     ```yaml\n     # This job scrapes the SNMP exporter, passing the actual network device as a parameter.\n     - job_name: 'your_network_device_job_name'\n       scrape_interval: 60s \n       static_configs:\n         - targets:\n           - <network_device_ip_1> # This is NOT scraped directly by Prometheus\n           - <network_device_ip_2>\n       metrics_path: /snmp\n       params:\n         module: [if_mib] # Or your specified module\n       relabel_configs:\n         - source_labels: [__address__]\n           target_label: __param_target\n         - source_labels: [__param_target]\n           target_label: instance\n         - target_label: __address__\n           replacement: your-snmp-exporter-host:9116 # IMPORTANT: Update this line!\n     ```",
          "**5. Reload Prometheus:**",
          "   - `curl -X POST http://<prometheus_host>:9090/-/reload`."
        ];
        break;
      case 'PostgreSQL':
          rawInstructions = [
              "**1. Install PostgreSQL Exporter (`postgres_exporter`):**",
              "   - Download the binary from `https://github.com/prometheus-community/postgres_exporter/releases` or use a Docker image.",
              "   - Example Docker command: `docker run -d -p 9187:9187 -e DATA_SOURCE_NAME=\"postgresql://user:password@host:port/database?sslmode=disable\" wrouesnel/postgres_exporter`",
              "**2. Configure Exporter (Connection String):**",
              "   - Set the `DATA_SOURCE_NAME` environment variable for the exporter.",
              "   - Format: `postgresql://<user>:<password>@<db_host>:<db_port>/<database_name>?sslmode=<ssl_preference>`",
              "   - Example: `DATA_SOURCE_NAME=\"postgresql://pguser:pgpass@my.postgres.host:5432/mydb?sslmode=require\"`",
              "   - Ensure the database user has sufficient privileges (e.g., connect, read pg_stat_activity).",
              "**3. Run Exporter:**",
              "   - Start the exporter service or Docker container. Default port is `9187`.",
              "**4. Firewall:**",
              "   - Allow TCP connections to port `9187` (or your custom exporter port) from your Prometheus server.",
              "**5. Verify Metrics:**",
              "   - Access `http://<exporter_host>:9187/metrics`.",
              "**6. Prometheus Configuration:**",
              "   - Add the generated YAML to `prometheus.yml` (targets the exporter).",
              "**7. Reload Prometheus:**",
              "   - `curl -X POST http://<prometheus_host>:9090/-/reload`."
          ];
          break;
      case 'MySQL':
          rawInstructions = [
              "**1. Install MySQL Exporter (`mysqld_exporter`):**",
              "   - Download binary from `https://github.com/prometheus/mysqld_exporter/releases` or use Docker image (e.g., `prom/mysqld-exporter`).",
              "   - Example Docker: `docker run -d -p 9104:9104 -e DATA_SOURCE_NAME='user:password@(host:port)/' prom/mysqld-exporter`",
              "**2. Configure Exporter (Connection String):**",
              "   - Set `DATA_SOURCE_NAME` environment variable.",
              "   - Format: `<user>:<password>@(<db_host>:<db_port>)/[<database_name>]` (database name is optional).",
              "   - Example: `DATA_SOURCE_NAME='exporter_user:secret@(my.mysql.host:3306)/'`",
              "   - Create a dedicated MySQL user for the exporter with necessary privileges (e.g., `PROCESS`, `REPLICATION CLIENT`, `SELECT`).",
              "     ```yaml\n     CREATE USER 'exporter'@'%' IDENTIFIED BY 'password' WITH MAX_USER_CONNECTIONS 3;\n     GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';\n     FLUSH PRIVILEGES;\n     ```",
              "**3. Run Exporter:**",
              "   - Start the exporter service/container. Default port is `9104`.",
              "**4. Firewall:**",
              "   - Allow TCP connections to port `9104` (or custom) from Prometheus.",
              "**5. Verify Metrics:**",
              "   - Access `http://<exporter_host>:9104/metrics`.",
              "**6. Prometheus Configuration:**",
              "   - Add generated YAML to `prometheus.yml` (targets the exporter).",
              "**7. Reload Prometheus:**",
              "   - `curl -X POST http://<prometheus_host>:9090/-/reload`."
          ];
          break;
      case 'MongoDB':
          rawInstructions = [
              "**1. Install MongoDB Exporter:**",
              "   - Several exporters exist, `mongodb_exporter` by Percona or the one from `dcu` are common.",
              "   - Percona: `https://github.com/percona/mongodb_exporter`",
              "   - dcu: `https://github.com/dcu/mongodb_exporter` (simpler, often sufficient)",
              "   - Example Docker (dcu): `docker run -d -p 9216:9216 -e MONGODB_URI=\"mongodb://user:password@host:port/?authSource=admin\" dcu/mongodb-exporter`",
              "**2. Configure Exporter (MongoDB URI):**",
              "   - Provide the MongoDB connection URI via environment variable (e.g., `MONGODB_URI` or specific to exporter).",
              "   - URI Format: `mongodb://[username:password@]host1[:port1][,...hostN[:portN]][/[database][?options]]`",
              "   - Example: `MONGODB_URI=\"mongodb://mongoadmin:secret@my.mongo.host:27017/admin?ssl=true\"`",
              "   - Ensure the MongoDB user has roles like `clusterMonitor` and `readAnyDatabase`.",
              "**3. Run Exporter:**",
              "   - Start the exporter service/container. Default port for `dcu/mongodb-exporter` is `9216`, Percona's might be `9104` or configurable.",
              "**4. Firewall:**",
              "   - Allow TCP connections to the exporter's port from Prometheus.",
              "**5. Verify Metrics:**",
              "   - Access `http://<exporter_host>:<exporter_port>/metrics`.",
              "**6. Prometheus Configuration:**",
              "   - Add generated YAML to `prometheus.yml` (targets the exporter).",
              "**7. Reload Prometheus:**",
              "   - `curl -X POST http://<prometheus_host>:9090/-/reload`."
          ];
          break;
      case 'Kubernetes':
          rawInstructions = [
              "**1. API Server Accessibility:**",
              "   - Ensure Prometheus can reach the Kubernetes API server. If running Prometheus outside the cluster, you must configure the `api_server` URL and authentication details in `prometheus.yml`.",
              "**2. Service Discovery Role (`kubernetes_sd_configs`):**",
              "   - Choose the appropriate `role` for discovering targets: `pod`, `service`, `endpoints`, `node`, `ingress`. `pod` is common for application metrics.",
              "**3. Authentication:**",
              "   - **In-cluster:** Prometheus typically uses the service account token automatically mounted at `/var/run/secrets/kubernetes.io/serviceaccount/token`. This is often the default if `bearer_token_file` is not specified.",
              "   - **External:** Provide `bearer_token_file` or configure other authentication methods (e.g., `basic_auth`, `tls_config`).",
              "**4. RBAC Permissions:**",
              "   - Prometheus needs permissions to list and watch Kubernetes resources. Create a `ClusterRole` and `ClusterRoleBinding` (or `Role`/`RoleBinding` for namespace-specific monitoring).",
              "   - **Example `ClusterRole` (prometheus-cluster-role.yaml):**",
              "     ```yaml\n     apiVersion: rbac.authorization.k8s.io/v1\n     kind: ClusterRole\n     metadata:\n       name: prometheus\n     rules:\n     - apiGroups: [\"\"]\n       resources:\n       - nodes\n       - nodes/metrics\n       - services\n       - endpoints\n       - pods\n       - configmaps # For service discovery using configmaps\n       verbs: [get, list, watch]\n     - apiGroups:\n       - extensions\n       - networking.k8s.io # For ingresses\n       resources:\n       - ingresses\n       verbs: [get, list, watch]\n     - nonResourceURLs: [\"/metrics\"]\n       verbs: [get]\n     ```",
              "   - **Example `ClusterRoleBinding` (prometheus-cluster-role-binding.yaml):**",
              "     ```yaml\n     apiVersion: rbac.authorization.k8s.io/v1\n     kind: ClusterRoleBinding\n     metadata:\n       name: prometheus\n     roleRef:\n       apiGroup: rbac.authorization.k8s.io\n       kind: ClusterRole\n       name: prometheus\n     subjects:\n     - kind: ServiceAccount\n       name: prometheus # Name of your Prometheus service account\n       namespace: monitoring # Namespace where Prometheus is running\n     ```",
              "   - Apply with `kubectl apply -f prometheus-cluster-role.yaml -f prometheus-cluster-role-binding.yaml`.",
              "**5. Relabeling (`relabel_configs`):**",
              "   - Use `relabel_configs` extensively to filter targets (e.g., scrape only pods with `prometheus.io/scrape: 'true'` annotation) and to shape metric labels.",
              "   - **Example: Scrape pods annotated with `prometheus.io/scrape: 'true'` and use `prometheus.io/port` for the scrape port:**",
              "     ```yaml\n     relabel_configs:\n     - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]\n       action: keep\n       regex: true\n     - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]\n       action: replace\n       target_label: __metrics_path__\n       regex: (.+)\n     - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]\n       action: replace\n       regex: ([^:]+)(?::\\d+)?;(\\d+)\n       replacement: $$1:$$2\n       target_label: __address__\n     # Add more relabeling as needed for service, app, etc. labels\n     - source_labels: [__meta_kubernetes_namespace]\n       target_label: kubernetes_namespace\n     - source_labels: [__meta_kubernetes_pod_name]\n       target_label: kubernetes_pod_name\n     ```",
              "**6. Prometheus Configuration:**",
              "   - Add the generated (and likely further customized) `kubernetes_sd_configs` scrape job to your `prometheus.yml`.",
              "**7. Reload Prometheus:**",
              "   - `curl -X POST http://<prometheus_host>:9090/-/reload`."
          ];
          break;
      default:
        rawInstructions = [
          "**1. Expose Metrics:**",
          "   - Ensure the asset exposes Prometheus-compatible metrics on a reachable HTTP endpoint (often `/metrics`).",
          "**2. Network Access:**",
          "   - Confirm Prometheus can reach this endpoint over the network. Check firewalls, routing, and any network policies.",
          "**3. Prometheus Configuration:**",
          "   - Add the generated scrape configuration to your `prometheus.yml` file under the `scrape_configs:` section.",
          "**4. Reload Prometheus Configuration:**",
          "   - `curl -X POST http://<prometheus_host>:9090/-/reload` or send a `SIGHUP` signal to the Prometheus process."
        ];
        break;
    }
  }
  return rawInstructions.map(formatInstructionStep);
};

