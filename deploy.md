# 🐼 NMSLEX — Panduan Deployment v2.3

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

Script `deploy.sh` v2.3 akan otomatis:

1. ✅ Install system dependencies (curl, wget, jq, git, build-essential)
2. ✅ Install Node.js 18 + `serve` (static file server)
3. ✅ Install & konfigurasi Suricata IDS
4. ✅ **Validasi kompatibilitas versi** Elasticsearch & Kibana
5. ✅ Install & konfigurasi Elasticsearch 8.x (dengan sanitasi single-node config)
6. ✅ Install & konfigurasi Kibana (dengan **auto-fix environment Node.js**)
7. ✅ Install & konfigurasi Filebeat
8. ✅ Build NMSLEX Dashboard (React → production bundle)
9. ✅ Generate konfigurasi & management scripts
10. ✅ Buat systemd services
11. ✅ Start semua service & generate admin credentials (hashed SHA-256)

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

## Version Compatibility Check

Deploy script **otomatis memeriksa** kompatibilitas versi antara Elasticsearch dan Kibana:

### Kapan Pengecekan Dilakukan

| Tahap | Yang Dicek |
|-------|-----------|
| Sebelum install | Versi terinstall (`dpkg-query` / `rpm`) |
| Sebelum install | Versi kandidat dari repo (`apt-cache` / `repoquery`) |
| Setelah install ES | ES baru vs Kibana yang sudah ada |
| Setelah install Kibana | Kedua versi final |

### Aturan Validasi

- **Major.minor** harus sama (misal `8.13.x` ↔ `8.13.x`)
- Jika berbeda, deploy **berhenti** dengan pesan error
- Contoh output mismatch:

```
  ✘ Elastic Stack version mismatch detected
    Elasticsearch: 8.13.4
    Kibana:        8.12.1
    Gunakan major.minor yang sama, misalnya 8.13.x dengan 8.13.x
```

### Fix Versi Mismatch

```bash
# Cek versi saat ini
dpkg -l elasticsearch | tail -1
dpkg -l kibana | tail -1

# Upgrade/downgrade Kibana agar match
sudo apt-get install kibana=<VERSI_ES>
sudo systemctl restart kibana
```

---

## Kibana Auto-Fix (Node.js Conflict)

Kibana membawa bundled Node.js sendiri. Jika **system Node.js** (yang diinstall untuk dashboard) mengeset `NODE_OPTIONS` atau `NODE_PATH`, Kibana bisa crash dengan error:

```
Main process exited, code=exited, status=1/FAILURE
Failed with result 'exit-code'
Start request repeated too quickly
```

### Apa yang Deploy Script Lakukan

Deploy script v2.3 otomatis membuat **systemd override**:

```ini
# /etc/systemd/system/kibana.service.d/nmslex.conf
[Service]
Environment="NODE_OPTIONS="
Environment="NODE_PATH="
UnsetEnvironment=NODE_OPTIONS
UnsetEnvironment=NODE_PATH
```

Dan membersihkan `/etc/default/kibana` dari variabel yang bentrok.

### Fix Manual (jika belum update deploy.sh)

```bash
sudo mkdir -p /etc/systemd/system/kibana.service.d
cat << 'EOF' | sudo tee /etc/systemd/system/kibana.service.d/nmslex.conf
[Service]
Environment="NODE_OPTIONS="
Environment="NODE_PATH="
UnsetEnvironment=NODE_OPTIONS
UnsetEnvironment=NODE_PATH
EOF
sudo sed -i '/^NODE_OPTIONS=/d;/^NODE_PATH=/d' /etc/default/kibana
sudo systemctl daemon-reload
sudo systemctl restart kibana
```

### Kapan Diterapkan

- ✅ Saat **fresh install** (`sudo ./deploy.sh`)
- ✅ Saat **auto-restart** Kibana via `--status`
- ❌ Tidak diterapkan saat `--rebuild` (Kibana tidak diubah)

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
7. **Auto-fix ES** — otomatis fix `vm.max_map_count` dan konflik `single-node` config
8. **Auto-fix Kibana** — sanitasi `NODE_OPTIONS`/`NODE_PATH` sebelum restart

### Login Page Health Indicator

Halaman login NMSLEX juga menampilkan **status backend services**:
- Indikator kecil di bawah form login (hijau = semua OK, merah = ada masalah)
- Klik untuk expand dan lihat detail setiap service
- Jika ada service mati, tampil pesan: *"Jalankan `sudo ./deploy.sh --status`"*

---

## Update Kode

### Cara Update (Setelah Ada Perubahan di GitHub)

```bash
cd /home/<user>/nmslex
git pull origin main
sudo ./deploy.sh --rebuild
```

> ⚠️ **Tidak perlu** hapus folder atau clone ulang. Cukup `git pull` + `--rebuild`. Data, konfigurasi, dan credential tetap aman.

### Rebuild Dashboard

```bash
sudo ./deploy.sh --rebuild
```

Ini akan:
- Stop dashboard
- Sync source code terbaru
- Install dependencies & rebuild
- Restart dashboard

> Data, konfigurasi, dan service lain **tidak terpengaruh**.

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

## Environment & Security

NMSLEX **tidak** menggunakan cloud API key untuk deployment lokal. Semua konfigurasi bersifat lokal:

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

### Keamanan Repository

Repository ini **aman untuk di-clone** oleh siapa saja:

- ❌ Tidak ada API key atau secret di source code
- ❌ Tidak ada password di repository
- ✅ Folder `supabase/functions/` berisi kode edge function untuk fitur hosted/cloud — **tidak diperlukan** untuk deployment self-hosted
- ✅ Folder `docs-site/` hanya berisi halaman statis publik

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

### Kibana crash / "Start request repeated too quickly"

Ini biasanya disebabkan **konflik Node.js environment**. Fix:

```bash
# Gunakan deploy.sh
sudo ./deploy.sh --status
# Pilih 'y' untuk auto-restart — Kibana auto-fix diterapkan

# Atau manual
sudo mkdir -p /etc/systemd/system/kibana.service.d
cat << 'EOF' | sudo tee /etc/systemd/system/kibana.service.d/nmslex.conf
[Service]
Environment="NODE_OPTIONS="
Environment="NODE_PATH="
UnsetEnvironment=NODE_OPTIONS
UnsetEnvironment=NODE_PATH
EOF
sudo systemctl daemon-reload
sudo systemctl restart kibana
```

### Versi Elasticsearch & Kibana mismatch

```bash
# Cek versi
dpkg -l elasticsearch | tail -1
dpkg -l kibana | tail -1

# Install ulang Kibana sesuai versi ES
sudo apt-get install kibana=<VERSI_ES_ANDA>
sudo systemctl restart kibana
```

### Dashboard blank setelah login
```bash
# Cek apakah Elasticsearch berjalan
sudo ./deploy.sh --status
# Biasanya disebabkan ES tidak start
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
  © 2026 Muhammad Lutfi Alfian — NMSLEX v2.3
</p>
