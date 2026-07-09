"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCabinet } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { countMembers } from "@/lib/seats";

export type DeleteState = { error?: string };

// Suppression définitive du compte de l'utilisateur courant (exigence Apple/
// Google + RGPD). Irréversible.
// - Si l'utilisateur est le seul membre de son cabinet : le cabinet et toutes
//   ses données sont supprimés (cascade), et l'abonnement Stripe est annulé.
// - Sinon : seul le compte de l'utilisateur est supprimé ; le cabinet et les
//   données partagées sont conservés pour les autres membres.
export async function deleteMyAccount(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "SUPPRIMER") {
    return { error: "Tapez SUPPRIMER en majuscules pour confirmer." };
  }

  const user = await requireCabinet();
  const admin = createAdminClient();

  const members = await countMembers(user.cabinetId);
  const soleMember = members <= 1;

  if (soleMember) {
    // Annule l'abonnement Stripe (best-effort) avant de tout supprimer.
    try {
      const { data: cab } = await admin
        .from("cabinets")
        .select("stripe_subscription_id")
        .eq("id", user.cabinetId)
        .single();
      if (cab?.stripe_subscription_id) {
        await stripe.subscriptions.cancel(cab.stripe_subscription_id);
      }
    } catch {
      // ne bloque pas la suppression
    }

    // Supprime le cabinet : cascade sur clients, dossiers, factures,
    // connexions, portefeuille IA, etc.
    const { error: cabErr } = await admin
      .from("cabinets")
      .delete()
      .eq("id", user.cabinetId);
    if (cabErr) return { error: cabErr.message };
  }

  // Supprime l'utilisateur d'authentification : cascade sur son profil.
  const { error: userErr } = await admin.auth.admin.deleteUser(user.id);
  if (userErr) return { error: userErr.message };

  // Ferme la session côté navigateur puis renvoie vers la connexion.
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?compte=supprime");
}
