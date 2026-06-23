import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { EvenementForm } from "../evenement-form";
import { updateEvenementAction } from "../actions";
import { getEvenementFormOptions } from "../data";
import { DeleteEvenementButton } from "./delete-button";

export default async function EvenementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCabinet();
  const supabase = await createClient();

  const { data: ev } = await supabase
    .from("evenements")
    .select(
      "id, type, titre, dossier_id, assigne_a, date_evenement, heure, lieu, notes",
    )
    .eq("id", id)
    .single();

  if (!ev) notFound();

  const { dossiers, avocats } = await getEvenementFormOptions();
  const updateWithId = updateEvenementAction.bind(null, ev.id);

  return (
    <AppShell user={user}>
      <div className="flex items-center justify-between">
        <Link
          href="/agenda"
          className="text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Agenda
        </Link>
        <DeleteEvenementButton id={ev.id} />
      </div>

      <h1 className="mb-6 mt-2 text-xl font-semibold tracking-tight">
        {ev.titre}
      </h1>

      <EvenementForm
        action={updateWithId}
        dossiers={dossiers}
        avocats={avocats}
        defaults={{
          type: ev.type,
          titre: ev.titre,
          dossier_id: ev.dossier_id,
          assigne_a: ev.assigne_a,
          date_evenement: ev.date_evenement,
          heure: ev.heure,
          lieu: ev.lieu,
          notes: ev.notes,
        }}
        submitLabel="Enregistrer"
        cancelHref="/agenda"
      />
    </AppShell>
  );
}
