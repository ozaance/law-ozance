import { createClient } from "@/lib/supabase/server";

// Options pour le formulaire d'événement (dossiers + membres du cabinet).
export async function getEvenementFormOptions() {
  const supabase = await createClient();

  const [{ data: dossiers }, { data: avocats }] = await Promise.all([
    supabase
      .from("dossiers")
      .select("id, reference, titre")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, nom_complet, email").order("nom_complet"),
  ]);

  return {
    dossiers: (dossiers ?? []).map((d) => ({
      id: d.id,
      label: `${d.reference} — ${d.titre}`,
    })),
    avocats: (avocats ?? []).map((a) => ({
      id: a.id,
      label: a.nom_complet ?? a.email ?? "Membre",
    })),
  };
}
