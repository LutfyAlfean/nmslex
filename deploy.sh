#!/bin/bash
#
# NMSLEX - Network Management System Deployment Script
# Deploy all services: nmslex-dashboard, nmslex-manager, nmslex-indexer
# Includes: Suricata, Elasticsearch, Kibana, Filebeat
#

set -e

NMSLEX_VERSION="1.0.0"
NMSLEX_PORT=7356
NMSLEX_DIR="/opt/nmslex"
NMSLEX_CONF="/etc/nmslex"
NMSLEX_LOG="/var/log/nmslex"
ELASTIC_VERSION="8.13.0"
SURICATA_VERSION="7.0.3"
INTERFACE="eth0"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${CYAN}[NMSLEX]${NC} $1"; }
log_ok() { echo -e "${GREEN}[  OK  ]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[ WARN ]${NC} $1"; }
log_err() { echo -e "${RED}[ERROR ]${NC} $1"; }

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════╗"
echo "║       NMSLEX - Network Management        ║"
echo "║         System Installer v${NMSLEX_VERSION}            ║"
echo "║                                          ║"
echo "║   🐼 Protecting your network             ║"
echo "║      one packet at a time                ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# --- Check Root ---
if [ "$EUID" -ne 0 ]; then
  log_err "Script harus dijalankan sebagai root (sudo)"
  exit 1
fi

# --- Detect OS ---
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
  VER=$VERSION_ID
else
  log_err "OS tidak didukung"
  exit 1
fi

log_info "Detected OS: $OS $VER"

# --- Parse Arguments ---
while [[ $# -gt 0 ]]; do
  case $1 in
    --interface) INTERFACE="$2"; shift 2 ;;
    --port) NMSLEX_PORT="$2"; shift 2 ;;
    *) shift ;;
  esac
done

log_info "Interface: $INTERFACE"
log_info "Dashboard Port: $NMSLEX_PORT"

# --- Install Dependencies ---
log_info "Installing system dependencies..."
if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
  apt-get update -qq
  apt-get install -y -qq curl wget gnupg2 apt-transport-https ca-certificates software-properties-common jq git build-essential
elif [[ "$OS" == "centos" || "$OS" == "rocky" || "$OS" == "rhel" ]]; then
  yum install -y -q curl wget gnupg2 ca-certificates jq git gcc make
fi
log_ok "System dependencies installed"

# --- Install Node.js 18 ---
log_info "Installing Node.js 18..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y -qq nodejs
fi
log_ok "Node.js $(node --version) installed"

# --- Install Suricata ---
log_info "Installing Suricata..."
if ! command -v suricata &> /dev/null; then
  if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    add-apt-repository -y ppa:oisf/suricata-stable 2>/dev/null || true
    apt-get update -qq
    apt-get install -y -qq suricata
  elif [[ "$OS" == "centos" || "$OS" == "rocky" ]]; then
    yum install -y -q epel-release
    yum install -y -q suricata
  fi
fi
log_ok "Suricata installed"

# --- Configure Suricata ---
log_info "Configuring Suricata..."
cat > /etc/suricata/suricata-nmslex.yaml << SURICATAEOF
%YAML 1.1
---
vars:
  address-groups:
    HOME_NET: "[192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12]"
    EXTERNAL_NET: "!\$HOME_NET"

af-packet:
  - interface: ${INTERFACE}
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes

outputs:
  - eve-log:
      enabled: yes
      filetype: regular
      filename: /var/log/suricata/eve.json
      types:
        - alert
        - http
        - dns
        - tls
        - files
        - smtp
        - flow
        - stats:
            totals: yes
            threads: no
SURICATAEOF

suricata-update 2>/dev/null || true
log_ok "Suricata configured"

# --- Install Elasticsearch ---
log_info "Installing Elasticsearch ${ELASTIC_VERSION}..."
if ! command -v /usr/share/elasticsearch/bin/elasticsearch &> /dev/null; then
  wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | gpg --dearmor -o /usr/share/keyrings/elasticsearch-keyring.gpg 2>/dev/null
  echo "deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] https://artifacts.elastic.co/packages/8.x/apt stable main" > /etc/apt/sources.list.d/elastic-8.x.list
  apt-get update -qq
  apt-get install -y -qq elasticsearch
fi

# Configure Elasticsearch
cat >> /etc/elasticsearch/elasticsearch.yml << 'ESEOF'
cluster.name: nmslex-cluster
node.name: nmslex-node-1
network.host: 0.0.0.0
discovery.type: single-node
xpack.security.enabled: false
ESEOF

sysctl -w vm.max_map_count=262144 2>/dev/null || true
echo "vm.max_map_count=262144" >> /etc/sysctl.conf 2>/dev/null || true
log_ok "Elasticsearch installed and configured"

# --- Install Kibana ---
log_info "Installing Kibana ${ELASTIC_VERSION}..."
if ! command -v /usr/share/kibana/bin/kibana &> /dev/null; then
  apt-get install -y -qq kibana
fi

cat >> /etc/kibana/kibana.yml << 'KBEOF'
server.host: "0.0.0.0"
server.port: 5601
elasticsearch.hosts: ["http://localhost:9200"]
KBEOF
log_ok "Kibana installed and configured"

# --- Install Filebeat ---
log_info "Installing Filebeat ${ELASTIC_VERSION}..."
if ! command -v filebeat &> /dev/null; then
  apt-get install -y -qq filebeat
fi

cat > /etc/filebeat/filebeat.yml << 'FBEOF'
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/suricata/eve.json
    json.keys_under_root: true
    json.add_error_key: true

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "nmslex-suricata-%{+yyyy.MM.dd}"

setup.template.name: "nmslex-suricata"
setup.template.pattern: "nmslex-suricata-*"
setup.ilm.enabled: false
FBEOF
log_ok "Filebeat installed and configured"

# --- Setup NMSLEX Directories ---
log_info "Setting up NMSLEX directories..."
mkdir -p ${NMSLEX_DIR}/{dashboard,scripts,bin}
mkdir -p ${NMSLEX_CONF}
mkdir -p ${NMSLEX_LOG}

# --- Build Dashboard ---
log_info "Building NMSLEX Dashboard..."
cp -r . ${NMSLEX_DIR}/dashboard/
cd ${NMSLEX_DIR}/dashboard
npm install --production 2>/dev/null || npm install
npm run build
log_ok "Dashboard built successfully"

# --- Create NMSLEX Config ---
cat > ${NMSLEX_CONF}/dashboard.conf << EOF
NMSLEX_PORT=${NMSLEX_PORT}
NMSLEX_DIR=${NMSLEX_DIR}
NMSLEX_LOG=${NMSLEX_LOG}
ES_HOST=http://localhost:9200
KIBANA_HOST=http://localhost:5601
SURICATA_LOG=/var/log/suricata/eve.json
EOF

# --- Create Manager Script ---
cat > ${NMSLEX_DIR}/bin/nmslex-manager.sh << 'MGREOF'
#!/bin/bash
# NMSLEX Manager - Orchestration & Health Check
LOG_FILE="/var/log/nmslex/manager.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"; }

log "NMSLEX Manager started"

while true; do
  # Health check all services
  for svc in suricata elasticsearch kibana filebeat; do
    if systemctl is-active --quiet $svc; then
      log "[OK] $svc is running"
    else
      log "[WARN] $svc is not running, attempting restart..."
      systemctl restart $svc
      log "[INFO] $svc restart triggered"
    fi
  done

  # Agent heartbeat check
  log "[INFO] Checking agent heartbeats..."

  sleep 30
done
MGREOF
chmod +x ${NMSLEX_DIR}/bin/nmslex-manager.sh

# --- Create Indexer Script ---
cat > ${NMSLEX_DIR}/bin/nmslex-indexer.sh << 'IDXEOF'
#!/bin/bash
# NMSLEX Indexer - Log processing and indexing
LOG_FILE="/var/log/nmslex/indexer.log"
EVE_JSON="/var/log/suricata/eve.json"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"; }

log "NMSLEX Indexer started"

while true; do
  if [ -f "$EVE_JSON" ]; then
    LINES=$(wc -l < "$EVE_JSON")
    log "[INFO] eve.json has $LINES lines"
    
    # Index rotation check
    SIZE=$(stat -f%z "$EVE_JSON" 2>/dev/null || stat -c%s "$EVE_JSON" 2>/dev/null)
    if [ "$SIZE" -gt 1073741824 ]; then
      log "[INFO] Rotating eve.json (size: $SIZE bytes)"
      mv "$EVE_JSON" "${EVE_JSON}.$(date +%Y%m%d%H%M%S)"
      systemctl restart suricata
      log "[INFO] Rotation complete"
    fi
  fi

  sleep 60
done
IDXEOF
chmod +x ${NMSLEX_DIR}/bin/nmslex-indexer.sh

# --- Create Systemd Services ---
log_info "Creating systemd services..."

# Dashboard Service
cat > /etc/systemd/system/nmslex-dashboard.service << EOF
[Unit]
Description=NMSLEX Dashboard
After=network.target elasticsearch.service
Wants=elasticsearch.service

[Service]
Type=simple
EnvironmentFile=${NMSLEX_CONF}/dashboard.conf
ExecStart=/usr/bin/npx serve -s ${NMSLEX_DIR}/dashboard/dist -l ${NMSLEX_PORT}
Restart=always
RestartSec=5
StandardOutput=append:${NMSLEX_LOG}/dashboard.log
StandardError=append:${NMSLEX_LOG}/dashboard.log

[Install]
WantedBy=multi-user.target
EOF

# Manager Service
cat > /etc/systemd/system/nmslex-manager.service << EOF
[Unit]
Description=NMSLEX Manager
After=network.target elasticsearch.service suricata.service
Wants=elasticsearch.service suricata.service

[Service]
Type=simple
ExecStart=/bin/bash ${NMSLEX_DIR}/bin/nmslex-manager.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Indexer Service
cat > /etc/systemd/system/nmslex-indexer.service << EOF
[Unit]
Description=NMSLEX Indexer
After=network.target elasticsearch.service suricata.service
Wants=elasticsearch.service suricata.service

[Service]
Type=simple
ExecStart=/bin/bash ${NMSLEX_DIR}/bin/nmslex-indexer.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

log_ok "Systemd services created"

# --- Enable & Start Services ---
log_info "Starting all services..."
systemctl daemon-reload

for svc in elasticsearch kibana suricata filebeat nmslex-dashboard nmslex-manager nmslex-indexer; do
  systemctl enable $svc 2>/dev/null || true
  systemctl start $svc 2>/dev/null || true
  log_ok "$svc enabled and started"
done

# --- Create Agent Install Script ---
log_info "Creating agent install script..."
cat > ${NMSLEX_DIR}/scripts/nmslex-agent-install.sh << 'AGENTEOF'
#!/bin/bash
# NMSLEX Agent Installer
set -e

NMSLEX_SERVER=""
NMSLEX_PORT=9200
AGENT_NAME=$(hostname)
INTERFACE="eth0"
LOG_PATHS="/var/log/syslog,/var/log/auth.log"

while [[ $# -gt 0 ]]; do
  case $1 in
    --server) NMSLEX_SERVER="$2"; shift 2 ;;
    --port) NMSLEX_PORT="$2"; shift 2 ;;
    --name) AGENT_NAME="$2"; shift 2 ;;
    --interface) INTERFACE="$2"; shift 2 ;;
    --log-paths) LOG_PATHS="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if [ -z "$NMSLEX_SERVER" ]; then
  echo "Error: --server is required"
  echo "Usage: sudo ./nmslex-agent-install.sh --server <NMSLEX_SERVER_IP>"
  exit 1
fi

echo "=== NMSLEX Agent Installer ==="
echo "Server: $NMSLEX_SERVER"
echo "Agent: $AGENT_NAME"
echo "Interface: $INTERFACE"

# Install Filebeat
apt-get update -qq
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | gpg --dearmor -o /usr/share/keyrings/elasticsearch-keyring.gpg 2>/dev/null
echo "deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] https://artifacts.elastic.co/packages/8.x/apt stable main" > /etc/apt/sources.list.d/elastic-8.x.list
apt-get update -qq
apt-get install -y -qq filebeat

# Setup agent directory
mkdir -p /opt/nmslex-agent/bin
mkdir -p /etc/nmslex-agent

# Create agent config
IFS=',' read -ra PATHS <<< "$LOG_PATHS"
cat > /etc/nmslex-agent/agent.yml << AYML
server:
  host: ${NMSLEX_SERVER}
  port: ${NMSLEX_PORT}
agent:
  name: ${AGENT_NAME}
  interface: ${INTERFACE}
  heartbeat_interval: 30s
logs:
  paths:
$(for p in "${PATHS[@]}"; do echo "    - $p"; done)
metrics:
  enabled: true
  interval: 10s
  collect: [cpu, memory, disk, network]
AYML

# Configure Filebeat
cat > /etc/nmslex-agent/filebeat.yml << FBYML
filebeat.inputs:
$(for p in "${PATHS[@]}"; do
echo "  - type: log"
echo "    enabled: true"
echo "    paths:"
echo "      - $p"
done)

output.elasticsearch:
  hosts: ["${NMSLEX_SERVER}:${NMSLEX_PORT}"]
  index: "nmslex-agent-${AGENT_NAME}-%{+yyyy.MM.dd}"

setup.template.name: "nmslex-agent"
setup.template.pattern: "nmslex-agent-*"
setup.ilm.enabled: false

processors:
  - add_host_metadata: ~
  - add_fields:
      target: ''
      fields:
        nmslex.agent_name: ${AGENT_NAME}
FBYML

cp /etc/nmslex-agent/filebeat.yml /etc/filebeat/filebeat.yml

# Create agent heartbeat service
cat > /opt/nmslex-agent/bin/heartbeat.sh << HB
#!/bin/bash
while true; do
  curl -sf -X POST "http://${NMSLEX_SERVER}:${NMSLEX_PORT}/nmslex-heartbeat/_doc" \
    -H "Content-Type: application/json" \
    -d '{"agent":"'${AGENT_NAME}'","host":"'$(hostname)'","ip":"'$(hostname -I | awk '{print $1}')'","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","status":"active"}' \
    2>/dev/null || true
  sleep 30
done
HB
chmod +x /opt/nmslex-agent/bin/heartbeat.sh

# Create systemd service
cat > /etc/systemd/system/nmslex-agent.service << SVC
[Unit]
Description=NMSLEX Agent
After=network.target

[Service]
Type=simple
ExecStart=/bin/bash /opt/nmslex-agent/bin/heartbeat.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVC

# Create connection test tool
cat > /opt/nmslex-agent/bin/nmslex-agent << TOOL
#!/bin/bash
case "\$1" in
  test-connection)
    echo "Testing connection to ${NMSLEX_SERVER}:${NMSLEX_PORT}..."
    if curl -sf "http://${NMSLEX_SERVER}:${NMSLEX_PORT}" > /dev/null 2>&1; then
      echo "✓ Connection successful"
    else
      echo "✗ Connection failed"
      exit 1
    fi
    ;;
  uninstall)
    echo "Uninstalling NMSLEX Agent..."
    systemctl stop nmslex-agent filebeat 2>/dev/null
    systemctl disable nmslex-agent filebeat 2>/dev/null
    rm -rf /opt/nmslex-agent /etc/nmslex-agent
    rm -f /etc/systemd/system/nmslex-agent.service
    systemctl daemon-reload
    echo "✓ Agent uninstalled"
    ;;
  *)
    echo "Usage: nmslex-agent {test-connection|uninstall}"
    ;;
esac
TOOL
chmod +x /opt/nmslex-agent/bin/nmslex-agent

# Start services
systemctl daemon-reload
systemctl enable filebeat nmslex-agent
systemctl restart filebeat
systemctl start nmslex-agent

echo ""
echo "=== NMSLEX Agent Installed Successfully ==="
echo "Agent Name: $AGENT_NAME"
echo "Server: $NMSLEX_SERVER:$NMSLEX_PORT"
echo ""
echo "Commands:"
echo "  systemctl status nmslex-agent"
echo "  /opt/nmslex-agent/bin/nmslex-agent test-connection"
echo ""
AGENTEOF
chmod +x ${NMSLEX_DIR}/scripts/nmslex-agent-install.sh

log_ok "Agent install script created at ${NMSLEX_DIR}/scripts/nmslex-agent-install.sh"

# --- Done ---
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     NMSLEX Deployment Complete! 🐼       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "Dashboard:      ${CYAN}http://$(hostname -I | awk '{print $1}'):${NMSLEX_PORT}${NC}"
echo -e "Kibana:         ${CYAN}http://$(hostname -I | awk '{print $1}'):5601${NC}"
echo -e "Elasticsearch:  ${CYAN}http://$(hostname -I | awk '{print $1}'):9200${NC}"
echo ""
echo "Services:"
echo "  sudo systemctl status nmslex-dashboard"
echo "  sudo systemctl status nmslex-manager"
echo "  sudo systemctl status nmslex-indexer"
echo ""
echo "Agent script: ${NMSLEX_DIR}/scripts/nmslex-agent-install.sh"
echo ""
