import Link from "next/link";
import { requireCabinet } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { EvenementForm } from "../evenement-form";
import { createEvenementAction } from "../actions";
import { getEvenementFormOptions } from "../data";

export default async function NewEvenementPage({
  searchParams,
}: {
  searchParams: Promise<{ dossier?: string }>;
}) {
  const user = await requireCabinet();
  const { dossier } = await searchParams;
  const { dossiers, avocats } = await getEvenementFormOptions();

  return (
    <AppShell user={user}>
      <Link
        href="/agenda"
        className="text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Agenda
      </Link>
      <h1 className="mb-6 mt-2 text-xl font-semibold tracking-tight">
        Nouvel événement
      </h1>
      <EvenementForm
        action={createEvenementAction}
        dossiers={dossiers}
        avocats={avocats}
        defaults={{ dossier_id: dossier, assigne_a: user.id }}
        submitLabel="Créer"
        cancelHref="/agenda"
      />
    </AppShell>
  );
}
