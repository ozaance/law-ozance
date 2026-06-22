import Link from "next/link";
import { requireCabinet } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

const MODULES = [
  {
    name: "Clients & Prospects",
    desc: "Entreprises, particuliers, contacts",
    href: "/clients",
    ready: true,
  },
  {
    name: "Dossiers",
    desc: "Affaires, statuts, avocat responsable",
    href: "/dossiers",
    ready: true,
  },
  {
    name: "Agenda & Échéances",
    desc: "RDV, audiences, délais",
    href: "/agenda",
    ready: true,
  },
  {
    name: "Temps & Facturation",
    desc: "Saisie du temps, factures",
    href: "/factures",
    ready: true,
  },
  { name: "Documents", desc: "GED par dossier, modèles", ready: false },
];

export default async function DashboardPage() {
  const user = await requireCabinet();

  return (
    <AppShell user={user}>
      <h1 className="text-xl font-semibold tracking-tight">
        Bonjour {user.nomComplet?.split(" ")[0] ?? ""} 👋
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Cabinet {user.cabinetNom}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) =>
          m.ready && m.href ? (
            <Link
              key={m.name}
              href={m.href}
              className="group rounded-lg border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <p className="font-medium group-hover:underline">{m.name}</p>
              <p className="mt-1 text-sm text-zinc-500">{m.desc}</p>
              <p className="mt-3 text-xs font-medium text-emerald-600">
                Ouvrir →
              </p>
            </Link>
          ) : (
            <div
              key={m.name}
              className="rounded-lg border border-dashed border-zinc-200 p-5 dark:border-zinc-800"
            >
              <p className="font-medium text-zinc-400">{m.name}</p>
              <p className="mt-1 text-sm text-zinc-400">{m.desc}</p>
              <p className="mt-3 text-xs uppercase tracking-wide text-zinc-400">
                À venir
              </p>
            </div>
          ),
        )}
      </div>
    </AppShell>
  );
}
