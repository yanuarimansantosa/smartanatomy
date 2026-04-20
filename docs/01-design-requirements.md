# RME Praktek Mandiri — Design Requirements

**Tanggal:** 2026-04-20
**Status:** Draft v1 (hasil konsolidasi riset, menunggu review user)

---

## 1. Konteks & Tujuan

Aplikasi **Rekam Medis Elektronik (RME) untuk dokter praktek mandiri** di Indonesia. Fokus: workflow dokter solo praktek di tablet, bisa jalan offline (sinyal sering tidak stabil), sync otomatis saat online, dan compliant dengan regulasi Kemenkes.

**Bukan**: SIMRS rumah sakit, klinik multi-dokter (untuk fase pertama).

---

## 2. Regulasi & Standar (Wajib Compliant)

### Permenkes No. 24 Tahun 2022 — Rekam Medis Elektronik
- **Wajib** untuk semua faskes termasuk **praktek mandiri** sejak 31 Desember 2023.
- Mencabut Permenkes 269/2008.
- Tiga prinsip inti yang harus dijamin sistem: **Kerahasiaan, Integritas, Ketersediaan** data.
- Sistem boleh dikembangkan sendiri (self-hosted) — bukan harus pakai vendor.

### Integrasi SATUSEHAT Platform (Kemenkes DTO)
- Standar interoperabilitas: **HL7 FHIR R4** (REST API).
- Identitas pasien nasional: **IHS Number** (Indonesia Health Services).
- Profile FHIR Indonesia tersedia di simplifier.net (SATUSEHAT FHIR R4 Implementation Guide).
- Sandbox + Postman collection tersedia di satusehat.kemkes.go.id untuk dev.
- Ada **SATUSEHAT Mediator** untuk akselerasi integrasi (open source di github.com/kemenkesri).

**Implication:** Skema data internal kita harus **mappable ke FHIR resources** (Patient, Practitioner, Encounter, Observation, Condition, MedicationRequest, dll). Kita simpan dalam bentuk normalized di local DB, lalu transform ke FHIR saat sync ke SATUSEHAT.

---

## 3. Riset RME Eksisting (Indonesia) — Gap Analysis

| Produk            | Model          | Kekuatan                                       | Gap / Peluang                                                |
| ----------------- | -------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| **Privata (Assist.id)** | SaaS cloud     | Ekosistem 6000+ faskes, e-resep, SATUSEHAT     | Dependent koneksi, biaya bulanan                             |
| **ASRI**          | SaaS gratis*   | Gratis sampai Des 2026, SATUSEHAT-ready        | Setelah 2026 status tidak jelas, vendor lock-in              |
| **Medisy, MyKlinik** | SaaS         | UI cukup baik, integrasi SATUSEHAT             | Klinik-oriented, kurang optimal solo + tablet                |
| **Dokterkita**    | SaaS murah     | Harga <50rb/bulan, ada AI chatbot              | Belum ada bukti tablet-first / offline-first                 |
| **AIBIZ Medical** | WhatsApp-based | Pasien akses via WA                            | Bukan PWA, dokter UX terbatas                                |

**Posisi differensiasi RME ini:**
1. **Tablet-first PWA** (kompetitor mostly desktop-web atau mobile phone).
2. **Offline-first** (kompetitor cloud-only — bermasalah di area sinyal lemah).
3. **Speech-to-text dictation** (under-utilized di kompetitor — clinician masih banyak ngetik).
4. **Self-hosted ke VPS sendiri** (data 100% di kontrol dokter, bukan SaaS pihak ke-3).

---

## 4. User Persona & Workflow

### Primary user: Dokter praktek mandiri
- Lokasi: ruang praktek (klinik kecil, kamar praktek di rumah, atau visit pasien)
- Device: **tablet (10–13 inch)** dengan stylus + touch
- Tangan sering kotor / sarung tangan — minimize typing, maximize tap + voice
- Sesi konsultasi 5–15 menit per pasien — UI harus cepat, tidak banyak klik

### Workflow tipikal satu sesi konsultasi:
1. **Identifikasi pasien** — cari (NIK/nama/telp) atau tambah baru
2. **Lihat riwayat** — kunjungan terakhir, alergi, obat aktif, lab terakhir
3. **Anamnesis** — keluhan, riwayat penyakit (input via voice/template)
4. **Pemeriksaan fisik** — TTV (numerik via stepper), inspeksi/palpasi (voice/template)
5. **Diagnosis** — pilih kode ICD-10 (autocomplete, riwayat dokter sering)
6. **Terapi** — obat (autocomplete dari formularium), tindakan, edukasi
7. **Cetak/share** — resep, surat keterangan, rujukan (PDF)

### Sekunder: Pasien (read-only future) & Asisten (future)
Tidak di-scope fase pertama.

---

## 5. Tablet-First Touchscreen UX Principles

(Sintesis dari healthcare UX best practices + medical device UI)

1. **Information density tetap penting** — clinician butuh banyak data sekaligus, jangan over-minimize.
2. **Touch targets ≥48px** — sesuai WCAG + Material guideline untuk gloves/wet hands.
3. **Landscape default**, support portrait sebagai sekunder.
4. **Split-view layout** — pasien list di kiri, detail di kanan (master-detail), bukan navigasi back-forth.
5. **Visible system state** — status sync (online/offline/syncing/error) selalu terlihat.
6. **Voice button persisten** — floating action button untuk dictation di setiap text area.
7. **Quick templates / smart defaults** — dokter sering pakai pola yang sama (ucapan pembuka, contoh diagnosis sering, dll).
8. **Cross-device consistency** — desktop dan mobile harus konsisten (untuk asisten/dokter di luar ruang praktek).

---

## 6. Speech-to-Text (Dictation)

### Tech: Web Speech API (`SpeechRecognition`)
- **Pro:** Native browser, gratis, low latency, support `lang="id-ID"`.
- **Con:** Kualitas tergantung browser; Chrome/Edge paling baik (pakai Google STT), Safari iPad pakai Apple.
- **Browser support:** Chrome, Edge, Safari iPadOS 14.5+. Firefox terbatas.
- **PWA:** Bisa langsung dipakai dari PWA installed; permission mic minta sekali.

### Strategi peningkatan akurasi medis:
- **Custom vocabulary post-processing** — daftar istilah medis Indonesia + dokter-specific terms (auto-correct via dictionary).
- **Voice templates** — frase sering diucapkan dipetakan ke teks lengkap (contoh: "anam batuk pilek 3 hari" → expand jadi struktur).
- **Cloud STT fallback (opsional, future)** — saat online, untuk akurasi lebih tinggi pakai Speechmatics/Soniox/Google STT API. Tapi untuk MVP cukup Web Speech API native.

### UX dictation:
- Tombol mic per field; tap-and-hold untuk push-to-talk, atau toggle continuous.
- Visual waveform feedback saat merekam.
- Real-time interim transcript ditampilkan (low confidence text dimiringkan).
- Edit manual selalu bisa setelah transkripsi.

---

## 7. Arsitektur Offline-First + Sync

### Storage layers:
1. **Cache Storage API** (via service worker, Workbox) — app shell: HTML, CSS, JS, fonts, ikon. Strategy: `CacheFirst` untuk asset statis, `StaleWhileRevalidate` untuk API metadata.
2. **IndexedDB** (via **Dexie.js**) — semua data terstruktur: pasien, kunjungan, diagnosis, resep, dll. Bisa di-query, di-index.
3. **Encrypted at rest** — sensitive fields (NIK, diagnosis) di-encrypt dengan key derived dari password dokter (Web Crypto API). Memenuhi prinsip "Kerahasiaan" Permenkes.

### Sync strategy:
- **Mutation queue** di IndexedDB — semua write (create/update/delete) masuk queue dengan timestamp + UUID lokal.
- **Background Sync API** — saat online, service worker drain queue ke server VPS via REST/GraphQL.
- **Conflict resolution: LWW (Last-Write-Wins)** dengan `updatedAt` timestamp. Cukup untuk single-user (dokter solo) per record. Untuk shared records (future multi-user), upgrade ke CRDT (Yjs/Automerge).
- **ID strategy:** UUID v7 (timestamp-prefixed, sortable) digenerate di client — no server round-trip needed for ID assignment.
- **SATUSEHAT sync terpisah** — aplikasi ↔ VPS server (real-time sync), VPS server ↔ SATUSEHAT (batch sync, async). Server kita yang transform ke FHIR.

### Network status UX:
- Indikator selalu visible: **Online / Offline / Syncing (X items pending) / Sync Error**.
- Saat offline, semua action tetap jalan; user diberi tahu "Tersimpan lokal, akan sync saat online".
- Manual "Sync sekarang" button untuk trigger paksa.

---

## 8. Security & Privacy (Permenkes Compliance)

- **Auth:** username + password + opsional PIN cepat untuk re-auth (60 menit timeout default).
- **Audit log:** semua akses & modifikasi rekam medis dicatat (siapa, kapan, apa) — wajib per Permenkes.
- **Encryption in transit:** HTTPS (TLS 1.3) — wajib.
- **Encryption at rest:** sensitive fields encrypted di IndexedDB; di server (PostgreSQL) pakai column-level encryption (`pgcrypto`).
- **Backup:** auto-export terenkripsi ke cloud (opsional, dokter konfigurasi sendiri).
- **Data residency:** semua data di server VPS dokter (Indonesia preferred per regulasi data lokal).

---

## 9. Open Questions (Butuh Konfirmasi User)

1. **Spesialisasi dokter** — apa? (Akan mempengaruhi template anamnesis, daftar diagnosis sering, formularium.) *Email user "yanuar.tht@gmail.com" — apakah THT? Bisa konfirmasi?*
2. **Skala awal** — berapa pasien per hari? (Mempengaruhi pilihan VPS spec & DB sizing.)
3. **Fitur cetak** — perlu integrasi printer Bluetooth/thermal? Atau cukup PDF + share?
4. **Multi-device sync** — satu dokter pakai 1 tablet saja, atau multi-device (tablet + laptop)?
5. **Backup ke cloud** — preferred cloud (Google Drive / OneDrive / cloud sendiri)?
6. **Brand/identitas aplikasi** — nama app, warna, logo (untuk PWA manifest)?
7. **SATUSEHAT integration** — fase 1 (offline tanpa SATUSEHAT) atau langsung integrate?

---

## 10. Sumber Riset

- [Permenkes No. 24 Tahun 2022 — eClinic summary](https://www.eclinic.id/permenkes-terbaru-no-24-tahun-2022-kewajiban-faskes-untuk-rekam-medis-elektronik/)
- [Permenkes 24/2022 detail — Medisy](https://www.medisy.id/article/membedah-tuntas-apa-isi-pmk-24-tahun-2022-permenkes-242022-dan-apa-yang-wajib-diketahui-setiap-klinik)
- [SATUSEHAT FHIR R4 Implementation Guide](https://simplifier.net/guide/SATUSEHAT-FHIR-R4-Implementation-Guide/Home/Modul-Pelayanan/ResourceInformation?version=current)
- [SATUSEHAT Postman public collection](https://www.postman.com/satusehat/satusehat-public/documentation/u2k8uiz/00-fhir-resource-contoh-penggunaan)
- [SATUSEHAT mediator client (PHP) — kemenkesri GitHub](https://github.com/kemenkesri/satusehat-mediator-client-php)
- [DTO Kemenkes — Playbook integrasi SATUSEHAT (FHIR)](https://medium.com/@dtokemkes/pakai-standar-global-fhir-kemenkes-uji-coba-playbook-integrasi-satusehat-platform-00a0e3815762)
- [Privata (Assist.id) RME praktek mandiri](https://assist.id/software-klinik-privata)
- [ASRI — RME gratis](https://ehealth.co.id/blog/post/rekam-medis-elektronik-gratis-untuk-praktik-mandiri/)
- [Healthcare UX best practices — Eleken](https://www.eleken.co/blog-posts/user-interface-design-for-healthcare-applications)
- [Healthcare UX trends — Koru UX](https://www.koruux.com/50-examples-of-healthcare-UI/)
- [Web Speech API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Speech recognition in PWA — Progressier](https://progressier.com/pwa-capabilities/speech-recognition)
- [Offline-first PWA Next.js + IndexedDB — Wellally](https://www.wellally.tech/blog/build-offline-first-pwa-nextjs-indexeddb)
- [PWA sync & conflict resolution — GTC Sys](https://gtcsys.com/comprehensive-faqs-guide-data-synchronization-in-pwas-offline-first-strategies-and-conflict-resolution/)
- [Background sync — MS Edge docs](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/background-syncs)
