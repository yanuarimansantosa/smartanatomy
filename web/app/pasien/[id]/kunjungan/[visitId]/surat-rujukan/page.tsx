import { notFound } from "next/navigation";
import { getPatientById, umurDariTglLahir } from "@/lib/patients";
import { getVisitById, fmtTanggalKunjungan } from "@/lib/visits";
import { SuratRujukanClient } from "./surat-rujukan-client";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string; visitId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id, visitId } = await params;
  const [p, fv] = await Promise.all([
    getPatientById(id),
    getVisitById(visitId),
  ]);
  if (!p || !fv) return { title: "Surat rujukan" };
  return { title: `Rujukan · ${p.nama}` };
}

export default async function SuratRujukanPage({ params }: { params: Params }) {
  const { id, visitId } = await params;
  const [p, fv] = await Promise.all([
    getPatientById(id),
    getVisitById(visitId),
  ]);
  if (!p || !fv || fv.visit.patientId !== id) notFound();

  const v = fv.visit;
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
    visitDate: v.visitDate,
    visitDateLong: fmtTanggalKunjungan(v.visitDate),
    chiefComplaint: v.chiefComplaint,
  };
  const soapJson = fv.soap
    ? {
        subjective: fv.soap.subjective,
        objective: fv.soap.objective,
        assessment: fv.soap.assessment,
        plan: fv.soap.plan,
      }
    : null;
  const diagnosesJson = fv.diagnoses
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((d) => ({
      icd10Code: d.icd10Code,
      icd10NameId: d.icd10NameId ?? d.icd10NameEn ?? d.icd10Code,
      primary: d.diagnosisType === "primary",
    }));
  const prescriptionsJson = fv.prescriptions
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((rx) => ({
      drugName: rx.drugName,
      strength: rx.strength,
      dose: rx.dose,
      frequency: rx.frequency,
      duration: rx.duration,
    }));

  return (
    <SuratRujukanClient
      patient={patientJson}
      visit={visitJson}
      soap={soapJson}
      diagnoses={diagnosesJson}
      prescriptions={prescriptionsJson}
    />
  );
}
