import "server-only";
import { headers } from "next/headers";
import { db } from "@/db/client";
import { auditLogs, type AuditLog } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";

// Append-only audit log helper. App hanya boleh INSERT — DELETE/UPDATE
// diblokir di level Postgres trigger (lihat migration 0002).
// PRD prinsip #6 Accountability: setiap akses RM tercatat termasuk RAG query.

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "view"
  | "sign"
  | "ai_query"
  | "login"
  | "logout"
  | "export"
  | string;

export type AuditEvent = {
  actorId?: string;
  actorLabel?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
};

export async function logEvent(ev: AuditEvent): Promise<void> {
  let ipAddress: string | undefined;
  let userAgent: string | undefined;
  try {
    const h = await headers();
    ipAddress =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      undefined;
    userAgent = h.get("user-agent") ?? undefined;
  } catch {
    // headers() not available outside request scope — fine, log without IP/UA
  }

  await db.insert(auditLogs).values({
    actorId: ev.actorId,
    actorLabel: ev.actorLabel ?? "system",
    action: ev.action,
    entity: ev.entity,
    entityId: ev.entityId,
    beforeJson: (ev.before ?? null) as object | null,
    afterJson: (ev.after ?? null) as object | null,
    ipAddress,
    userAgent,
  });
}

export async function listAuditByEntity(
  entity: string,
  entityId: string,
  limit = 50,
): Promise<AuditLog[]> {
  return await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.entity, entity), eq(auditLogs.entityId, entityId)))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function listRecentAudit(limit = 100): Promise<AuditLog[]> {
  return await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
