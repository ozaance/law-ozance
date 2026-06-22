import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { formatDuree, formatEuros, montantLigne } from "@/lib/format";
import { formatDateFr } from "@/app/agenda/constants";
import { StatutControl } from "./statut-control";
import { DeleteFactureButton } from "./delete-button";

export default async function FactureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCabinet();
  const supabase = await createClient();

  const { data: facture } = await supabase
    .from("factures")
    .select(
      "id, numero, statut, date_emission, date_echeance, notes, total, client:clients(nom, email)",
    )
    .eq("id", id)
    .single();

  if (!facture) notFound();

  const { data: lignes } = await supabase
    .from("time_entries")
    .select(
      "id, date_saisie, duree_minutes, taux, description, dossier:dossiers(reference)",
    )
    .eq("facture_id", id)
    .order("date_saisie", { ascending: true });

  const client = Array.isArray(facture.client)
    ? facture.client[0]
    : (facture.client as { nom: string; email: string | null } | null);

  return (
    <AppShell user={user}>
      <div className="flex items-center justify-between">
        <Link
          href="/factures"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Factures
        </Link>
        <div className="flex items-center gap-3">
          <StatutControl id={facture.id} statut={facture.statut} />
          <DeleteFactureButton id={facture.id} />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-mono text-lg font-semibold">
              {facture.numero}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Émise le {formatDateFr(facture.date_emission)}
              {facture.date_echeance
                ? ` · échéance ${formatDateFr(facture.date_echeance)}`
                : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{client?.nom}</p>
            {client?.email && (
              <p className="text-xs text-zinc-500">{client.email}</p>
            )}
          </div>
        </div>

        <div className="mt-6 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {(lignes ?? []).map((l) => {
            const dossier = Array.isArray(l.dossier)
              ? l.dossier[0]
              : (l.dossier as { reference: string } | null);
            return (
              <div
                key={l.id}
                className="flex items-center gap-3 py-2.5 text-sm"
              >
                <span className="w-20 shrink-0 text-xs text-zinc-500">
                  {l.date_saisie}
                </span>
                <span className="w-16 shrink-0 font-medium">
                  {formatDuree(l.duree_minutes)}
                </span>
                <span className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-400">
                  <span className="font-mono text-xs text-zinc-400">
                    {dossier?.reference}
                  </span>{" "}
                  {l.description ?? "—"}
                </span>
                <span className="w-20 shrink-0 text-right text-xs text-zinc-500">
                  {l.taux ? `${l.taux} €/h` : "—"}
                </span>
                <span className="w-24 shrink-0 text-right">
                  {formatEuros(montantLigne(l.duree_minutes, l.taux))}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              Total
            </p>
            <p className="text-2xl font-semibold">
              {formatEuros(Number(facture.total))}
            </p>
          </div>
        </div>

        {facture.notes && (
          <p className="mt-4 border-t border-zinc-200 pt-4 text-sm text-zinc-500 dark:border-zinc-800">
            {facture.notes}
          </p>
        )}
      </div>
    </AppShell>
  );
}
