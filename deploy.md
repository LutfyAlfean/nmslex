# NMSLEX - Panduan Deployment

Tutorial lengkap cara deploy NMSLEX di VM lokal.

## Prasyarat

| Komponen | Minimum |
|----------|---------|
| OS | Ubuntu 22.04 / Debian 12 / CentOS 9 |
| RAM | 8 GB (16 GB direkomendasikan) |
| CPU | 4 Core |
| Disk | 50 GB |
| Network | 1 interface aktif |

## Langkah 1: Clone Repository

```bash
git clone https://github.com/yourusername/nmslex.git
cd nmslex
```

## Langkah 2: Jalankan Deploy Script

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

Script ini akan otomatis:
1. Install dependencies (Node.js, Suricata, Elasticsearch, Kibana, Filebeat)
2. Konfigurasi semua service
3. Build dashboard
4. Membuat systemd services
5. Start semua service

## Langkah 3: Verifikasi Instalasi

```bash
# Cek semua service
sudo systemctl status nmslex-dashboard
sudo systemctl status nmslex-manager
sudo systemctl status nmslex-indexer
sudo systemctl status suricata
sudo systemctl status elasticsearch
sudo systemctl status kibana
sudo systemctl status filebeat
```

## Langkah 4: Akses Dashboard

Buka browser dan akses:

```
http://<IP_VM>:7356
```

## Struktur Service

### nmslex-dashboard
- **Port**: 7356
- **Fungsi**: Serve dashboard web UI
- **Log**: `/var/log/nmslex/dashboard.log`

### nmslex-manager
- **Fungsi**: Orkestrasi agent, health check, dan konfigurasi
- **Log**: `/var/log/nmslex/manager.log`

### nmslex-indexer
- **Fungsi**: Mengambil log dari Suricata dan index ke Elasticsearch
- **Log**: `/var/log/nmslex/indexer.log`

## Port Default

| Service | Port |
|---------|------|
| NMSLEX Dashboard | 7356 |
| Elasticsearch | 9200 |
| Kibana | 5601 |
| Suricata (eve.json) | — (file-based) |
| Filebeat | — (agent-based) |

## Konfigurasi Lanjutan

### Ubah Interface Suricata

```bash
sudo nano /etc/suricata/suricata.yaml
# Ubah af-packet interface ke interface yang diinginkan
```

### Ubah Port Dashboard

```bash
sudo nano /etc/nmslex/dashboard.conf
# Ubah NMSLEX_PORT=7356 ke port yang diinginkan
sudo systemctl restart nmslex-dashboard
```

## Troubleshooting

### Elasticsearch tidak start
```bash
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo systemctl restart elasticsearch
```

### Dashboard tidak bisa diakses
```bash
sudo firewall-cmd --add-port=7356/tcp --permanent
sudo firewall-cmd --reload
# atau untuk ufw:
sudo ufw allow 7356/tcp
```

### Suricata tidak mendeteksi traffic
```bash
# Pastikan interface benar
sudo suricata --list-runmodes
ip link show
# Update rules
sudo suricata-update
sudo systemctl restart suricata
```

## Uninstall

```bash
sudo systemctl stop nmslex-dashboard nmslex-manager nmslex-indexer
sudo systemctl disable nmslex-dashboard nmslex-manager nmslex-indexer
sudo rm /etc/systemd/system/nmslex-*.service
sudo rm -rf /opt/nmslex
sudo rm -rf /etc/nmslex
sudo rm -rf /var/log/nmslex
sudo systemctl daemon-reload
```
