# 🐼 NMSLEX — Panduan Deployment v2.2

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
git clone https://github.com/LutfyAlfean/nmslex.git
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
| `--status` | Cek status semua service + auto-restart |
| `--rebuild` | Rebuild dashboard saja (data tetap aman) |
| `--reset` | Reset semua konfigurasi ke default |
| `--uninstall` | Hapus seluruh instalasi NMSLEX |
| `--help` | Tampilkan bantuan |

Contoh:
```bash
sudo ./deploy.sh --interface ens33 --port 8080
```

## Langkah 3: Apa yang Terjadi Saat Deploy

Script `deploy.sh` v2.2 akan otomatis:

1. ✅ Install system dependencies (curl, wget, jq, git, build-essential)
2. ✅ Install Node.js 18 + `serve` (static file server)
3. ✅ Install & konfigurasi Suricata IDS
4. ✅ Install & konfigurasi Elasticsearch 8.x (dengan sanitasi single-node config)
5. ✅ Install & konfigurasi Kibana
6. ✅ Install & konfigurasi Filebeat
7. ✅ Build NMSLEX Dashboard (React → production bundle)
8. ✅ Generate konfigurasi & management scripts
9. ✅ Buat systemd services
10. ✅ Start semua service & generate admin credentials (hashed SHA-256)

## Langkah 4: Verifikasi

```bash
# Cara tercepat — cek semua service sekaligus
sudo ./deploy.sh --status

# Atau manual per-service
sudo systemctl status nmslex-dashboard
sudo systemctl status elasticsearch
sudo systemctl status kibana
sudo systemctl status suricata
sudo systemctl status filebeat
```

## Langkah 5: Akses Dashboard

```
http://<IP_VM>:7356
```

Login dengan credentials yang ditampilkan saat deploy selesai.

> 💡 Credentials disimpan sebagai hash di `/etc/nmslex/admin.credentials` (root-only). Password hanya ditampilkan **sekali** saat deploy.

---

## Health Check & Auto-Restart

### `--status` Command

```bash
sudo ./deploy.sh --status
```

Perintah ini akan:

1. **Cek semua service** — elasticsearch, kibana, suricata, filebeat, nmslex-dashboard, nmslex-manager
2. **Tampilkan detail** — uptime, memory usage, status
3. **Tampilkan log error** — jika service mati, 15 baris log terakhir ditampilkan dengan error di-highlight merah
4. **Cek port** — 9200 (ES), 5601 (Kibana), 7356 (Dashboard)
5. **ES cluster health** — green/yellow/red + jumlah nodes
6. **Auto-restart** — jika ada service mati, ditawarkan opsi restart otomatis
7. **Auto-fix** — untuk Elasticsearch, otomatis fix `vm.max_map_count` dan konflik `single-node` config

### Login Page Health Indicator

Halaman login NMSLEX juga menampilkan **status backend services**:
- Indikator kecil di bawah form login (hijau = semua OK, merah = ada masalah)
- Klik untuk expand dan lihat detail setiap service
- Jika ada service mati, tampil pesan: *"Jalankan `sudo ./deploy.sh --status`"*

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
| `/etc/nmslex/admin.credentials` | Email & password hash (SHA-256) | 600 (root only) |
| `.env` | Environment variables (lokal) | Tidak di-commit |

### Credential Security

- Password admin di-**hash** menggunakan SHA-256 sebelum disimpan
- Password plaintext hanya ditampilkan **sekali** saat deploy
- File credentials hanya bisa dibaca oleh root (`chmod 600`)

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

### Quick Check — Gunakan `--status`

```bash
sudo ./deploy.sh --status
```

Ini cara tercepat untuk mendiagnosis masalah. Jika ada service mati, pilih `y` untuk auto-restart.

### Elasticsearch tidak start
```bash
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo systemctl restart elasticsearch
```

> **Tip:** `--status` dengan auto-restart otomatis fix masalah ini.

### Dashboard blank setelah login
```bash
# Cek apakah Elasticsearch berjalan
sudo ./deploy.sh --status

# Biasanya disebabkan ES tidak start
# --status akan auto-fix dan restart
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
  © 2026 Muhammad Lutfi Alfian — NMSLEX v2.2
</p>
