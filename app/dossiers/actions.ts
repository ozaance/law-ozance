"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATUTS, TYPES_AFFAIRE } from "./constants";

export type DossierFormState = { error?: string };

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function parseForm(formData: FormData) {
  const type = String(formData.get("type_affaire") ?? "conseil");
  const statut = String(formData.get("statut") ?? "ouvert");
  return {
    client_id: String(formData.get("client_id") ?? ""),
    avocat_id: emptyToNull(formData.get("avocat_id")),
    titre: String(formData.get("titre") ?? "").trim(),
    type_affaire: type in TYPES_AFFAIRE ? type : "conseil",
    statut: statut in STATUTS ? statut : "ouvert",
    description: emptyToNull(formData.get("description")),
    date_ouverture: emptyToNull(formData.get("date_ouverture")),
    date_cloture: emptyToNull(formData.get("date_cloture")),
  };
}

function validate(data: ReturnType<typeof parseForm>): string | null {
  if (!data.client_id) return "Le client est obligatoire.";
  if (!data.titre) return "Le titre est obligatoire.";
  return null;
}

export async function createDossierAction(
  _prev: DossierFormState,
  formData: FormData,
): Promise<DossierFormState> {
  const data = parseForm(formData);
  const err = validate(data);
  if (err) return { error: err };

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("dossiers")
    .insert(data)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dossiers");
  redirect(`/dossiers/${row.id}`);
}

export async function updateDossierAction(
  id: string,
  _prev: DossierFormState,
  formData: FormData,
): Promise<DossierFormState> {
  const data = parseForm(formData);
  const err = validate(data);
  if (err) return { error: err };

  const supabase = await createClient();
  const { error } = await supabase.from("dossiers").update(data).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dossiers");
  revalidatePath(`/dossiers/${id}`);
  redirect(`/dossiers/${id}`);
}

export async function deleteDossierAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("dossiers").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dossiers");
  redirect("/dossiers");
}
