import Link from "next/link";
import { signout } from "@/app/auth/actions";
import type { CurrentUser } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/clients", label: "Clients" },
  { href: "/dossiers", label: "Dossiers" },
  { href: "/agenda", label: "Agenda" },
];

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-semibold tracking-tight">
              LexFlow
            </Link>
            <nav className="flex items-center gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">
                {user.nomComplet ?? user.email}
              </p>
              <p className="text-xs text-zinc-500">{user.cabinetNom}</p>
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
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
