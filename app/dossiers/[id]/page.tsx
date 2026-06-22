import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { DossierForm } from "../dossier-form";
import { updateDossierAction } from "../actions";
import { getDossierFormOptions } from "../data";
import { DeleteDossierButton } from "./delete-button";

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCabinet();
  const supabase = await createClient();

  const { data: dossier } = await supabase
    .from("dossiers")
    .select(
      "id, reference, titre, client_id, avocat_id, type_affaire, statut, description, date_ouverture, date_cloture",
    )
    .eq("id", id)
    .single();

  if (!dossier) notFound();

  const { clients, avocats } = await getDossierFormOptions();
  const updateWithId = updateDossierAction.bind(null, dossier.id);

  return (
    <AppShell user={user}>
      <div className="flex items-center justify-between">
        <Link
          href="/dossiers"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Dossiers
        </Link>
        <DeleteDossierButton id={dossier.id} />
      </div>

      <div className="mb-6 mt-2 flex items-baseline gap-3">
        <span className="font-mono text-sm text-zinc-400">
          {dossier.reference}
        </span>
        <h1 className="text-xl font-semibold tracking-tight">
          {dossier.titre}
        </h1>
      </div>

      <DossierForm
        action={updateWithId}
        clients={clients}
        avocats={avocats}
        defaults={{
          client_id: dossier.client_id,
          avocat_id: dossier.avocat_id,
          titre: dossier.titre,
          type_affaire: dossier.type_affaire,
          statut: dossier.statut,
          description: dossier.description,
          date_ouverture: dossier.date_ouverture,
          date_cloture: dossier.date_cloture,
        }}
        submitLabel="Enregistrer"
        cancelHref="/dossiers"
      />
    </AppShell>
  );
}
