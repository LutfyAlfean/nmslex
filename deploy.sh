#!/bin/bash
#
# NMSLEX - Network Management System
# Advanced Deployment & Management Script v2.3
# © 2026 Muhammad Lutfi Alfian
#

# DO NOT use set -e with background processes
NMSLEX_VERSION="2.3.0"
NMSLEX_PORT=7356
NMSLEX_DIR="/opt/nmslex"
NMSLEX_CONF="/etc/nmslex"
NMSLEX_LOG="/var/log/nmslex"
ELASTIC_VERSION="8.13.0"
INTERFACE=""
ACTION="install"

export DEBIAN_FRONTEND=noninteractive

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
# Animated Spinner (with exit code check)
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
  wait "$pid" 2>/dev/null
  local exit_code=$?
  if [ $exit_code -eq 0 ]; then
    printf "\r  ${GREEN}✔${NC} %-60s\n" "$msg"
  else
    printf "\r  ${RED}✘${NC} %-60s\n" "$msg (exit code: $exit_code)"
  fi
  return $exit_code
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
  echo -e "    ${CYAN}--status${NC}    Check status of all services"
  echo ""
  echo -e "  ${WHITE}${BOLD}Options:${NC}"
  echo -e "    ${CYAN}--interface${NC} <iface>  Network interface (auto-detected if omitted)"
  echo -e "    ${CYAN}--port${NC} <port>        Dashboard port (default: 7356)"
  echo -e "    ${CYAN}--help${NC}               Show this help"
  echo ""
  echo -e "  ${WHITE}${BOLD}Examples:${NC}"
  echo -e "    ${DIM}sudo ./deploy.sh${NC}                        # Fresh install"
  echo -e "    ${DIM}sudo ./deploy.sh --rebuild${NC}               # Rebuild after code changes"
  echo -e "    ${DIM}sudo ./deploy.sh --reset${NC}                 # Reset configuration"
  echo -e "    ${DIM}sudo ./deploy.sh --uninstall${NC}             # Remove everything"
  echo -e "    ${DIM}sudo ./deploy.sh --interface ens18${NC}       # Custom interface"
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
    --status)     ACTION="status"; shift ;;
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
# Auto-detect Network Interface
# ═══════════════════════════════════════
detect_interface() {
  if [ -n "$INTERFACE" ]; then
    log_info "Using specified interface: ${WHITE}${INTERFACE}${NC}"
    return
  fi

  # Try to find the default-route interface
  local detected
  detected=$(ip route show default 2>/dev/null | awk '{print $5; exit}')

  if [ -z "$detected" ]; then
    # Fallback: first non-lo UP interface
    detected=$(ip -o link show up 2>/dev/null | awk -F': ' '!/lo/{print $2; exit}')
  fi

  if [ -n "$detected" ]; then
    INTERFACE="$detected"
    log_ok "Auto-detected interface: ${WHITE}${INTERFACE}${NC}"
  else
    INTERFACE="eth0"
    log_warn "Could not auto-detect interface, falling back to ${WHITE}eth0${NC}"
  fi
}

# ═══════════════════════════════════════
# Run command in background with spinner
# ═══════════════════════════════════════
run_with_spinner() {
  local msg="$1"
  shift
  "$@" >/dev/null 2>&1 &
  spinner $! "$msg"
}

get_package_version() {
  local pkg="$1"
  local version=""

  if command -v dpkg-query >/dev/null 2>&1; then
    version=$(dpkg-query -W -f='${Version}' "$pkg" 2>/dev/null | head -n 1)
    if [ -n "$version" ]; then
      echo "$version"
      return 0
    fi
  fi

  if command -v rpm >/dev/null 2>&1; then
    version=$(rpm -q --qf '%{VERSION}
' "$pkg" 2>/dev/null | head -n 1)
    if [ -n "$version" ]; then
      echo "$version"
      return 0
    fi
  fi

  return 1
}

get_repo_candidate_version() {
  local pkg="$1"
  local version=""

  if command -v apt-cache >/dev/null 2>&1; then
    version=$(apt-cache policy "$pkg" 2>/dev/null | awk '/Candidate:/ {print $2; exit}')
    if [ -n "$version" ] && [ "$version" != "(none)" ]; then
      echo "$version"
      return 0
    fi
  fi

  if command -v repoquery >/dev/null 2>&1; then
    version=$(repoquery --quiet --latest-limit=1 --qf '%{version}' "$pkg" 2>/dev/null | head -n 1)
    if [ -n "$version" ] && [ "$version" != "(null)" ]; then
      echo "$version"
      return 0
    fi
  fi

  return 1
}

is_package_installed() {
  local pkg="$1"

  if command -v dpkg-query >/dev/null 2>&1; then
    dpkg-query -W -f='${Status}' "$pkg" 2>/dev/null | grep -q "install ok installed" && return 0
  fi

  if command -v rpm >/dev/null 2>&1; then
    rpm -q "$pkg" >/dev/null 2>&1 && return 0
  fi

  return 1
}

is_service_known() {
  local svc="$1"
  systemctl list-unit-files --type=service 2>/dev/null | awk '{print $1}' | grep -qx "${svc}.service"
}

wait_for_http() {
  local url="$1"
  local timeout="${2:-60}"
  local label="${3:-Endpoint}"
  local elapsed=0

  while [ "$elapsed" -lt "$timeout" ]; do
    if curl -fsS --max-time 5 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done

  log_warn "$label did not respond within ${timeout}s"
  return 1
}

wait_for_port() {
  local port="$1"
  local timeout="${2:-60}"
  local label="${3:-Port ${port}}"
  local elapsed=0

  while [ "$elapsed" -lt "$timeout" ]; do
    if ss -tlnH 2>/dev/null | awk '{print $4}' | grep -Eq "(:|\])${port}$"; then
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done

  log_warn "$label did not listen within ${timeout}s"
  return 1
}

get_configured_dashboard_port() {
  local config_file="${NMSLEX_CONF}/dashboard.conf"
  local configured_port=""

  if [ -f "$config_file" ]; then
    configured_port=$(read_env_value "NMSLEX_PORT" "$config_file")
  fi

  printf "%s" "${configured_port:-$NMSLEX_PORT}"
}

get_major_minor_version() {
  echo "$1" | grep -oE '[0-9]+\.[0-9]+' | head -n 1
}

ensure_elastic_stack_compatibility() {
  local label="$1"
  local es_version="$2"
  local kb_version="$3"

  if [ -z "$es_version" ] || [ -z "$kb_version" ]; then
    return 0
  fi

  local es_mm
  local kb_mm
  es_mm=$(get_major_minor_version "$es_version")
  kb_mm=$(get_major_minor_version "$kb_version")

  if [ -z "$es_mm" ] || [ -z "$kb_mm" ]; then
    log_warn "$label version check skipped"
    return 0
  fi

  if [ "$es_mm" != "$kb_mm" ]; then
    log_err "$label version mismatch detected"
    echo -e "    ${DIM}Elasticsearch: ${WHITE}${es_version}${NC}"
    echo -e "    ${DIM}Kibana:        ${WHITE}${kb_version}${NC}"
    echo -e "    ${DIM}Gunakan major.minor yang sama, misalnya 8.13.x dengan 8.13.x${NC}"
    exit 1
  fi

  log_ok "$label compatible (${es_version} ↔ ${kb_version})"
}

fix_kibana_runtime_env() {
  mkdir -p /etc/systemd/system/kibana.service.d
  cat > /etc/systemd/system/kibana.service.d/nmslex.conf << 'KBSVC'
[Service]
Environment="NODE_OPTIONS="
Environment="NODE_PATH="
Environment="NODE_ENV="
UnsetEnvironment=NODE_OPTIONS
UnsetEnvironment=NODE_PATH
UnsetEnvironment=NODE_ENV
KBSVC

  mkdir -p /etc/default
  if [ -f /etc/default/kibana ]; then
    sed -i '/^NODE_OPTIONS=/d' /etc/default/kibana
    sed -i '/^NODE_PATH=/d' /etc/default/kibana
    sed -i '/^NODE_ENV=/d' /etc/default/kibana
  else
    touch /etc/default/kibana
  fi

  systemctl daemon-reload
  log_ok "Kibana runtime environment sanitized"
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
    systemctl stop "$svc" 2>/dev/null || true
    systemctl disable "$svc" 2>/dev/null || true
    log_ok "Stopped $svc"
  done

  log_step "Removing Files"
  rm -f /etc/systemd/system/nmslex-*.service
  rm -rf ${NMSLEX_DIR}
  rm -rf ${NMSLEX_CONF}
  rm -rf ${NMSLEX_LOG}
  systemctl daemon-reload
  log_ok "NMSLEX files removed"

  log_step "Removing Packages"
  if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    apt-get remove -y -qq suricata elasticsearch kibana filebeat 2>/dev/null || true
    apt-get autoremove -y -qq 2>/dev/null || true
  elif [[ "$OS" == "centos" || "$OS" == "rocky" ]]; then
    yum remove -y -q suricata elasticsearch kibana filebeat 2>/dev/null || true
  fi
  log_ok "Packages removed"

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
    systemctl stop "$svc" 2>/dev/null || true
    log_ok "Stopped $svc"
  done

  log_step "Resetting Configuration"

  cat > /etc/suricata/suricata-nmslex.yaml << SURICATAEOF
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
  log_ok "Suricata config reset"

  cat > ${NMSLEX_CONF}/dashboard.conf << EOF
NMSLEX_PORT=${NMSLEX_PORT}
NMSLEX_DIR=${NMSLEX_DIR}
NMSLEX_LOG=${NMSLEX_LOG}
ES_HOST=http://localhost:9200
KIBANA_HOST=http://localhost:5601
SURICATA_LOG=/var/log/suricata/eve.json
EOF
  log_ok "Dashboard config reset"

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
  log_ok "Filebeat config reset"

  ELASTICSEARCH_CONFIG="/etc/elasticsearch/elasticsearch.yml"
  if [ -f "$ELASTICSEARCH_CONFIG" ]; then
    sed -i '/^cluster\.initial_master_nodes:/d' "$ELASTICSEARCH_CONFIG"
    sed -i '/^discovery\.seed_hosts:/d' "$ELASTICSEARCH_CONFIG"
    log_ok "Elasticsearch single-node conflicts cleaned"
  fi

  log_step "Restarting Services"
  for svc in suricata elasticsearch kibana filebeat nmslex-dashboard nmslex-manager nmslex-indexer; do
    systemctl restart "$svc" 2>/dev/null || true
    log_ok "Restarted $svc"
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
  systemctl stop nmslex-dashboard 2>/dev/null || true
  log_ok "Dashboard stopped"

  log_step "Syncing Source"
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  if [ -d "${NMSLEX_DIR}/dashboard" ]; then
    rsync -a --exclude='node_modules' --exclude='dist' --exclude='.git' "${SCRIPT_DIR}/" "${NMSLEX_DIR}/dashboard/"
    # Ensure hidden files like .env are synced
    cp "${SCRIPT_DIR}"/.env ${NMSLEX_DIR}/dashboard/.env 2>/dev/null || true
    cp "${SCRIPT_DIR}"/.env.example ${NMSLEX_DIR}/dashboard/.env.example 2>/dev/null || true
    log_ok "Source synced"
  else
    mkdir -p ${NMSLEX_DIR}/dashboard
    cp -r "${SCRIPT_DIR}"/* ${NMSLEX_DIR}/dashboard/
    cp "${SCRIPT_DIR}"/.env ${NMSLEX_DIR}/dashboard/.env 2>/dev/null || true
    cp "${SCRIPT_DIR}"/.env.example ${NMSLEX_DIR}/dashboard/.env.example 2>/dev/null || true
    log_ok "Source copied"
  fi

  log_step "Building Dashboard"
  cd ${NMSLEX_DIR}/dashboard

  # Ensure .env exists with Supabase vars
  if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    log_info "Created .env from .env.example"
  fi
  if ! grep -q "VITE_SUPABASE_URL" .env 2>/dev/null; then
    log_warn "Missing VITE_SUPABASE_URL in .env - dashboard may show blank page!"
    [ -f ".env.example" ] && grep "^VITE_SUPABASE" .env.example >> .env
  fi

  log_info "Installing dependencies..."
  npm install 2>&1 | tail -5
  log_ok "Dependencies installed"

  log_info "Building production bundle..."
  npx vite build 2>&1 | tail -5
  if [ $? -eq 0 ]; then
    log_ok "Build complete"
  else
    log_err "Build failed! Check errors above."
    exit 1
  fi

  log_step "Restarting Dashboard"
  systemctl start nmslex-dashboard
  log_ok "Dashboard started"

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
    log_info "Updating package lists..."
    apt-get update -qq 2>&1 | tail -1
    log_info "Installing system packages..."
    apt-get install -y -qq curl wget gnupg2 apt-transport-https ca-certificates software-properties-common jq git build-essential 2>&1 | tail -1
    log_ok "System packages installed"
  elif [[ "$OS" == "centos" || "$OS" == "rocky" || "$OS" == "rhel" ]]; then
    log_info "Installing system packages..."
    yum install -y -q curl wget gnupg2 ca-certificates jq git gcc make 2>&1 | tail -1
    log_ok "System packages installed"
  fi
  progress_bar $step $steps "Overall"

  # Step 2: Node.js
  step=$((step+1))
  log_step "[$step/$steps] Node.js Runtime"
  if ! command -v node &> /dev/null; then
    log_info "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - >/dev/null 2>&1
    apt-get install -y -qq nodejs >/dev/null 2>&1
    log_ok "Node.js $(node --version) installed"
  else
    log_ok "Node.js $(node --version) already installed"
  fi
  # Install serve globally for systemd
  if ! command -v serve &> /dev/null; then
    log_info "Installing serve (static file server)..."
    npm install -g serve >/dev/null 2>&1
    log_ok "serve installed"
  fi
  progress_bar $step $steps "Overall"

  # Step 3: Suricata
  step=$((step+1))
  log_step "[$step/$steps] Suricata IDS"
  if ! command -v suricata &> /dev/null; then
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
      log_info "Adding Suricata repository..."
      add-apt-repository -y ppa:oisf/suricata-stable >/dev/null 2>&1 || true
      apt-get update -qq >/dev/null 2>&1
      log_info "Installing Suricata..."
      apt-get install -y -qq suricata >/dev/null 2>&1
    elif [[ "$OS" == "centos" || "$OS" == "rocky" ]]; then
      yum install -y -q epel-release >/dev/null 2>&1
      yum install -y -q suricata >/dev/null 2>&1
    fi
    log_ok "Suricata installed"
  else
    log_ok "Suricata already installed"
  fi

  log_info "Configuring Suricata..."
  cat > /etc/suricata/suricata-nmslex.yaml << SURICATAEOF
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
  suricata-update >/dev/null 2>&1 || true
  log_ok "Suricata configured"
  progress_bar $step $steps "Overall"

  # Step 4: Elasticsearch
  step=$((step+1))
  log_step "[$step/$steps] Elasticsearch"
  local installed_es_version=""
  local installed_kb_version=""
  local repo_es_version=""
  local repo_kb_version=""

  installed_es_version=$(get_package_version elasticsearch 2>/dev/null || true)
  installed_kb_version=$(get_package_version kibana 2>/dev/null || true)
  ensure_elastic_stack_compatibility "Installed Elastic Stack" "$installed_es_version" "$installed_kb_version"

  # Ensure prerequisites for HTTPS repos
  log_info "Installing prerequisites (apt-transport-https, gnupg)..."
  apt-get install -y -qq apt-transport-https gnupg >/dev/null 2>&1 || true

  log_info "Adding Elastic GPG key..."
  if ! wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | gpg --dearmor --batch --yes -o /usr/share/keyrings/elasticsearch-keyring.gpg 2>/dev/null; then
    log_warn "GPG key download failed, retrying with curl..."
    curl -fsSL https://artifacts.elastic.co/GPG-KEY-elasticsearch | gpg --dearmor --batch --yes -o /usr/share/keyrings/elasticsearch-keyring.gpg 2>/dev/null || {
      log_err "Failed to import Elastic GPG key. Check internet connection."
      log_err "Manual fix: wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo gpg --dearmor -o /usr/share/keyrings/elasticsearch-keyring.gpg"
      exit 1
    }
  fi
  log_ok "Elastic GPG key imported"

  log_info "Adding Elastic repository..."
  echo "deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] https://artifacts.elastic.co/packages/8.x/apt stable main" > /etc/apt/sources.list.d/elastic-8.x.list
  apt-get update -qq >/dev/null 2>&1

  repo_es_version=$(get_repo_candidate_version elasticsearch 2>/dev/null || true)
  repo_kb_version=$(get_repo_candidate_version kibana 2>/dev/null || true)

  if [ -z "$repo_es_version" ]; then
    log_err "Elasticsearch package candidate not found in repository"
    log_err "Check internet/DNS and run: apt-get update && apt-cache policy elasticsearch"
    exit 1
  fi

  if [ -z "$repo_kb_version" ]; then
    log_err "Kibana package candidate not found in repository"
    log_err "Check internet/DNS and run: apt-get update && apt-cache policy kibana"
    exit 1
  fi

  if [ -z "$installed_es_version" ] && [ -n "$installed_kb_version" ] && [ -n "$repo_es_version" ]; then
    ensure_elastic_stack_compatibility "Repository vs installed Kibana" "$repo_es_version" "$installed_kb_version"
  fi

  log_info "Elasticsearch candidate version: ${WHITE}${repo_es_version}${NC}"
  log_info "Kibana candidate version: ${WHITE}${repo_kb_version}${NC}"

  local es_installed=false
  if is_package_installed elasticsearch; then
    es_installed=true
  fi

  if [ "$es_installed" = false ]; then
    log_info "Installing Elasticsearch (this may take a few minutes)..."
    if ! apt-get install -y elasticsearch; then
      log_err "Elasticsearch installation FAILED!"
      log_err "Try manually: sudo apt-get install -y elasticsearch"
      log_err "Check: sudo apt-get update && apt-cache policy elasticsearch"
      exit 1
    fi
    if ! is_package_installed elasticsearch; then
      log_err "Elasticsearch package not found after install attempt!"
      log_err "Check repository: apt-cache policy elasticsearch"
      exit 1
    fi
    if ! is_service_known elasticsearch; then
      log_err "elasticsearch.service not found after install attempt!"
      log_err "Install seems incomplete/corrupt. Try: sudo apt-get install --reinstall -y elasticsearch"
      exit 1
    fi
    log_ok "Elasticsearch installed successfully"
  else
    log_ok "Elasticsearch already installed"
  fi

  installed_es_version=$(get_package_version elasticsearch 2>/dev/null || true)
  installed_kb_version=$(get_package_version kibana 2>/dev/null || true)
  ensure_elastic_stack_compatibility "Elasticsearch vs existing Kibana" "$installed_es_version" "$installed_kb_version"

  log_info "Configuring Elasticsearch..."
  ELASTICSEARCH_CONFIG="/etc/elasticsearch/elasticsearch.yml"

  sed -i '/^cluster\.name:/d' "$ELASTICSEARCH_CONFIG"
  sed -i '/^node\.name:/d' "$ELASTICSEARCH_CONFIG"
  sed -i '/^network\.host:/d' "$ELASTICSEARCH_CONFIG"
  sed -i '/^discovery\.type:/d' "$ELASTICSEARCH_CONFIG"
  sed -i '/^cluster\.initial_master_nodes:/d' "$ELASTICSEARCH_CONFIG"
  sed -i '/^discovery\.seed_hosts:/d' "$ELASTICSEARCH_CONFIG"
  sed -i '/^xpack\.security\.enabled:/d' "$ELASTICSEARCH_CONFIG"

  cat >> "$ELASTICSEARCH_CONFIG" << 'ESEOF'

# NMSLEX Config
cluster.name: nmslex-cluster
node.name: nmslex-node-1
network.host: 0.0.0.0
discovery.type: single-node
xpack.security.enabled: false
ESEOF

  sysctl -w vm.max_map_count=262144 >/dev/null 2>&1 || true
  grep -q "^vm.max_map_count=262144$" /etc/sysctl.conf || echo "vm.max_map_count=262144" >> /etc/sysctl.conf
  log_ok "Elasticsearch configured"
  progress_bar $step $steps "Overall"

  # Step 5: Kibana
  step=$((step+1))
  log_step "[$step/$steps] Kibana"
  installed_es_version=$(get_package_version elasticsearch 2>/dev/null || true)
  installed_kb_version=$(get_package_version kibana 2>/dev/null || true)
  repo_kb_version=$(get_repo_candidate_version kibana 2>/dev/null || true)

  if [ -z "$installed_kb_version" ] && [ -n "$installed_es_version" ] && [ -n "$repo_kb_version" ]; then
    ensure_elastic_stack_compatibility "Repository vs installed Elasticsearch" "$installed_es_version" "$repo_kb_version"
  fi

  local kb_installed=false
  if is_package_installed kibana; then
    kb_installed=true
  fi

  if [ "$kb_installed" = false ]; then
    log_info "Installing Kibana (this may take a few minutes)..."
    if ! apt-get install -y kibana; then
      log_err "Kibana installation FAILED!"
      log_err "Try manually: sudo apt-get install -y kibana"
      log_err "Check: sudo apt-get update && apt-cache policy kibana"
      exit 1
    fi
    if ! is_package_installed kibana; then
      log_err "Kibana package not found after install attempt!"
      exit 1
    fi
    if ! is_service_known kibana; then
      log_err "kibana.service not found after install attempt!"
      log_err "Install seems incomplete/corrupt. Try: sudo apt-get install --reinstall -y kibana"
      exit 1
    fi
    log_ok "Kibana installed successfully"
  else
    log_ok "Kibana already installed"
  fi

  installed_kb_version=$(get_package_version kibana 2>/dev/null || true)
  ensure_elastic_stack_compatibility "Elastic Stack" "$installed_es_version" "$installed_kb_version"

  # Clean old NMSLEX config entries
  sed -i '/^server\.host:/d' /etc/kibana/kibana.yml
  sed -i '/^server\.port:/d' /etc/kibana/kibana.yml
  sed -i '/^elasticsearch\.hosts:/d' /etc/kibana/kibana.yml
  sed -i '/^xpack\.security\.enabled:/d' /etc/kibana/kibana.yml
  sed -i '/^xpack\.encryptedSavedObjects\.encryptionKey:/d' /etc/kibana/kibana.yml
  sed -i '/^xpack\.reporting\.encryptionKey:/d' /etc/kibana/kibana.yml
  sed -i '/^xpack\.security\.encryptionKey:/d' /etc/kibana/kibana.yml
  sed -i '/^# NMSLEX Config$/d' /etc/kibana/kibana.yml

  # Generate encryption keys (required by Kibana xpack)
  local kb_enc_key
  local kb_rpt_key
  local kb_sec_key
  mkdir -p "${NMSLEX_CONF}"
  # Re-use existing keys if stored, otherwise generate new ones
  if [ -f "${NMSLEX_CONF}/kibana-keys" ]; then
    source "${NMSLEX_CONF}/kibana-keys"
    kb_enc_key="${KIBANA_ENC_KEY}"
    kb_rpt_key="${KIBANA_RPT_KEY}"
    kb_sec_key="${KIBANA_SEC_KEY}"
  fi
  [ -z "$kb_enc_key" ] && kb_enc_key=$(openssl rand -hex 16)
  [ -z "$kb_rpt_key" ] && kb_rpt_key=$(openssl rand -hex 16)
  [ -z "$kb_sec_key" ] && kb_sec_key=$(openssl rand -hex 16)
  # Persist keys
  cat > "${NMSLEX_CONF}/kibana-keys" << KEYEOF
KIBANA_ENC_KEY=${kb_enc_key}
KIBANA_RPT_KEY=${kb_rpt_key}
KIBANA_SEC_KEY=${kb_sec_key}
KEYEOF
  chmod 600 "${NMSLEX_CONF}/kibana-keys"

  cat >> /etc/kibana/kibana.yml << KBEOF

# NMSLEX Config
server.host: "0.0.0.0"
server.port: 5601
elasticsearch.hosts: ["http://localhost:9200"]
xpack.security.enabled: false
xpack.encryptedSavedObjects.encryptionKey: "${kb_enc_key}"
xpack.reporting.encryptionKey: "${kb_rpt_key}"
xpack.security.encryptionKey: "${kb_sec_key}"
KBEOF
  fix_kibana_runtime_env
  log_ok "Kibana configured"
  progress_bar $step $steps "Overall"

  # Step 6: Filebeat
  step=$((step+1))
  log_step "[$step/$steps] Filebeat"
  if ! command -v filebeat &> /dev/null; then
    log_info "Installing Filebeat..."
    apt-get install -y -qq filebeat >/dev/null 2>&1
    log_ok "Filebeat installed"
  else
    log_ok "Filebeat already installed"
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
  log_ok "Filebeat configured"
  progress_bar $step $steps "Overall"

  # Step 7: NMSLEX directories & build
  step=$((step+1))
  log_step "[$step/$steps] Building NMSLEX Dashboard"
  mkdir -p ${NMSLEX_DIR}/{dashboard,scripts,bin}
  mkdir -p ${NMSLEX_CONF}
  mkdir -p ${NMSLEX_LOG}

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  log_info "Copying source files..."
  cp -r "${SCRIPT_DIR}"/* ${NMSLEX_DIR}/dashboard/ 2>/dev/null || true
  # Copy hidden files like .env too
  cp "${SCRIPT_DIR}"/.env ${NMSLEX_DIR}/dashboard/.env 2>/dev/null || true
  cp "${SCRIPT_DIR}"/.env.example ${NMSLEX_DIR}/dashboard/.env.example 2>/dev/null || true
  cd ${NMSLEX_DIR}/dashboard

  # Ensure .env exists with Supabase vars (required for Vite build)
  if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
      log_info "Creating .env from .env.example..."
      cp .env.example .env
    fi
  fi
  # Verify critical Supabase env vars exist
  if ! grep -q "VITE_SUPABASE_URL" .env 2>/dev/null; then
    log_warn ".env missing VITE_SUPABASE_URL - adding from .env.example..."
    if [ -f ".env.example" ]; then
      grep "^VITE_SUPABASE" .env.example >> .env
    else
      log_err "No .env.example found! Dashboard will show blank page without Supabase vars."
      log_err "Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env"
    fi
  fi

  log_info "Installing node modules (this may take a minute)..."
  npm install 2>&1 | tail -3
  log_ok "Node modules installed"

  log_info "Building production bundle..."
  npx vite build 2>&1 | tail -5
  if [ -d "dist" ]; then
    log_ok "Dashboard built successfully"
  else
    log_err "Build failed! Retrying with verbose output..."
    npx vite build
    if [ ! -d "dist" ]; then
      log_err "Build failed. Please check errors above and run: sudo ./deploy.sh --rebuild"
      exit 1
    fi
  fi
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
MAX_LOG_SIZE=10485760  # 10MB
RETRY_INTERVAL=300     # 5 minutes cooldown after failed restart
declare -A LAST_RESTART_ATTEMPT

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"; }

rotate_log() {
  if [ -f "$LOG_FILE" ]; then
    local size=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
    if [ "$size" -gt "$MAX_LOG_SIZE" ]; then
      mv "$LOG_FILE" "${LOG_FILE}.old"
      log "Log rotated"
    fi
  fi
}

can_retry() {
  local svc=$1
  local now=$(date +%s)
  local last=${LAST_RESTART_ATTEMPT[$svc]:-0}
  [ $((now - last)) -ge $RETRY_INTERVAL ]
}

log "NMSLEX Manager started (v2.1)"
log "[INFO] Retry cooldown: ${RETRY_INTERVAL}s per service"

while true; do
  rotate_log

  for svc in elasticsearch suricata kibana filebeat; do
    if systemctl is-active --quiet $svc; then
      : # Service OK, no log spam
    else
      if can_retry $svc; then
        log "[WARN] $svc is down, attempting restart..."
        if systemctl restart $svc 2>/dev/null; then
          sleep 5
          if systemctl is-active --quiet $svc; then
            log "[OK] $svc restarted successfully"
            LAST_RESTART_ATTEMPT[$svc]=0
          else
            log "[ERROR] $svc failed to start — next retry in ${RETRY_INTERVAL}s"
            log "[HINT] Check: journalctl -xeu $svc --no-pager -n 20"
            LAST_RESTART_ATTEMPT[$svc]=$(date +%s)
          fi
        else
          log "[ERROR] $svc restart command failed — next retry in ${RETRY_INTERVAL}s"
          LAST_RESTART_ATTEMPT[$svc]=$(date +%s)
        fi
      fi
    fi
  done

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
    SIZE=$(stat -c%s "$EVE_JSON" 2>/dev/null || stat -f%z "$EVE_JSON" 2>/dev/null || echo 0)
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
ExecStart=$(which serve) -s ${NMSLEX_DIR}/dashboard/dist -l ${NMSLEX_PORT}
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

  if is_service_known elasticsearch; then
    systemctl reset-failed elasticsearch >/dev/null 2>&1 || true
    systemctl enable elasticsearch >/dev/null 2>&1 || true
    systemctl restart elasticsearch >/dev/null 2>&1 || true
    if wait_for_http "http://localhost:9200" 120 "Elasticsearch API" && systemctl is-active --quiet elasticsearch 2>/dev/null; then
      log_ok "Started elasticsearch"
    else
      log_warn "elasticsearch failed to become ready (check: systemctl status elasticsearch && journalctl -u elasticsearch -n 50 --no-pager)"
    fi
  else
    log_warn "elasticsearch service unit not found; skipping start"
  fi

  if is_service_known kibana; then
    fix_kibana_runtime_env
    systemctl reset-failed kibana >/dev/null 2>&1 || true
    systemctl enable kibana >/dev/null 2>&1 || true
    systemctl restart kibana >/dev/null 2>&1 || true
    if wait_for_port 5601 120 "Kibana port" && systemctl is-active --quiet kibana 2>/dev/null; then
      log_ok "Started kibana"
    else
      systemctl reset-failed kibana >/dev/null 2>&1 || true
      systemctl restart kibana >/dev/null 2>&1 || true
      if wait_for_port 5601 120 "Kibana port" && systemctl is-active --quiet kibana 2>/dev/null; then
        log_ok "Started kibana"
      else
        log_warn "kibana failed to become ready (check: systemctl status kibana && journalctl -u kibana -n 80 --no-pager)"
      fi
    fi
  else
    log_warn "kibana service unit not found; skipping start"
  fi

  for svc in suricata filebeat nmslex-manager nmslex-indexer; do
    if ! is_service_known "$svc"; then
      log_warn "$svc service unit not found; skipping start"
      continue
    fi

    systemctl reset-failed "$svc" >/dev/null 2>&1 || true
    systemctl enable "$svc" >/dev/null 2>&1 || true
    systemctl restart "$svc" >/dev/null 2>&1 || true
    if systemctl is-active --quiet "$svc" 2>/dev/null; then
      log_ok "Started $svc"
    else
      log_warn "$svc failed to start (check: systemctl status $svc && journalctl -u $svc -n 50 --no-pager)"
    fi
  done

  if is_service_known nmslex-dashboard; then
    local dashboard_port
    dashboard_port=$(get_configured_dashboard_port)
    systemctl reset-failed nmslex-dashboard >/dev/null 2>&1 || true
    systemctl enable nmslex-dashboard >/dev/null 2>&1 || true
    systemctl restart nmslex-dashboard >/dev/null 2>&1 || true
    if wait_for_port "$dashboard_port" 30 "Dashboard port" && systemctl is-active --quiet nmslex-dashboard 2>/dev/null; then
      log_ok "Started nmslex-dashboard"
    else
      log_warn "nmslex-dashboard failed to become ready on port ${dashboard_port} (check: systemctl status nmslex-dashboard && journalctl -u nmslex-dashboard -n 50 --no-pager)"
    fi
  else
    log_warn "nmslex-dashboard service unit not found; skipping start"
  fi
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
export DEBIAN_FRONTEND=noninteractive
NMSLEX_SERVER=""
NMSLEX_PORT=9200
AGENT_NAME=$(hostname)
INTERFACE=""
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

if [ -z "$INTERFACE" ]; then
  INTERFACE=$(ip route show default 2>/dev/null | awk '{print $5; exit}')
  [ -z "$INTERFACE" ] && INTERFACE=$(ip -o link show up 2>/dev/null | awk -F': ' '!/lo/{print $2; exit}')
  [ -z "$INTERFACE" ] && INTERFACE="eth0"
  echo "Auto-detected interface: $INTERFACE"
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
read_env_value() {
  local key="$1"
  local file="$2"
  local value

  value=$(grep -E "^${key}=" "$file" 2>/dev/null | head -n 1 | cut -d'=' -f2-)
  value="${value#\"}"
  value="${value%\"}"
  value="${value#\'}"
  value="${value%\'}"
  printf "%s" "$value"
}

hash_secret_value() {
  local value="$1"
  printf "%s" "$value" | sha256sum | awk '{print $1}'
}

sync_admin_credentials() {
  local env_file=""
  local supabase_url=""
  local supabase_anon_key=""
  local function_url=""
  local reset_payload=""
  local bootstrap_payload=""
  local response=""
  local error_message=""

  for candidate in "${SCRIPT_DIR}/.env" "${NMSLEX_DIR}/dashboard/.env"; do
    if [ -f "$candidate" ]; then
      env_file="$candidate"
      break
    fi
  done

  if [ -z "$env_file" ]; then
    log_warn "Admin auth sync skipped: .env not found"
    return 1
  fi

  supabase_url=$(read_env_value "VITE_SUPABASE_URL" "$env_file")
  supabase_anon_key=$(read_env_value "VITE_SUPABASE_PUBLISHABLE_KEY" "$env_file")

  if [ -z "$supabase_url" ] || [ -z "$supabase_anon_key" ]; then
    log_warn "Admin auth sync skipped: backend URL/key missing in .env"
    return 1
  fi

  function_url="${supabase_url%/}/functions/v1/manage-users"

  reset_payload=$(jq -nc \
    --arg email "$ADMIN_EMAIL" \
    --arg password "$ADMIN_PASSWORD" \
    '{action:"reset_admin_password", email:$email, password:$password}')

  response=$(curl -sS --max-time 30 -X POST "$function_url" \
    -H "Content-Type: application/json" \
    -H "apikey: $supabase_anon_key" \
    -H "Authorization: Bearer $supabase_anon_key" \
    -d "$reset_payload")

  if echo "$response" | jq -e '.success == true' >/dev/null 2>&1; then
    log_ok "Admin password synced to backend auth"
    return 0
  fi

  error_message=$(echo "$response" | jq -r '.error // empty' 2>/dev/null)

  if [ "$error_message" = "User not found" ]; then
    bootstrap_payload=$(jq -nc \
      --arg email "$ADMIN_EMAIL" \
      --arg password "$ADMIN_PASSWORD" \
      --arg name "Administrator" \
      '{action:"bootstrap_admin", email:$email, password:$password, name:$name}')

    response=$(curl -sS --max-time 30 -X POST "$function_url" \
      -H "Content-Type: application/json" \
      -H "apikey: $supabase_anon_key" \
      -H "Authorization: Bearer $supabase_anon_key" \
      -d "$bootstrap_payload")

    if echo "$response" | jq -e '.success == true' >/dev/null 2>&1; then
      log_ok "Admin account bootstrapped in backend auth"
      return 0
    fi

    error_message=$(echo "$response" | jq -r '.error // empty' 2>/dev/null)
  fi

  log_warn "Admin auth sync failed${error_message:+: $error_message}"
  return 1
}

generate_admin_credentials() {
  ADMIN_EMAIL="adminlex@nmslex.com"
  ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d '=/+' | head -c 16)
  ADMIN_PASSWORD_HASH=$(hash_secret_value "$ADMIN_PASSWORD")

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
  echo "ADMIN_PASSWORD_HASH=${ADMIN_PASSWORD_HASH}" >> ${NMSLEX_CONF}/admin.credentials
  chmod 600 ${NMSLEX_CONF}/admin.credentials
  log_ok "Credentials saved as hash (root only): ${NMSLEX_CONF}/admin.credentials"

  if ! sync_admin_credentials; then
    log_warn "Login awal bisa gagal sampai kredensial backend berhasil disinkronkan"
  fi
}

# ═══════════════════════════════════════
# Status Check (--status)
# ═══════════════════════════════════════
do_status() {
  show_banner
  echo -e "  ${WHITE}${BOLD}🔍 NMSLEX Service Health Check${NC}"
  echo ""

  local services=("elasticsearch" "kibana" "suricata" "filebeat" "nmslex-dashboard" "nmslex-manager")
  local all_ok=true

  for svc in "${services[@]}"; do
    if systemctl is-active --quiet "$svc" 2>/dev/null; then
      local uptime=$(systemctl show "$svc" --property=ActiveEnterTimestamp --value 2>/dev/null)
      local mem=$(systemctl show "$svc" --property=MemoryCurrent --value 2>/dev/null)
      local mem_mb=""
      if [[ "$mem" =~ ^[0-9]+$ ]] && [ "$mem" -gt 0 ]; then
        mem_mb=" ($(( mem / 1024 / 1024 ))MB)"
      fi
      echo -e "  ${GREEN}✔${NC} ${WHITE}${svc}${NC} ${GREEN}running${NC}${DIM}${mem_mb}${NC}"
      echo -e "    ${DIM}since: ${uptime}${NC}"
    elif is_service_known "$svc"; then
      all_ok=false
      echo -e "  ${RED}✘${NC} ${WHITE}${svc}${NC} ${RED}stopped / failed${NC}"
      echo -e "    ${DIM}─── Recent logs ───${NC}"
      journalctl -u "$svc" --no-pager -n 15 --since "1 hour ago" 2>/dev/null | while IFS= read -r line; do
        if echo "$line" | grep -qiE "error|fatal|fail|exception"; then
          echo -e "    ${RED}${line}${NC}"
        else
          echo -e "    ${DIM}${line}${NC}"
        fi
      done
      echo -e "    ${DIM}───────────────────${NC}"
    elif is_package_installed "$svc"; then
      all_ok=false
      echo -e "  ${YELLOW}─${NC} ${WHITE}${svc}${NC} ${YELLOW}package installed but service unit missing${NC}"
    else
      all_ok=false
      echo -e "  ${YELLOW}─${NC} ${WHITE}${svc}${NC} ${YELLOW}not installed${NC}"
    fi
  done

  echo ""

  # Port checks
  echo -e "  ${WHITE}${BOLD}🌐 Port Status${NC}"
  local dashboard_port
  dashboard_port=$(get_configured_dashboard_port)
  local ports=("9200:Elasticsearch" "5601:Kibana" "${dashboard_port}:Dashboard")
  for entry in "${ports[@]}"; do
    local port="${entry%%:*}"
    local name="${entry##*:}"
    if ss -tlnH 2>/dev/null | awk '{print $4}' | grep -Eq "(:|\])${port}$"; then
      echo -e "  ${GREEN}✔${NC} ${name} port ${CYAN}${port}${NC} ${GREEN}listening${NC}"
    else
      echo -e "  ${RED}✘${NC} ${name} port ${CYAN}${port}${NC} ${RED}not listening${NC}"
      all_ok=false
    fi
  done

  echo ""

  # Elasticsearch cluster health
  local es_health
  es_health=$(curl -s --max-time 5 "http://localhost:9200/_cluster/health" 2>/dev/null)
  if [ $? -eq 0 ] && [ -n "$es_health" ]; then
    local status=$(echo "$es_health" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    local num_nodes=$(echo "$es_health" | grep -o '"number_of_nodes":[0-9]*' | cut -d: -f2)
    case "$status" in
      green)  echo -e "  ${GREEN}✔${NC} Elasticsearch cluster: ${GREEN}${status}${NC} (${num_nodes} nodes)" ;;
      yellow) echo -e "  ${YELLOW}⚠${NC} Elasticsearch cluster: ${YELLOW}${status}${NC} (${num_nodes} nodes)" ;;
      red)    echo -e "  ${RED}✘${NC} Elasticsearch cluster: ${RED}${status}${NC} (${num_nodes} nodes)"; all_ok=false ;;
    esac
  else
    echo -e "  ${RED}✘${NC} Elasticsearch API ${RED}not responding${NC}"
    all_ok=false
  fi

  # Suricata stats
  if [ -f /var/log/suricata/stats.log ]; then
    local last_stat=$(tail -1 /var/log/suricata/stats.log 2>/dev/null)
    echo -e "  ${DIM}Suricata last stat: ${last_stat}${NC}"
  fi

  echo ""
  if $all_ok; then
    echo -e "  ${GREEN}┌──────────────────────────────────────────┐${NC}"
    echo -e "  ${GREEN}│  ${WHITE}${BOLD}✔ All services healthy${NC}${GREEN}                    │${NC}"
    echo -e "  ${GREEN}└──────────────────────────────────────────┘${NC}"
  else
    echo -e "  ${RED}┌──────────────────────────────────────────┐${NC}"
    echo -e "  ${RED}│  ${WHITE}${BOLD}⚠ Some services need attention${NC}${RED}            │${NC}"
    echo -e "  ${RED}└──────────────────────────────────────────┘${NC}"
    echo ""

    # Collect failed services
    local failed_svcs=()
    for svc in "${services[@]}"; do
      if systemctl is-enabled --quiet "$svc" 2>/dev/null && ! systemctl is-active --quiet "$svc" 2>/dev/null; then
        failed_svcs+=("$svc")
      fi
    done

    if [ ${#failed_svcs[@]} -gt 0 ]; then
      echo ""
      echo -e "  ${YELLOW}${BOLD}Auto-restart failed services? [y/N]${NC}"
      read -r -p "  > " answer
      if [[ "$answer" =~ ^[Yy]$ ]]; then
        for svc in "${failed_svcs[@]}"; do
          echo -e "  ${CYAN}▸${NC} Restarting ${WHITE}${svc}${NC}..."
          systemctl reset-failed "$svc" >/dev/null 2>&1 || true

          # Pre-restart fixes
          if [ "$svc" = "elasticsearch" ]; then
            # Fix common ES issues
            sysctl -w vm.max_map_count=262144 >/dev/null 2>&1
            local es_yml="/etc/elasticsearch/elasticsearch.yml"
            if [ -f "$es_yml" ]; then
              sed -i '/^cluster\.initial_master_nodes/d' "$es_yml"
              sed -i '/^discovery\.seed_hosts/d' "$es_yml"
              if ! grep -q "^discovery.type:" "$es_yml"; then
                echo "discovery.type: single-node" >> "$es_yml"
              fi
            fi
          fi

          if [ "$svc" = "kibana" ]; then
            wait_for_http "http://localhost:9200" 120 "Elasticsearch API" >/dev/null 2>&1 || true
            fix_kibana_runtime_env
          fi

          if [ "$svc" = "nmslex-dashboard" ]; then
            local dashboard_port
            dashboard_port=$(get_configured_dashboard_port)
            systemctl restart "$svc" 2>/dev/null
            wait_for_port "$dashboard_port" 30 "Dashboard port" >/dev/null 2>&1 || true
          elif [ "$svc" = "kibana" ]; then
            systemctl restart "$svc" 2>/dev/null
            wait_for_port 5601 120 "Kibana port" >/dev/null 2>&1 || true
          else
            systemctl restart "$svc" 2>/dev/null
          fi
          sleep 3

          if systemctl is-active --quiet "$svc" 2>/dev/null; then
            echo -e "  ${GREEN}✔${NC} ${svc} ${GREEN}restarted successfully${NC}"
          else
            echo -e "  ${RED}✘${NC} ${svc} ${RED}still failing${NC}"
            echo -e "    ${DIM}Check: sudo journalctl -u ${svc} -n 30 --no-pager${NC}"
          fi
        done
        echo ""
        echo -e "  ${DIM}Run ${CYAN}sudo ./deploy.sh --status${NC} ${DIM}again to verify${NC}"
      fi
    else
      echo -e "  ${DIM}Tips:${NC}"
      echo -e "  ${DIM}  sudo systemctl restart <service>${NC}"
      echo -e "  ${DIM}  sudo journalctl -u <service> -f${NC}"
      echo -e "  ${DIM}  sudo ./deploy.sh --reset${NC}"
    fi
  fi
  echo ""
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
  status)     do_status ;;
esac
