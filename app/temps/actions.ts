"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { heuresToMinutes } from "@/lib/format";

export type TimeEntryState = { error?: string; ts?: number };

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
  const { error } = await supabase.from("time_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dossiers/${dossierId}`);
}
