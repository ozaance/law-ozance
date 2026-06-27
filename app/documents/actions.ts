"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "documents";

export async function recordDocument(
  dossierId: string,
  payload: { nom: string; chemin: string; taille: number; type_mime: string },
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("documents").insert({
    dossier_id: dossierId,
    nom: payload.nom,
    chemin: payload.chemin,
    taille: payload.taille,
    type_mime: payload.type_mime,
  });
  if (error) return { error: error.message };
  revalidatePath(`/dossiers/${dossierId}`);
  revalidatePath("/documents");
  return {};
}

export async function getSignedUrl(
  chemin: string,
  expiresIn = 60,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(chemin, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

// Remplace le fichier d'un document existant (édition Word : on re-téléverse
// la version modifiée). On conserve la même entrée et on supprime l'ancien
// fichier. La mise en page est préservée puisqu'on stocke le binaire tel quel.
export async function replaceDocument(
  id: string,
  oldChemin: string,
  dossierId: string,
  payload: { nom: string; chemin: string; taille: number; type_mime: string },
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({
      nom: payload.nom,
      chemin: payload.chemin,
      taille: payload.taille,
      type_mime: payload.type_mime,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  // Best-effort : on retire l'ancien fichier (ignore l'échec).
  if (oldChemin && oldChemin !== payload.chemin) {
    await supabase.storage.from(BUCKET).remove([oldChemin]);
  }
  revalidatePath(`/dossiers/${dossierId}`);
  revalidatePath("/documents");
  return {};
}

export async function deleteDocument(
  id: string,
  chemin: string,
  dossierId: string,
) {
  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove([chemin]);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dossiers/${dossierId}`);
  revalidatePath("/documents");
}
