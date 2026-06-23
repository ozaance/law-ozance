"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCabinet } from "@/lib/auth";
import { heuresToMinutes } from "@/lib/format";

export type TimeEntryState = { error?: string; ts?: number };
export type SimpleState = { error?: string };

function parseTaux(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  return Number.isNaN(n) || n < 0 ? null : n;
}

export async function createTimeEntry(
  dossierId: string,
  _prev: TimeEntryState,
  formData: FormData,
): Promise<TimeEntryState> {
  const heures = Number(String(formData.get("heures") ?? "").replace(",", "."));
  if (Number.isNaN(heures) || heures <= 0) {
    return { error: "Durée invalide (en heures, ex. 1.5)." };
  }

  const data = {
    dossier_id: dossierId,
    date_saisie:
      String(formData.get("date_saisie") ?? "").trim() ||
      new Date().toISOString().slice(0, 10),
    duree_minutes: heuresToMinutes(heures),
    taux: parseTaux(formData.get("taux")),
    description: String(formData.get("description") ?? "").trim() || null,
  };

  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").insert(data);
  if (error) return { error: error.message };

  revalidatePath(`/dossiers/${dossierId}`);
  return { ts: Date.now() };
}

export async function deleteTimeEntry(id: string, dossierId: string) {
  const supabase = await createClient();
  // On ne supprime pas une saisie déjà rattachée à une facture.
  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", id)
    .eq("facturee", false);
  if (error) throw new Error(error.message);
  revalidatePath(`/dossiers/${dossierId}`);
}

// =====================================================================
// Chronomètre live (un par utilisateur) + timesheet
// =====================================================================

export async function startTimer(
  _prev: SimpleState,
  formData: FormData,
): Promise<SimpleState> {
  const user = await requireCabinet();
  // Le dossier est optionnel : on peut l'attribuer plus tard.
  const dossierId = String(formData.get("dossier_id") ?? "") || null;
  const description = String(formData.get("description") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("active_timers").upsert({
    user_id: user.id,
    dossier_id: dossierId,
    description,
    started_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  // Layout : le widget flottant (AppShell) se met à jour sur toutes les pages.
  revalidatePath("/", "layout");
  return {};
}

// Attribuer / changer le dossier du chrono en cours.
export async function setTimerDossier(formData: FormData): Promise<void> {
  const user = await requireCabinet();
  const dossierId = String(formData.get("dossier_id") ?? "") || null;
  const supabase = await createClient();
  await supabase
    .from("active_timers")
    .update({ dossier_id: dossierId })
    .eq("user_id", user.id);
  revalidatePath("/", "layout");
}

export async function stopTimer(): Promise<void> {
  const user = await requireCabinet();
  const supabase = await createClient();

  const { data: timer } = await supabase
    .from("active_timers")
    .select("dossier_id, description, started_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!timer) return;

  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(timer.started_at).getTime()) / 60000),
  );

  let tauxDossier: number | null = null;
  if (timer.dossier_id) {
    const { data: dossier } = await supabase
      .from("dossiers")
      .select("taux_horaire")
      .eq("id", timer.dossier_id)
      .single();
    tauxDossier = dossier?.taux_horaire ?? null;
  }
  const taux = tauxDossier ?? user.tauxHoraire ?? null;

  await supabase.from("time_entries").insert({
    dossier_id: timer.dossier_id, // peut être null : saisie « à attribuer »
    duree_minutes: minutes,
    taux,
    description: timer.description,
    date_saisie: new Date().toISOString().slice(0, 10),
  });
  await supabase.from("active_timers").delete().eq("user_id", user.id);

  revalidatePath("/", "layout");
  revalidatePath(`/dossiers/${timer.dossier_id}`);
}

export async function cancelTimer(): Promise<void> {
  const user = await requireCabinet();
  const supabase = await createClient();
  await supabase.from("active_timers").delete().eq("user_id", user.id);
  revalidatePath("/", "layout");
}

// Attribuer / changer le dossier d'une saisie depuis la timesheet.
// Réaligne le taux sur le dossier choisi (saisies non facturées uniquement).
export async function assignEntryDossier(formData: FormData): Promise<void> {
  const user = await requireCabinet();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const dossierId = String(formData.get("dossier_id") ?? "") || null;

  const supabase = await createClient();
  const update: { dossier_id: string | null; taux?: number | null } = {
    dossier_id: dossierId,
  };
  if (dossierId) {
    const { data: d } = await supabase
      .from("dossiers")
      .select("taux_horaire")
      .eq("id", dossierId)
      .single();
    update.taux = d?.taux_horaire ?? user.tauxHoraire ?? null;
  }

  await supabase
    .from("time_entries")
    .update(update)
    .eq("id", id)
    .eq("facturee", false);
  revalidatePath("/", "layout");
}

// Suppression d'une saisie depuis la timesheet (non facturée uniquement).
export async function removeEntry(formData: FormData): Promise<void> {
  await requireCabinet();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("time_entries")
    .delete()
    .eq("id", id)
    .eq("facturee", false);
  revalidatePath("/temps");
}

// Coût horaire d'un membre (admin uniquement).
export async function setMemberCost(
  _prev: SimpleState,
  formData: FormData,
): Promise<SimpleState> {
  const user = await requireCabinet();
  if (user.role !== "admin")
    return { error: "Action réservée aux administrateurs." };

  const memberId = String(formData.get("member_id") ?? "");
  if (!memberId) return { error: "Membre invalide." };
  const raw = String(formData.get("cout") ?? "").trim();
  const cost = raw === "" ? null : Number(raw.replace(",", "."));
  if (cost != null && (Number.isNaN(cost) || cost < 0))
    return { error: "Coût invalide." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_cost", {
    p_member: memberId,
    p_cost: cost,
  });
  if (error) return { error: error.message };

  revalidatePath("/temps");
  return {};
}
