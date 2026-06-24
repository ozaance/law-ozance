"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ClientFormState = { error?: string };

function parseForm(formData: FormData) {
  const type = String(formData.get("type") ?? "entreprise");
  const nom = String(formData.get("nom") ?? "").trim();
  const payload = {
    type: type === "particulier" ? "particulier" : "entreprise",
    nom,
    siren: emptyToNull(formData.get("siren")),
    forme_juridique: emptyToNull(formData.get("forme_juridique")),
    tva_intra: emptyToNull(formData.get("tva_intra")),
    email: emptyToNull(formData.get("email")),
    telephone: emptyToNull(formData.get("telephone")),
    adresse: emptyToNull(formData.get("adresse")),
    code_postal: emptyToNull(formData.get("code_postal")),
    ville: emptyToNull(formData.get("ville")),
    notes: emptyToNull(formData.get("notes")),
  };
  // Les champs entreprise n'ont pas de sens pour un particulier.
  if (payload.type === "particulier") {
    payload.siren = null;
    payload.forme_juridique = null;
    payload.tva_intra = null;
  }
  return payload;
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const data = parseForm(formData);
  if (!data.nom) return { error: "Le nom est obligatoire." };

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("clients")
    .insert(data)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/clients");
  redirect(`/clients/${row.id}`);
}

export async function updateClientAction(
  id: string,
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const data = parseForm(formData);
  if (!data.nom) return { error: "Le nom est obligatoire." };

  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(data).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  redirect("/clients");
}
