# NMSLEX Agent - Panduan Integrasi VM

Cara menginstall NMSLEX Agent di VM yang ingin dimonitor.

## Apa itu NMSLEX Agent?

NMSLEX Agent adalah lightweight agent yang diinstall di setiap VM/host yang ingin dimonitor. Agent ini berfungsi untuk:

- Mengumpulkan log sistem (auth, syslog, kern)
- Mengirim metrics (CPU, RAM, Disk, Network)
- Forward log ke NMSLEX server via Filebeat
- Health check dan heartbeat ke NMSLEX Manager

## Prasyarat

| Komponen | Minimum |
|----------|---------|
| OS | Ubuntu 20.04+ / Debian 11+ / CentOS 8+ / Rocky 9+ |
| RAM | 512 MB |
| CPU | 1 Core |
| Network | Koneksi ke NMSLEX Server |

## Langkah 1: Download Agent Script

Dari VM yang ingin dimonitor, jalankan:

```bash
curl -sO http://<NMSLEX_SERVER_IP>:7356/agent/install.sh
# atau copy manual:
scp user@nmslex-server:/opt/nmslex/scripts/nmslex-agent-install.sh .
```

## Langkah 2: Jalankan Installer

```bash
chmod +x nmslex-agent-install.sh
sudo ./nmslex-agent-install.sh --server <NMSLEX_SERVER_IP>
```

### Opsi Instalasi

| Flag | Deskripsi | Default |
|------|-----------|---------|
| `--server` | IP NMSLEX Server | (wajib) |
| `--port` | Port Elasticsearch | 9200 |
| `--name` | Nama agent | hostname |
| `--interface` | Network interface | eth0 |
| `--log-paths` | Log tambahan | /var/log/syslog,/var/log/auth.log |

Contoh lengkap:

```bash
sudo ./nmslex-agent-install.sh \
  --server 192.168.1.100 \
  --port 9200 \
  --name web-server-01 \
  --interface ens33 \
  --log-paths "/var/log/nginx/access.log,/var/log/nginx/error.log"
```

## Langkah 3: Verifikasi

```bash
# Cek status agent
sudo systemctl status nmslex-agent

# Cek Filebeat
sudo systemctl status filebeat

# Cek koneksi ke server
sudo /opt/nmslex-agent/bin/nmslex-agent test-connection
```

## Langkah 4: Verifikasi di Dashboard

1. Buka NMSLEX Dashboard: `http://<NMSLEX_SERVER_IP>:7356`
2. Navigasi ke menu **Agents**
3. Agent baru akan muncul dengan status **active** (hijau)

## Konfigurasi Agent

File konfigurasi agent berada di `/etc/nmslex-agent/agent.yml`:

```yaml
# NMSLEX Agent Configuration
server:
  host: 192.168.1.100
  port: 9200

agent:
  name: web-server-01
  interface: ens33
  heartbeat_interval: 30s

logs:
  paths:
    - /var/log/syslog
    - /var/log/auth.log
    - /var/log/kern.log
  
metrics:
  enabled: true
  interval: 10s
  collect:
    - cpu
    - memory
    - disk
    - network

filebeat:
  elasticsearch:
    hosts: ["https://192.168.1.100:9200"]
  index: "nmslex-agent-{agent.name}"
```

## Menambah Log Custom

Edit konfigurasi agent:

```bash
sudo nano /etc/nmslex-agent/agent.yml
```

Tambahkan path log baru di bagian `logs.paths`:

```yaml
logs:
  paths:
    - /var/log/syslog
    - /var/log/auth.log
    - /var/log/myapp/app.log    # tambahkan ini
```

Restart agent:

```bash
sudo systemctl restart nmslex-agent
```

## Menghapus Agent

```bash
sudo /opt/nmslex-agent/bin/nmslex-agent uninstall
# atau manual:
sudo systemctl stop nmslex-agent filebeat
sudo systemctl disable nmslex-agent filebeat
sudo rm -rf /opt/nmslex-agent
sudo rm -rf /etc/nmslex-agent
sudo rm /etc/systemd/system/nmslex-agent.service
sudo systemctl daemon-reload
```

## Troubleshooting

### Agent tidak muncul di dashboard
```bash
# Cek koneksi
ping <NMSLEX_SERVER_IP>
curl -k https://<NMSLEX_SERVER_IP>:9200

# Cek firewall
sudo ufw status
sudo firewall-cmd --list-ports
```

### Filebeat error
```bash
# Cek log
sudo journalctl -u filebeat -f

# Test config
sudo filebeat test config -c /etc/nmslex-agent/filebeat.yml
sudo filebeat test output -c /etc/nmslex-agent/filebeat.yml
```

### CPU/Memory usage tinggi
```bash
# Kurangi metrics interval
sudo nano /etc/nmslex-agent/agent.yml
# Ubah metrics.interval ke 30s atau 60s
sudo systemctl restart nmslex-agent
```
