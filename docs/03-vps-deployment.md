# VPS Deployment Runbook — NovaCareEMR · Salam AI

**Status:** Draft v1, menunggu data VPS user.

> **Brand alignment:** Deployment ini harus konsisten dengan **Pilar AMAN — Kedaulatan Data**. Data klinis tidak pernah meninggalkan VPS tenant. Tidak ada cloud aggregator. Multi-tenant arsitektur per-VPS atau per-namespace.

---

## 1. Rekomendasi Provider VPS

> Per UU PDP No. 27/2022 dan Pilar AMAN, **datacenter Indonesia preferred**. Latency dari user (Semarang) juga lebih rendah.

### Tier 1 — Datacenter Indonesia (rekomendasi utama)

| Provider | Lokasi DC | Spec entry | Harga/bln | Catatan |
| --- | --- | --- | --- | --- |
| **Biznet Gio** | Jakarta, Surabaya | 2vCPU/2GB/40GB | ~Rp 175k | Enterprise-grade Indonesia, support bahasa ID |
| **Nevacloud** | Jakarta | 2vCPU/2GB/40GB | ~Rp 99k | Ringan, pricing transparan, Tier-3 DC |
| **Idcloudhost** | Jakarta | 2vCPU/2GB/40GB | ~Rp 110k | Mature, good support |
| **Indonesian Cloud** | Jakarta | 2vCPU/4GB/50GB | ~Rp 350k | Enterprise, ISO 27001 |

### Tier 2 — Internasional (kalau butuh hemat / DC luar)

| Provider | Lokasi DC terdekat | Spec entry | Harga/bln | Catatan |
| --- | --- | --- | --- | --- |
| **Hetzner** | Singapore (baru), Finlandia, Jerman | 2vCPU/4GB/40GB | ~$5 (~Rp 80k) | Terbaik value, Singapore DC ada untuk APAC |
| **DigitalOcean** | Singapore | 1vCPU/1GB/25GB | $6 | Mature, banyak tutorial |
| **Vultr** | Singapore, Tokyo | 1vCPU/1GB/25GB | $6 | Mirip DO |

**Rekomendasi saya:** **Biznet Gio** atau **Nevacloud** untuk produksi (compliance + latency), Hetzner/DO untuk dev/staging.

---

## 2. Spec Recommendation Berdasarkan Skala

| Tahap | Pasien aktif | RAM | vCPU | Disk | DB |
| --- | --- | --- | --- | --- | --- |
| **Seed (single-tenant, dr. Yanuar)** | < 5,000 | 2 GB | 2 | 40 GB SSD | Postgres self-hosted di VPS yang sama |
| **Grow (10–20 tenant)** | 50,000 | 8 GB | 4 | 160 GB | Postgres dedicated VPS |
| **Scale (100+ tenant)** | 500,000+ | 32 GB+ | 8+ | 1 TB+ | Postgres cluster + read replicas |

Phase awal cukup **2vCPU/2-4GB/40GB** untuk satu praktek.

---

## 3. Domain Recommendation (Brand-Aligned)

Brand: **Salam AI** + produk **NovaCareEMR**. Saran nama domain (cek availability dulu via Niagahoster/Cloudflare):

### Untuk produk komersial (jangka panjang)
- `salam.ai` — premium TLD .ai (~$70/tahun), paling on-brand. Cek availability.
- `salamai.com` / `salam-ai.com`
- `salamai.id` — TLD Indonesia (~Rp 250k/tahun), nasionalis
- `salamhealth.id`
- `novacare.id` — kalau mau emphasize produk
- `novacareemr.com`

### Untuk single-tenant tahap awal (dr. Yanuar Semarang)
- `dryanuar.id` / `praktek-dryanuar.id` — personal dokter
- `tht-yanuar.com`
- `klinik-yanuar.id`

### Subdomain strategy (multi-tenant ready)
- `app.salam.ai` — single shared instance
- `dryanuar.app.salam.ai` — tenant subdomain
- `app.dryanuar.id` — tenant punya domain sendiri

**Rekomendasi:** beli `salam.ai` sebagai brand domain (kalau available) + tetap bisa pakai subdomain `app.salam.ai` untuk tenant pertama. Atau kalau mau lebih konservatif, mulai dengan `salamai.id`.

---

## 4. Arsitektur Deployment (Phase Awal)

```
                    Internet
                       │
                       │ HTTPS (port 443)
                       ▼
              ┌────────────────────┐
              │  Caddy reverse-proxy │
              │  Auto Let's Encrypt │
              └─────────┬──────────┘
                        │ proxy_pass localhost:3000
                        ▼
              ┌────────────────────┐
              │  Next.js (PM2/sd)  │
              │  NovaCareEMR app   │
              │  (port 3000 local) │
              └─────────┬──────────┘
                        │ DATABASE_URL
                        ▼
              ┌────────────────────┐
              │  PostgreSQL 16     │
              │  pgcrypto enabled  │
              │  Daily backup      │
              └────────────────────┘
                        │
                        ▼
              ┌────────────────────┐
              │  rclone → Cloud    │
              │  Backup off-site   │
              │  (encrypted)       │
              └────────────────────┘
```

**Komponen yang akan diinstall:**
- Ubuntu 24.04 LTS (base OS)
- Node.js 22 LTS (via NodeSource repo)
- PostgreSQL 16 + `pgcrypto` extension
- Caddy 2 (reverse proxy + auto-HTTPS)
- systemd service untuk Next.js app
- UFW firewall (allow 22, 80, 443 only)
- fail2ban (SSH brute-force protection)
- automatic-updates (security patches)

**Yang BELUM dibutuhkan di Phase Awal (akan ditambah Phase 2+):**
- Redis / BullMQ (untuk SATUSEHAT sync queue)
- MinIO (untuk attachment foto/scan)
- Monitoring stack (Grafana/Loki) — bisa pakai Uptime Kuma sederhana dulu

---

## 5. Pre-Deployment Checklist (HARUS DILAKUKAN USER)

Sebelum saya bisa lanjut, butuh konfirmasi/info berikut:

### 5.1 VPS
- [ ] **Provider yang dipilih:** _________________
- [ ] **VPS sudah dibuat?** Yes / No (kalau No, beli dulu dengan spec rekomendasi di atas)
- [ ] **IP publik:** _________________
- [ ] **OS terinstall:** Ubuntu 24.04 LTS (atau yang ada) ⚠ kalau bukan Ubuntu 22+/24+, perlu reinstall
- [ ] **Akses SSH:**
  - Username: _____________ (root, ubuntu, atau lainnya)
  - Method: password / SSH key
  - Port SSH (default 22): _____

### 5.2 Domain
- [ ] **Domain yang dipilih:** _________________
- [ ] **Sudah punya / mau saya bantu pilih?** _____
- [ ] **Registrar:** _________________ (Niagahoster, Cloudflare, Namecheap, dll)
- [ ] **DNS dikelola di mana:** _____ (registrar atau Cloudflare)

### 5.3 Email & Backup
- [ ] **Email untuk Let's Encrypt notifications:** _________________
- [ ] **Backup destination:** Wasabi / Backblaze B2 / Google Drive / cloud lain / belum

### 5.4 Konfirmasi action
- [ ] Saya boleh **akses VPS via SSH** untuk install? (atau Anda yang jalankan script saya?)
- [ ] Domain DNS — Anda yang ubah, atau saya yang konfigurasi (kalau Cloudflare API token disediakan)?

---

## 6. Deployment Script Outline (akan di-finalize setelah info VPS lengkap)

```bash
# 1. Initial server hardening
apt update && apt upgrade -y
ufw allow OpenSSH && ufw allow 80,443/tcp && ufw enable
apt install -y fail2ban unattended-upgrades

# 2. Install runtime
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs postgresql-16 caddy git

# 3. Setup app user & directory
useradd -m -s /bin/bash novacare
su - novacare
git clone <repo-url> /home/novacare/app
cd /home/novacare/app/web
npm ci --omit=dev
npm run build

# 4. PostgreSQL
sudo -u postgres createuser novacare
sudo -u postgres createdb novacare_prod -O novacare
sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# 5. systemd service
# (file: /etc/systemd/system/novacare.service)

# 6. Caddy
# (file: /etc/caddy/Caddyfile — auto HTTPS via Let's Encrypt)

# 7. Backup cron
# (script: /home/novacare/backup.sh — pg_dump + rclone)
```

Detail file template (Caddyfile, systemd, backup) akan saya generate setelah:
- Domain dipilih
- VPS info diberi

---

## 7. Security Hardening (per Brand HARD RULES)

Sesuai `project_brand_constraints.md`:

- [x] **Encryption in transit:** HTTPS via Caddy + Let's Encrypt (TLS 1.3)
- [ ] **Encryption at rest:** PostgreSQL `pgcrypto` untuk field sensitif (NIK, alergi, diagnosis text). Implementasi di Phase 2 (saat backend dibuat).
- [ ] **Audit log immutable:** PostgreSQL append-only table + triggers. Phase 2.
- [x] **No external API calls untuk data klinis** — by architecture; SATUSEHAT sync di Phase 3 dengan eksplisit consent flow.
- [ ] **Backup encrypted off-site:** rclone dengan `crypt` remote. Setup pas deploy.
- [x] **Tenant isolation:** Phase awal single-tenant (dr. Yanuar), Phase 2+ schema-per-tenant.
- [ ] **Penetration test rutin:** post-launch (Phase Grow).

---

## 8. Pertanyaan untuk User (TL;DR)

Silakan jawab 3 pertanyaan singkat:

1. **VPS:** sudah punya? Kalau belum, mau saya rekomendasikan provider mana (Tier 1 atau Tier 2 di section 1)?
2. **Domain:** sudah punya? Kalau belum, mau pakai opsi mana (lihat section 3)?
3. **Eksekusi:** Anda mau **saya yang akses SSH** dan jalankan, atau **saya generate script + dokumentasi** lalu Anda yang jalankan di VPS?

Setelah jawab 3 ini + info di section 5, saya finalize semua template dan deploy bisa jalan.
