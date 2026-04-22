import { notFound } from "next/navigation";
import { getPatientById, umurDariTglLahir } from "@/lib/patients";
import { getVisitById, fmtTanggalKunjungan } from "@/lib/visits";
import { SuratSehatClient } from "./surat-sehat-client";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string; visitId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id, visitId } = await params;
  const [p, fv] = await Promise.all([
    getPatientById(id),
    getVisitById(visitId),
  ]);
  if (!p || !fv) return { title: "Surat keterangan sehat" };
  return { title: `Surat sehat · ${p.nama}` };
}

export default async function SuratSehatPage({ params }: { params: Params }) {
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
  };

  return <SuratSehatClient patient={patientJson} visit={visitJson} />;
}
