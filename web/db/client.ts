import "server-only";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

if (!process.env.RME_DATABASE_URL) {
  throw new Error(
    "RME_DATABASE_URL belum di-set — cek file web/.env.local di VPS."
  );
}

// Singleton pool untuk Next.js dev + prod. Dev mode pakai globalThis
// biar HMR ga bikin connection leak.
declare global {
  var __rmePgPool: Pool | undefined;
}

const pool =
  globalThis.__rmePgPool ??
  new Pool({
    connectionString: process.env.RME_DATABASE_URL,
    ssl:
      process.env.RME_DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__rmePgPool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };
