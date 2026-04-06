# 🐼 NMSLEX — Network Management System

<p align="center">
  <img src="public/logo.png" alt="NMSLEX Logo" width="180" />
</p>

<p align="center">
  <strong>Protecting your network, one packet at a time.</strong><br/>
  <em>Open-source NMS dengan Suricata IDS, Elasticsearch, dan Dashboard interaktif</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.3.0-cyan?style=flat-square" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
  <img src="https://img.shields.io/badge/node-18%2B-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/platform-Linux-orange?style=flat-square" />
</p>

---

## 📖 Tentang NMSLEX

**NMSLEX** adalah Network Management System yang dirancang untuk memantau, mengelola, dan mengamankan jaringan komputer secara real-time. Dibangun dengan stack keamanan terkemuka:

| Komponen | Fungsi |
|----------|--------|
| [Suricata](https://suricata.io) | IDS/IPS — Deteksi & pencegahan intrusi |
| [Elasticsearch](https://elastic.co) | Search engine — Penyimpanan & analisis log |
| [Kibana](https://elastic.co/kibana) | Visualisasi data & analytics |
| [Filebeat](https://elastic.co/beats/filebeat) | Log shipper — Pengumpulan log dari agent |

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🛡️ **Deteksi Ancaman** | Real-time threat detection dengan Suricata rules |
| 📊 **Dashboard Monitoring** | Dashboard interaktif untuk seluruh jaringan |
| 📋 **Log Explorer** | Pencarian & analisis log terpusat |
| 🖥️ **Agent Management** | Kelola semua VM/host + detail metrics |
| 🌐 **Network Topology** | Visualisasi topologi jaringan (drag & drop) |
| 🔐 **Authentication** | Login dengan auto-generated credentials (hashed) |
| 📱 **Telegram Bot** | Notifikasi realtime via Telegram |
| 👥 **User Management** | Kelola akun admin, operator, dan viewer |
| 📄 **PDF Reporting** | Export laporan profesional |
| 🔔 **Alert Notifications** | Sound alert & badge counter realtime |
| ⚙️ **Konfigurasi Terpusat** | Pengaturan semua komponen dari satu tempat |
| 🏥 **Health Check** | Cek status semua service dari CLI & dashboard |
| 🔄 **Auto-Restart** | Otomatis restart service yang mati via `--status` |
| 🔀 **Version Compatibility** | Validasi otomatis versi Elasticsearch & Kibana |
| 🔧 **Kibana Auto-Fix** | Sanitasi environment Node.js untuk Kibana |

---

## 🏗️ Arsitektur

```
┌──────────────────────────────────────────────────────────┐
│                    NMSLEX Dashboard                      │
│                   (Port: 7356)                           │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────┐      │
│  │ Suricata │  │ Elasticsearch │  │   Kibana     │      │
│  │ IDS/IPS  │  │  (Port:9200)  │  │ (Port:5601)  │      │
│  └────┬─────┘  └───────┬───────┘  └──────┬───────┘      │
│       └────────────────┼──────────────────┘              │
│                        │                                 │
│  ┌─────────────────────┴──────────────────────────────┐  │
│  │               Filebeat (Log Collection)            │  │
│  └─────────────────────┬──────────────────────────────┘  │
│                        │                                 │
│  ┌─────────┐  ┌────────┴┐  ┌─────────┐  ┌─────────┐    │
│  │ Agent 1 │  │ Agent 2 │  │ Agent 3 │  │ Agent N │    │
│  │(VM/Host)│  │(VM/Host)│  │(VM/Host)│  │(VM/Host)│    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

## 💻 System Requirements

### Server (Master Node)

| Jumlah Agent | vCPU | RAM | Disk | Network |
|:---:|:---:|:---:|:---:|:---:|
| 1–5 agent | 2 | 4 GB | 50 GB SSD | 1 Gbps |
| 6–10 agent | 4 | 8 GB | 100 GB SSD | 1 Gbps |
| 11–20 agent | 4 | 16 GB | 200 GB SSD | 1 Gbps |
| 21–50 agent | 8 | 32 GB | 500 GB SSD | 10 Gbps |
| 50+ agent | 16 | 64 GB | 1 TB SSD | 10 Gbps |

### Agent (Per VM/Host)

| Komponen | Minimum | Rekomendasi |
|----------|:-------:|:-----------:|
| vCPU | 1 | 1 |
| RAM | 512 MB | 1 GB |
| Disk | 5 GB | 10 GB |

> Agent sangat ringan — hanya menjalankan Filebeat dan heartbeat script.

---

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/LutfyAlfean/nmslex.git
cd nmslex

# 2. Jalankan installer
chmod +x deploy.sh
sudo ./deploy.sh

# 3. Akses dashboard
# http://<IP_SERVER>:7356
```

Saat deploy selesai, script akan menampilkan **credentials default** yang perlu disimpan.

---

## 🔧 Management

```bash
# Cek status semua service (dengan auto-restart jika ada yang mati)
sudo ./deploy.sh --status

# Rebuild setelah perubahan kode
sudo ./deploy.sh --rebuild

# Reset konfigurasi ke default
sudo ./deploy.sh --reset

# Uninstall lengkap
sudo ./deploy.sh --uninstall

# Custom interface & port
sudo ./deploy.sh --interface ens33 --port 8080
```

### Health Check (`--status`)

Perintah `--status` akan:
- ✅ Cek status semua systemd service (elasticsearch, kibana, suricata, filebeat, nmslex-*)
- ✅ Tampilkan memory usage dan uptime setiap service
- ✅ Tampilkan **log error** jika ada service yang mati
- ✅ Cek port listening (9200, 5601, 7356)
- ✅ Cek Elasticsearch cluster health
- ✅ **Auto-restart** service yang mati (dengan konfirmasi)
- ✅ Fix otomatis masalah umum ES (vm.max_map_count, single-node config)
- ✅ **Kibana auto-fix** — sanitasi `NODE_OPTIONS`/`NODE_PATH` yang bentrok dengan bundled Node.js

### Update Kode (Setelah `git pull`)

```bash
cd /home/<user>/nmslex
git pull origin main
sudo ./deploy.sh --rebuild
```

> ⚠️ **Tidak perlu** `--uninstall` atau clone ulang. Cukup `git pull` + `--rebuild`.

---

## 🔀 Version Compatibility Check

Deploy script v2.3 secara otomatis memeriksa kompatibilitas versi antara **Elasticsearch** dan **Kibana** sebelum install:

- ✅ Cek versi yang sudah terinstall (via `dpkg-query` / `rpm`)
- ✅ Cek versi kandidat dari repository (via `apt-cache` / `repoquery`)
- ✅ Bandingkan **major.minor** — jika mismatch, deploy **berhenti** dengan pesan jelas
- ✅ Cek ulang setelah install untuk memastikan konsistensi

Contoh output jika mismatch:
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

# Install Kibana versi yang sama dengan ES
sudo apt-get install kibana=8.13.4
sudo systemctl restart kibana
```

---

## 🔧 Kibana Auto-Fix

Jika Kibana gagal start karena **konflik Node.js environment**, deploy script otomatis:

1. **Membuat systemd override** di `/etc/systemd/system/kibana.service.d/nmslex.conf`
2. **Menghapus** `NODE_OPTIONS` dan `NODE_PATH` dari `/etc/default/kibana`
3. **Reload** systemd daemon

Ini mengatasi masalah ketika Node.js 18 (untuk dashboard) me-inject environment variables yang tidak kompatibel dengan bundled Node.js Kibana.

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

---

## 🔒 Environment & Security

NMSLEX menggunakan konfigurasi lokal — **tidak ada** API key atau secret yang di-hardcode.

- File `.env.example` disediakan sebagai template
- Saat deploy, `.env` di-generate otomatis oleh `deploy.sh`
- Credentials admin di-**hash** (SHA-256) dan disimpan di `/etc/nmslex/admin.credentials` (root-only)
- Password hanya ditampilkan **sekali** saat deploy — simpan segera
- **Jangan commit file `.env` ke repository**

### Login Page Health Indicator

Halaman login menampilkan **status backend services** secara real-time:
- Indikator hijau/merah di bawah form login
- Bisa di-expand untuk melihat detail setiap service
- Membantu debug jika dashboard blank setelah login

### Keamanan Repository

Repository ini **aman untuk di-clone** oleh siapa saja:

| Item | Status |
|------|--------|
| API keys / secrets | ❌ Tidak ada yang di-hardcode |
| `.env` file | ❌ Tidak disertakan (hanya `.env.example`) |
| Admin password | ❌ Di-generate saat deploy, bukan di repo |
| Edge functions | ✅ Kode saja, secret disimpan terpisah |
| `docs-site/` | ✅ Halaman statis publik, tidak ada data sensitif |

> Folder `supabase/functions/` berisi kode edge function untuk fitur health-check dan manajemen user pada versi cloud/hosted. Untuk deployment self-hosted di VM, fitur ini **tidak diperlukan** — semua berjalan lokal.

---

## 📚 Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| 📖 [Panduan Deployment](deploy.md) | Tutorial lengkap deployment di VM |
| 🖥️ [Panduan Agent](agent.md) | Cara install agent di VM target |
| 🌐 [Dokumentasi Online](https://nmslex.vercel.app) | Website dokumentasi lengkap |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Recharts |
| IDS/IPS | Suricata 7.x |
| Search Engine | Elasticsearch 8.x |
| Visualization | Kibana 8.x |
| Log Shipping | Filebeat 8.x |
| Runtime | Node.js 18+ |
| Static Server | serve |

---

## 📝 Lisensi

MIT License — Silakan digunakan dan dimodifikasi sesuai kebutuhan.

---

<p align="center">
  <strong>🐼 NMSLEX</strong> — Protecting your network, one packet at a time.
</p>

<p align="center">
  © 2026 Muhammad Lutfi Alfian. All rights reserved.
</p>
