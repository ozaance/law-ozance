"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

type State = { error?: string };

export async function createCabinet(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const nom = String(formData.get("nom") ?? "").trim();
  if (nom.length < 2) return { error: "Le nom du cabinet est requis." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_cabinet", { nom });

  if (error) return { error: error.message };

  // Email de bienvenue (best-effort, n'interrompt pas le parcours).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) {
    const h = await headers();
    const host = h.get("host")!;
    const proto = h.get("x-forwarded-proto") ?? "http";
    await sendWelcomeEmail({
      to: user.email,
      prenom: (user.user_metadata?.nom_complet as string | undefined) ?? null,
      cabinetNom: nom,
      appUrl: `${proto}://${host}/dashboard`,
    });
  }

  revalidatePath("/", "layout");
  // Phase de test : accès direct à l'application. Réactiver le passage par
  // /abonnement (saisie carte) en même temps que SUBSCRIPTION_REQUIRED=true.
  redirect("/dashboard");
}
