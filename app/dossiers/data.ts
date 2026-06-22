import { createClient } from "@/lib/supabase/server";

// Options pour les sélecteurs du formulaire de dossier (clients + membres du cabinet).
export async function getDossierFormOptions() {
  const supabase = await createClient();

  const [{ data: clients }, { data: avocats }] = await Promise.all([
    supabase.from("clients").select("id, nom").order("nom"),
    supabase.from("profiles").select("id, nom_complet, email").order("nom_complet"),
  ]);

  return {
    clients: (clients ?? []).map((c) => ({ id: c.id, label: c.nom })),
    avocats: (avocats ?? []).map((a) => ({
      id: a.id,
      label: a.nom_complet ?? a.email ?? "Membre",
    })),
  };
}
