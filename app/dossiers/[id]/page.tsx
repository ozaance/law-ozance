import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { DossierForm } from "../dossier-form";
import { updateDossierAction } from "../actions";
import { getDossierFormOptions } from "../data";
import { DeleteDossierButton } from "./delete-button";
import {
  TYPES_EVENEMENT,
  TYPE_COLORS,
  formatDateFr,
  type TypeEvenement,
} from "@/app/agenda/constants";

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

  const { data: evenements } = await supabase
    .from("evenements")
    .select("id, type, titre, date_evenement, termine")
    .eq("dossier_id", dossier.id)
    .order("date_evenement", { ascending: true });

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

      <section className="mb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">
            Échéances &amp; événements ({evenements?.length ?? 0})
          </h2>
          <Link
            href={`/agenda/new?dossier=${dossier.id}`}
            className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
          >
            + Nouvel événement
          </Link>
        </div>
        {evenements?.length ? (
          <div className="mt-3 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {evenements.map((e) => (
              <Link
                key={e.id}
                href={`/agenda/${e.id}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      TYPE_COLORS[e.type as TypeEvenement]
                    }`}
                  >
                    {TYPES_EVENEMENT[e.type as TypeEvenement]}
                  </span>
                  <span
                    className={`truncate text-sm ${
                      e.termine ? "text-zinc-400 line-through" : ""
                    }`}
                  >
                    {e.titre}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {formatDateFr(e.date_evenement)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-400">
            Aucune échéance pour ce dossier.
          </p>
        )}
      </section>

      <h2 className="mb-4 text-sm font-medium text-zinc-500">Informations</h2>
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
