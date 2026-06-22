"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TYPES_EVENEMENT } from "./constants";

export type EvenementFormState = { error?: string };

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function parseForm(formData: FormData) {
  const type = String(formData.get("type") ?? "echeance");
  return {
    type: type in TYPES_EVENEMENT ? type : "echeance",
    titre: String(formData.get("titre") ?? "").trim(),
    dossier_id: emptyToNull(formData.get("dossier_id")),
    assigne_a: emptyToNull(formData.get("assigne_a")),
    date_evenement: emptyToNull(formData.get("date_evenement")),
    heure: emptyToNull(formData.get("heure")),
    lieu: emptyToNull(formData.get("lieu")),
    notes: emptyToNull(formData.get("notes")),
  };
}

function validate(data: ReturnType<typeof parseForm>): string | null {
  if (!data.titre) return "Le titre est obligatoire.";
  if (!data.date_evenement) return "La date est obligatoire.";
  return null;
}

export async function createEvenementAction(
  _prev: EvenementFormState,
  formData: FormData,
): Promise<EvenementFormState> {
  const data = parseForm(formData);
  const err = validate(data);
  if (err) return { error: err };

  const supabase = await createClient();
  const { error } = await supabase.from("evenements").insert(data);
  if (error) return { error: error.message };

  revalidatePath("/agenda");
  redirect("/agenda");
}

export async function updateEvenementAction(
  id: string,
  _prev: EvenementFormState,
  formData: FormData,
): Promise<EvenementFormState> {
  const data = parseForm(formData);
  const err = validate(data);
  if (err) return { error: err };

  const supabase = await createClient();
  const { error } = await supabase.from("evenements").update(data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/agenda");
  revalidatePath(`/agenda/${id}`);
  redirect("/agenda");
}

export async function toggleEvenementAction(id: string, termine: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("evenements")
    .update({ termine })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/agenda");
}

export async function deleteEvenementAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("evenements").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/agenda");
  redirect("/agenda");
}
