import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  nomComplet: string | null;
  role: string;
  cabinetId: string;
  cabinetNom: string;
  tauxHoraire: number | null;
  tutorielVu: boolean;
};

// À utiliser dans les pages protégées qui exigent un cabinet.
// Redirige vers /login (non connecté) ou /onboarding (pas de cabinet).
export async function requireCabinet(): Promise<CurrentUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "nom_complet, role, cabinet_id, taux_horaire, tutoriel_vu, cabinet:cabinets(nom)",
    )
    .eq("id", user.id)
    .single();

  if (!profile?.cabinet_id) redirect("/onboarding");

  const cabinetNom = Array.isArray(profile.cabinet)
    ? profile.cabinet[0]?.nom
    : (profile.cabinet as { nom: string } | null)?.nom;

  return {
    id: user.id,
    email: user.email ?? null,
    nomComplet: profile.nom_complet,
    role: profile.role,
    cabinetId: profile.cabinet_id,
    cabinetNom: cabinetNom ?? "Mon cabinet",
    tauxHoraire: profile.taux_horaire,
    tutorielVu: profile.tutoriel_vu ?? false,
  };
}
