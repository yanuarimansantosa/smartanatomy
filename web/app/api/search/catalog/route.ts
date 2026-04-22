import { NextResponse } from "next/server";
import { MODULE_LISTINGS } from "@/lib/modules/registry";
import { getAllIcd10, getAllIcd9 } from "@/lib/modules/catalog";

export const dynamic = "force-static";
export const revalidate = 3600;

export type SearchCatalog = {
  modules: Array<{
    id: string;
    title: string;
    subspecialty: string;
    tags: string[];
    href: string;
  }>;
  icd10: Array<{
    code: string;
    display: string;
    moduleId: string;
    moduleTitle: string;
    href: string;
  }>;
  icd9: Array<{
    code: string;
    nameId: string;
    treatmentLabel: string;
    moduleId: string;
    moduleTitle: string;
    feeIdr?: number;
    href: string;
  }>;
};

export async function GET() {
  const [icd10, icd9] = await Promise.all([getAllIcd10(), getAllIcd9()]);

  const payload: SearchCatalog = {
    modules: MODULE_LISTINGS.map((m) => ({
      id: m.id,
      title: m.title,
      subspecialty: m.subspecialty,
      tags: m.tags ?? [],
      href: `/cdss-tester?module=${encodeURIComponent(m.id)}`,
    })),
    icd10: icd10.map((d) => ({
      code: d.code,
      display: d.display,
      moduleId: d.moduleId,
      moduleTitle: d.moduleTitle,
      href: `/icd-10?q=${encodeURIComponent(d.code)}`,
    })),
    icd9: icd9.map((p) => ({
      code: p.code,
      nameId: p.nameId,
      treatmentLabel: p.treatmentLabel,
      moduleId: p.moduleId,
      moduleTitle: p.moduleTitle,
      feeIdr: p.feeIdr,
      href: `/icd-9?q=${encodeURIComponent(p.code)}`,
    })),
  };

  return NextResponse.json(payload);
}
