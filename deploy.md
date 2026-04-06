# 🐼 NMSLEX — Panduan Deployment v2.1

Tutorial lengkap cara deploy NMSLEX di VM lokal.

---

## Prasyarat

| Komponen | Minimum | Rekomendasi |
|----------|---------|-------------|
| OS | Ubuntu 22.04 / Debian 12 / CentOS 9 | Ubuntu 22.04 LTS |
| RAM | 4 GB | 8–16 GB |
| CPU | 2 Core | 4 Core |
| Disk | 50 GB SSD | 100 GB SSD |
| Network | 1 interface aktif | 1 Gbps |

---

## Langkah 1: Clone Repository

```bash
git clone https://github.com/lutfialf/nmslex.git
cd nmslex
```

## Langkah 2: Jalankan Deploy Script

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

### Opsi Deploy

| Flag | Deskripsi |
|------|-----------|
| `--interface <iface>` | Network interface (default: `eth0`) |
| `--port <port>` | Dashboard port (default: `7356`) |
| `--rebuild` | Rebuild dashboard saja (data tetap aman) |
| `--reset` | Reset semua konfigurasi ke default |
| `--uninstall` | Hapus seluruh instalasi NMSLEX |
| `--help` | Tampilkan bantuan |

Contoh:
```bash
sudo ./deploy.sh --interface ens33 --port 8080
```

## Langkah 3: Apa yang Terjadi Saat Deploy

Script `deploy.sh` v2.1 akan otomatis:

1. ✅ Install system dependencies (curl, wget, jq, git, build-essential)
2. ✅ Install Node.js 18 + `serve` (static file server)
3. ✅ Install & konfigurasi Suricata IDS
4. ✅ Install & konfigurasi Elasticsearch 8.x
5. ✅ Install & konfigurasi Kibana
6. ✅ Install & konfigurasi Filebeat
7. ✅ Build NMSLEX Dashboard (React → production bundle)
8. ✅ Generate konfigurasi & management scripts
9. ✅ Buat systemd services
10. ✅ Start semua service & generate admin credentials

## Langkah 4: Verifikasi

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

## Langkah 5: Akses Dashboard

```
http://<IP_VM>:7356
```

Login dengan credentials yang ditampilkan saat deploy selesai.

> 💡 Credentials juga tersimpan di `/etc/nmslex/admin.credentials` (root-only)

---

## Struktur Service

| Service | Port | Fungsi | Log |
|---------|------|--------|-----|
| `nmslex-dashboard` | 7356 | Web UI | `/var/log/nmslex/dashboard.log` |
| `nmslex-manager` | — | Orkestrasi & health check | `/var/log/nmslex/manager.log` |
| `nmslex-indexer` | — | Log rotation & indexing | `/var/log/nmslex/indexer.log` |
| `elasticsearch` | 9200 | Search engine | `journalctl -u elasticsearch` |
| `kibana` | 5601 | Visualisasi | `journalctl -u kibana` |
| `suricata` | — | IDS/IPS | `/var/log/suricata/` |
| `filebeat` | — | Log collection | `journalctl -u filebeat` |

---

## Management

### Rebuild (setelah perubahan kode)

```bash
sudo ./deploy.sh --rebuild
```

Ini akan:
- Stop dashboard
- Sync source code terbaru
- Install dependencies & rebuild
- Restart dashboard

> Data, konfigurasi, dan service lain **tidak terpengaruh**.

### Reset Konfigurasi

```bash
sudo ./deploy.sh --reset
```

Reset Suricata, Filebeat, dan dashboard config ke default tanpa menghapus instalasi.

### Uninstall

```bash
sudo ./deploy.sh --uninstall
```

Menghapus semua komponen NMSLEX. Ketik `UNINSTALL` untuk konfirmasi.

---

## Environment & Security

NMSLEX **tidak** menggunakan cloud API key. Semua konfigurasi bersifat lokal:

| File | Fungsi | Permission |
|------|--------|-----------|
| `/etc/nmslex/dashboard.conf` | Konfigurasi port, path, ES host | 644 |
| `/etc/nmslex/admin.credentials` | Email & password admin | 600 (root only) |
| `.env` | Environment variables (lokal) | Tidak di-commit |

### `.env.example`

Template environment disediakan di `.env.example`. Saat deploy, `.env` di-generate otomatis:

```bash
# .env.example
NMSLEX_PORT=7356
NMSLEX_ES_HOST=http://localhost:9200
NMSLEX_KIBANA_HOST=http://localhost:5601
NMSLEX_SURICATA_LOG=/var/log/suricata/eve.json
```

---

## Troubleshooting

### Elasticsearch tidak start
```bash
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo systemctl restart elasticsearch
```

### Dashboard tidak bisa diakses
```bash
# Firewall
sudo ufw allow 7356/tcp
# atau
sudo firewall-cmd --add-port=7356/tcp --permanent && sudo firewall-cmd --reload

# Cek service
sudo systemctl status nmslex-dashboard
sudo journalctl -u nmslex-dashboard -f
```

### Build gagal (`vite: not found`)
```bash
cd /opt/nmslex/dashboard
npm install          # install SEMUA dependencies termasuk devDependencies
npx vite build       # build langsung dengan npx
sudo systemctl restart nmslex-dashboard
```

### Suricata tidak mendeteksi traffic
```bash
ip link show                    # Pastikan interface benar
sudo suricata-update            # Update rules
sudo systemctl restart suricata
```

---

## Uninstall Manual

```bash
sudo systemctl stop nmslex-dashboard nmslex-manager nmslex-indexer
sudo systemctl disable nmslex-dashboard nmslex-manager nmslex-indexer
sudo rm /etc/systemd/system/nmslex-*.service
sudo rm -rf /opt/nmslex /etc/nmslex /var/log/nmslex
sudo systemctl daemon-reload
```

---

<p align="center">
  © 2026 Muhammad Lutfi Alfian — NMSLEX v2.1
</p>
