// Build roadmap — milestones derived from PRD v2.0, TDD v1.0, and DB Schema v1.0.
// Each item maps to an expected git tag pattern. Status is computed at render
// time by intersecting this list with the live GitHub tags via lib/github-tags.ts.

export type MilestoneStatus = "done" | "in-progress" | "planned";

export type Milestone = {
  id: string;
  title: string;
  detail?: string;
  expectedTag?: string | RegExp;
  // Manual override: use when tag exists but feature is partial, or vice versa.
  manualStatus?: MilestoneStatus;
};

export type RoadmapCategory = {
  key: string;
  title: string;
  subtitle: string;
  items: Milestone[];
};

export const REPO_OWNER = "yanuarimansantosa";
export const REPO_NAME = "novacare-emr";

export const ROADMAP: RoadmapCategory[] = [
  {
    key: "brand",
    title: "Brand & UI",
    subtitle: "Visual identity, theming, navigation, editorial layout",
    items: [
      {
        id: "monorepo-init",
        title: "Monorepo init (Next.js 16 + Tailwind v4 + Drizzle)",
        expectedTag: /v0\.[12]\./,
      },
      {
        id: "tema-clinical",
        title: "Theme system (12 palettes) + theme switcher",
        expectedTag: /v0\.[34]\./,
      },
      {
        id: "internasional-theme",
        title: "Internasional theme (deep teal · ivory · gold · Playfair)",
        expectedTag: /v0\.7/,
      },
      {
        id: "f0-tablet-home",
        title: "Home tablet single-page redesign + Salam greeting + No-LLM badge",
        expectedTag: /v0\.8\.0/,
      },
      {
        id: "f1-dark-mode",
        title: "Dark mode tokens (theme-internasional) + Sun/Moon toggle",
        expectedTag: "v0.8.1-dark-mode",
      },
      {
        id: "f2-duo-phrase",
        title: "Duo-phrase H1 italic emphasis",
        expectedTag: "v0.8.2-duo-phrase",
      },
      {
        id: "f3-mark-lockup",
        title: "NovaCareMark ECG-in-bubble + duo-phrase wordmark",
        expectedTag: "v0.8.3-mark-lockup",
      },
      {
        id: "d-tentang",
        title: "/tentang page — 3 Pilar + 7 Prinsip + anti-pola",
        expectedTag: "v0.9.0-tentang",
      },
      {
        id: "p-progress",
        title: "/progress dashboard — roadmap synced to GitHub tags",
        expectedTag: /v0\.10\.[12]-progress/,
      },
      {
        id: "c-pasien-style",
        title: "Internasional editorial style propagated to /pasien pages",
        expectedTag: /v0\.10\.\d+-pasien-style/,
      },
      {
        id: "dark-mode-all-themes",
        title: "Dark mode for all 12 themes (currently only Internasional)",
        expectedTag: /v0\.\d+-dark-mode-all/,
      },
    ],
  },

  {
    key: "clinical-engine",
    title: "Clinical Flow Engine (PRD v2.0)",
    subtitle:
      "Engine-primary modul klinis · CDSS · auto-compose SOAP · cetak resep · zero-typing target",
    items: [
      {
        id: "engine-core",
        title: "Module engine foundation (10-section ModuleSpec + renderer)",
        detail: "Generic engine yang ditumpangi semua modul.",
        expectedTag: "v0.16.0-module-engine",
      },
      {
        id: "mod-tonsilitis",
        title: "Module 1 — Tonsilitis Kronik (J35.0) · Brodsky · STOP-BANG",
        expectedTag: "v0.16.1-module-tonsilitis",
      },
      {
        id: "mod-crs",
        title: "Module 2 — Rinosinusitis Kronik (J32) · SNOT-22 · EPOS",
        expectedTag: "v0.16.2-module-crs",
      },
      {
        id: "mod-omsk-aman",
        title: "Module 3 — OMSK Tipe Aman (H66.1)",
        expectedTag: "v0.16.3-module-omsk-aman",
      },
      {
        id: "mod-omsk-bahaya",
        title: "Module 4 — OMSK Tipe Bahaya (H66.2) + komplikasi panel",
        expectedTag: "v0.16.4-module-omsk-bahaya",
      },
      {
        id: "mod-fb-airway",
        title: "Module 5 — Foreign Body Airway (T17) · EMERGENCY",
        expectedTag: "v0.16.5-module-fb-airway",
      },
      {
        id: "mod-bppv",
        title: "Module 6 — BPPV (H81.1) · Dix-Hallpike · Epley",
        expectedTag: "v0.16.6-module-bppv",
      },
      {
        id: "mod-rinitis-alergi",
        title:
          "Module 7 — Rinitis Alergi (J30.4) · SFAR · ARIA · monetisasi 5-layer",
        expectedTag: "v0.16.7-module-rinitis-alergi",
      },
      {
        id: "mod-trauma-wajah",
        title: "Module 8 — Trauma Wajah & Maksilofasial (S02.x) · RED FLAG",
        expectedTag: "v0.16.8-module-trauma-wajah",
      },
      {
        id: "mod-knf",
        title: "Module 9 — KNF (C11) · RED FLAG-driven early detection",
        expectedTag: "v0.16.9-module-knf",
      },
      {
        id: "mod-tuli-kongenital",
        title:
          "Module 10 — Tuli Kongenital (H90.x) · JCIH 1-3-6 golden period",
        expectedTag: "v0.16.11-module-tuli-kongenital",
      },
      {
        id: "mod-serumen-impaksi",
        title: "Module 11 — Serumen Impaksi (H61.2) · high-volume cashflow",
        expectedTag: "v0.16.14-module-serumen-impaksi",
      },
      {
        id: "mod-uao",
        title: "Module 12 — Upper Airway Obstruction (J98/J05.1) · EMERGENCY",
        detail: "Belum dibuat — next emergency module setelah FB Airway.",
      },
      {
        id: "theme-semantic",
        title: "Theme semantic tokens (risk/warning/success) untuk engine",
        expectedTag: "v0.16.10-theme-semantic-tokens",
      },
      {
        id: "cdss-tester",
        title: "CDSS Tester standalone + loading state + null-safe ctx",
        expectedTag: /v0\.16\.(12|13|15)/,
      },
      {
        id: "universal-search",
        title: "Universal Search Stage 1 — palette (menu · pasien · ICD · modul)",
        expectedTag: "v0.17.0-universal-search-stage-1",
      },
      {
        id: "ux-yatidak-soap",
        title:
          "Pertanyaan tap Ya/Tidak + SOAP sticky kanan (modul + CDSS tester)",
        expectedTag: /v0\.17\.[12]/,
      },
      {
        id: "next16-boundary-fix",
        title: "Next 16 server→client boundary fix (load spec client-side)",
        expectedTag: "v0.17.3-modul-page-client-spec-load",
      },
      {
        id: "cetak-resep",
        title: "Cetak resep MVP (A5 portrait, R/ format, print-ready)",
        expectedTag: "v0.17.4-cetak-resep-mvp",
      },
      {
        id: "doctor-identity",
        title: "Doctor identity (nama + SIP) configurable via BrandConfig",
        expectedTag: "v0.17.5-doctor-identity-config",
      },
      {
        id: "surat-sakit",
        title: "Surat Keterangan Sakit MVP (A4 portrait, terbilang ID, tap-only)",
        expectedTag: "v0.17.7-surat-sakit-mvp",
      },
      {
        id: "surat-rujukan",
        title:
          "Surat Rujukan MVP (auto-populate SOAP+Dx+Rx, 8 destinasi Semarang)",
        expectedTag: "v0.17.8-surat-rujukan-mvp",
      },
      {
        id: "patient-history-enriched",
        title:
          "Riwayat kunjungan diperkaya — primary dx + jumlah resep per row",
        expectedTag: "v0.17.9-patient-history-enriched",
      },
      {
        id: "surat-sehat",
        title:
          "Surat Keterangan Sehat MVP (keperluan quick-pick, scope THT toggle)",
        expectedTag: "v0.17.10-surat-sehat-mvp",
      },
      {
        id: "ztci-editor",
        title:
          "ZTCI Layer 1 — engine-primary visit editor (tap-only, zero typing)",
        detail:
          "Belum dimulai — rewrite editor.tsx jadi engine-first dengan typing cuma escape hatch.",
      },
      {
        id: "uao-emergency",
        title: "Module 13+ — Emergency modules tambahan (epistaksis, trauma leher)",
        detail: "Queue setelah UAO.",
      },
    ],
  },

  {
    key: "schema",
    title: "Database Schema (14 tables)",
    subtitle: "PostgreSQL 16 · UUID PK · RLS · tenant_id (per DB Schema v1.0)",
    items: [
      {
        id: "tbl-patients",
        title: "patients (MVP fields)",
        detail: "Missing: NIK encryption, IHS, BPJS, allergies, MRN auto-gen sequence",
        expectedTag: /v0\.5/,
        manualStatus: "in-progress",
      },
      {
        id: "tbl-audit-logs",
        title: "audit_logs (append-only, PG trigger blocks UPDATE/DELETE)",
        expectedTag: "v0.10.0-audit-log",
      },
      {
        id: "tbl-tenants",
        title: "tenants (multi-tenant root)",
        expectedTag: /schema-(tenants|s1)/,
      },
      {
        id: "tbl-users",
        title: "users (doctor · nurse · tenant_admin)",
        expectedTag: /schema-(users|s1)/,
      },
      {
        id: "tbl-locations",
        title: "locations (cabang · operating_hours JSONB)",
        expectedTag: /schema-(locations|s1)/,
      },
      {
        id: "tbl-visits",
        title: "visits (KNJ-YYYY-NNNN · vitals · BMI generated · 7-step current)",
        expectedTag: /schema-(visits|s2)/,
      },
      {
        id: "tbl-soap-notes",
        title: "soap_notes (1:1 visit · ent_examination JSONB · atlas_drawings · scoring)",
        expectedTag: /schema-(soap|s2)/,
      },
      {
        id: "tbl-visit-diagnoses",
        title: "visit_diagnoses (ICD-10 · primary/secondary/comorbid)",
        expectedTag: /schema-(diagnoses|s2)/,
      },
      {
        id: "tbl-prescriptions",
        title: "prescriptions (R/YYYY-NNNN-DD · drug · dose · interaction-checked)",
        expectedTag: /schema-(prescriptions|s3)/,
      },
      {
        id: "tbl-billing",
        title: "billing_invoices (INV-YYYY-NNNN · umum/bpjs/asuransi)",
        expectedTag: /schema-(billing|s3)/,
      },
      {
        id: "tbl-feedback-logs",
        title: "feedback_logs (Salam AI closed-loop core)",
        expectedTag: /schema-(feedback|s3)/,
      },
      {
        id: "tbl-schedules",
        title: "schedules (slot per dokter/lokasi/tanggal)",
        expectedTag: /schema-(schedules|s4)/,
      },
      {
        id: "tbl-bookings",
        title: "bookings (online booking + OTP)",
        expectedTag: /schema-(bookings|s4)/,
      },
      {
        id: "tbl-icd10",
        title: "icd10_codes (70k+ rows seed · GIN fuzzy search)",
        expectedTag: /schema-(icd10|s5)/,
      },
      {
        id: "tbl-doctor-prefs",
        title: "doctor_preferences + global_preferences (nightly re-rank)",
        expectedTag: /schema-(prefs|s5)/,
      },
      {
        id: "tbl-notif-logs",
        title: "notification_logs + satusehat_push_logs",
        expectedTag: /schema-(logs|s5)/,
      },
    ],
  },

  {
    key: "api",
    title: "REST API (62 endpoints, 13 groups)",
    subtitle: "Per Salam AI API Contract v1.0 — JWT auth + standard envelope",
    items: [
      { id: "api-auth", title: "Auth (6 endpoints: register · login · refresh · logout · profile · password)", expectedTag: /api-auth/ },
      { id: "api-tenant", title: "Tenant & Location (7)", expectedTag: /api-tenant/ },
      { id: "api-scheduling", title: "Scheduling + Queue SSE (9)", expectedTag: /api-scheduling/ },
      { id: "api-patients", title: "Patients (6)", detail: "Server actions exist; REST surface pending", expectedTag: /v0\.5/, manualStatus: "in-progress" },
      { id: "api-visits", title: "Visits (7) — incl. /sign + /ai-suggestions + /photos", expectedTag: /api-visits/ },
      { id: "api-soap", title: "SOAP Note (4) — incl. /scoring (SFAR · STOP-BANG · Paradise · VAS-ARIA)", expectedTag: /api-soap/ },
      { id: "api-diagnoses", title: "Diagnoses (5) — ICD-10 search <200ms", expectedTag: /api-diagnoses/ },
      { id: "api-prescriptions", title: "Prescriptions + drug interaction-check (6)", expectedTag: /api-prescriptions/ },
      { id: "api-billing", title: "Billing + reports daily/monthly (7)", expectedTag: /api-billing/ },
      { id: "api-output", title: "Output: PDF · WA · email · SATUSEHAT (4)", expectedTag: /api-output/ },
      { id: "api-feedback", title: "Feedback & AI Learning (4)", expectedTag: /api-feedback/ },
    ],
  },

  {
    key: "ai",
    title: "Salam AI Intelligence Engine",
    subtitle: "Python FastAPI service · NO LLM · rule-based + RAG + nightly re-rank",
    items: [
      { id: "ai-rag", title: "RAG warm-up <5s (ChromaDB per-tenant + sentence-transformers ML-MiniLM)", expectedTag: /ai-rag/ },
      { id: "ai-scoring", title: "Scoring engines: SFAR · STOP-BANG · Paradise · VAS+ARIA", expectedTag: /ai-scoring/ },
      { id: "ai-icd10", title: "ICD-10 suggester with confidence + reasoning", expectedTag: /ai-icd10/ },
      { id: "ai-drugs", title: "Drug interaction checker (500+ pairs seed)", expectedTag: /ai-drugs/ },
      { id: "ai-feedback", title: "Closed-loop feedback (passive log + active correction)", expectedTag: /ai-feedback/ },
      { id: "ai-rerank", title: "Nightly re-rank cron (02:00 WIB)", expectedTag: /ai-rerank/ },
    ],
  },

  {
    key: "infra",
    title: "Infrastructure & DevOps",
    subtitle: "VPS · Docker · CI/CD · backup · observability",
    items: [
      { id: "infra-vps", title: "VPS Hostinger KVM4 · Ubuntu 24.04 · Postgres 16 · Nginx", expectedTag: /v0\.[1-5]\./ },
      { id: "infra-pwa", title: "PWA service worker (Serwist) + offline page", expectedTag: /v0\.[36]\./ },
      { id: "infra-tls", title: "Let's Encrypt + dev.rme.medinovatech.com auto-renew", expectedTag: /infra-tls/, manualStatus: "done" },
      { id: "infra-deploy", title: "Auto-deploy to dev VPS after each push", expectedTag: /infra-deploy/, manualStatus: "done" },
      { id: "infra-docker", title: "Per-service Docker images (Phalcon · Python · Vue · Postgres · Chroma · Redis)", expectedTag: /infra-docker/ },
      { id: "infra-cicd", title: "GitHub Actions: PHPUnit + pytest + Vitest + image push to GHCR", expectedTag: /infra-cicd/ },
      { id: "infra-backup", title: "rclone → Backblaze B2 daily 02:30 WIB (RPO <24h, RTO <2h)", expectedTag: /infra-backup/ },
      { id: "infra-monitor", title: "Uptime Robot + Netdata + Sentry", expectedTag: /infra-monitor/ },
    ],
  },

  {
    key: "satusehat",
    title: "SATUSEHAT & Compliance",
    subtitle: "FHIR R4 push, OAuth2, audit, BPJS readiness",
    items: [
      { id: "satusehat-oauth", title: "SATUSEHAT OAuth2 client credentials + Redis token cache", expectedTag: /satusehat-oauth/ },
      { id: "satusehat-encounter", title: "Encounter resource push after visit signed", expectedTag: /satusehat-encounter/ },
      { id: "satusehat-condition", title: "Condition + Observation + Procedure resources", expectedTag: /satusehat-condition/ },
      { id: "satusehat-medication", title: "MedicationRequest resource", expectedTag: /satusehat-medication/ },
      { id: "satusehat-retry", title: "Retry queue with exponential backoff (max 3x)", expectedTag: /satusehat-retry/ },
      { id: "compliance-audit", title: "audit_logs append-only foundation", expectedTag: "v0.10.0-audit-log" },
      { id: "compliance-encryption", title: "pgcrypto AES-256 on NIK · name · phone · BPJS", expectedTag: /compliance-encryption/ },
      { id: "compliance-rls", title: "Row-Level Security policies on every tenant table", expectedTag: /compliance-rls/ },
    ],
  },

  {
    key: "notif",
    title: "Notification Pipeline",
    subtitle: "Async via Redis queues → Email · WhatsApp (Fonnte) · Telegram",
    items: [
      { id: "notif-queue", title: "Redis queue worker scaffold", expectedTag: /notif-queue/ },
      { id: "notif-email", title: "SMTP sender worker", expectedTag: /notif-email/ },
      { id: "notif-wa", title: "Fonnte WhatsApp worker", expectedTag: /notif-wa/ },
      { id: "notif-telegram", title: "Telegram Bot API worker", expectedTag: /notif-telegram/ },
      { id: "notif-pdf", title: "PDF generator worker (DOMPDF)", expectedTag: /notif-pdf/ },
      { id: "notif-trigger-booking", title: "Booking confirmation + reminder H-1 / H-0", expectedTag: /notif-booking/ },
      { id: "notif-trigger-resep", title: "Resep send to WA + Telegram after sign", expectedTag: /notif-resep/ },
      { id: "notif-trigger-followup", title: "Follow-up D+1 + D+7 + Imunoterapi H-2", expectedTag: /notif-followup/ },
    ],
  },
];

export function flattenMilestones(): Milestone[] {
  return ROADMAP.flatMap((c) => c.items);
}
