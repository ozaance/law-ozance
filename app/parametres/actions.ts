"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ParamsState = { error?: string; message?: string };

export async function updateMonProfil(
  _prev: ParamsState,
  formData: FormData,
): Promise<ParamsState> {
  const nom = String(formData.get("nom_complet") ?? "").trim();
  const tauxRaw = String(formData.get("taux_horaire") ?? "").trim();
  const taux = tauxRaw === "" ? null : Number(tauxRaw.replace(",", "."));

  if (taux != null && (Number.isNaN(taux) || taux < 0)) {
    return { error: "Le taux horaire doit être un nombre positif." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase
    .from("profiles")
    .update({ nom_complet: nom || null, taux_horaire: taux })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { message: "Paramètres enregistrés." };
}
