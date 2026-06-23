import Link from "next/link";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { formatEuros } from "@/lib/format";
import {
  STATUTS_FACTURE,
  STATUT_FACTURE_COLORS,
  type StatutFacture,
} from "./constants";

export default async function FacturesPage() {
  const user = await requireCabinet();
  const supabase = await createClient();

  const { data: factures } = await supabase
    .from("factures")
    .select("id, numero, statut, date_emission, total, client:clients(nom)")
    .order("created_at", { ascending: false });

  const totalDu = (factures ?? [])
    .filter((f) => f.statut === "envoyee")
    .reduce((s, f) => s + Number(f.total), 0);

  return (
    <AppShell user={user}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Factures</h1>
          <p className="mt-1 text-sm text-muted">
            {factures?.length ?? 0} facture
            {(factures?.length ?? 0) > 1 ? "s" : ""} · {formatEuros(totalDu)} en
            attente de paiement
          </p>
        </div>
        <Link
          href="/factures/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
        >
          + Nouvelle facture
        </Link>
      </div>

      {!factures?.length ? (
        <div className="mt-10 rounded-lg border border-dashed border-border-strong py-16 text-center dark:border-border-strong">
          <p className="text-sm text-muted">Aucune facture.</p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)] dark:divide-border dark:border-border">
          {factures.map((f) => {
            const clientNom = Array.isArray(f.client)
              ? f.client[0]?.nom
              : (f.client as { nom: string } | null)?.nom;
            return (
              <Link
                key={f.id}
                href={`/factures/${f.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-zinc-400">
                    {f.numero}
                  </span>
                  <span className="text-sm font-medium">{clientNom}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {formatEuros(Number(f.total))}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUT_FACTURE_COLORS[f.statut as StatutFacture]
                    }`}
                  >
                    {STATUTS_FACTURE[f.statut as StatutFacture]}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
