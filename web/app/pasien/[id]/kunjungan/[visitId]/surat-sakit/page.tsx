import { notFound } from "next/navigation";
import { getPatientById, umurDariTglLahir } from "@/lib/patients";
import { getVisitById, fmtTanggalKunjungan } from "@/lib/visits";
import { SuratSakitClient } from "./surat-sakit-client";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string; visitId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id, visitId } = await params;
  const [p, fv] = await Promise.all([
    getPatientById(id),
    getVisitById(visitId),
  ]);
  if (!p || !fv) return { title: "Surat keterangan sakit" };
  return { title: `Surat sakit · ${p.nama}` };
}

export default async function SuratSakitPage({ params }: { params: Params }) {
  const { id, visitId } = await params;
  const [p, fv] = await Promise.all([
    getPatientById(id),
    getVisitById(visitId),
  ]);
  if (!p || !fv || fv.visit.patientId !== id) notFound();

  const v = fv.visit;
  // Plain JSON only (Next 16 server→client boundary rule).
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
  const diagnosesJson = fv.diagnoses.map((d) => ({
    icd10Code: d.icd10Code,
    icd10NameId: d.icd10NameId ?? d.icd10NameEn ?? d.icd10Code,
    primary: d.diagnosisType === "primary",
  }));

  return (
    <SuratSakitClient
      patient={patientJson}
      visit={visitJson}
      diagnoses={diagnosesJson}
    />
  );
}
