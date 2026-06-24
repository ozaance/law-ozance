import { notFound } from "next/navigation";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDuree, formatEuros, montantLigne } from "@/lib/format";
import { formatDateFr } from "@/app/agenda/constants";
import { PrintButton } from "./print-button";

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function ImpressionFacturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCabinet();
  const supabase = await createClient();

  const [{ data: facture }, { data: cabinet }, { data: lignesLibres }] =
    await Promise.all([
      supabase
        .from("factures")
        .select(
          "id, numero, statut, type_document, objet, honoraire_resultat, date_emission, date_echeance, notes, montant_ht, taux_tva, montant_tva, total, client:clients(type, nom, adresse, code_postal, ville, siren, forme_juridique, tva_intra)",
        )
        .eq("id", id)
        .single(),
      supabase
        .from("cabinets")
        .select(
          "nom, barreau, telephone, site_web, logo_url, adresse, code_postal, ville, forme_juridique, siret, tva_intra, iban, bic, tva_assujetti, conditions_reglement, mentions_facture",
        )
        .eq("id", user.cabinetId)
        .single(),
      supabase
        .from("facture_lignes")
        .select("id, designation, montant, ordre")
        .eq("facture_id", id)
        .order("ordre", { ascending: true }),
    ]);

  if (!facture) notFound();

  // Décompte horaire (si pas de lignes forfait)
  const forfait = (lignesLibres ?? []).length > 0;
  const { data: lignesTemps } = forfait
    ? { data: [] }
    : await supabase
        .from("time_entries")
        .select("id, date_saisie, duree_minutes, taux, description, dossier:dossiers(reference)")
        .eq("facture_id", id)
        .order("date_saisie", { ascending: true });

  const client = one(facture.client);
  const ht = Number(facture.montant_ht ?? 0);
  const tva = Number(facture.montant_tva ?? 0);
  const ttc = Number(facture.total ?? 0);
  const tauxTva = Number(facture.taux_tva ?? 0);
  const isEntreprise = client?.type === "entreprise";
  const titre =
    facture.type_document === "facture" ? "FACTURE" : "NOTE D'HONORAIRES";

  return (
    <div className="min-h-dvh bg-zinc-100 py-8 text-zinc-900 print:bg-white print:py-0">
      <style>{`@media print { @page { margin: 14mm; } }`}</style>

      <div className="mx-auto mb-4 flex max-w-[800px] items-center justify-between px-6 print:hidden">
        <a href={`/factures/${id}`} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Retour
        </a>
        <PrintButton />
      </div>

      <div className="mx-auto max-w-[800px] bg-white p-12 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        {/* En-tête : avocat / titre */}
        <div className="flex items-start justify-between gap-8">
          <div className="flex items-start gap-4">
            {cabinet?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cabinet.logo_url} alt="" className="h-16 w-auto" />
            )}
            <div className="text-sm leading-relaxed">
              <div className="text-base font-semibold">{cabinet?.nom}</div>
              {cabinet?.barreau && (
                <div className="italic">Avocat inscrit au Barreau de {cabinet.barreau}</div>
              )}
              {cabinet?.adresse && <div>{cabinet.adresse}</div>}
              {(cabinet?.code_postal || cabinet?.ville) && (
                <div>
                  {cabinet?.code_postal} {cabinet?.ville}
                </div>
              )}
              {cabinet?.telephone && <div>{cabinet.telephone}</div>}
              {cabinet?.site_web && <div>{cabinet.site_web}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold tracking-tight">{titre}</div>
            <div className="mt-1 font-mono text-sm">
              N° {facture.numero ?? "Brouillon"}
            </div>
            <div className="mt-2 text-sm text-zinc-600">
              {(cabinet?.ville ? cabinet.ville + ", le " : "Le ") +
                formatDateFr(facture.date_emission)}
            </div>
            {facture.date_echeance && (
              <div className="text-sm text-zinc-600">
                Échéance : {formatDateFr(facture.date_echeance)}
              </div>
            )}
          </div>
        </div>

        {/* Client */}
        <div className="mt-10 flex justify-end">
          <div className="min-w-[260px] text-sm leading-relaxed">
            <div className="font-semibold">{client?.nom}</div>
            {client?.forme_juridique && <div>{client.forme_juridique}</div>}
            {client?.adresse && <div>{client.adresse}</div>}
            {(client?.code_postal || client?.ville) && (
              <div>
                {client?.code_postal} {client?.ville}
              </div>
            )}
            {client?.siren && <div>SIREN : {client.siren}</div>}
            {client?.tva_intra && <div>TVA : {client.tva_intra}</div>}
          </div>
        </div>

        {/* Objet */}
        {facture.objet && (
          <div className="mt-8 border border-zinc-300 px-4 py-2 text-sm">
            <span className="font-semibold">Objet : </span>
            {facture.objet}
          </div>
        )}

        {/* Lignes */}
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-zinc-300 text-left text-xs uppercase tracking-wide text-zinc-500">
              {forfait ? (
                <th className="py-2 font-medium">Désignation</th>
              ) : (
                <>
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Désignation</th>
                  <th className="py-2 text-right font-medium">Durée</th>
                  <th className="py-2 text-right font-medium">PU HT</th>
                </>
              )}
              <th className="py-2 text-right font-medium">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            {forfait
              ? (lignesLibres ?? []).map((l) => (
                  <tr key={l.id} className="border-b border-zinc-200 align-top">
                    <td className="py-2 pr-3 whitespace-pre-wrap">
                      {l.designation}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatEuros(Number(l.montant))}
                    </td>
                  </tr>
                ))
              : (lignesTemps ?? []).map((l) => {
                  const dossier = one(l.dossier);
                  return (
                    <tr key={l.id} className="border-b border-zinc-200 align-top">
                      <td className="py-2 pr-2 text-zinc-500">
                        {formatDateFr(l.date_saisie)}
                      </td>
                      <td className="py-2 pr-2">
                        {dossier?.reference && (
                          <span className="font-mono text-xs text-zinc-400">
                            {dossier.reference}{" "}
                          </span>
                        )}
                        {l.description ?? "Prestation juridique"}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {formatDuree(l.duree_minutes)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {l.taux ? `${l.taux} €` : "—"}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {formatEuros(montantLigne(l.duree_minutes, l.taux))}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="mt-6 flex justify-end">
          <div className="w-64 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-zinc-500">Montant HT</span>
              <span className="tabular-nums">{formatEuros(ht)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-500">
                TVA {tauxTva > 0 ? `${tauxTva} %` : ""}
              </span>
              <span className="tabular-nums">
                {tauxTva > 0 ? formatEuros(tva) : "Non applicable"}
              </span>
            </div>
            <div className="mt-1 flex justify-between border-t-2 border-zinc-300 py-2 text-base font-bold">
              <span>Montant total TTC</span>
              <span className="tabular-nums">{formatEuros(ttc)}</span>
            </div>
          </div>
        </div>

        {facture.honoraire_resultat && (
          <p className="mt-6 text-xs italic leading-relaxed text-zinc-600 whitespace-pre-wrap">
            {facture.honoraire_resultat}
          </p>
        )}

        {/* Détails / règlement */}
        <div className="mt-8 border-t border-zinc-300 pt-4 text-sm">
          <div className="font-semibold">Détails de la facturation</div>
          {facture.notes && (
            <p className="mt-1 whitespace-pre-wrap text-zinc-600">
              {facture.notes}
            </p>
          )}
          <p className="mt-3">
            {cabinet?.conditions_reglement ??
              "Facture payable au comptant, à réception."}
          </p>
          {(cabinet?.iban || cabinet?.bic) && (
            <div className="mt-2 inline-block border border-zinc-300 px-3 py-2 text-xs">
              {cabinet?.iban && <div>IBAN : {cabinet.iban}</div>}
              {cabinet?.bic && <div>BIC : {cabinet.bic}</div>}
            </div>
          )}
        </div>

        {/* Mentions légales */}
        <div className="mt-6 space-y-1 text-xs leading-relaxed text-zinc-500">
          {!cabinet?.tva_assujetti && (
            <p>TVA non applicable, art. 293 B du CGI.</p>
          )}
          {isEntreprise && (
            <p>
              En cas de retard de paiement : pénalités au taux de 3 fois le taux
              d&apos;intérêt légal et indemnité forfaitaire de recouvrement de
              40 € (art. L441-10 et D441-5 du Code de commerce).
            </p>
          )}
          {cabinet?.siret && <p>SIRET {cabinet.siret}</p>}
          {cabinet?.mentions_facture && (
            <p className="whitespace-pre-wrap">{cabinet.mentions_facture}</p>
          )}
        </div>

        {/* Signature client */}
        <div className="mt-10 text-sm">
          <div className="font-semibold">Signature du client</div>
          <p className="mt-1 text-xs italic text-zinc-500">
            « Lu et approuvé, bon pour accord sur le montant et les prestations
            détaillées ci-dessus »
          </p>
          <div className="mt-10 h-px w-56 bg-zinc-300" />
        </div>
      </div>
    </div>
  );
}
