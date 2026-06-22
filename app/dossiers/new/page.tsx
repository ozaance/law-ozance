import Link from "next/link";
import { requireCabinet } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { DossierForm } from "../dossier-form";
import { createDossierAction } from "../actions";
import { getDossierFormOptions } from "../data";

export default async function NewDossierPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const user = await requireCabinet();
  const { client } = await searchParams;
  const { clients, avocats } = await getDossierFormOptions();

  return (
    <AppShell user={user}>
      <Link
        href="/dossiers"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Dossiers
      </Link>
      <h1 className="mb-6 mt-2 text-xl font-semibold tracking-tight">
        Nouveau dossier
      </h1>
      <DossierForm
        action={createDossierAction}
        clients={clients}
        avocats={avocats}
        defaults={{ client_id: client, avocat_id: user.id }}
        submitLabel="Créer le dossier"
        cancelHref="/dossiers"
      />
    </AppShell>
  );
}
