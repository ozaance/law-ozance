"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/clients", label: "Clients" },
  { href: "/dossiers", label: "Dossiers" },
  { href: "/agenda", label: "Agenda" },
  { href: "/temps", label: "Temps" },
  { href: "/factures", label: "Facturation" },
  { href: "/equipe", label: "Équipe" },
  { href: "/abonnement", label: "Abonnement" },
];

export function NavLinks({ variant = "sidebar" }: { variant?: "sidebar" | "bar" }) {
  const pathname = usePathname();

  return (
    <>
      {NAV.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        if (variant === "bar") {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-accent-soft text-foreground"
                : "text-muted hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/5"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                active ? "bg-accent" : "bg-transparent group-hover:bg-border-strong"
              }`}
            />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
