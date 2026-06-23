"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDocument, getSignedUrl } from "./actions";

export function DocumentRowActions({
  id,
  chemin,
  dossierId,
}: {
  id: string;
  chemin: string;
  dossierId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function download() {
    const url = await getSignedUrl(chemin);
    if (url) window.open(url, "_blank");
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={download}
        className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Télécharger
      </button>
      <button
        type="button"
        disabled={pending}
        aria-label="Supprimer le document"
        onClick={() => {
          if (confirm("Supprimer ce document ?")) {
            startTransition(async () => {
              await deleteDocument(id, chemin, dossierId);
              router.refresh();
            });
          }
        }}
        className="text-zinc-400 transition-colors hover:text-red-600 disabled:opacity-50"
      >
        ✕
      </button>
    </div>
  );
}
