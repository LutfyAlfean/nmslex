#!/bin/bash
#
# NMSLEX - Network Management System
# Advanced Deployment & Management Script v2.0
# © 2026 Muhammad Lutfi Alfian
#

set -e

NMSLEX_VERSION="2.0.0"
NMSLEX_PORT=7356
NMSLEX_DIR="/opt/nmslex"
NMSLEX_CONF="/etc/nmslex"
NMSLEX_LOG="/var/log/nmslex"
ELASTIC_VERSION="8.13.0"
SURICATA_VERSION="7.0.3"
INTERFACE="eth0"
ACTION="install"

# ═══════════════════════════════════════
# ANSI Colors & Styles
# ═══════════════════════════════════════
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'
BG_RED='\033[41m'
BG_GREEN='\033[42m'
BG_CYAN='\033[46m'
BG_BLUE='\033[44m'

# ═══════════════════════════════════════
# Logging Functions
# ═══════════════════════════════════════
log_info()  { echo -e "  ${CYAN}▸${NC} $1"; }
log_ok()    { echo -e "  ${GREEN}✔${NC} $1"; }
log_warn()  { echo -e "  ${YELLOW}⚠${NC} $1"; }
log_err()   { echo -e "  ${RED}✘${NC} $1"; }
log_step()  { echo -e "\n${BOLD}${BLUE}━━━ $1 ━━━${NC}"; }

# ═══════════════════════════════════════
# Animated Spinner
# ═══════════════════════════════════════
spinner() {
  local pid=$1
  local msg="${2:-Working...}"
  local frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
  local i=0
  while kill -0 "$pid" 2>/dev/null; do
    printf "\r  ${CYAN}${frames[$i]}${NC} ${DIM}%s${NC}" "$msg"
    i=$(( (i+1) % ${#frames[@]} ))
    sleep 0.1
  done
  printf "\r  ${GREEN}✔${NC} %-60s\n" "$msg"
}

# ═══════════════════════════════════════
# Progress Bar
# ═══════════════════════════════════════
progress_bar() {
  local current=$1 total=$2 label="${3:-Progress}"
  local pct=$((current * 100 / total))
  local filled=$((pct / 2))
  local empty=$((50 - filled))
  local bar=""
  for ((i=0; i<filled; i++)); do bar+="█"; done
  for ((i=0; i<empty; i++)); do bar+="░"; done
  printf "\r  ${DIM}%s${NC} ${CYAN}%s${NC} ${WHITE}%3d%%${NC}" "$label" "$bar" "$pct"
  [[ $pct -eq 100 ]] && echo ""
}

# ═══════════════════════════════════════
# Banner
# ═══════════════════════════════════════
show_banner() {
  clear
  echo -e "${CYAN}"
  echo "    ┌─────────────────────────────────────────────┐"
  echo "    │                                             │"
  echo "    │   🐼  N M S L E X                           │"
  echo "    │   Network Management System v${NMSLEX_VERSION}          │"
  echo "    │                                             │"
  echo "    │   Protecting your network,                  │"
  echo "    │   one packet at a time.                     │"
  echo "    │                                             │"
  echo "    └─────────────────────────────────────────────┘"
  echo -e "${NC}"
  echo -e "  ${DIM}© 2026 Muhammad Lutfi Alfian${NC}"
  echo ""
}

# ═══════════════════════════════════════
# Usage / Help
# ═══════════════════════════════════════
show_usage() {
  show_banner
  echo -e "  ${WHITE}${BOLD}Usage:${NC}  sudo ./deploy.sh [ACTION] [OPTIONS]"
  echo ""
  echo -e "  ${WHITE}${BOLD}Actions:${NC}"
  echo -e "    ${GREEN}install${NC}     Full installation (default)"
  echo -e "    ${YELLOW}--rebuild${NC}   Rebuild dashboard only (preserves config & data)"
  echo -e "    ${RED}--reset${NC}     Reset all config to defaults (keeps installation)"
  echo -e "    ${RED}--uninstall${NC}  Complete removal of NMSLEX and all components"
  echo ""
  echo -e "  ${WHITE}${BOLD}Options:${NC}"
  echo -e "    ${CYAN}--interface${NC} <iface>  Network interface (default: eth0)"
  echo -e "    ${CYAN}--port${NC} <port>        Dashboard port (default: 7356)"
  echo -e "    ${CYAN}--help${NC}               Show this help"
  echo ""
  echo -e "  ${WHITE}${BOLD}Examples:${NC}"
  echo -e "    ${DIM}sudo ./deploy.sh${NC}                        # Fresh install"
  echo -e "    ${DIM}sudo ./deploy.sh --rebuild${NC}               # Rebuild after code changes"
  echo -e "    ${DIM}sudo ./deploy.sh --reset${NC}                 # Reset configuration"
  echo -e "    ${DIM}sudo ./deploy.sh --uninstall${NC}             # Remove everything"
  echo -e "    ${DIM}sudo ./deploy.sh --interface ens33${NC}       # Custom interface"
  echo ""
}

# ═══════════════════════════════════════
# Parse Arguments
# ═══════════════════════════════════════
while [[ $# -gt 0 ]]; do
  case $1 in
    --interface)  INTERFACE="$2"; shift 2 ;;
    --port)       NMSLEX_PORT="$2"; shift 2 ;;
    --rebuild)    ACTION="rebuild"; shift ;;
    --reset)      ACTION="reset"; shift ;;
    --uninstall)  ACTION="uninstall"; shift ;;
    --help|-h)    show_usage; exit 0 ;;
    *)            shift ;;
  esac
done

# ═══════════════════════════════════════
# Check Root
# ═══════════════════════════════════════
check_root() {
  if [ "$EUID" -ne 0 ]; then
    log_err "This script must be run as root (sudo)"
    exit 1
  fi
}

# ═══════════════════════════════════════
# Detect OS
# ═══════════════════════════════════════
detect_os() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
  else
    log_err "Unsupported OS"
    exit 1
  fi
  log_info "Detected: ${WHITE}$OS $VER${NC}"
}

# ═══════════════════════════════════════
# UNINSTALL
# ═══════════════════════════════════════
do_uninstall() {
  show_banner
  echo -e "  ${BG_RED}${WHITE}${BOLD} ⚠  UNINSTALL MODE ${NC}"
  echo ""
  echo -e "  ${RED}This will completely remove NMSLEX and all components:${NC}"
  echo -e "    ${DIM}• Dashboard, Manager, Indexer services${NC}"
  echo -e "    ${DIM}• Suricata, Elasticsearch, Kibana, Filebeat${NC}"
  echo -e "    ${DIM}• All configuration files and logs${NC}"
  echo -e "    ${DIM}• Agent install scripts${NC}"
  echo ""
  read -p "  $(echo -e ${YELLOW})Are you sure? Type 'UNINSTALL' to confirm: $(echo -e ${NC})" confirm
  if [ "$confirm" != "UNINSTALL" ]; then
    echo -e "\n  ${GREEN}Uninstall cancelled.${NC}"
    exit 0
  fi

  echo ""
  log_step "Stopping Services"
  for svc in nmslex-dashboard nmslex-manager nmslex-indexer suricata elasticsearch kibana filebeat; do
    (systemctl stop $svc 2>/dev/null; systemctl disable $svc 2>/dev/null) &
    spinner $! "Stopping $svc..."
  done

  log_step "Removing Files"
  (
    rm -f /etc/systemd/system/nmslex-*.service
    rm -rf ${NMSLEX_DIR}
    rm -rf ${NMSLEX_CONF}
    rm -rf ${NMSLEX_LOG}
    systemctl daemon-reload
  ) &
  spinner $! "Cleaning up NMSLEX files..."

  log_step "Removing Packages"
  if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    (apt-get remove -y -qq suricata elasticsearch kibana filebeat 2>/dev/null; apt-get autoremove -y -qq 2>/dev/null) &
    spinner $! "Removing packages..."
  elif [[ "$OS" == "centos" || "$OS" == "rocky" ]]; then
    (yum remove -y -q suricata elasticsearch kibana filebeat 2>/dev/null) &
    spinner $! "Removing packages..."
  fi

  echo ""
  echo -e "  ${GREEN}${BOLD}✔ NMSLEX has been completely uninstalled.${NC}"
  echo ""
  exit 0
}

# ═══════════════════════════════════════
# RESET
# ═══════════════════════════════════════
do_reset() {
  show_banner
  echo -e "  ${BG_RED}${WHITE}${BOLD} ⚠  RESET MODE ${NC}"
  echo ""
  echo -e "  ${YELLOW}This will reset all NMSLEX configuration to defaults.${NC}"
  echo -e "  ${DIM}Installation and data will be preserved.${NC}"
  echo ""
  read -p "  $(echo -e ${YELLOW})Continue? (y/N): $(echo -e ${NC})" confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo -e "\n  ${GREEN}Reset cancelled.${NC}"
    exit 0
  fi

  echo ""
  log_step "Stopping Services"
  for svc in nmslex-dashboard nmslex-manager nmslex-indexer; do
    (systemctl stop $svc 2>/dev/null) &
    spinner $! "Stopping $svc..."
  done

  log_step "Resetting Configuration"

  # Re-create Suricata config
  (cat > /etc/suricata/suricata-nmslex.yaml << SURICATAEOF
%YAML 1.1
---
vars:
  address-groups:
    HOME_NET: "[192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12]"
    EXTERNAL_NET: "!\\\$HOME_NET"

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
  ) &
  spinner $! "Resetting Suricata config..."

  # Re-create dashboard config
  (cat > ${NMSLEX_CONF}/dashboard.conf << EOF
NMSLEX_PORT=${NMSLEX_PORT}
NMSLEX_DIR=${NMSLEX_DIR}
NMSLEX_LOG=${NMSLEX_LOG}
ES_HOST=http://localhost:9200
KIBANA_HOST=http://localhost:5601
SURICATA_LOG=/var/log/suricata/eve.json
EOF
  ) &
  spinner $! "Resetting dashboard config..."

  # Re-create Filebeat config
  (cat > /etc/filebeat/filebeat.yml << 'FBEOF'
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
  ) &
  spinner $! "Resetting Filebeat config..."

  sleep 1

  log_step "Restarting Services"
  for svc in suricata elasticsearch kibana filebeat nmslex-dashboard nmslex-manager nmslex-indexer; do
    (systemctl restart $svc 2>/dev/null) &
    spinner $! "Restarting $svc..."
  done

  echo ""
  echo -e "  ${GREEN}${BOLD}✔ Configuration reset complete.${NC}"
  echo -e "  ${DIM}All services restarted with default settings.${NC}"
  echo ""
  exit 0
}

# ═══════════════════════════════════════
# REBUILD
# ═══════════════════════════════════════
do_rebuild() {
  show_banner
  echo -e "  ${BG_CYAN}${WHITE}${BOLD} ♻  REBUILD MODE ${NC}"
  echo ""
  echo -e "  ${CYAN}Rebuilding dashboard from source...${NC}"
  echo -e "  ${DIM}Config, data, and services will be preserved.${NC}"
  echo ""

  log_step "Stopping Dashboard"
  (systemctl stop nmslex-dashboard 2>/dev/null) &
  spinner $! "Stopping dashboard service..."

  log_step "Building Dashboard"
  cd ${NMSLEX_DIR}/dashboard

  # Pull latest if git
  if [ -d ".git" ]; then
    (git pull 2>/dev/null) &
    spinner $! "Pulling latest changes..."
  else
    log_info "Copying source files..."
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    (cp -r "${SCRIPT_DIR}"/* ${NMSLEX_DIR}/dashboard/ 2>/dev/null) &
    spinner $! "Syncing source files..."
  fi

  (npm install 2>/dev/null) &
  spinner $! "Installing dependencies..."

  (npm run build 2>&1 > /dev/null) &
  spinner $! "Building production bundle..."

  log_step "Restarting Dashboard"
  (systemctl start nmslex-dashboard) &
  spinner $! "Starting dashboard service..."

  echo ""
  echo -e "  ${GREEN}${BOLD}✔ Dashboard rebuilt successfully!${NC}"
  echo -e "  ${DIM}Access: http://$(hostname -I | awk '{print $1}'):${NMSLEX_PORT}${NC}"
  echo ""
  exit 0
}

# ═══════════════════════════════════════
# FULL INSTALL
# ═══════════════════════════════════════
do_install() {
  show_banner
  echo -e "  ${BG_GREEN}${WHITE}${BOLD} 🚀 INSTALLING NMSLEX ${NC}"
  echo ""
  echo -e "  Interface:  ${WHITE}${INTERFACE}${NC}"
  echo -e "  Port:       ${WHITE}${NMSLEX_PORT}${NC}"
  echo ""

  local steps=10
  local step=0

  # Step 1: System deps
  step=$((step+1))
  log_step "[$step/$steps] System Dependencies"
  if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    (apt-get update -qq && apt-get install -y -qq curl wget gnupg2 apt-transport-https ca-certificates software-properties-common jq git build-essential 2>&1 > /dev/null) &
    spinner $! "Installing system packages..."
  elif [[ "$OS" == "centos" || "$OS" == "rocky" || "$OS" == "rhel" ]]; then
    (yum install -y -q curl wget gnupg2 ca-certificates jq git gcc make 2>&1 > /dev/null) &
    spinner $! "Installing system packages..."
  fi
  progress_bar $step $steps "Overall"

  # Step 2: Node.js
  step=$((step+1))
  log_step "[$step/$steps] Node.js Runtime"
  if ! command -v node &> /dev/null; then
    (curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y -qq nodejs 2>&1 > /dev/null) &
    spinner $! "Installing Node.js 18..."
  else
    log_ok "Node.js $(node --version) already installed"
  fi
  progress_bar $step $steps "Overall"

  # Step 3: Suricata
  step=$((step+1))
  log_step "[$step/$steps] Suricata IDS"
  if ! command -v suricata &> /dev/null; then
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
      (add-apt-repository -y ppa:oisf/suricata-stable 2>/dev/null; apt-get update -qq; apt-get install -y -qq suricata 2>&1 > /dev/null) &
      spinner $! "Installing Suricata..."
    elif [[ "$OS" == "centos" || "$OS" == "rocky" ]]; then
      (yum install -y -q epel-release; yum install -y -q suricata 2>&1 > /dev/null) &
      spinner $! "Installing Suricata..."
    fi
  else
    log_ok "Suricata already installed"
  fi

  # Configure Suricata
  (cat > /etc/suricata/suricata-nmslex.yaml << SURICATAEOF
%YAML 1.1
---
vars:
  address-groups:
    HOME_NET: "[192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12]"
    EXTERNAL_NET: "!\\\$HOME_NET"

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
  suricata-update 2>/dev/null
  ) &
  spinner $! "Configuring Suricata rules..."
  progress_bar $step $steps "Overall"

  # Step 4: Elasticsearch
  step=$((step+1))
  log_step "[$step/$steps] Elasticsearch"
  if ! command -v /usr/share/elasticsearch/bin/elasticsearch &> /dev/null; then
    (wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | gpg --dearmor -o /usr/share/keyrings/elasticsearch-keyring.gpg 2>/dev/null
    echo "deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] https://artifacts.elastic.co/packages/8.x/apt stable main" > /etc/apt/sources.list.d/elastic-8.x.list
    apt-get update -qq && apt-get install -y -qq elasticsearch 2>&1 > /dev/null) &
    spinner $! "Installing Elasticsearch ${ELASTIC_VERSION}..."
  else
    log_ok "Elasticsearch already installed"
  fi

  (cat >> /etc/elasticsearch/elasticsearch.yml << 'ESEOF'
cluster.name: nmslex-cluster
node.name: nmslex-node-1
network.host: 0.0.0.0
discovery.type: single-node
xpack.security.enabled: false
ESEOF
  sysctl -w vm.max_map_count=262144 2>/dev/null
  echo "vm.max_map_count=262144" >> /etc/sysctl.conf 2>/dev/null
  ) &
  spinner $! "Configuring Elasticsearch..."
  progress_bar $step $steps "Overall"

  # Step 5: Kibana
  step=$((step+1))
  log_step "[$step/$steps] Kibana"
  if ! command -v /usr/share/kibana/bin/kibana &> /dev/null; then
    (apt-get install -y -qq kibana 2>&1 > /dev/null) &
    spinner $! "Installing Kibana..."
  else
    log_ok "Kibana already installed"
  fi

  (cat >> /etc/kibana/kibana.yml << 'KBEOF'
server.host: "0.0.0.0"
server.port: 5601
elasticsearch.hosts: ["http://localhost:9200"]
KBEOF
  ) &
  spinner $! "Configuring Kibana..."
  progress_bar $step $steps "Overall"

  # Step 6: Filebeat
  step=$((step+1))
  log_step "[$step/$steps] Filebeat"
  if ! command -v filebeat &> /dev/null; then
    (apt-get install -y -qq filebeat 2>&1 > /dev/null) &
    spinner $! "Installing Filebeat..."
  else
    log_ok "Filebeat already installed"
  fi

  (cat > /etc/filebeat/filebeat.yml << 'FBEOF'
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
  ) &
  spinner $! "Configuring Filebeat..."
  progress_bar $step $steps "Overall"

  # Step 7: NMSLEX directories & build
  step=$((step+1))
  log_step "[$step/$steps] Building NMSLEX Dashboard"
  mkdir -p ${NMSLEX_DIR}/{dashboard,scripts,bin}
  mkdir -p ${NMSLEX_CONF}
  mkdir -p ${NMSLEX_LOG}

  cp -r . ${NMSLEX_DIR}/dashboard/
  cd ${NMSLEX_DIR}/dashboard

  (npm install 2>&1 > /dev/null) &
  spinner $! "Installing node modules..."

  (npm run build 2>&1 > /dev/null) &
  spinner $! "Building production bundle..."
  progress_bar $step $steps "Overall"

  # Step 8: Config & scripts
  step=$((step+1))
  log_step "[$step/$steps] Configuration & Scripts"

  cat > ${NMSLEX_CONF}/dashboard.conf << EOF
NMSLEX_PORT=${NMSLEX_PORT}
NMSLEX_DIR=${NMSLEX_DIR}
NMSLEX_LOG=${NMSLEX_LOG}
ES_HOST=http://localhost:9200
KIBANA_HOST=http://localhost:5601
SURICATA_LOG=/var/log/suricata/eve.json
EOF

  # Manager script
  cat > ${NMSLEX_DIR}/bin/nmslex-manager.sh << 'MGREOF'
#!/bin/bash
LOG_FILE="/var/log/nmslex/manager.log"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"; }
log "NMSLEX Manager started"
while true; do
  for svc in suricata elasticsearch kibana filebeat; do
    if systemctl is-active --quiet $svc; then
      log "[OK] $svc is running"
    else
      log "[WARN] $svc is not running, attempting restart..."
      systemctl restart $svc
      log "[INFO] $svc restart triggered"
    fi
  done
  log "[INFO] Checking agent heartbeats..."
  sleep 30
done
MGREOF
  chmod +x ${NMSLEX_DIR}/bin/nmslex-manager.sh

  # Indexer script
  cat > ${NMSLEX_DIR}/bin/nmslex-indexer.sh << 'IDXEOF'
#!/bin/bash
LOG_FILE="/var/log/nmslex/indexer.log"
EVE_JSON="/var/log/suricata/eve.json"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"; }
log "NMSLEX Indexer started"
while true; do
  if [ -f "$EVE_JSON" ]; then
    LINES=$(wc -l < "$EVE_JSON")
    log "[INFO] eve.json has $LINES lines"
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
  log_ok "Scripts created"
  progress_bar $step $steps "Overall"

  # Step 9: Systemd services
  step=$((step+1))
  log_step "[$step/$steps] Systemd Services"

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
  progress_bar $step $steps "Overall"

  # Step 10: Start services
  step=$((step+1))
  log_step "[$step/$steps] Starting Services"
  systemctl daemon-reload

  for svc in elasticsearch kibana suricata filebeat nmslex-dashboard nmslex-manager nmslex-indexer; do
    (systemctl enable $svc 2>/dev/null; systemctl start $svc 2>/dev/null) &
    spinner $! "Starting $svc..."
  done
  progress_bar $step $steps "Overall"

  # Create agent install script
  create_agent_script

  # Generate admin credentials
  generate_admin_credentials

  # Final summary
  show_completion
}

# ═══════════════════════════════════════
# Agent Script Generator
# ═══════════════════════════════════════
create_agent_script() {
  cat > ${NMSLEX_DIR}/scripts/nmslex-agent-install.sh << 'AGENTEOF'
#!/bin/bash
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

echo "🐼 NMSLEX Agent Installer"
echo "   Server: $NMSLEX_SERVER | Agent: $AGENT_NAME"

apt-get update -qq
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | gpg --dearmor -o /usr/share/keyrings/elasticsearch-keyring.gpg 2>/dev/null
echo "deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] https://artifacts.elastic.co/packages/8.x/apt stable main" > /etc/apt/sources.list.d/elastic-8.x.list
apt-get update -qq && apt-get install -y -qq filebeat

mkdir -p /opt/nmslex-agent/bin /etc/nmslex-agent

IFS=',' read -ra PATHS <<< "$LOG_PATHS"

cat > /etc/nmslex-agent/filebeat.yml << FBYML
filebeat.inputs:
$(for p in "${PATHS[@]}"; do echo "  - type: log"; echo "    enabled: true"; echo "    paths:"; echo "      - $p"; done)

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

cat > /opt/nmslex-agent/bin/nmslex-agent << TOOL
#!/bin/bash
case "\$1" in
  test-connection)
    echo "Testing connection to ${NMSLEX_SERVER}:${NMSLEX_PORT}..."
    if curl -sf "http://${NMSLEX_SERVER}:${NMSLEX_PORT}" > /dev/null 2>&1; then
      echo "✔ Connection successful"
    else
      echo "✘ Connection failed"
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
    echo "✔ Agent uninstalled"
    ;;
  *) echo "Usage: nmslex-agent {test-connection|uninstall}" ;;
esac
TOOL
chmod +x /opt/nmslex-agent/bin/nmslex-agent

systemctl daemon-reload
systemctl enable filebeat nmslex-agent
systemctl restart filebeat
systemctl start nmslex-agent

echo ""
echo "✔ NMSLEX Agent installed successfully!"
echo "  Agent: $AGENT_NAME → $NMSLEX_SERVER:$NMSLEX_PORT"
echo "  Commands: nmslex-agent test-connection | nmslex-agent uninstall"
AGENTEOF
  chmod +x ${NMSLEX_DIR}/scripts/nmslex-agent-install.sh
  log_ok "Agent script created"
}

# ═══════════════════════════════════════
# Admin Credentials
# ═══════════════════════════════════════
generate_admin_credentials() {
  ADMIN_EMAIL="adminlex@nmslex.com"
  ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d '=/+' | head -c 16)

  echo ""
  echo -e "  ${YELLOW}┌──────────────────────────────────────────┐${NC}"
  echo -e "  ${YELLOW}│  ${WHITE}${BOLD}DEFAULT ADMIN CREDENTIALS${NC}${YELLOW}               │${NC}"
  echo -e "  ${YELLOW}├──────────────────────────────────────────┤${NC}"
  echo -e "  ${YELLOW}│  ${DIM}Email:${NC}    ${CYAN}${ADMIN_EMAIL}${NC}${YELLOW}       │${NC}"
  echo -e "  ${YELLOW}│  ${DIM}Password:${NC} ${CYAN}${ADMIN_PASSWORD}${NC}${YELLOW}               │${NC}"
  echo -e "  ${YELLOW}├──────────────────────────────────────────┤${NC}"
  echo -e "  ${YELLOW}│  ${RED}⚠ SAVE THIS PASSWORD!${NC}${YELLOW}                   │${NC}"
  echo -e "  ${YELLOW}│  ${DIM}Cannot be shown again.${NC}${YELLOW}                   │${NC}"
  echo -e "  ${YELLOW}└──────────────────────────────────────────┘${NC}"

  echo "ADMIN_EMAIL=${ADMIN_EMAIL}" > ${NMSLEX_CONF}/admin.credentials
  echo "ADMIN_PASSWORD=${ADMIN_PASSWORD}" >> ${NMSLEX_CONF}/admin.credentials
  chmod 600 ${NMSLEX_CONF}/admin.credentials
  log_ok "Credentials saved (root only): ${NMSLEX_CONF}/admin.credentials"
}

# ═══════════════════════════════════════
# Completion Summary
# ═══════════════════════════════════════
show_completion() {
  local IP=$(hostname -I | awk '{print $1}')
  echo ""
  echo -e "  ${GREEN}┌──────────────────────────────────────────┐${NC}"
  echo -e "  ${GREEN}│  ${WHITE}${BOLD}🐼 NMSLEX Deployment Complete!${NC}${GREEN}          │${NC}"
  echo -e "  ${GREEN}└──────────────────────────────────────────┘${NC}"
  echo ""
  echo -e "  ${WHITE}${BOLD}Services:${NC}"
  echo -e "    Dashboard      ${CYAN}http://${IP}:${NMSLEX_PORT}${NC}"
  echo -e "    Kibana         ${CYAN}http://${IP}:5601${NC}"
  echo -e "    Elasticsearch  ${CYAN}http://${IP}:9200${NC}"
  echo ""
  echo -e "  ${WHITE}${BOLD}Management:${NC}"
  echo -e "    ${DIM}sudo systemctl status nmslex-dashboard${NC}"
  echo -e "    ${DIM}sudo ./deploy.sh --rebuild${NC}   ${DIM}# After code changes${NC}"
  echo -e "    ${DIM}sudo ./deploy.sh --reset${NC}     ${DIM}# Reset config${NC}"
  echo -e "    ${DIM}sudo ./deploy.sh --uninstall${NC} ${DIM}# Remove everything${NC}"
  echo ""
  echo -e "  ${WHITE}${BOLD}Agent:${NC}"
  echo -e "    ${DIM}${NMSLEX_DIR}/scripts/nmslex-agent-install.sh${NC}"
  echo ""
}

# ═══════════════════════════════════════
# Main Entry Point
# ═══════════════════════════════════════
check_root
detect_os

case $ACTION in
  install)    do_install ;;
  rebuild)    do_rebuild ;;
  reset)      do_reset ;;
  uninstall)  do_uninstall ;;
esac
