"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export type ClientOpt = { id: string; nom: string };
export type DossierFilterOpt = { id: string; label: string; clientId: string };

const inputCls =
  "rounded-md border border-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-border-strong dark:bg-zinc-900 dark:focus:border-zinc-100";

export function DocumentsFilters({
  clients,
  dossiers,
}: {
  clients: ClientOpt[];
  dossiers: DossierFilterOpt[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const c = sp.get("c") ?? "";
  const d = sp.get("d") ?? "";
  const [search, setSearch] = useState(q);

  function update(next: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`/documents${params.toString() ? `?${params}` : ""}`);
  }

  // Dossiers restreints au client sélectionné.
  const dossiersVisibles = c
    ? dossiers.filter((x) => x.clientId === c)
    : dossiers;

  const hasFilters = q || c || d;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: search });
        }}
        className="min-w-[200px] flex-1"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un document…"
          className={`${inputCls} w-full`}
        />
      </form>

      <select
        value={c}
        onChange={(e) => update({ c: e.target.value, d: "" })}
        className={inputCls}
        aria-label="Filtrer par client"
      >
        <option value="">Tous les clients</option>
        {clients.map((cl) => (
          <option key={cl.id} value={cl.id}>
            {cl.nom}
          </option>
        ))}
      </select>

      <select
        value={d}
        onChange={(e) => update({ d: e.target.value })}
        className={inputCls}
        aria-label="Filtrer par dossier"
      >
        <option value="">Tous les dossiers</option>
        {dossiersVisibles.map((dd) => (
          <option key={dd.id} value={dd.id}>
            {dd.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            router.push("/documents");
          }}
          className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
