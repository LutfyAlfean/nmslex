# 🐼 NMSLEX — Panduan Deployment v2.4

Tutorial lengkap cara deploy NMSLEX di VM lokal, step by step dari nol hingga berhasil.

---

## Prasyarat

| Komponen | Minimum | Rekomendasi |
|----------|---------|-------------|
| OS | Ubuntu 22.04 / Debian 12 / CentOS 9 | Ubuntu 22.04 LTS |
| RAM | 4 GB | 8–16 GB |
| CPU | 2 Core | 4 Core |
| Disk | 50 GB SSD | 100 GB SSD |
| Network | 1 interface aktif | 1 Gbps |
| Internet | Wajib saat deploy | Untuk download packages |

> ⚠️ **Pastikan VM terhubung ke internet** saat deploy pertama kali. Script perlu mendownload Elasticsearch, Kibana, Suricata, Node.js, dan dependencies lainnya.

---

## 🚀 Panduan Deploy Pertama Kali (Step by Step)

Ikuti langkah-langkah berikut **secara berurutan**. Jangan skip langkah apapun.

### Langkah 1: Persiapan Sistem

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Pastikan git tersedia
sudo apt install -y git curl wget
```

### Langkah 2: Clone Repository

```bash
git clone https://github.com/LutfyAlfean/nmslex.git
cd nmslex
```

### Langkah 3: Konfigurasi Environment (`.env`)

File `.env` berisi konfigurasi lokal NMSLEX. Buat dari template yang disediakan:

```bash
# Copy template
cp .env.example .env

# Edit sesuai kebutuhan (opsional — default sudah siap pakai)
nano .env
```

**Isi `.env.example`:**

```bash
# Dashboard
NMSLEX_PORT=7356                              # Port web dashboard

# Elasticsearch
NMSLEX_ES_HOST=http://localhost:9200           # Alamat Elasticsearch

# Kibana
NMSLEX_KIBANA_HOST=http://localhost:5601       # Alamat Kibana

# Suricata
NMSLEX_SURICATA_LOG=/var/log/suricata/eve.json # Path log Suricata

# Telegram Bot (opsional — bisa dikonfigurasi nanti via dashboard)
# TELEGRAM_BOT_TOKEN=
# TELEGRAM_CHAT_ID=
```

**Kapan perlu edit `.env`:**

| Kondisi | Yang Diubah |
|---------|------------|
| Dashboard di port lain | `NMSLEX_PORT=8080` |
| ES di server terpisah | `NMSLEX_ES_HOST=http://192.168.1.50:9200` |
| Kibana di server terpisah | `NMSLEX_KIBANA_HOST=http://192.168.1.50:5601` |
| Log Suricata di path custom | `NMSLEX_SURICATA_LOG=/custom/path/eve.json` |
| Notifikasi Telegram | Isi `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID` |

> 💡 **Untuk deploy standar** (semua service di satu VM), **tidak perlu edit `.env`** — default sudah benar.

### Langkah 4: Cek Network Interface

Sebelum deploy, pastikan nama network interface Anda:

```bash
ip link show
```

Output contoh:
```
1: lo: <LOOPBACK,UP> ...
2: eth0: <BROADCAST,MULTICAST,UP> ...     ← Gunakan ini
3: ens33: <BROADCAST,MULTICAST,UP> ...    ← Atau ini (VMware)
```

> Default interface adalah `eth0`. Jika berbeda, gunakan flag `--interface`.

### Langkah 5: Jalankan Deploy Script

```bash
chmod +x deploy.sh

# Opsi A: Default (interface eth0, port 7356)
sudo ./deploy.sh

# Opsi B: Custom interface & port
sudo ./deploy.sh --interface ens33 --port 8080
```

**Opsi deploy lengkap:**

| Flag | Deskripsi |
|------|-----------|
| `--interface <iface>` | Network interface (default: `eth0`) |
| `--port <port>` | Dashboard port (default: `7356`) |
| `--status` | Cek status semua service + auto-restart |
| `--rebuild` | Rebuild dashboard saja (data tetap aman) |
| `--reset` | Reset semua konfigurasi ke default |
| `--uninstall` | Hapus seluruh instalasi NMSLEX |
| `--help` | Tampilkan bantuan |

### Langkah 6: Tunggu Proses Deploy

Script akan otomatis melakukan:

```
[1/9] System Dependencies    ✔ curl, wget, jq, git, build-essential
[2/9] Node.js Runtime        ✔ Node.js 18 + serve
[3/9] Suricata IDS           ✔ Install + konfigurasi rules
[4/9] Elasticsearch          ✔ Validasi versi + install + konfigurasi
[5/9] Kibana                 ✔ Validasi versi + install + auto-fix Node.js
[6/9] Filebeat               ✔ Install + konfigurasi log shipping
[7/9] Build Dashboard        ✔ npm install + vite build
[8/9] Systemd Services       ✔ Buat & enable semua service
[9/9] Start & Credentials    ✔ Start semua + generate admin password
```

> ⏱️ Proses deploy memakan waktu **10–30 menit** tergantung kecepatan internet dan spesifikasi VM.

### Langkah 7: Simpan Credentials

Setelah deploy selesai, **catat credentials yang ditampilkan**:

```
┌─────────────────────────────────────────┐
│  🔐 Admin Credentials                   │
│                                         │
│  Email:    adminlex@nmslex.com          │
│  Password: <RANDOM_PASSWORD>            │
│                                         │
│  ⚠ Password hanya ditampilkan SEKALI!   │
└─────────────────────────────────────────┘
```

> 🔒 Password di-hash SHA-256 dan disimpan di `/etc/nmslex/admin.credentials` (root-only). **Tidak bisa di-recover** — hanya ditampilkan saat deploy.

### Langkah 8: Verifikasi Semua Service

```bash
sudo ./deploy.sh --status
```

Output yang diharapkan:
```
🔍 NMSLEX Service Health Check
  ✔ elasticsearch running (XXX MB)
  ✔ kibana running (XXX MB)
  ✔ suricata running (XXX MB)
  ✔ filebeat running (XXX MB)
  ✔ nmslex-dashboard running (XXX MB)
  ✔ nmslex-manager running (XXX MB)

🌐 Port Status
  ✔ Elasticsearch port 9200 listening
  ✔ Kibana port 5601 listening
  ✔ Dashboard port 7356 listening
```

> Jika ada service yang gagal, pilih `y` saat ditawarkan auto-restart.

### Langkah 9: Akses Dashboard

Buka browser dan akses:

```
http://<IP_VM>:7356
```

Login dengan credentials dari Langkah 7.

### Langkah 10: (Opsional) Buka Firewall

Jika dashboard tidak bisa diakses dari luar VM:

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 7356/tcp
sudo ufw allow 9200/tcp   # Elasticsearch (opsional)
sudo ufw allow 5601/tcp   # Kibana (opsional)

# CentOS/Rocky (firewalld)
sudo firewall-cmd --add-port=7356/tcp --permanent
sudo firewall-cmd --reload
```

---

## ✅ Checklist Deploy Berhasil

Gunakan checklist ini untuk memastikan deploy sukses:

- [ ] `sudo ./deploy.sh --status` → semua service ✔ running
- [ ] Port 9200, 5601, 7356 listening
- [ ] `http://<IP>:7356` bisa diakses di browser
- [ ] Login berhasil dengan credentials
- [ ] Dashboard menampilkan data (stat cards, charts)
- [ ] Health indicator di login page menunjukkan hijau

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
