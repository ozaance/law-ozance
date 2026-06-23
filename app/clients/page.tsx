import Link from "next/link";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function ClientsPage() {
  const user = await requireCabinet();
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, type, nom, email, telephone, forme_juridique")
    .order("created_at", { ascending: false });

  return (
    <AppShell user={user}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-muted">
            {clients?.length ?? 0} client{(clients?.length ?? 0) > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/clients/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
        >
          + Nouveau client
        </Link>
      </div>

      {!clients?.length ? (
        <div className="mt-12 rounded-lg border border-dashed border-border-strong py-16 text-center dark:border-border-strong">
          <p className="text-sm text-muted">Aucun client pour le moment.</p>
          <Link
            href="/clients/new"
            className="mt-3 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Ajouter votre premier client
          </Link>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)] dark:divide-border dark:border-border">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    c.type === "entreprise"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {c.type}
                </span>
                <div>
                  <p className="text-sm font-medium">{c.nom}</p>
                  {c.email && (
                    <p className="text-xs text-muted">{c.email}</p>
                  )}
                </div>
              </div>
              <span className="text-sm text-zinc-400">→</span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
