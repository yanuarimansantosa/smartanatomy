import { notFound } from "next/navigation";
import { getPatientById } from "@/lib/patients";
import { getVisitById } from "@/lib/visits";
import { MODULE_LISTINGS, isModuleAvailable } from "@/lib/modules/registry";
import { ModuleRenderer } from "@/components/module-engine/module-renderer";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string; visitId: string; moduleId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { moduleId } = await params;
  const listing = MODULE_LISTINGS.find((l) => l.id === moduleId);
  return { title: listing ? `${listing.title} — Modul` : "Modul" };
}

export default async function ModulePage({ params }: { params: Params }) {
  const { id, visitId, moduleId } = await params;

  if (!isModuleAvailable(moduleId)) notFound();

  const [p, fv] = await Promise.all([
    getPatientById(id),
    getVisitById(visitId),
  ]);

  if (!p || !fv || fv.visit.patientId !== id) notFound();

  const listing = MODULE_LISTINGS.find((l) => l.id === moduleId)!;

  return (
    <ModuleRenderer
      moduleId={moduleId}
      listing={listing}
      visitId={visitId}
      patientId={id}
      chiefComplaint={fv.visit.chiefComplaint ?? ""}
    />
  );
}
