# NMSLEX - Network Management System

<p align="center">
  <img src="public/logo.png" alt="NMSLEX Logo" width="200" />
</p>

<p align="center">
  <strong>Monitor. Manage. Secure.</strong>
</p>

---

## Apa itu NMSLEX?

**NMSLEX** adalah Network Management System (NMS) yang dirancang untuk memantau, mengelola, dan mengamankan jaringan komputer secara real-time. NMSLEX terintegrasi penuh dengan stack keamanan dan monitoring terkemuka:

- **[Suricata](https://github.com/oisf/suricata)** — IDS/IPS (Intrusion Detection/Prevention System) untuk deteksi ancaman jaringan
- **[Elasticsearch](https://github.com/elastic/elasticsearch)** — Search engine untuk menyimpan dan menganalisis log
- **[Kibana](https://github.com/elastic/kibana)** — Visualisasi data dan dashboard analytics
- **[Filebeat](https://github.com/elastic/beats)** — Log shipper untuk mengumpulkan dan mengirim log dari setiap agent

---

## 💻 Resource Requirements

### NMSLEX Server (Master Node)

Server utama yang menjalankan Dashboard, Suricata, Elasticsearch, Kibana, Filebeat, dan semua NMSLEX services.

| Jumlah Agent | vCPU | RAM | Disk | Network |
|:---:|:---:|:---:|:---:|:---:|
| 1 – 5 agent | 2 vCPU | 4 GB | 50 GB SSD | 1 Gbps |
| 6 – 10 agent | 4 vCPU | 8 GB | 100 GB SSD | 1 Gbps |
| 11 – 20 agent | 4 vCPU | 16 GB | 200 GB SSD | 1 Gbps |
| 21 – 30 agent | 8 vCPU | 32 GB | 500 GB SSD | 1–10 Gbps |
| 31 – 50 agent | 8 vCPU | 32 GB | 500 GB SSD | 10 Gbps |
| 50+ agent | 16 vCPU | 64 GB | 1 TB SSD | 10 Gbps |

> **⚠️ Catatan:**
> - Disk usage sangat bergantung pada jumlah log yang dihasilkan. Suricata + Elasticsearch bisa menghasilkan **1–5 GB log/hari per agent** tergantung traffic.
> - Gunakan SSD untuk performa Elasticsearch yang optimal.
> - Untuk 50+ agent, pertimbangkan multi-node Elasticsearch cluster.

### Breakdown Pemakaian Resource di Server

| Komponen | vCPU | RAM | Disk |
|----------|:----:|:---:|:----:|
| Suricata IDS/IPS | 1–2 | 1–2 GB | 5–20 GB (log) |
| Elasticsearch | 1–4 | 2–16 GB | 20–500 GB (indices) |
| Kibana | 0.5–1 | 512 MB–1 GB | 1 GB |
| Filebeat | 0.25 | 256 MB | 500 MB |
| NMSLEX Dashboard | 0.25 | 256 MB | 500 MB |
| NMSLEX Manager | 0.25 | 128 MB | 100 MB |
| NMSLEX Indexer | 0.25 | 256 MB | 100 MB |
| **OS Overhead** | 0.5 | 512 MB | 5 GB |

### NMSLEX Agent (Per VM/Host yang Dimonitor)

Agent sangat ringan — hanya menjalankan Filebeat dan heartbeat script.

| Komponen | Minimum | Rekomendasi |
|----------|:-------:|:-----------:|
| vCPU | 1 vCPU | 1 vCPU |
| RAM | 512 MB | 1 GB |
| Disk | 5 GB | 10 GB |
| Network | 100 Mbps | 1 Gbps |

> Agent tidak menjalankan Suricata atau Elasticsearch, jadi resource-nya sangat kecil. Agent hanya mengirim log ke server NMSLEX.

### Rekomendasi Spesifikasi VM (Lokal)

Berikut contoh spesifikasi VM yang direkomendasikan untuk deployment lokal:

#### 🟢 Setup Kecil (Lab/Testing, 1–5 Agent)
```
NMSLEX Server:  2 vCPU | 4 GB RAM  | 50 GB SSD
Per Agent:      1 vCPU | 512 MB RAM | 5 GB disk
─────────────────────────────────────────────────
Total minimum:  7 vCPU | 6.5 GB RAM | 75 GB disk
(1 server + 5 agent)
```

#### 🟡 Setup Menengah (Small Office, 10–20 Agent)
```
NMSLEX Server:  4 vCPU | 16 GB RAM | 200 GB SSD
Per Agent:      1 vCPU | 1 GB RAM  | 10 GB disk
─────────────────────────────────────────────────
Total minimum:  24 vCPU | 36 GB RAM | 400 GB disk
(1 server + 20 agent)
```

#### 🔴 Setup Besar (Enterprise, 21–50 Agent)
```
NMSLEX Server:  8 vCPU  | 32 GB RAM | 500 GB SSD
Per Agent:      1 vCPU  | 1 GB RAM  | 10 GB disk
─────────────────────────────────────────────────
Total minimum:  58 vCPU | 82 GB RAM | 1 TB disk
(1 server + 50 agent)
```

### Tips Optimasi Resource

1. **Kurangi retention log** — Default Elasticsearch menyimpan log 30 hari. Kurangi jika disk terbatas:
   ```bash
   curl -X PUT "localhost:9200/nmslex-suricata-*/_settings" \
     -H "Content-Type: application/json" \
     -d '{"index.lifecycle.rollover_alias":"nmslex-suricata"}'
   ```

2. **Disable rules Suricata yang tidak perlu** — Kurangi CPU usage:
   ```bash
   sudo suricata-update list-sources
   sudo suricata-update disable-source <source-name>
   ```

3. **Naikkan metrics interval agent** — Default 10 detik, ubah ke 30–60 detik untuk hemat bandwidth:
   ```yaml
   # /etc/nmslex-agent/agent.yml
   metrics:
     interval: 60s
   ```

4. **Gunakan compression** — Aktifkan gzip di Filebeat:
   ```yaml
   output.elasticsearch:
     compression_level: 3
   ```

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🛡️ **Deteksi Ancaman** | Real-time threat detection menggunakan Suricata rules |
| 📊 **Dashboard Monitoring** | Dashboard interaktif untuk memantau seluruh jaringan |
| 📋 **Log Explorer** | Pencarian dan analisis log terpusat via Elasticsearch |
| 🖥️ **Agent Management** | Kelola semua VM/host yang dimonitor + detail metrics |
| 🌐 **Network Analysis** | Analisis traffic, protocol distribution, top talkers |
| 🔐 **Authentication** | Login dengan auto-generated credentials saat deploy |
| 📱 **Telegram Bot** | Notifikasi realtime via Telegram untuk alerts critical |
| 👥 **User Management** | Kelola akun admin, operator, dan viewer |
| 📄 **PDF Reporting** | Export laporan profesional dalam format PDF |
| ⚙️ **Konfigurasi Terpusat** | Pengaturan Suricata, Elasticsearch, dan dashboard dari satu tempat |

## Arsitektur

```
┌─────────────────────────────────────────────────────┐
│                   NMSLEX Dashboard                  │
│                  (Port: 7356)                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Suricata │  │ Elasticsearch│  │   Kibana     │  │
│  │ IDS/IPS  │  │  (Port:9200) │  │ (Port:5601)  │  │
│  └────┬─────┘  └──────┬───────┘  └──────┬───────┘  │
│       │               │                 │           │
│       └───────────────┼─────────────────┘           │
│                       │                             │
├───────────────────────┼─────────────────────────────┤
│                   Filebeat                          │
│              (Log Collection)                       │
├───────────────────────┼─────────────────────────────┤
│                       │                             │
│  ┌─────────┐  ┌──────┴──┐  ┌─────────┐             │
│  │ Agent 1 │  │ Agent 2 │  │ Agent N │  ...         │
│  │ (VM/Host)│  │(VM/Host)│  │(VM/Host)│             │
│  └─────────┘  └─────────┘  └─────────┘             │
└─────────────────────────────────────────────────────┘
```

## Systemd Services

| Service | Deskripsi |
|---------|-----------|
| `nmslex-dashboard` | Dashboard web UI (port 7356) |
| `nmslex-manager` | Service manager untuk orkestrasi |
| `nmslex-indexer` | Log indexer ke Elasticsearch |

```bash
sudo systemctl status nmslex-dashboard
sudo systemctl status nmslex-manager
sudo systemctl status nmslex-indexer
```

## Quick Start

```bash
git clone https://github.com/yourusername/nmslex.git
cd nmslex
chmod +x deploy.sh
sudo ./deploy.sh
```

Saat deploy selesai, script akan menampilkan **credentials default**:
```
╔══════════════════════════════════════════╗
║     DEFAULT ADMIN CREDENTIALS            ║
╠══════════════════════════════════════════╣
║  Email:    adminlex@nmslex.com           ║
║  Password: <auto-generated>             ║
╠══════════════════════════════════════════╣
║  ⚠️  SIMPAN PASSWORD INI!                ║
╚══════════════════════════════════════════╝
```

Dashboard akan tersedia di: `http://<IP_SERVER>:7356`

## Reset Password

1. Buka halaman login: `http://<IP>:7356/login`
2. Klik **"Lupa password?"**
3. Masukkan email: `adminlex@nmslex.com`
4. Cek inbox untuk link reset
5. Atau lihat file credentials: `sudo cat /etc/nmslex/admin.credentials`

## Dokumentasi

- 📖 [Cara Deploy](deploy.md) — Tutorial lengkap deployment di VM lokal
- 🖥️ [Cara Install Agent](agent.md) — Panduan integrasi VM ke NMSLEX

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Recharts
- **IDS/IPS**: Suricata 7.x
- **Search Engine**: Elasticsearch 8.x
- **Visualization**: Kibana 8.x
- **Log Shipping**: Filebeat 8.x
- **Runtime**: Node.js 18+

## Lisensi

MIT License — Silakan digunakan dan dimodifikasi sesuai kebutuhan.

---

<p align="center">
  <strong>NMSLEX</strong> — Protecting your network, one packet at a time. 🐼
</p>

<p align="center">
  © 2026 by Muhammad Lutfi Alfian. All rights reserved.
</p>
