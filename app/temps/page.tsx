import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { formatDuree, formatEuros, montantLigne } from "@/lib/format";
import { formatDateFr } from "@/app/agenda/constants";
import { TimerWidget } from "./timer-widget";
import { CostInput } from "./cost-input";
import { DossierSelect } from "./dossier-select";
import { removeEntry, assignEntryDossier } from "./actions";

type Periode = "mois" | "30j" | "tout";

const PERIODES: Record<Periode, string> = {
  mois: "Ce mois",
  "30j": "30 derniers jours",
  tout: "Tout",
};

function periodeStart(p: Periode): string | null {
  const now = new Date();
  if (p === "mois")
    return new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
  if (p === "30j")
    return new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  return null;
}

function rel<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

type MyEntry = {
  id: string;
  date_saisie: string;
  duree_minutes: number;
  taux: number | null;
  description: string | null;
  facturee: boolean;
  dossier_id: string | null;
  dossier: { reference: string; titre: string } | { reference: string; titre: string }[] | null;
};

type CabEntry = { avocat_id: string | null; duree_minutes: number; taux: number | null };
type Membre = {
  id: string;
  nom_complet: string | null;
  email: string | null;
  cout_horaire: number | null;
};

export default async function TempsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const user = await requireCabinet();
  const isAdmin = user.role === "admin";
  const { p } = await searchParams;
  const periode: Periode =
    p === "30j" || p === "tout" ? (p as Periode) : "mois";
  const start = periodeStart(periode);

  const supabase = await createClient();

  // Chrono actif.
  const { data: timerRow } = await supabase
    .from("active_timers")
    .select("dossier_id, description, started_at")
    .eq("user_id", user.id)
    .maybeSingle();

  // Dossiers pour le sélecteur.
  const { data: dossiersRaw } = await supabase
    .from("dossiers")
    .select("id, reference, titre")
    .order("created_at", { ascending: false });
  const dossiers = (dossiersRaw ?? []).map((d) => ({
    id: d.id,
    label: `${d.reference} — ${d.titre}`,
  }));

  // Ma feuille de temps sur la période.
  let myQuery = supabase
    .from("time_entries")
    .select(
      "id, date_saisie, duree_minutes, taux, description, facturee, dossier_id, dossier:dossiers(reference, titre)",
    )
    .eq("avocat_id", user.id)
    .order("date_saisie", { ascending: false });
  if (start) myQuery = myQuery.gte("date_saisie", start);
  const { data: myEntries } = await myQuery.returns<MyEntry[]>();

  const myMinutes = (myEntries ?? []).reduce((s, e) => s + e.duree_minutes, 0);
  const myMontant = (myEntries ?? []).reduce(
    (s, e) => s + (montantLigne(e.duree_minutes, e.taux) ?? 0),
    0,
  );

  // Regroupement par jour.
  const byDay = new Map<string, MyEntry[]>();
  for (const e of myEntries ?? []) {
    const list = byDay.get(e.date_saisie) ?? [];
    list.push(e);
    byDay.set(e.date_saisie, list);
  }

  // Rentabilité équipe (admin).
  let rentabilite: {
    membre: string;
    minutes: number;
    ca: number;
    cout: number | null;
    marge: number | null;
    memberId: string;
    coutHoraire: number | null;
  }[] = [];
  if (isAdmin) {
    let cabQuery = supabase
      .from("time_entries")
      .select("avocat_id, duree_minutes, taux");
    if (start) cabQuery = cabQuery.gte("date_saisie", start);
    const [{ data: cabEntries }, { data: membres }] = await Promise.all([
      cabQuery.returns<CabEntry[]>(),
      supabase
        .from("profiles")
        .select("id, nom_complet, email, cout_horaire")
        .eq("cabinet_id", user.cabinetId)
        .returns<Membre[]>(),
    ]);

    const agg = new Map<string, { minutes: number; ca: number }>();
    for (const e of cabEntries ?? []) {
      if (!e.avocat_id) continue;
      const a = agg.get(e.avocat_id) ?? { minutes: 0, ca: 0 };
      a.minutes += e.duree_minutes;
      a.ca += montantLigne(e.duree_minutes, e.taux) ?? 0;
      agg.set(e.avocat_id, a);
    }

    rentabilite = (membres ?? [])
      .map((m) => {
        const a = agg.get(m.id) ?? { minutes: 0, ca: 0 };
        const cout =
          m.cout_horaire != null ? (a.minutes / 60) * m.cout_horaire : null;
        return {
          memberId: m.id,
          membre: m.nom_complet ?? m.email ?? "Membre",
          coutHoraire: m.cout_horaire,
          minutes: a.minutes,
          ca: a.ca,
          cout,
          marge: cout != null ? a.ca - cout : null,
        };
      })
      .sort((x, y) => y.ca - x.ca);
  }

  const active = timerRow
    ? {
        dossierId: timerRow.dossier_id,
        description: timerRow.description,
        startedAt: timerRow.started_at,
      }
    : null;

  return (
    <AppShell user={user}>
      <h1 className="text-xl font-semibold tracking-tight">Temps</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Chronomètre, feuille de temps et rentabilité.
      </p>

      <TimerWidget active={active} dossiers={dossiers} />

      {/* Filtres de période */}
      <div className="mt-8 flex flex-wrap items-center gap-1">
        {(Object.keys(PERIODES) as Periode[]).map((key) => (
          <a
            key={key}
            href={`/temps?p=${key}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              periode === key
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {PERIODES[key]}
          </a>
        ))}
      </div>

      {/* Ma feuille de temps */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Ma feuille de temps · {formatDuree(myMinutes)}
          </h2>
          <span className="text-sm font-medium">{formatEuros(myMontant)}</span>
        </div>

        {byDay.size === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Aucune saisie sur cette période.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-5">
            {[...byDay.entries()].map(([day, entries]) => (
              <div key={day}>
                <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  {formatDateFr(day)}
                </div>
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)]">
                  {entries.map((e) => {
                    const d = rel(e.dossier);
                    return (
                      <div
                        key={e.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <span className="w-16 shrink-0 font-mono text-sm tabular-nums">
                          {formatDuree(e.duree_minutes)}
                        </span>
                        <div className="min-w-0 flex-1">
                          {e.facturee ? (
                            <p className="truncate text-sm font-medium">
                              {d ? d.titre : "Non attribué"}
                            </p>
                          ) : (
                            <div className="max-w-xs">
                              <DossierSelect
                                action={assignEntryDossier}
                                dossiers={dossiers}
                                current={e.dossier_id}
                                entryId={e.id}
                              />
                            </div>
                          )}
                          {e.description && (
                            <p className="mt-0.5 truncate text-xs text-muted">
                              {e.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-sm text-muted">
                          {formatEuros(montantLigne(e.duree_minutes, e.taux))}
                        </span>
                        {!e.facturee && (
                          <form action={removeEntry}>
                            <input type="hidden" name="id" value={e.id} />
                            <button
                              type="submit"
                              aria-label="Supprimer"
                              className="shrink-0 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-black/[0.04] hover:text-red-600 dark:hover:bg-white/5"
                            >
                              ✕
                            </button>
                          </form>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rentabilité équipe (admin) */}
      {isAdmin && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold">Rentabilité des collaborateurs</h2>
          <p className="mt-1 text-sm text-muted">
            Renseignez le coût horaire de chacun pour obtenir la marge (CA −
            coût) sur la période.
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 font-medium">Collaborateur</th>
                  <th className="px-4 py-2.5 text-right font-medium">Temps</th>
                  <th className="px-4 py-2.5 text-right font-medium">CA</th>
                  <th className="px-4 py-2.5 text-right font-medium">Coût/h</th>
                  <th className="px-4 py-2.5 text-right font-medium">Coût</th>
                  <th className="px-4 py-2.5 text-right font-medium">Marge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rentabilite.map((r) => (
                  <tr key={r.memberId}>
                    <td className="px-4 py-2.5 font-medium">{r.membre}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatDuree(r.minutes)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatEuros(r.ca)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <CostInput memberId={r.memberId} cout={r.coutHoraire} />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                      {r.cout != null ? formatEuros(r.cout) : "—"}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-medium tabular-nums ${
                        r.marge == null
                          ? ""
                          : r.marge >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {r.marge != null ? formatEuros(r.marge) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AppShell>
  );
}
