import { notFound } from "next/navigation";
import { getPatientById, umurDariTglLahir } from "@/lib/patients";
import { getVisitById, fmtTanggalKunjungan } from "@/lib/visits";
import { CetakResepClient } from "./cetak-resep-client";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string; visitId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id, visitId } = await params;
  const [p, fv] = await Promise.all([
    getPatientById(id),
    getVisitById(visitId),
  ]);
  if (!p || !fv) return { title: "Cetak resep" };
  return { title: `Cetak resep · ${p.nama}` };
}

export default async function CetakResepPage({ params }: { params: Params }) {
  const { id, visitId } = await params;
  const [p, fv] = await Promise.all([
    getPatientById(id),
    getVisitById(visitId),
  ]);
  if (!p || !fv || fv.visit.patientId !== id) notFound();

  const v = fv.visit;
  // Plain JSON only — supaya aman dilewatkan ke Client Component (per Next 16 rule).
  const patientJson = {
    id: p.id,
    nama: p.nama,
    noRm: p.noRm,
    nik: p.nik,
    jk: p.jk,
    tglLahir: p.tglLahir,
    umur: umurDariTglLahir(p.tglLahir),
    alamat: p.alamat,
  };
  const visitJson = {
    id: v.id,
    visitNumber: v.visitNumber,
    visitDateLong: fmtTanggalKunjungan(v.visitDate),
    chiefComplaint: v.chiefComplaint,
  };
  const prescriptionsJson = fv.prescriptions
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((rx) => ({
      id: rx.id,
      drugName: rx.drugName,
      genericName: rx.genericName,
      drugForm: rx.drugForm,
      strength: rx.strength,
      dose: rx.dose,
      frequency: rx.frequency,
      duration: rx.duration,
      route: rx.route,
      instructions: rx.instructions,
      quantity: rx.quantity,
      unit: rx.unit,
    }));
  const diagnosesJson = fv.diagnoses.map((d) => ({
    icd10Code: d.icd10Code,
    icd10NameId: d.icd10NameId ?? d.icd10NameEn ?? d.icd10Code,
    primary: d.diagnosisType === "primary",
  }));

  return (
    <CetakResepClient
      patient={patientJson}
      visit={visitJson}
      prescriptions={prescriptionsJson}
      diagnoses={diagnosesJson}
    />
  );
}
