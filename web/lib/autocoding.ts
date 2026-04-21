// Auto-coding ICD-10 — rule-based, NO LLM (brand HARD RULE).
// Input  : free-text diagnosa dokter (mis. "OMA telinga kanan, BPPV")
// Output : daftar saran ICD-10 dengan skor relevansi.
//
// Algoritma:
//   1. Tokenize input → words ≥3 char (lowercase, strip tanda baca).
//   2. Untuk tiap entry ICD-10, hitung skor:
//      +5 kalau salah satu keyword muncul utuh (substring match)
//      +3 kalau token cocok di nameId
//      +2 kalau token cocok di nameEn
//      +1 kalau token cocok di code (mis. user ngetik "h61")
//   3. Sort desc, ambil top-N, drop yang skor 0.
//
// Tidak ada ML, tidak ada embedding, tidak ada call ke API eksternal.
// Semua jalan di client/server Node tanpa dependency tambahan.

import { ICD10_THT, type Icd10Entry } from "./seeds/icd10-tht";

export type CodingSuggestion = {
  entry: Icd10Entry;
  score: number;
  matchedTerms: string[];
};

const STOP_WORDS = new Set([
  "yang", "dan", "atau", "dengan", "pada", "untuk", "dari", "ini", "itu",
  "ada", "tidak", "akut", "kronik", "kronis", "kanan", "kiri", "bilateral",
  "the", "and", "with", "without", "of", "in", "at", "on",
]);

function tokenize(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[.,;:!?()/\\\[\]"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];
  return cleaned
    .split(" ")
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

export function suggestIcd10(text: string, limit = 5): CodingSuggestion[] {
  const tokens = tokenize(text);
  if (tokens.length === 0) return [];

  const lowText = text.toLowerCase();
  const results: CodingSuggestion[] = [];

  for (const entry of ICD10_THT) {
    let score = 0;
    const matched = new Set<string>();

    // Keyword full-substring match (paling kuat — singkatan klinis sengaja
    // dikurasi: "oma", "bppv", "lpr", dst).
    for (const kw of entry.keywords ?? []) {
      const k = kw.toLowerCase();
      if (lowText.includes(k)) {
        score += 5;
        matched.add(kw);
      }
    }

    const lowId = entry.nameId.toLowerCase();
    const lowEn = entry.nameEn.toLowerCase();
    const lowCode = entry.code.toLowerCase();

    for (const t of tokens) {
      if (lowId.includes(t)) {
        score += 3;
        matched.add(t);
      }
      if (lowEn.includes(t)) {
        score += 2;
        matched.add(t);
      }
      if (lowCode.includes(t)) {
        score += 1;
        matched.add(t);
      }
    }

    if (score > 0) {
      results.push({ entry, score, matchedTerms: [...matched] });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
