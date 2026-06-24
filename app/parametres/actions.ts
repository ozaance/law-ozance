"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCabinet } from "@/lib/auth";

export type ParamsState = { error?: string; message?: string };

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

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

// Informations de facturation du cabinet (émetteur). Admin uniquement.
export async function updateCabinetFacturation(
  _prev: ParamsState,
  formData: FormData,
): Promise<ParamsState> {
  const user = await requireCabinet();
  if (user.role !== "admin")
    return { error: "Réservé aux administrateurs du cabinet." };

  const tauxRaw = String(formData.get("tva_taux") ?? "").trim();
  const taux = tauxRaw === "" ? 20 : Number(tauxRaw.replace(",", "."));
  if (Number.isNaN(taux) || taux < 0)
    return { error: "Taux de TVA invalide." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("cabinets")
    .update({
      barreau: emptyToNull(formData.get("barreau")),
      telephone: emptyToNull(formData.get("telephone")),
      site_web: emptyToNull(formData.get("site_web")),
      logo_url: emptyToNull(formData.get("logo_url")),
      adresse: emptyToNull(formData.get("adresse")),
      code_postal: emptyToNull(formData.get("code_postal")),
      ville: emptyToNull(formData.get("ville")),
      forme_juridique: emptyToNull(formData.get("forme_juridique")),
      siret: emptyToNull(formData.get("siret")),
      tva_intra: emptyToNull(formData.get("tva_intra")),
      iban: emptyToNull(formData.get("iban")),
      bic: emptyToNull(formData.get("bic")),
      tva_assujetti: formData.get("tva_assujetti") === "on",
      tva_taux: taux,
      conditions_reglement: emptyToNull(formData.get("conditions_reglement")),
      mentions_facture: emptyToNull(formData.get("mentions_facture")),
    })
    .eq("id", user.cabinetId);

  if (error) return { error: error.message };

  revalidatePath("/parametres");
  return { message: "Informations de facturation enregistrées." };
}
