
import type { AssetType, FormData } from '@/types'; // Assuming FormData might be used or adapted

export const assetTypeConfigPlaceholders: Record<AssetType, { param1: string, param2: string }> = {
  Server: { param1: 'Server IP Address (e.g., 192.168.1.100)', param2: 'Node Exporter Port (e.g., 9100)' },
  Network: { param1: 'Device IP / Hostname', param2: 'SNMP Module (e.g., if_mib)' },
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
      if (data.config_param2) { 
        scrapeConfigBody += ` # Note: Port ${data.config_param2} provided, ensure it's part of the target URL if needed.`;
      }
      break;
    case 'Kubernetes':
      scrapeConfigBody = `
    kubernetes_sd_configs:
      - role: pod 
        api_server: ${data.config_param1 ? `'${data.config_param1}'` : 'YOUR_K8S_API_SERVER_URL'}
        ${data.config_param2 ? `bearer_token_file: '${data.config_param2}'`: '# bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token (if in-cluster)'}
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_container_port_name]
        action: keep
        regex: metrics`;
      break;
    case 'Server':
    case 'Ubuntu Server':
      port = port || '9100'; 
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}:${port}']`;
      break;
    case 'Windows Server':
      port = port || '9182'; 
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
      port = port || '9187'; 
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}:${port}']`;
      break;
    case 'MySQL':
      port = port || '9104'; 
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}:${port}']`;
      break;
    case 'MongoDB':
      port = port || '9216'; 
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}:${port}']`; 
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
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: snmp-exporter.example.com:9116`;
      break;
    default:
      scrapeConfigBody = `
    static_configs:
      - targets: ['${targets}${port ? `:${port}` : ''}']`;
      break;
  }

  return `scrape_configs:
  - job_name: '${jobName}'
${scrapeConfigBody}
`;
};

const formatInstructionStep = (step: string): string => {
    let formattedStep = step.replace(
        /```yaml\n([\s\S]*?)\n```/g,
        '<pre class="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-xs font-code my-2 whitespace-pre-wrap border border-slate-200 dark:border-slate-700 shadow-sm">$1</pre>'
    );
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
      case 'Ubuntu Server':
        rawInstructions = [
          "Download Node Exporter:",
          "   - Go to `https://prometheus.io/download/#node_exporter` and download the latest Linux (amd64) version.",
          "   - Example (replace version if needed):",
          "     ```yaml\n     wget https://github.com/prometheus/node_exporter/releases/download/v1.8.1/node_exporter-1.8.1.linux-amd64.tar.gz\n     tar xvf node_exporter-1.8.1.linux-amd64.tar.gz\n     sudo cp node_exporter-1.8.1.linux-amd64/node_exporter /usr/local/bin/\n     ```",
          "Create `node_exporter` User:",
          "   - For security, run Node Exporter as a dedicated non-privileged user.",
          "     ```yaml\n     sudo useradd -rs /bin/false node_exporter\n     ```",
          "Create systemd Service File:",
          "   - Create `/etc/systemd/system/node_exporter.service` with the following content:",
          "     ```yaml\n     [Unit]\n     Description=Node Exporter\n     Wants=network-online.target\n     After=network-online.target\n\n     [Service]\n     User=node_exporter\n     Group=node_exporter\n     Type=simple\n     ExecStart=/usr/local/bin/node_exporter\n\n     [Install]\n     WantedBy=multi-user.target\n     ```",
          "Start Node Exporter Service:",
          "   - Reload systemd, enable, and start the service.",
          "     ```yaml\n     sudo systemctl daemon-reload\n     sudo systemctl enable node_exporter\n     sudo systemctl start node_exporter\n     sudo systemctl status node_exporter\n     ```",
          "Firewall Configuration (if applicable):",
          "   - Ensure port `9100` (default) is open. For `ufw` (Ubuntu):",
          "     ```yaml\n     sudo ufw allow 9100/tcp\n     sudo ufw reload\n     ```",
          "Verify Metrics Endpoint:",
          "   - Access `http://<YOUR_SERVER_IP>:9100/metrics` in a browser or use `curl http://<YOUR_SERVER_IP>:9100/metrics`.",
          "   - You should see a page full of Prometheus metrics.",
          "Configure Prometheus:",
          "   - Add the generated YAML snippet to your `prometheus.yml` file under `scrape_configs:`. Ensure `<YOUR_SERVER_IP>` is replaced with the actual IP from the Wizard's configuration (param1).",
          "Reload Prometheus Configuration:",
          "   - `curl -X POST http://<PROMETHEUS_HOST_IP>:9090/-/reload` or send a `SIGHUP` signal."
        ];
        break;
      case 'Windows Server':
        rawInstructions = [
          "Download Windows Exporter:",
          "   - Go to `https://github.com/prometheus-community/windows_exporter/releases` and download the latest `.msi` installer.",
          "Install Windows Exporter:",
          "   - Run the downloaded MSI installer.",
          "   - During installation, you can select which collectors to enable (e.g., `cpu,cs,logical_disk,net,os,service,system,memory,tcp,process`). The default port is `9182`.",
          "   - You can also enable all default collectors by running `msiexec /i windows_exporter-XXX.msi ENABLED_COLLECTORS=\"defaults\"`",
          "Configure Windows Firewall:",
          "   - Allow incoming TCP connections on port `9182` (or your custom port). Using PowerShell:",
          "     ```yaml\n     New-NetFirewallRule -DisplayName \"Windows Exporter\" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 9182\n     ```",
          "Verify Metrics Endpoint:",
          "   - Access `http://<YOUR_WINDOWS_SERVER_IP>:9182/metrics` in a browser or use `curl`.",
          "Configure Prometheus:",
          "   - Add the generated YAML snippet to your `prometheus.yml`. Ensure `<YOUR_WINDOWS_SERVER_IP>` is replaced with the actual IP from the Wizard's configuration (param1).",
          "Reload Prometheus Configuration:",
          "   - `curl -X POST http://<PROMETHEUS_HOST_IP>:9090/-/reload`."
        ];
        break;
      case 'Docker':
        rawInstructions = [
          "Choose Exporter (cAdvisor Recommended):",
          "   - For general container metrics, Google's cAdvisor is recommended. For Docker daemon-specific metrics, use Docker's built-in metrics or a dedicated Docker exporter.",
          "Run cAdvisor Container:",
          "   - Execute the following command on your Docker host. Adjust the published port (`-p 8080:8080`) if `8080` is in use.",
          "     ```yaml\n     docker run \\\n       --volume=/:/rootfs:ro \\\n       --volume=/var/run:/var/run:rw \\\n       --volume=/sys:/sys:ro \\\n       --volume=/var/lib/docker/:/var/lib/docker:ro \\\n       --publish=8080:8080 \\\n       --detach=true \\\n       --name=cadvisor \\\n       --privileged \\\n       --device=/dev/kmsg \\\n       gcr.io/cadvisor/cadvisor:latest\n     ```",
          "Verify cAdvisor Metrics:",
          "   - Access `http://<DOCKER_HOST_IP>:8080/metrics` (use the host port you published).",
          "Configure Prometheus:",
          "   - Add the generated YAML snippet to your `prometheus.yml`. The target should be `<DOCKER_HOST_IP>:8080` or as configured in the Wizard (param1). The metrics_path is usually `/metrics` (param2).",
          "Reload Prometheus Configuration:",
          "   - `curl -X POST http://<PROMETHEUS_HOST_IP>:9090/-/reload`."
        ];
        break;
      case 'Application':
        rawInstructions = [
          "Instrument Your Application:",
          "   - Integrate a Prometheus client library suitable for your application's language (e.g., `prometheus-client` for Python/Java, `prom-client` for Node.js).",
          "   - Expose application-specific metrics on an HTTP endpoint, typically `/metrics`.",
          "Verify Metrics Endpoint:",
          "   - Ensure `http://<YOUR_APP_HOST>:<APP_PORT>/metrics` (as configured in param1 of the wizard) is accessible and serves Prometheus-formatted metrics.",
          "Firewall/Network Access:",
          "   - Confirm that Prometheus can reach your application's metrics endpoint. Check host-based firewalls, network firewalls, and cloud security groups.",
          "Configure Prometheus:",
          "   - Add the generated YAML snippet to your `prometheus.yml`.",
          "Reload Prometheus Configuration:",
          "   - `curl -X POST http://<PROMETHEUS_HOST_IP>:9090/-/reload`."
        ];
        break;
      case 'Network': 
        rawInstructions = [
          "Enable SNMP on Network Device:",
          "   - Configure SNMP (v2c or v3) on your target network device (switch, router, firewall).",
          "   - Note the SNMP community string (for v2c) or v3 credentials. This is typically **not** provided to Prometheus Lens directly, but used by the SNMP Exporter.",
          "Deploy SNMP Exporter:",
          "   - Run an instance of the Prometheus SNMP Exporter (e.g., `prom/snmp-exporter` Docker image).",
          "   - You'll need an `snmp.yml` configuration file for the exporter that defines how to query your devices. Param2 from the wizard (`SNMP Module`) refers to a module name in this file (e.g., `if_mib`).",
          "   - Example `snmp.yml` (minimal, often built-in or community provided for common devices):",
          "     ```yaml\n     if_mib:\n       walk: [ifDescr, ifType, ifSpeed, ifPhysAddress, ifAdminStatus, ifOperStatus, ifInOctets, ifOutOctets, ifHCInOctets, ifHCOutOctets]\n       # Add more OIDs or modules as needed\n     ```",
          "   - Run SNMP Exporter (Docker example, exposing port `9116`):",
          "     ```yaml\n     docker run -d -p 9116:9116 -v ./snmp.yml:/etc/snmp_exporter/snmp.yml prom/snmp-exporter\n     ```",
          "Test SNMP Exporter Endpoint:",
          "   - From a machine that can reach the SNMP Exporter, run:",
          "     `curl \"http://<SNMP_EXPORTER_HOST>:9116/snmp?module=<YOUR_SNMP_MODULE>&target=<NETWORK_DEVICE_IP>\"`",
          "   - Replace placeholders. `<NETWORK_DEVICE_IP>` is param1 from the wizard.",
          "Configure Prometheus:",
          "   - The generated YAML in `prometheus.yml` targets the **SNMP Exporter itself**.",
          "   - **Crucially, update the `replacement` field in `relabel_configs` to point to your SNMP Exporter's actual address and port (e.g., `snmp-exporter.example.com:9116`).** The wizard configures param1 as the device IP.",
          "Reload Prometheus Configuration:",
          "   - `curl -X POST http://<PROMETHEUS_HOST_IP>:9090/-/reload`."
        ];
        break;
      case 'PostgreSQL':
          rawInstructions = [
              "Install PostgreSQL Exporter (`postgres_exporter`):",
              "   - Download the binary from `https://github.com/prometheus-community/postgres_exporter/releases` or use a Docker image (e.g., `quay.io/prometheuscommunity/postgres-exporter`).",
              "   - Example Docker command (replace placeholders):",
              "     ```yaml\n     docker run -d -p 9187:9187 \\\n       -e DATA_SOURCE_NAME=\"postgresql://USER:PASSWORD@DB_HOST:DB_PORT/DATABASE?sslmode=disable\" \\\n       quay.io/prometheuscommunity/postgres-exporter\n     ```",
              "Configure Exporter (Connection String):",
              "   - The exporter uses a `DATA_SOURCE_NAME` environment variable or command-line flag.",
              "   - Format: `postgresql://<user>:<password>@<db_host>:<db_port>/<database_name>?sslmode=<ssl_preference>`",
              "   - The `DB_HOST` from `DATA_SOURCE_NAME` should match param1 from the wizard. The exporter port (e.g., `9187`) is param2.",
              "   - Ensure the database user (e.g., `USER`) has privileges like `pg_monitor` or at least `SELECT` on `pg_stat_activity` and other relevant tables.",
              "Run Exporter:",
              "   - Start the exporter service or Docker container. The default port is typically `9187`.",
              "Firewall:",
              "   - Allow TCP connections to the exporter's port (e.g., `9187`) from your Prometheus server.",
              "Verify Metrics:",
              "   - Access `http://<EXPORTER_HOST_IP_OR_DB_HOST_IP>:<EXPORTER_PORT>/metrics`. The target for Prometheus is the exporter.",
              "Configure Prometheus:",
              "   - Add the generated YAML snippet to `prometheus.yml`. It targets the exporter at `<DB_HOST_IP>:<EXPORTER_PORT>` (param1:param2 from wizard).",
              "Reload Prometheus Configuration:",
              "   - `curl -X POST http://<PROMETHEUS_HOST_IP>:9090/-/reload`."
          ];
          break;
      case 'MySQL':
          rawInstructions = [
              "Install MySQL Exporter (`mysqld_exporter`):",
              "   - Download binary from `https://github.com/prometheus/mysqld_exporter/releases` or use a Docker image (e.g., `prom/mysqld-exporter`).",
              "   - Example Docker command (replace placeholders):",
              "     ```yaml\n     docker run -d -p 9104:9104 \\\n       -e DATA_SOURCE_NAME='USER:PASSWORD@(DB_HOST:DB_PORT)/' \\\n       prom/mysqld-exporter\n     ```",
              "Configure Exporter (Connection String):",
              "   - Set the `DATA_SOURCE_NAME` environment variable or command-line flag.",
              "   - Format: `<user>:<password>@(<db_host>:<db_port>)/[<database_name>]`. The database name is often optional.",
              "   - `DB_HOST` should match param1 from the wizard. The exporter port (e.g., `9104`) is param2.",
              "   - Create a dedicated MySQL user for the exporter:",
              "     ```yaml\n     CREATE USER 'exporter'@'%' IDENTIFIED BY 'your_password' WITH MAX_USER_CONNECTIONS 3;\n     GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';\n     FLUSH PRIVILEGES;\n     ```",
              "Run Exporter:",
              "   - Start the exporter. The default port is `9104`.",
              "Firewall:",
              "   - Allow TCP connections to the exporter's port from Prometheus.",
              "Verify Metrics:",
              "   - Access `http://<EXPORTER_HOST_IP_OR_DB_HOST_IP>:<EXPORTER_PORT>/metrics`.",
              "Configure Prometheus:",
              "   - Add generated YAML to `prometheus.yml`. It targets the exporter at `<DB_HOST_IP>:<EXPORTER_PORT>` (param1:param2 from wizard).",
              "Reload Prometheus Configuration:",
              "   - `curl -X POST http://<PROMETHEUS_HOST_IP>:9090/-/reload`."
          ];
          break;
      case 'MongoDB':
          rawInstructions = [
              "Install MongoDB Exporter:",
              "   - A common choice is `dcu/mongodb-exporter` or Percona's `mongodb_exporter`.",
              "   - Example Docker command for `dcu/mongodb-exporter` (replace placeholders):",
              "     ```yaml\n     docker run -d -p 9216:9216 \\\n       -e MONGODB_URI=\"mongodb://USER:PASSWORD@MONGO_HOST:MONGO_PORT/?authSource=admin\" \\\n       dcu/mongodb-exporter\n     ```",
              "Configure Exporter (MongoDB URI):",
              "   - Provide the MongoDB connection URI (param1 from wizard) via an environment variable like `MONGODB_URI`.",
              "   - URI Format: `mongodb://[username:password@]host1[:port1][,...hostN[:portN]][/[database][?options]]`",
              "   - Example: `mongodb://mongoadmin:secret@my.mongo.host:27017/admin?ssl=true`",
              "   - Ensure the MongoDB user has roles like `clusterMonitor` and `readAnyDatabase`.",
              "Run Exporter:",
              "   - Start the exporter. Port for `dcu/mongodb-exporter` is typically `9216` (param2 from wizard).",
              "Firewall:",
              "   - Allow TCP connections to the exporter's port from Prometheus.",
              "Verify Metrics:",
              "   - Access `http://<EXPORTER_HOST_IP_OR_MONGO_HOST_IP_IF_SAME_MACHINE>:<EXPORTER_PORT>/metrics`.",
              "Configure Prometheus:",
              "   - Add generated YAML to `prometheus.yml`. It targets the exporter at an address derived from your MongoDB URI host and the exporter port. For simplicity, the Prometheus config assumes param1 from the wizard is the host of the *exporter* if it's different from the MongoDB host itself. Often they are on the same machine or the exporter host is specified as the primary target.",
              "Reload Prometheus Configuration:",
              "   - `curl -X POST http://<PROMETHEUS_HOST_IP>:9090/-/reload`."
          ];
          break;
      case 'Kubernetes':
          rawInstructions = [
              "API Server Accessibility & Authentication:",
              "   - Ensure Prometheus can reach the Kubernetes API server (param1 from wizard).",
              "   - If Prometheus is in-cluster, it typically uses the service account token at `/var/run/secrets/kubernetes.io/serviceaccount/token`. If `bearer_token_file` (param2 from wizard) is not specified, this is often assumed.",
              "   - For external Prometheus, provide `bearer_token_file` or configure other methods (`basic_auth`, `tls_config`).",
              "RBAC Permissions for Prometheus Service Account:",
              "   - Prometheus needs permissions to discover and scrape targets. Create a `ClusterRole` and `ClusterRoleBinding` (or namespace-specific `Role`/`RoleBinding`).",
              "   - **Example `ClusterRole` (prometheus-cluster-role.yaml):**",
              "     ```yaml\n     apiVersion: rbac.authorization.k8s.io/v1\n     kind: ClusterRole\n     metadata:\n       name: prometheus-lens-scraper\n     rules:\n     - apiGroups: [\"\"]\n       resources:\n       - nodes\n       - nodes/proxy\n       - nodes/metrics\n       - services\n       - endpoints\n       - pods\n       - configmaps\n       verbs: [get, list, watch]\n     - apiGroups:\n       - networking.k8s.io \n       resources:\n       - ingresses\n       verbs: [get, list, watch]\n     - nonResourceURLs: [\"/metrics\"]\n       verbs: [get]\n     ```",
              "   - **Example `ClusterRoleBinding` (prometheus-crb.yaml):** (Replace `YOUR_PROMETHEUS_NAMESPACE` and `YOUR_PROMETHEUS_SA_NAME`)",
              "     ```yaml\n     apiVersion: rbac.authorization.k8s.io/v1\n     kind: ClusterRoleBinding\n     metadata:\n       name: prometheus-lens-scraper\n     roleRef:\n       apiGroup: rbac.authorization.k8s.io\n       kind: ClusterRole\n       name: prometheus-lens-scraper\n     subjects:\n     - kind: ServiceAccount\n       name: YOUR_PROMETHEUS_SA_NAME \n       namespace: YOUR_PROMETHEUS_NAMESPACE\n     ```",
              "   - Apply with `kubectl apply -f prometheus-cluster-role.yaml -f prometheus-crb.yaml`.",
              "Pod Annotations for Scrape Configuration:",
              "   - The generated Prometheus config uses `relabel_configs` to scrape pods annotated with `prometheus.io/scrape: 'true'` and using the port named `metrics`.",
              "   - Annotate your application pods:",
              "     ```yaml\n     metadata:\n       annotations:\n         prometheus.io/scrape: \"true\"\n         prometheus.io/port: \"YOUR_APP_METRICS_PORT_NUMBER_AS_STRING\"\n         prometheus.io/path: \"/your/metrics/path\" # Optional, defaults to /metrics\n     spec:\n       containers:\n       - name: my-app\n         ports:\n         - name: metrics # Must match the port name Prometheus looks for, or adjust relabel_configs\n           containerPort: YOUR_APP_METRICS_PORT_NUMBER\n     ```",
              "Configure Prometheus:",
              "   - Add the generated `kubernetes_sd_configs` job to your `prometheus.yml`. You might need to customize `relabel_configs` further based on your needs (e.g., specific namespaces, different port names).",
              "Reload Prometheus Configuration:",
              "   - `curl -X POST http://<PROMETHEUS_HOST_IP>:9090/-/reload`."
          ];
          break;
      default:
        rawInstructions = [
          "Expose Metrics:",
          "   - Ensure the asset exposes Prometheus-compatible metrics on a reachable HTTP endpoint (often `/metrics`). This usually involves an exporter specific to the technology.",
          "Network Access:",
          "   - Confirm Prometheus can reach this endpoint over the network. Check firewalls, routing, and any network policies.",
          "Configure Prometheus:",
          "   - Add the generated scrape configuration to your `prometheus.yml` file under the `scrape_configs:` section.",
          "Reload Prometheus Configuration:",
          "   - `curl -X POST http://<PROMETHEUS_HOST_IP>:9090/-/reload` or send a `SIGHUP` signal."
        ];
        break;
    }
  }
  return rawInstructions.map((stepContent, index) => {
    const cleanedStepContent = stepContent.replace(/^\s*(\*{1,2}\s*\d+\.\s*\*{0,2}\s*)/, '');
    const stepHeader = `<div class="mb-3"><span class="inline-block text-xs font-bold uppercase py-1 px-3 tracking-wider rounded-full bg-primary/10 text-primary">Step ${index + 1}</span></div>`;
    const formattedContent = formatInstructionStep(cleanedStepContent); 
    return `${stepHeader}${formattedContent}`;
  });
};

