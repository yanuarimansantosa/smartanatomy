"use server";

import { db } from "@/db/client";
import { patients } from "@/db/schema";
import { nextNoRm } from "@/lib/patients";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createPatientSchema = z.object({
  nama: z.string().trim().min(2, "Nama minimal 2 karakter").max(200),
  nik: z
    .string()
    .trim()
    .regex(/^\d{16}$/u, "NIK harus 16 digit angka")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  tglLahir: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, "Tanggal lahir wajib diisi (YYYY-MM-DD)"),
  jk: z.enum(["L", "P"]),
  telepon: z.string().trim().max(20).optional().or(z.literal("").transform(() => undefined)),
  email: z
    .string()
    .trim()
    .email("Email tidak valid")
    .max(120)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  alamat: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
  catatan: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
});

export type CreatePatientState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createPatient(
  _prev: CreatePatientState,
  formData: FormData,
): Promise<CreatePatientState> {
  const raw = Object.fromEntries(formData);
  const parsed = createPatientSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali isian form.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = parsed.data;
  const noRm = await nextNoRm();

  let createdId: string;
  try {
    const inserted = await db
      .insert(patients)
      .values({
        noRm,
        nama: data.nama,
        nik: data.nik,
        tglLahir: data.tglLahir,
        jk: data.jk,
        telepon: data.telepon,
        email: data.email,
        alamat: data.alamat,
        catatan: data.catatan,
      })
      .returning({ id: patients.id });
    createdId = inserted[0].id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan pasien.";
    if (msg.includes("patients_nik_unique_idx")) {
      return {
        ok: false,
        message: "NIK sudah terdaftar untuk pasien lain.",
        fieldErrors: { nik: ["NIK sudah terdaftar"] },
      };
    }
    return { ok: false, message: msg };
  }

  revalidatePath("/pasien");
  redirect(`/pasien/${createdId}`);
}
