"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordDocument } from "./actions";

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function DocumentUpload({
  cabinetId,
  dossierId,
}: {
  cabinetId: string;
  dossierId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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

  return (
    <div className="flex flex-col items-end gap-1">
      <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900">
        {busy ? "Envoi…" : "+ Téléverser"}
        <input
          ref={inputRef}
          type="file"
          onChange={onChange}
          disabled={busy}
          className="hidden"
        />
      </label>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
