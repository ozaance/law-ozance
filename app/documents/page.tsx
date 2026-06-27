import Link from "next/link";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { formatTaille } from "@/lib/format";
import { formatDateFr } from "@/app/agenda/constants";
import { DocumentUploadCentral } from "./document-upload-central";
import { DocumentsFilters } from "./documents-filters";
import { DocumentRowActions } from "./document-row-actions";

type DocRow = {
  id: string;
  nom: string;
  chemin: string;
  taille: number | null;
  created_at: string;
  dossier:
    | {
        id: string;
        reference: string | null;
        titre: string;
        client: { nom: string } | { nom: string }[] | null;
      }
    | {
        id: string;
        reference: string | null;
        titre: string;
        client: { nom: string } | { nom: string }[] | null;
      }[]
    | null;
};

function rel<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function dossierLabel(reference: string | null, titre: string): string {
  return reference ? `${reference} — ${titre}` : titre;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; c?: string; d?: string }>;
}) {
  const user = await requireCabinet();
  const { q, c, d } = await searchParams;
  const supabase = await createClient();

  // Listes pour les filtres et l'upload.
  const [{ data: clientsRaw }, { data: dossiersRaw }] = await Promise.all([
    supabase.from("clients").select("id, nom").order("nom"),
    supabase
      .from("dossiers")
      .select("id, reference, titre, client_id")
      .order("created_at", { ascending: false }),
  ]);
  const clients = clientsRaw ?? [];
  const dossiers = (dossiersRaw ?? []).map((x) => ({
    id: x.id,
    label: dossierLabel(x.reference, x.titre),
    clientId: x.client_id as string,
  }));

  // Documents (filtrés).
  let query = supabase
    .from("documents")
    .select(
      "id, nom, chemin, taille, created_at, dossier:dossiers!inner(id, reference, titre, client_id, client:clients(nom))",
    )
    .order("created_at", { ascending: false });
  if (q) query = query.ilike("nom", `%${q}%`);
  if (d) query = query.eq("dossier_id", d);
  if (c) query = query.eq("dossier.client_id", c);
  const { data: docsRaw } = await query.returns<DocRow[]>();
  const docs = docsRaw ?? [];

  return (
    <AppShell user={user}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-1 text-sm text-muted">
            Tous les fichiers du cabinet, classés par dossier.
          </p>
        </div>
        <DocumentUploadCentral
          cabinetId={user.cabinetId}
          dossiers={dossiers.map((x) => ({ id: x.id, label: x.label }))}
          defaultDossierId={d}
        />
      </div>

      <div className="mt-6">
        <DocumentsFilters clients={clients} dossiers={dossiers} />
      </div>

      {docs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border-strong py-14 text-center">
          <p className="text-sm text-muted">
            {q || c || d
              ? "Aucun document ne correspond à ces filtres."
              : "Aucun document pour le moment."}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Téléversez un fichier en le rattachant à un dossier.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 font-medium">Document</th>
                <th className="px-4 py-2.5 font-medium">Dossier</th>
                <th className="px-4 py-2.5 font-medium">Client</th>
                <th className="px-4 py-2.5 text-right font-medium">Taille</th>
                <th className="px-4 py-2.5 font-medium">Ajouté le</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {docs.map((doc) => {
                const dossier = rel(doc.dossier);
                const client = dossier ? rel(dossier.client) : null;
                return (
                  <tr key={doc.id}>
                    <td className="max-w-[22rem] px-4 py-2.5">
                      <span className="block truncate font-medium" title={doc.nom}>
                        {doc.nom}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {dossier ? (
                        <Link
                          href={`/dossiers/${dossier.id}`}
                          className="text-zinc-600 hover:text-foreground hover:underline dark:text-zinc-400"
                        >
                          {dossierLabel(dossier.reference, dossier.titre)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {client?.nom ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                      {formatTaille(doc.taille)}
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {formatDateFr(doc.created_at.slice(0, 10))}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end">
                        <DocumentRowActions
                          id={doc.id}
                          chemin={doc.chemin}
                          dossierId={dossier?.id ?? ""}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
