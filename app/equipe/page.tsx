import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { InviteForm } from "./invite-form";
import { revokeInvitation } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrateur",
  avocat: "Avocat",
  assistant: "Assistant",
};

type Member = {
  id: string;
  email: string | null;
  nom_complet: string | null;
  role: string;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  created_at: string;
};

function initials(name: string | null, email: string | null): string {
  const base = name ?? email ?? "?";
  const parts = base.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export default async function EquipePage() {
  const user = await requireCabinet();
  const isAdmin = user.role === "admin";
  const supabase = await createClient();

  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, nom_complet, role")
      .eq("cabinet_id", user.cabinetId)
      .order("created_at", { ascending: true })
      .returns<Member[]>(),
    supabase
      .from("invitations")
      .select("id, email, role, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .returns<Invitation[]>(),
  ]);

  return (
    <AppShell user={user}>
      <h1 className="text-xl font-semibold tracking-tight">Équipe</h1>
      <p className="mb-8 mt-1 text-sm text-muted">
        Les membres de {user.cabinetNom} et leurs invitations en cours.
      </p>

      {isAdmin && (
        <div className="mb-10">
          <InviteForm />
        </div>
      )}

      {/* Membres */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold">
          Membres{" "}
          <span className="font-normal text-muted">({members?.length ?? 0})</span>
        </h2>
        <div className="card divide-y divide-border">
          {members?.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-semibold text-accent">
                {initials(m.nom_complet, m.email)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.nom_complet ?? m.email}
                  {m.id === user.id && (
                    <span className="ml-2 text-xs text-muted">(vous)</span>
                  )}
                </p>
                {m.nom_complet && (
                  <p className="truncate text-xs text-muted">{m.email}</p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
                {ROLE_LABEL[m.role] ?? m.role}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Invitations en attente */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">
          Invitations en attente{" "}
          <span className="font-normal text-muted">
            ({invitations?.length ?? 0})
          </span>
        </h2>
        {invitations && invitations.length > 0 ? (
          <div className="card divide-y divide-border">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{inv.email}</p>
                  <p className="text-xs text-muted">
                    Invité comme {ROLE_LABEL[inv.role] ?? inv.role}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  En attente
                </span>
                {isAdmin && (
                  <form action={revokeInvitation}>
                    <input type="hidden" name="id" value={inv.id} />
                    <button
                      type="submit"
                      className="shrink-0 rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/5"
                    >
                      Révoquer
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Aucune invitation en attente.</p>
        )}
      </section>
    </AppShell>
  );
}
