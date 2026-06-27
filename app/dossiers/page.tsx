import Link from "next/link";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { STATUTS, STATUT_COLORS, TYPES_AFFAIRE, type Statut } from "./constants";

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const user = await requireCabinet();
  const { statut } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("dossiers")
    .select(
      "id, reference, titre, type_affaire, statut, client:clients(id, nom), avocat:profiles(nom_complet)",
    )
    .order("created_at", { ascending: false });

  if (statut && statut in STATUTS) query = query.eq("statut", statut);

  const { data: dossiers } = await query;

  // Regroupement par client (tri alphabétique des clients).
  const groupes = new Map<
    string,
    { clientNom: string; dossiers: NonNullable<typeof dossiers> }
  >();
  for (const d of dossiers ?? []) {
    const client = Array.isArray(d.client) ? d.client[0] : d.client;
    const cid = (client as { id?: string } | null)?.id ?? "_sans";
    const cnom = (client as { nom?: string } | null)?.nom ?? "Sans client";
    const g = groupes.get(cid) ?? { clientNom: cnom, dossiers: [] };
    g.dossiers.push(d);
    groupes.set(cid, g);
  }
  const groupesTries = [...groupes.values()].sort((a, b) =>
    a.clientNom.localeCompare(b.clientNom, "fr"),
  );

  return (
    <AppShell user={user}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dossiers</h1>
          <p className="mt-1 text-sm text-muted">
            {dossiers?.length ?? 0} dossier{(dossiers?.length ?? 0) > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dossiers/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
        >
          + Nouveau dossier
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-1">
        <FilterChip label="Tous" href="/dossiers" active={!statut} />
        {Object.entries(STATUTS).map(([v, label]) => (
          <FilterChip
            key={v}
            label={label}
            href={`/dossiers?statut=${v}`}
            active={statut === v}
          />
        ))}
      </div>

      {!dossiers?.length ? (
        <div className="mt-10 rounded-lg border border-dashed border-border-strong py-16 text-center dark:border-border-strong">
          <p className="text-sm text-muted">Aucun dossier.</p>
          <Link
            href="/dossiers/new"
            className="mt-3 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Créer un dossier
          </Link>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-6">
          {groupesTries.map((g) => (
            <div key={g.clientNom}>
              <div className="mb-2 flex items-baseline gap-2 px-1">
                <h2 className="text-sm font-semibold">{g.clientNom}</h2>
                <span className="text-xs text-muted">
                  {g.dossiers.length} dossier
                  {g.dossiers.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)] dark:divide-border dark:border-border">
                {g.dossiers.map((d) => {
                  const avocatNom = relNom(d.avocat, "nom_complet");
                  return (
                    <Link
                      key={d.id}
                      href={`/dossiers/${d.id}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-zinc-400">
                            {d.reference}
                          </span>
                          <span className="truncate text-sm font-medium">
                            {d.titre}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          {avocatNom ? `${avocatNom} · ` : ""}
                          {
                            TYPES_AFFAIRE[
                              d.type_affaire as keyof typeof TYPES_AFFAIRE
                            ]
                          }
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUT_COLORS[d.statut as Statut]
                        }`}
                      >
                        {STATUTS[d.statut as Statut]}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function relNom(rel: unknown, key = "nom"): string {
  const obj = Array.isArray(rel) ? rel[0] : rel;
  return (obj as Record<string, string> | null)?.[key] ?? "";
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-sm transition-colors ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "border border-border text-zinc-600 hover:bg-zinc-100 dark:border-border dark:text-zinc-400 dark:hover:bg-zinc-900"
      }`}
    >
      {label}
    </Link>
  );
}
