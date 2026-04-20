# Stack & Arsitektur — Proposal

**Status:** Proposal v1, menunggu konfirmasi user.

---

## Rekomendasi Stack

### Frontend (PWA — runs di tablet)
| Layer                  | Pilihan                              | Alasan                                                                 |
| ---------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| Framework              | **Next.js 15 (App Router)**          | SSR/SSG hybrid, dev server cepat, ekosistem terbesar, deploy fleksibel ke VPS |
| Language               | **TypeScript**                       | Type safety untuk medical data — kritikal                              |
| Styling                | **Tailwind CSS v4 + shadcn/ui**      | Touch-target friendly, accessible, tablet-responsive                   |
| State (UI)             | **Zustand**                          | Ringan, simple, cocok offline-first                                    |
| Forms                  | **React Hook Form + Zod**            | Performant, validation skema yang reusable di server juga              |
| Local DB               | **Dexie.js** (wrapper IndexedDB)     | API enak, query builder, reactive hooks via `dexie-react-hooks`        |
| PWA / Service Worker   | **Serwist** (penerus next-pwa)       | Maintained, App Router compatible, Workbox-based                       |
| Speech-to-Text         | **Web Speech API** (native)          | Gratis, lang `id-ID`, no cloud dependency untuk MVP                    |
| Encryption             | **Web Crypto API** (built-in)        | AES-GCM untuk field sensitif di IndexedDB                              |
| Date/time              | **date-fns**                         | Tree-shakeable, `id` locale tersedia                                   |
| Charts (TTV trend)     | **Recharts** atau **Tremor**         | Touch-friendly, responsive                                             |

### Backend (di VPS)
| Layer                  | Pilihan                              | Alasan                                                                 |
| ---------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| Runtime                | **Node.js (sama Next.js)**           | Satu bahasa full-stack, pakai Next.js API routes / Route Handlers      |
| Database               | **PostgreSQL 16**                    | Mature, JSONB untuk fleksibilitas FHIR, `pgcrypto` untuk encryption    |
| ORM                    | **Drizzle ORM**                      | Type-safe, ringan, migration jelas                                     |
| Auth                   | **Auth.js (NextAuth) + bcrypt**      | Self-hosted, session-based                                             |
| Sync API               | **REST + JSON** (atau tRPC)          | Sederhana, debuggable, bisa upgrade ke GraphQL kalau perlu             |
| FHIR mapper            | **fhir.js** atau custom mapper       | Transform internal → FHIR R4 untuk SATUSEHAT                           |
| Background jobs        | **BullMQ + Redis** (atau pg-boss)    | Queue untuk sync ke SATUSEHAT, kirim notifikasi                        |
| File storage           | **MinIO** (S3-compatible) di VPS     | Untuk attachment (foto luka, hasil lab scan)                           |

### Deployment (VPS)
| Komponen     | Pilihan                                                                |
| ------------ | ---------------------------------------------------------------------- |
| OS           | Ubuntu 24.04 LTS                                                       |
| Reverse proxy | **Caddy** (auto-HTTPS via Let's Encrypt, simpler dari Nginx)          |
| Process mgr  | **PM2** atau systemd                                                   |
| DB           | PostgreSQL native (bukan container) untuk durability                   |
| Container    | Docker Compose untuk app + Redis + MinIO                               |
| Backup       | `pg_dump` daily + rclone ke cloud (Wasabi/Backblaze)                   |
| Monitoring   | Uptime Kuma + Postgres metrics via Grafana (opsional fase awal)        |

### Tooling Dev (di VSCode)
- **ESLint + Prettier** — code style
- **Vitest** — unit test
- **Playwright** — e2e test (test offline mode!)
- **Drizzle Kit** — migrations
- **Simple Browser** extension — preview di dalam VSCode

---

## Arsitektur Sistem (High Level)

```
┌────────────────────────────────────┐
│ Tablet (PWA installed)             │
│  ┌──────────────────────────────┐  │
│  │ Next.js App (React)          │  │
│  │  • UI (Tailwind + shadcn)    │  │
│  │  • Zustand state             │  │
│  │  • React Query (server data) │  │
│  └──────────┬───────────────────┘  │
│             │                      │
│  ┌──────────▼───────────────────┐  │
│  │ Service Worker (Serwist)     │  │
│  │  • App shell cache           │  │
│  │  • Background sync           │  │
│  └──────────┬───────────────────┘  │
│             │                      │
│  ┌──────────▼───────────────────┐  │
│  │ IndexedDB (Dexie)            │  │
│  │  • Patients, Encounters,     │  │
│  │    Diagnoses, Prescriptions  │  │
│  │  • Mutation queue            │  │
│  │  • Encrypted sensitive cols  │  │
│  └──────────────────────────────┘  │
└──────────────┬─────────────────────┘
               │ HTTPS (when online)
               │ Background Sync
               ▼
┌──────────────────────────────────────┐
│ VPS (Ubuntu + Caddy)                 │
│  ┌────────────────────────────────┐  │
│  │ Next.js API (sync endpoints)   │  │
│  │  • POST /sync/push             │  │
│  │  • GET  /sync/pull             │  │
│  │  • Auth, audit log             │  │
│  └─────────┬──────────────────────┘  │
│  ┌─────────▼──────────────────────┐  │
│  │ PostgreSQL (master data)       │  │
│  └─────────┬──────────────────────┘  │
│  ┌─────────▼──────────────────────┐  │
│  │ FHIR Mapper Worker (BullMQ)    │  │
│  │  → SATUSEHAT API (async)       │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## Roadmap (Phase-Based) — Updated 2026-04-20

> SATUSEHAT integration dipindah dari Phase 4 → Phase 3 atas konfirmasi user.
> Modul spesialisasi (THT dst) jadi Phase 5 terpisah.

### Phase 0 — Foundation (1 minggu)
- Scaffold Next.js + Tailwind + shadcn + TypeScript
- Setup Serwist (PWA) + manifest + ikon + offline shell
- Setup Dexie schema awal (FHIR-aligned dari awal)
- Preview di VSCode (Simple Browser) + dev tablet (via LAN IP)

### Phase 1 — Core RME Offline (2–3 minggu)
- Data model **FHIR-mapped** dari awal (Patient, Encounter, Observation, Condition, MedicationRequest)
- CRUD pasien (offline)
- Sesi konsultasi: anamnesis, pemeriksaan, diagnosis, terapi
- ICD-10 autocomplete (data static seed)
- Riwayat kunjungan
- Print/share PDF (resep, surat)

### Phase 2 — Sync & VPS Backend (2 minggu)
- Backend Next.js API + PostgreSQL + Drizzle
- Mutation queue + background sync (client → VPS)
- Auth + audit log
- Deploy ke VPS dengan Caddy

### Phase 3 — SATUSEHAT Integration (2–3 minggu) ⭐ PRIORITY
- Registrasi di sandbox SATUSEHAT (satusehat.kemkes.go.id)
- FHIR R4 mapper: Patient, Practitioner, Encounter, Observation, Condition, MedicationRequest
- IHS Number lookup & matching
- Async push ke SATUSEHAT (BullMQ worker di VPS)
- Test end-to-end di sandbox, lalu prod

### Phase 4 — Voice & UX Polish (1–2 minggu)
- Web Speech API integration (`lang="id-ID"`)
- Voice templates & vocabulary boosting medis
- Loading states, error handling, empty states
- Tablet UX polish (gestures, landscape/portrait)

### Phase 5 — Modul Spesialisasi (per spesialisasi: 1–2 minggu)
- **THT** (pertama, sesuai user): template anamnesis (otalgi, otorhea, tinitus, vertigo, epistaksis, suara serak, dll), pemeriksaan (otoscopy findings, rhinoscopy, oropharynx), formularium THT
- Modul lain: dewasa interna, anak, kulit, dll (di-pluggable)
- Arsitektur: tiap modul = JSON schema + komponen UI custom yang di-load dynamic

### Phase 6+ — Future
- Multi-user (asisten read-only)
- Patient portal (lihat riwayat sendiri)
- BPJS integration (P-Care)
- Telemedicine (video call)
- Cloud STT untuk akurasi voice lebih tinggi

---

## Yang Perlu User Konfirmasi Sebelum Scaffold

1. ✅ Setuju stack ini? (Next.js + PWA + Dexie + Postgres di VPS)
2. ✅ Phase order OK? (Offline core dulu, baru sync, baru SATUSEHAT)
3. ✅ Ada preference yang mau diganti? (misal: pakai SQLite di server bukan Postgres? Pakai Vue/Svelte bukan React?)
4. Lihat **Open Questions** di `01-design-requirements.md` section 9.
