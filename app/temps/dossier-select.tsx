"use client";

export type DossierOption = { id: string; label: string };

// Sélecteur de dossier qui soumet une action serveur au changement.
// Utilisé pour le chrono en cours (setTimerDossier) et la timesheet (assignEntryDossier).
export function DossierSelect({
  action,
  dossiers,
  current,
  entryId,
  compact = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  dossiers: DossierOption[];
  current: string | null;
  entryId?: string;
  compact?: boolean;
}) {
  const base =
    "rounded-md border border-border-strong bg-white outline-none focus:border-zinc-900 dark:border-border-strong dark:bg-zinc-900 dark:focus:border-zinc-100";
  const size = compact
    ? "max-w-full px-2 py-1 text-xs"
    : "w-full px-2.5 py-1.5 text-sm";

  return (
    <form action={action}>
      {entryId && <input type="hidden" name="id" value={entryId} />}
      <select
        key={current ?? "none"}
        name="dossier_id"
        defaultValue={current ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`${base} ${size}`}
        aria-label="Dossier"
      >
        <option value="">Non attribué</option>
        {dossiers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>
    </form>
  );
}
