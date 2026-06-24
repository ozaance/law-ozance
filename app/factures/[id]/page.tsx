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
      "id, numero, statut, type_document, objet, honoraire_resultat, date_emission, date_echeance, notes, montant_ht, taux_tva, montant_tva, total, client:clients(nom, email)",
    )
    .eq("id", id)
    .single();

  if (!facture) notFound();

  const { data: lignesLibres } = await supabase
    .from("facture_lignes")
    .select("id, designation, montant, ordre")
    .eq("facture_id", id)
    .order("ordre", { ascending: true });
  const forfait = (lignesLibres ?? []).length > 0;

  const { data: lignes } = forfait
    ? { data: [] }
    : await supabase
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
          className="text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Factures
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/factures/${facture.id}/impression`}
            className="rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
          >
            Imprimer / PDF
          </Link>
          <StatutControl id={facture.id} statut={facture.statut} />
          <DeleteFactureButton id={facture.id} />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-sm)] dark:border-border">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-mono text-lg font-semibold">
              {facture.numero ?? "Brouillon"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Émise le {formatDateFr(facture.date_emission)}
              {facture.date_echeance
                ? ` · échéance ${formatDateFr(facture.date_echeance)}`
                : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{client?.nom}</p>
            {client?.email && (
              <p className="text-xs text-muted">{client.email}</p>
            )}
          </div>
        </div>

        {facture.objet && (
          <p className="mt-4 text-sm">
            <span className="font-medium">Objet : </span>
            <span className="text-muted">{facture.objet}</span>
          </p>
        )}

        <div className="mt-6 divide-y divide-border border-y border-border dark:divide-border dark:border-border">
          {forfait
            ? (lignesLibres ?? []).map((l) => (
                <div key={l.id} className="flex items-start gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
                    {l.designation}
                  </span>
                  <span className="w-24 shrink-0 text-right">
                    {formatEuros(Number(l.montant))}
                  </span>
                </div>
              ))
            : (lignes ?? []).map((l) => {
                const dossier = Array.isArray(l.dossier)
                  ? l.dossier[0]
                  : (l.dossier as { reference: string } | null);
                return (
                  <div
                    key={l.id}
                    className="flex items-center gap-3 py-2.5 text-sm"
                  >
                    <span className="w-20 shrink-0 text-xs text-muted">
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
                    <span className="w-20 shrink-0 text-right text-xs text-muted">
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
          <div className="w-60 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted">Total HT</span>
              <span className="tabular-nums">
                {formatEuros(Number(facture.montant_ht ?? 0))}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted">
                TVA{" "}
                {Number(facture.taux_tva ?? 0) > 0
                  ? `(${Number(facture.taux_tva)} %)`
                  : ""}
              </span>
              <span className="tabular-nums">
                {Number(facture.taux_tva ?? 0) > 0
                  ? formatEuros(Number(facture.montant_tva ?? 0))
                  : "Non applicable"}
              </span>
            </div>
            <div className="mt-1 flex justify-between border-t border-border pt-2 text-lg font-semibold">
              <span>Total TTC</span>
              <span className="tabular-nums">
                {formatEuros(Number(facture.total))}
              </span>
            </div>
          </div>
        </div>

        {facture.notes && (
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted dark:border-border">
            {facture.notes}
          </p>
        )}
      </div>
    </AppShell>
  );
}
