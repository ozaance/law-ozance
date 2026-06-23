import Link from "next/link";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { formatEuros } from "@/lib/format";
import {
  TYPES_EVENEMENT,
  TYPE_COLORS,
  formatDateFr,
  type TypeEvenement,
} from "@/app/agenda/constants";
import { PLANS, STATUT_LABELS, planFromPriceId } from "@/lib/stripe";

export default async function DashboardPage() {
  const user = await requireCabinet();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    clients,
    dossiersActifs,
    retards,
    facturesEnAttente,
    prochaines,
    cabinet,
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase
      .from("dossiers")
      .select("id", { count: "exact", head: true })
      .neq("statut", "clos"),
    supabase
      .from("evenements")
      .select("id", { count: "exact", head: true })
      .eq("termine", false)
      .lt("date_evenement", today),
    supabase.from("factures").select("total").eq("statut", "envoyee"),
    supabase
      .from("evenements")
      .select("id, type, titre, date_evenement")
      .eq("termine", false)
      .order("date_evenement", { ascending: true })
      .limit(6),
    supabase
      .from("cabinets")
      .select("abonnement_statut, abonnement_plan")
      .eq("id", user.cabinetId)
      .single(),
  ]);

  const caEnAttente = (facturesEnAttente.data ?? []).reduce(
    (s, f) => s + Number(f.total),
    0,
  );
  const statutAbo = cabinet.data?.abonnement_statut ?? "inactif";
  const planAbo = planFromPriceId(cabinet.data?.abonnement_plan ?? undefined);

  return (
    <AppShell user={user}>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour {user.nomComplet?.split(" ")[0] ?? ""}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Voici l&apos;activité du cabinet {user.cabinetNom}.
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Clients" value={String(clients.count ?? 0)} href="/clients" />
        <Kpi
          label="Dossiers actifs"
          value={String(dossiersActifs.count ?? 0)}
          href="/dossiers"
        />
        <Kpi
          label="Échéances en retard"
          value={String(retards.count ?? 0)}
          href="/agenda"
          danger={!!retards.count}
        />
        <Kpi
          label="En attente de paiement"
          value={formatEuros(caEnAttente)}
          href="/factures"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Prochaines échéances */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Prochaines échéances</h2>
            <Link
              href="/agenda"
              className="text-sm text-accent hover:underline"
            >
              Tout voir
            </Link>
          </div>
          {prochaines.data?.length ? (
            <div className="card divide-y divide-border overflow-hidden">
              {prochaines.data.map((e) => {
                const enRetard = e.date_evenement < today;
                return (
                  <Link
                    key={e.id}
                    href={`/agenda/${e.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          TYPE_COLORS[e.type as TypeEvenement]
                        }`}
                      >
                        {TYPES_EVENEMENT[e.type as TypeEvenement]}
                      </span>
                      <span className="truncate text-sm">{e.titre}</span>
                    </span>
                    <span
                      className={`tnum shrink-0 text-xs ${
                        enRetard ? "font-semibold text-red-600" : "text-muted"
                      }`}
                    >
                      {formatDateFr(e.date_evenement)}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="card grid place-items-center px-4 py-12 text-center">
              <p className="text-sm text-muted">Aucune échéance à venir.</p>
              <Link
                href="/agenda/new"
                className="mt-2 text-sm font-medium text-accent hover:underline"
              >
                Ajouter une échéance
              </Link>
            </div>
          )}
        </section>

        {/* Abonnement + accès rapide */}
        <section className="flex flex-col gap-6">
          <Link
            href="/abonnement"
            className="card p-5 transition-shadow hover:shadow-[var(--shadow-md)]"
          >
            <p className="text-xs uppercase tracking-wide text-muted">
              Abonnement
            </p>
            <p className="mt-2 text-lg font-semibold">
              {planAbo ? `Formule ${PLANS[planAbo].nom}` : "Aucune formule"}
            </p>
            <span
              className={`mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                ["trialing", "active"].includes(statutAbo)
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-black/[0.04] text-muted dark:bg-white/5"
              }`}
            >
              {STATUT_LABELS[statutAbo] ?? statutAbo}
            </span>
          </Link>

          <div className="card p-5">
            <p className="text-xs uppercase tracking-wide text-muted">
              Accès rapide
            </p>
            <div className="mt-3 flex flex-col gap-1">
              <QuickLink href="/clients/new" label="Nouveau client" />
              <QuickLink href="/dossiers/new" label="Nouveau dossier" />
              <QuickLink href="/agenda/new" label="Nouvelle échéance" />
              <QuickLink href="/factures/new" label="Nouvelle facture" />
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  href,
  danger,
}: {
  label: string;
  value: string;
  href: string;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className="card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
    >
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p
        className={`tnum mt-2 text-2xl font-semibold tracking-tight ${
          danger && value !== "0" ? "text-red-600" : ""
        }`}
      >
        {value}
      </p>
    </Link>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted transition-colors hover:bg-black/[0.03] hover:text-foreground dark:hover:bg-white/5"
    >
      <span className="text-accent">+</span> {label}
    </Link>
  );
}
