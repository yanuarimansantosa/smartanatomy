import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// Load .env.local (Next.js convention), fallback to .env
config({ path: ".env.local" });
config({ path: ".env" });

// `generate` (offline) tidak butuh URL. `push`/`migrate`/`studio` butuh URL.
// Kalau URL kosong kita kasih placeholder supaya generate tetap jalan.
const url =
  process.env.RME_DATABASE_URL ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
    ssl: process.env.RME_DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  },
  verbose: true,
  strict: true,
} satisfies Config;
