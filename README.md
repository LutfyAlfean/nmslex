# 🐼 NMSLEX — Network Management System

<p align="center">
  <img src="public/logo-panda.png" alt="NMSLEX Logo" width="180" />
</p>

<p align="center">
  <strong>Protecting your network, one packet at a time.</strong><br/>
  <em>Open-source NMS dengan Suricata IDS, Elasticsearch, dan Dashboard interaktif</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.1.0-cyan?style=flat-square" />
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
| 🔐 **Authentication** | Login dengan auto-generated credentials |
| 📱 **Telegram Bot** | Notifikasi realtime via Telegram |
| 👥 **User Management** | Kelola akun admin, operator, dan viewer |
| 📄 **PDF Reporting** | Export laporan profesional |
| 🔔 **Alert Notifications** | Sound alert & badge counter realtime |
| ⚙️ **Konfigurasi Terpusat** | Pengaturan semua komponen dari satu tempat |

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
git clone https://github.com/lutfialf/nmslex.git
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
# Status
sudo systemctl status nmslex-dashboard

# Rebuild setelah perubahan kode
sudo ./deploy.sh --rebuild

# Reset konfigurasi ke default
sudo ./deploy.sh --reset

# Uninstall lengkap
sudo ./deploy.sh --uninstall

# Custom interface & port
sudo ./deploy.sh --interface ens33 --port 8080
```

---

## 🔒 Environment & Security

NMSLEX menggunakan konfigurasi lokal — **tidak ada** API key atau secret yang di-hardcode.

- File `.env.example` disediakan sebagai template
- Saat deploy, `.env` di-generate otomatis oleh `deploy.sh`
- Credentials admin di-generate random dan disimpan di `/etc/nmslex/admin.credentials` (root-only)
- **Jangan commit file `.env` ke repository**

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
