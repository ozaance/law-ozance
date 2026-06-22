import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/auth/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nom_complet, role, cabinet:cabinets(nom)")
    .eq("id", user.id)
    .single();

  // Pas encore de cabinet -> onboarding
  if (!profile?.cabinet) redirect("/onboarding");

  const cabinetNom = Array.isArray(profile.cabinet)
    ? profile.cabinet[0]?.nom
    : (profile.cabinet as { nom: string }).nom;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10">
      <header className="flex items-center justify-between border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Cabinet
          </p>
          <h1 className="text-xl font-semibold tracking-tight">{cabinetNom}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">
              {profile.nom_complet ?? user.email}
            </p>
            <p className="text-xs capitalize text-zinc-500">{profile.role}</p>
          </div>
          <form action={signout}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-zinc-500">Modules</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <div
              key={m.name}
              className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"
            >
              <p className="font-medium">{m.name}</p>
              <p className="mt-1 text-sm text-zinc-500">{m.desc}</p>
              <p className="mt-3 text-xs uppercase tracking-wide text-zinc-400">
                À venir
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const MODULES = [
  { name: "Clients & Prospects", desc: "Entreprises, contacts, intake" },
  { name: "Dossiers", desc: "Affaires, statuts, avocat responsable" },
  { name: "Agenda & Échéances", desc: "RDV, audiences, délais" },
  { name: "Temps & Facturation", desc: "Saisie du temps, factures" },
  { name: "Documents", desc: "GED par dossier, modèles" },
];
