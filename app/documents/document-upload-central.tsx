"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordDocument } from "./actions";

export type DossierUpload = { id: string; label: string };

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Upload depuis la page Documents centrale : on choisit d'abord le dossier
// de rattachement, puis on téléverse le fichier.
export function DocumentUploadCentral({
  cabinetId,
  dossiers,
  defaultDossierId,
}: {
  cabinetId: string;
  dossiers: DossierUpload[];
  defaultDossierId?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dossierId, setDossierId] = useState<string>(defaultDossierId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!dossierId) {
      setError("Choisissez d'abord un dossier.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const chemin = `${cabinetId}/${dossierId}/${crypto.randomUUID()}-${safeName(file.name)}`;

    const { error: upErr } = await supabase.storage
      .from("documents")
      .upload(chemin, file);
    if (upErr) {
      setError(upErr.message);
      setBusy(false);
      return;
    }

    const { error: recErr } = await recordDocument(dossierId, {
      nom: file.name,
      chemin,
      taille: file.size,
      type_mime: file.type,
    });
    if (recErr) {
      setError(recErr);
      setBusy(false);
      return;
    }

    if (inputRef.current) inputRef.current.value = "";
    setBusy(false);
    router.refresh();
  }

  const inputCls =
    "rounded-md border border-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-border-strong dark:bg-zinc-900 dark:focus:border-zinc-100";

  return (
    <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center">
      <select
        value={dossierId}
        onChange={(e) => setDossierId(e.target.value)}
        className={`${inputCls} w-full sm:w-64`}
        aria-label="Dossier de rattachement"
      >
        <option value="">Rattacher à un dossier…</option>
        {dossiers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>
      <label
        className={`cursor-pointer whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          dossierId
            ? "bg-zinc-900 text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
            : "cursor-not-allowed bg-zinc-300 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
        }`}
      >
        {busy ? "Envoi…" : "+ Téléverser"}
        <input
          ref={inputRef}
          type="file"
          onChange={onChange}
          disabled={busy || !dossierId}
          className="hidden"
        />
      </label>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
