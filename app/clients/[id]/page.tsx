import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ClientForm } from "../client-form";
import { updateClientAction } from "../actions";
import { DeleteClientButton } from "./delete-button";
import {
  STATUTS,
  STATUT_COLORS,
  type Statut,
} from "@/app/dossiers/constants";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCabinet();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, type, nom, siren, forme_juridique, email, telephone, notes")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("id, reference, titre, statut")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const updateWithId = updateClientAction.bind(null, client.id);

  return (
    <AppShell user={user}>
      <div className="flex items-center justify-between">
        <Link
          href="/clients"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Clients
        </Link>
        <DeleteClientButton id={client.id} />
      </div>

      <h1 className="mb-6 mt-2 text-xl font-semibold tracking-tight">
        {client.nom}
      </h1>

      <section className="mb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-500">
            Dossiers ({dossiers?.length ?? 0})
          </h2>
          <Link
            href={`/dossiers/new?client=${client.id}`}
            className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
          >
            + Nouveau dossier
          </Link>
        </div>
        {dossiers?.length ? (
          <div className="mt-3 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {dossiers.map((d) => (
              <Link
                key={d.id}
                href={`/dossiers/${d.id}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="font-mono text-xs text-zinc-400">
                    {d.reference}
                  </span>
                  <span className="truncate text-sm">{d.titre}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUT_COLORS[d.statut as Statut]
                  }`}
                >
                  {STATUTS[d.statut as Statut]}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-400">
            Aucun dossier pour ce client.
          </p>
        )}
      </section>

      <h2 className="mb-4 text-sm font-medium text-zinc-500">Informations</h2>
      <ClientForm
        action={updateWithId}
        defaults={{
          type: client.type,
          nom: client.nom,
          siren: client.siren,
          forme_juridique: client.forme_juridique,
          email: client.email,
          telephone: client.telephone,
          notes: client.notes,
        }}
        submitLabel="Enregistrer"
        cancelHref="/clients"
      />
    </AppShell>
  );
}
