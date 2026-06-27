"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteDocument, getSignedUrl, replaceDocument } from "./actions";

type Kind = "pdf" | "image" | "office" | "text" | "other";

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function kindFromName(nom: string): Kind {
  const ext = nom.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext))
    return "image";
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext))
    return "office";
  if (["txt", "csv", "md"].includes(ext)) return "text";
  return "other";
}

function officeViewerUrl(fileUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}

function PreviewModal({
  nom,
  url,
  kind,
  onClose,
}: {
  nom: string;
  url: string;
  kind: Kind;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black/70 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <p className="truncate text-sm font-medium" title={nom}>
            {nom}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
            >
              Ouvrir / Télécharger
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="rounded-md px-2 py-1.5 text-muted transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/5"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-900">
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={nom}
              className="mx-auto max-h-full max-w-full object-contain"
            />
          ) : kind === "pdf" || kind === "text" ? (
            <iframe src={url} title={nom} className="h-full w-full border-0" />
          ) : kind === "office" ? (
            <iframe
              src={officeViewerUrl(url)}
              title={nom}
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
              <p className="text-sm text-muted">
                Aperçu non disponible pour ce type de fichier.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-accent hover:underline"
              >
                Télécharger le fichier
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DocumentRowActions({
  id,
  nom,
  chemin,
  dossierId,
  cabinetId,
}: {
  id: string;
  nom: string;
  chemin: string;
  dossierId: string;
  cabinetId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const kind = kindFromName(nom);
  const editable = kind === "office"; // Word/Excel/PPT : modifiable, pas les PDF

  async function openPreview() {
    setLoadingPreview(true);
    // URL signée plus longue : les visionneuses Office la récupèrent côté serveur.
    const url = await getSignedUrl(chemin, 1800);
    setLoadingPreview(false);
    if (url) setPreviewUrl(url);
  }

  async function download() {
    const url = await getSignedUrl(chemin);
    if (url) window.open(url, "_blank");
  }

  // Remplace le fichier par la version modifiée (re-téléversée).
  async function onReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReplacing(true);
    setReplaceError(null);

    const supabase = createClient();
    const nouveauChemin = `${cabinetId}/${dossierId}/${crypto.randomUUID()}-${safeName(file.name)}`;
    const { error: upErr } = await supabase.storage
      .from("documents")
      .upload(nouveauChemin, file);
    if (upErr) {
      setReplaceError(upErr.message);
      setReplacing(false);
      return;
    }

    const { error } = await replaceDocument(id, chemin, dossierId, {
      nom: file.name,
      chemin: nouveauChemin,
      taille: file.size,
      type_mime: file.type,
    });
    if (error) {
      setReplaceError(error);
      setReplacing(false);
      return;
    }
    if (replaceRef.current) replaceRef.current.value = "";
    setReplacing(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openPreview}
          disabled={loadingPreview}
          className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {loadingPreview ? "…" : "Aperçu"}
        </button>
        <button
          type="button"
          onClick={download}
          className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {editable ? "Modifier" : "Télécharger"}
        </button>
        {editable && (
          <label
            title="Re-téléverser la version modifiée (conserve la mise en page)"
            className="cursor-pointer text-sm text-zinc-600 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {replacing ? "…" : "Remplacer"}
            <input
              ref={replaceRef}
              type="file"
              accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={onReplace}
              disabled={replacing}
              className="hidden"
            />
          </label>
        )}
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
      {replaceError && (
        <p className="mt-1 text-right text-xs text-red-600">{replaceError}</p>
      )}

      {previewUrl && (
        <PreviewModal
          nom={nom}
          url={previewUrl}
          kind={kind}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </>
  );
}
