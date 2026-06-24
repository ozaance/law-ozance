"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCabinet } from "@/lib/auth";
import { montantLigne } from "@/lib/format";
import { STATUTS_FACTURE } from "./constants";

export type FactureState = { error?: string };

export async function createFacture(
  _prev: FactureState,
  formData: FormData,
): Promise<FactureState> {
  const client_id = String(formData.get("client_id") ?? "");
  if (!client_id) return { error: "Client manquant." };

  const mode = String(formData.get("mode") ?? "temps");
  const date_echeance =
    String(formData.get("date_echeance") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const objet = String(formData.get("objet") ?? "").trim() || null;
  const honoraire_resultat =
    String(formData.get("honoraire_resultat") ?? "").trim() || null;

  const user = await requireCabinet();
  const supabase = await createClient();

  // Régime TVA du cabinet (assujetti 20 % par défaut, ou franchise en base).
  const { data: cab } = await supabase
    .from("cabinets")
    .select("tva_assujetti, tva_taux")
    .eq("id", user.cabinetId)
    .single();
  const tauxTva = cab?.tva_assujetti ? Number(cab.tva_taux ?? 20) : 0;

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const newId = async (montantHt: number) => {
    const montantTva = round2(montantHt * (tauxTva / 100));
    const { data, error } = await supabase
      .from("factures")
      .insert({
        client_id,
        date_echeance,
        notes,
        objet,
        honoraire_resultat,
        type_document: "note",
        montant_ht: montantHt,
        taux_tva: tauxTva,
        montant_tva: montantTva,
        total: round2(montantHt + montantTva),
      })
      .select("id")
      .single();
    return { id: data?.id as string | undefined, error };
  };

  // ----- Mode FORFAIT / lignes libres -----
  if (mode === "forfait") {
    const designations = formData.getAll("ligne_designation").map(String);
    const montants = formData
      .getAll("ligne_montant")
      .map((v) => Number(String(v).replace(",", ".")));
    const lignes = designations
      .map((d, i) => ({
        designation: d.trim(),
        montant: Number.isFinite(montants[i]) ? montants[i] : 0,
      }))
      .filter((l) => l.designation || l.montant);

    if (lignes.length === 0)
      return { error: "Ajoutez au moins une ligne (désignation et montant)." };

    const montantHt = round2(lignes.reduce((s, l) => s + (l.montant || 0), 0));
    const { id, error } = await newId(montantHt);
    if (error || !id) return { error: error?.message ?? "Échec de création." };

    const { error: lErr } = await supabase.from("facture_lignes").insert(
      lignes.map((l, i) => ({
        facture_id: id,
        designation: l.designation || "Prestation juridique",
        montant: round2(l.montant || 0),
        ordre: i,
      })),
    );
    if (lErr) return { error: lErr.message };

    revalidatePath("/factures");
    redirect(`/factures/${id}`);
  }

  // ----- Mode TEMPS (décompte horaire) -----
  const entryIds = formData.getAll("entries").map(String).filter(Boolean);
  if (entryIds.length === 0)
    return { error: "Sélectionnez au moins une ligne de temps à facturer." };

  const { data: entries, error: entriesErr } = await supabase
    .from("time_entries")
    .select("id, duree_minutes, taux")
    .in("id", entryIds)
    .eq("facturee", false);

  if (entriesErr) return { error: entriesErr.message };
  if (!entries?.length)
    return { error: "Ces saisies sont déjà facturées ou introuvables." };

  // Objet de prestation éventuellement modifié sur la page de facturation.
  await Promise.all(
    entries.map((e) => {
      const d = String(formData.get(`desc_${e.id}`) ?? "").trim();
      return supabase
        .from("time_entries")
        .update({ description: d || null })
        .eq("id", e.id);
    }),
  );

  const montantHt = round2(
    entries.reduce((s, e) => s + (montantLigne(e.duree_minutes, e.taux) ?? 0), 0),
  );
  const { id, error } = await newId(montantHt);
  if (error || !id) return { error: error?.message ?? "Échec de création." };

  const { error: linkErr } = await supabase
    .from("time_entries")
    .update({ facture_id: id, facturee: true })
    .in(
      "id",
      entries.map((e) => e.id),
    );
  if (linkErr) return { error: linkErr.message };

  revalidatePath("/factures");
  redirect(`/factures/${id}`);
}

export async function updateStatutFacture(id: string, statut: string) {
  if (!(statut in STATUTS_FACTURE)) return;
  const supabase = await createClient();

  // Numéro légal attribué une seule fois, au moment où la facture est émise.
  if (statut === "envoyee" || statut === "payee") {
    await supabase.rpc("attribuer_numero_facture", { p_facture: id });
  }

  const { error } = await supabase
    .from("factures")
    .update({ statut })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/factures/${id}`);
  revalidatePath("/factures");
}

export async function deleteFacture(id: string) {
  const supabase = await createClient();
  // On délie les saisies de temps (elles redeviennent facturables)
  await supabase
    .from("time_entries")
    .update({ facture_id: null, facturee: false })
    .eq("facture_id", id);
  const { error } = await supabase.from("factures").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/factures");
  redirect("/factures");
}
