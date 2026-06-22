import Link from "next/link";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { montantLigne } from "@/lib/format";
import { FactureForm, type Ligne } from "./facture-form";

export default async function NewFacturePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const user = await requireCabinet();
  const { client: clientId } = await searchParams;
  const supabase = await createClient();

  // Pas de client choisi : on liste les clients
  if (!clientId) {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, nom")
      .order("nom");
    return (
      <AppShell user={user}>
        <Link
          href="/factures"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Factures
        </Link>
        <h1 className="mb-6 mt-2 text-xl font-semibold tracking-tight">
          Nouvelle facture — choisir un client
        </h1>
        <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {(clients ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/factures/new?client=${c.id}`}
              className="block px-4 py-3 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              {c.nom}
            </Link>
          ))}
        </div>
      </AppShell>
    );
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, nom")
    .eq("id", clientId)
    .single();

  // Saisies de temps non facturées des dossiers de ce client
  const { data: entries } = await supabase
    .from("time_entries")
    .select(
      "id, date_saisie, duree_minutes, taux, description, dossier:dossiers!inner(reference, client_id)",
    )
    .eq("facturee", false)
    .eq("dossier.client_id", clientId)
    .order("date_saisie", { ascending: true });

  const lignes: Ligne[] = (entries ?? []).map((e) => {
    const dossier = Array.isArray(e.dossier) ? e.dossier[0] : e.dossier;
    return {
      id: e.id,
      date: e.date_saisie,
      dureeMinutes: e.duree_minutes,
      description: e.description ?? "—",
      dossier: (dossier as { reference: string } | null)?.reference ?? "",
      montant: montantLigne(e.duree_minutes, e.taux),
    };
  });

  return (
    <AppShell user={user}>
      <Link
        href="/factures"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Factures
      </Link>
      <h1 className="mb-1 mt-2 text-xl font-semibold tracking-tight">
        Nouvelle facture
      </h1>
      <p className="mb-6 text-sm text-zinc-500">{client?.nom}</p>

      {lignes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">
            Aucune saisie de temps à facturer pour ce client.
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Ajoutez du temps depuis les dossiers du client.
          </p>
        </div>
      ) : (
        <FactureForm clientId={clientId} lignes={lignes} />
      )}
    </AppShell>
  );
}
