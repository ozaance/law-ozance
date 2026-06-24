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
import {
  STATUTS_FACTURE,
  STATUT_FACTURE_COLORS,
  type StatutFacture,
} from "@/app/factures/constants";
import { formatEuros } from "@/lib/format";

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
    .select(
      "id, type, nom, siren, forme_juridique, tva_intra, email, telephone, adresse, code_postal, ville, notes",
    )
    .eq("id", id)
    .single();

  if (!client) notFound();

  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("id, reference, titre, statut")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const { data: factures } = await supabase
    .from("factures")
    .select("id, numero, statut, total")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const updateWithId = updateClientAction.bind(null, client.id);

  return (
    <AppShell user={user}>
      <div className="flex items-center justify-between">
        <Link
          href="/clients"
          className="text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100"
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
          <h2 className="text-sm font-medium text-muted">
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
          <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)] dark:divide-border dark:border-border">
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

      <section className="mb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">
            Factures ({factures?.length ?? 0})
          </h2>
          <Link
            href={`/factures/new?client=${client.id}`}
            className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
          >
            + Créer une facture
          </Link>
        </div>
        {factures?.length ? (
          <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)] dark:divide-border dark:border-border">
            {factures.map((f) => (
              <Link
                key={f.id}
                href={`/factures/${f.id}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-zinc-400">
                    {f.numero}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUT_FACTURE_COLORS[f.statut as StatutFacture]
                    }`}
                  >
                    {STATUTS_FACTURE[f.statut as StatutFacture]}
                  </span>
                </span>
                <span className="text-sm font-medium">
                  {formatEuros(Number(f.total))}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-400">Aucune facture.</p>
        )}
      </section>

      <h2 className="mb-4 text-sm font-medium text-muted">Informations</h2>
      <ClientForm
        action={updateWithId}
        defaults={{
          type: client.type,
          nom: client.nom,
          siren: client.siren,
          forme_juridique: client.forme_juridique,
          tva_intra: client.tva_intra,
          email: client.email,
          telephone: client.telephone,
          adresse: client.adresse,
          code_postal: client.code_postal,
          ville: client.ville,
          notes: client.notes,
        }}
        submitLabel="Enregistrer"
        cancelHref="/clients"
      />
    </AppShell>
  );
}
