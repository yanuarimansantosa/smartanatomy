import "server-only";
import { db } from "@/db/client";
import { tenants, locations, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const DEFAULT_TENANT_SLUG = "default";
const DEFAULT_LOCATION_NAME = "Klinik Utama";
const DEFAULT_DOCTOR_EMAIL = "doctor@local";

export type DefaultIds = {
  tenantId: string;
  locationId: string;
  doctorId: string;
};

let cache: DefaultIds | null = null;

// Idempotent — creates the seed rows on first call, returns cached IDs after.
// MVP solo-dokter assumes a single tenant/location/doctor; multi-tenant comes
// later with auth. The IDs satisfy NOT NULL FKs on visits/soap/billing.
export async function getDefaultIds(): Promise<DefaultIds> {
  if (cache) return cache;

  let tenant = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, DEFAULT_TENANT_SLUG))
    .limit(1)
    .then((r) => r[0]);

  if (!tenant) {
    tenant = await db
      .insert(tenants)
      .values({
        slug: DEFAULT_TENANT_SLUG,
        name: "Klinik (default)",
        subscriptionStatus: "active",
      })
      .returning({ id: tenants.id })
      .then((r) => r[0]);
  }

  let location = await db
    .select({ id: locations.id })
    .from(locations)
    .where(
      and(
        eq(locations.tenantId, tenant.id),
        eq(locations.name, DEFAULT_LOCATION_NAME),
      ),
    )
    .limit(1)
    .then((r) => r[0]);

  if (!location) {
    location = await db
      .insert(locations)
      .values({
        tenantId: tenant.id,
        name: DEFAULT_LOCATION_NAME,
        slotDurationMinutes: 15,
      })
      .returning({ id: locations.id })
      .then((r) => r[0]);
  }

  let doctor = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.tenantId, tenant.id),
        eq(users.email, DEFAULT_DOCTOR_EMAIL),
      ),
    )
    .limit(1)
    .then((r) => r[0]);

  if (!doctor) {
    doctor = await db
      .insert(users)
      .values({
        tenantId: tenant.id,
        name: "Dokter",
        email: DEFAULT_DOCTOR_EMAIL,
        passwordHash: "!disabled", // auth not wired yet
        role: "doctor",
        specialty: "THT-KL",
      })
      .returning({ id: users.id })
      .then((r) => r[0]);
  }

  cache = {
    tenantId: tenant.id,
    locationId: location.id,
    doctorId: doctor.id,
  };
  return cache;
}
