"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { montantLigne } from "@/lib/format";
import { STATUTS_FACTURE } from "./constants";

export type FactureState = { error?: string };

export async function createFacture(
  _prev: FactureState,
  formData: FormData,
): Promise<FactureState> {
  const client_id = String(formData.get("client_id") ?? "");
  const date_echeance =
    String(formData.get("date_echeance") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const entryIds = formData.getAll("entries").map(String).filter(Boolean);

  if (!client_id) return { error: "Client manquant." };
  if (entryIds.length === 0)
    return { error: "Sélectionnez au moins une ligne de temps à facturer." };

  const supabase = await createClient();

  // On recharge les saisies sélectionnées (non encore facturées) pour le total
  const { data: entries, error: entriesErr } = await supabase
    .from("time_entries")
    .select("id, duree_minutes, taux")
    .in("id", entryIds)
    .eq("facturee", false);

  if (entriesErr) return { error: entriesErr.message };
  if (!entries?.length)
    return { error: "Ces saisies sont déjà facturées ou introuvables." };

  const total = entries.reduce(
    (s, e) => s + (montantLigne(e.duree_minutes, e.taux) ?? 0),
    0,
  );

  const { data: facture, error } = await supabase
    .from("factures")
    .insert({ client_id, date_echeance, notes, total })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const ids = entries.map((e) => e.id);
  const { error: linkErr } = await supabase
    .from("time_entries")
    .update({ facture_id: facture.id, facturee: true })
    .in("id", ids);

  if (linkErr) return { error: linkErr.message };

  revalidatePath("/factures");
  redirect(`/factures/${facture.id}`);
}

export async function updateStatutFacture(id: string, statut: string) {
  if (!(statut in STATUTS_FACTURE)) return;
  const supabase = await createClient();
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
