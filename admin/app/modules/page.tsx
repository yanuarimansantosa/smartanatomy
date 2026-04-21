import { PageStub } from "@/components/page-stub";

export default function ModulesPage() {
  return (
    <PageStub
      title="Modules"
      subtitle="Kelola katalog modul core &amp; optional. Tenant pilih dari menu 'Tambah Modul' sesuai tier (Basic / Pro / Gold)."
      cta={{ label: "Tambah modul baru" }}
    />
  );
}
