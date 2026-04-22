import { notFound } from "next/navigation";
import { getPatientById } from "@/lib/patients";
import { getVisitById } from "@/lib/visits";
import { getModuleSpec } from "@/lib/modules/registry";
import { ModuleRenderer } from "@/components/module-engine/module-renderer";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string; visitId: string; moduleId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { moduleId } = await params;
  const spec = await getModuleSpec(moduleId);
  return { title: spec ? `${spec.title} — Modul` : "Modul" };
}

export default async function ModulePage({ params }: { params: Params }) {
  const { id, visitId, moduleId } = await params;

  const [p, fv, spec] = await Promise.all([
    getPatientById(id),
    getVisitById(visitId),
    getModuleSpec(moduleId),
  ]);

  if (!p || !fv || fv.visit.patientId !== id) notFound();
  if (!spec) notFound();

  return (
    <ModuleRenderer
      spec={spec}
      visitId={visitId}
      patientId={id}
      chiefComplaint={fv.visit.chiefComplaint ?? ""}
    />
  );
}
