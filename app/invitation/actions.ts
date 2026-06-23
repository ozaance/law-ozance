"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncSeats } from "@/lib/seats";

export type AcceptState = { error?: string };

export async function acceptInvitation(
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Lien d'invitation invalide." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/invitation/${token}`);

  const { data: cabinetId, error } = await supabase.rpc("accept_invitation", {
    p_token: token,
  });
  // Les messages d'erreur du RPC sont déjà en français et lisibles.
  if (error) return { error: error.message };

  // Nouveau membre = un siège de plus sur l'abonnement du cabinet.
  if (typeof cabinetId === "string") await syncSeats(cabinetId);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
