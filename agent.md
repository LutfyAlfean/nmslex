# 🖥️ NMSLEX Agent — Panduan Integrasi VM

Cara menginstall NMSLEX Agent di VM yang ingin dimonitor.

---

## Apa itu NMSLEX Agent?

NMSLEX Agent adalah **lightweight agent** yang diinstall di setiap VM/host yang ingin dimonitor. Agent berfungsi untuk:

- 📋 Mengumpulkan log sistem (auth, syslog, kern)
- 📊 Mengirim metrics (CPU, RAM, Disk, Network)
- 📤 Forward log ke NMSLEX server via Filebeat
- 💓 Health check dan heartbeat ke NMSLEX Manager

---

## Prasyarat

| Komponen | Minimum |
|----------|---------|
| OS | Ubuntu 20.04+ / Debian 11+ / CentOS 8+ / Rocky 9+ |
| RAM | 512 MB |
| CPU | 1 Core |
| Network | Koneksi ke NMSLEX Server |

---

## Instalasi

### 1. Download Agent Script

```bash
# Dari NMSLEX server
scp user@nmslex-server:/opt/nmslex/scripts/nmslex-agent-install.sh .

# Atau download langsung
curl -sO http://<NMSLEX_SERVER_IP>:7356/agent/install.sh
```

### 2. Jalankan Installer

```bash
chmod +x nmslex-agent-install.sh
sudo ./nmslex-agent-install.sh --server <NMSLEX_SERVER_IP>
```

### Opsi Instalasi

| Flag | Deskripsi | Default |
|------|-----------|---------|
| `--server` | IP NMSLEX Server | **(wajib)** |
| `--port` | Port Elasticsearch | `9200` |
| `--name` | Nama agent | `hostname` |
| `--interface` | Network interface | `eth0` |
| `--log-paths` | Log paths (comma-separated) | `/var/log/syslog,/var/log/auth.log` |

**Contoh lengkap:**

```bash
sudo ./nmslex-agent-install.sh \
  --server 192.168.1.100 \
  --port 9200 \
  --name web-server-01 \
  --interface ens33 \
  --log-paths "/var/log/nginx/access.log,/var/log/nginx/error.log"
```

### 3. Verifikasi

```bash
# Status agent
sudo systemctl status nmslex-agent

# Status Filebeat
sudo systemctl status filebeat

# Test koneksi ke server
sudo /opt/nmslex-agent/bin/nmslex-agent test-connection
```

### 4. Cek di Dashboard

1. Buka `http://<NMSLEX_SERVER_IP>:7356`
2. Navigasi ke menu **Agents**
3. Agent baru muncul dengan status **active** (hijau)

---

## Konfigurasi

File konfigurasi agent: `/etc/nmslex-agent/filebeat.yml`

### Menambah Log Custom

```bash
# Edit filebeat config
sudo nano /etc/nmslex-agent/filebeat.yml

# Tambahkan path baru di bagian inputs
# Restart
sudo systemctl restart filebeat
```

---

## Management

```bash
# Test koneksi
sudo /opt/nmslex-agent/bin/nmslex-agent test-connection

# Restart agent
sudo systemctl restart nmslex-agent

# Lihat log agent
sudo journalctl -u nmslex-agent -f

# Lihat log Filebeat
sudo journalctl -u filebeat -f
```

---

## Uninstall Agent

```bash
# Cara cepat
sudo /opt/nmslex-agent/bin/nmslex-agent uninstall

# Atau manual
sudo systemctl stop nmslex-agent filebeat
sudo systemctl disable nmslex-agent filebeat
sudo rm -rf /opt/nmslex-agent /etc/nmslex-agent
sudo rm /etc/systemd/system/nmslex-agent.service
sudo systemctl daemon-reload
```

---

## Troubleshooting

### Agent tidak muncul di dashboard
```bash
ping <NMSLEX_SERVER_IP>
curl -s http://<NMSLEX_SERVER_IP>:9200    # Test Elasticsearch
sudo ufw status                           # Cek firewall
```

### Filebeat error
```bash
sudo journalctl -u filebeat -f
sudo filebeat test config -c /etc/filebeat/filebeat.yml
sudo filebeat test output -c /etc/filebeat/filebeat.yml
```

### CPU/Memory usage tinggi
```bash
# Kurangi heartbeat interval (default 30s)
# Edit /opt/nmslex-agent/bin/heartbeat.sh
# Ubah sleep 30 ke sleep 60
sudo systemctl restart nmslex-agent
```

---

<p align="center">
  © 2026 Muhammad Lutfi Alfian — NMSLEX Agent
</p>
