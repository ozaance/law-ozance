import Link from "next/link";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ToggleDone } from "./toggle-done";
import {
  TYPES_EVENEMENT,
  TYPE_COLORS,
  formatDateFr,
  type TypeEvenement,
} from "./constants";

type Evenement = {
  id: string;
  type: TypeEvenement;
  titre: string;
  date_evenement: string;
  heure: string | null;
  lieu: string | null;
  termine: boolean;
  dossier: unknown;
  assigne: unknown;
};

export default async function AgendaPage() {
  const user = await requireCabinet();
  const supabase = await createClient();

  const { data } = await supabase
    .from("evenements")
    .select(
      "id, type, titre, date_evenement, heure, lieu, termine, dossier:dossiers(reference), assigne:profiles(nom_complet)",
    )
    .order("date_evenement", { ascending: true })
    .order("heure", { ascending: true, nullsFirst: true });

  const evenements = (data ?? []) as Evenement[];
  const today = new Date().toISOString().slice(0, 10);

  const enRetard = evenements.filter(
    (e) => !e.termine && e.date_evenement < today,
  );
  const aVenir = evenements.filter(
    (e) => !e.termine && e.date_evenement >= today,
  );
  const termines = evenements
    .filter((e) => e.termine)
    .sort((a, b) => b.date_evenement.localeCompare(a.date_evenement));

  return (
    <AppShell user={user}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Agenda &amp; Échéances
          </h1>
          <p className="mt-1 text-sm text-muted">
            {aVenir.length} à venir · {enRetard.length} en retard
          </p>
        </div>
        <Link
          href="/agenda/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
        >
          + Nouvel événement
        </Link>
      </div>

      {!evenements.length ? (
        <div className="mt-10 rounded-lg border border-dashed border-border-strong py-16 text-center dark:border-border-strong">
          <p className="text-sm text-muted">Aucun événement.</p>
          <Link
            href="/agenda/new"
            className="mt-3 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Ajouter une échéance
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {enRetard.length > 0 && (
            <Section title="En retard" tone="danger" items={enRetard} />
          )}
          <Section title="À venir" items={aVenir} emptyLabel="Rien à venir." />
          {termines.length > 0 && (
            <Section title="Terminés" muted items={termines} />
          )}
        </div>
      )}
    </AppShell>
  );
}

function Section({
  title,
  items,
  tone,
  muted,
  emptyLabel,
}: {
  title: string;
  items: Evenement[];
  tone?: "danger";
  muted?: boolean;
  emptyLabel?: string;
}) {
  return (
    <section>
      <h2
        className={`mb-3 text-sm font-semibold ${
          tone === "danger" ? "text-red-600" : "text-muted"
        }`}
      >
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400">{emptyLabel}</p>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)] dark:divide-border dark:border-border">
          {items.map((e) => (
            <Row key={e.id} e={e} muted={muted} danger={tone === "danger"} />
          ))}
        </div>
      )}
    </section>
  );
}

function Row({
  e,
  muted,
  danger,
}: {
  e: Evenement;
  muted?: boolean;
  danger?: boolean;
}) {
  const dossierRef = relField(e.dossier, "reference");
  const assigneNom = relField(e.assigne, "nom_complet");

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <ToggleDone id={e.id} termine={e.termine} />
      <Link href={`/agenda/${e.id}`} className="min-w-0 flex-1 group">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              TYPE_COLORS[e.type]
            }`}
          >
            {TYPES_EVENEMENT[e.type]}
          </span>
          <span
            className={`truncate text-sm font-medium group-hover:underline ${
              muted ? "text-zinc-400 line-through" : ""
            }`}
          >
            {e.titre}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          <span className={danger ? "font-medium text-red-600" : ""}>
            {formatDateFr(e.date_evenement)}
            {e.heure ? ` · ${e.heure.slice(0, 5)}` : ""}
          </span>
          {dossierRef ? ` · ${dossierRef}` : ""}
          {e.lieu ? ` · ${e.lieu}` : ""}
          {assigneNom ? ` · ${assigneNom}` : ""}
        </p>
      </Link>
    </div>
  );
}

function relField(rel: unknown, key: string): string {
  const obj = Array.isArray(rel) ? rel[0] : rel;
  return (obj as Record<string, string> | null)?.[key] ?? "";
}
