import { NextRequest, NextResponse } from "next/server";
import { listPatients, umurDariTglLahir } from "@/lib/patients";

export const dynamic = "force-dynamic";

export type PatientHit = {
  id: string;
  nama: string;
  noRm: string;
  jenisKelamin: string;
  umur: string;
  href: string;
};

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json<{ items: PatientHit[] }>({ items: [] });

  const rows = await listPatients(q);
  const items: PatientHit[] = rows.slice(0, 8).map((r) => ({
    id: r.id,
    nama: r.nama,
    noRm: r.noRm,
    jenisKelamin: r.jk,
    umur: r.tglLahir ? umurDariTglLahir(r.tglLahir) : "-",
    href: `/pasien/${r.id}`,
  }));

  return NextResponse.json({ items });
}
