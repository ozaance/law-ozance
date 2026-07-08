"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCabinet } from "@/lib/auth";
import { deleteConnexion } from "@/lib/connectors/store";
import { hashToken } from "@/lib/connectors/crypto";

export type ConnexionState = {
  error?: string;
  message?: string;
  // Jeton MCP en clair, renvoyé UNE seule fois après création
  newToken?: string;
};

// --- Déconnexion d'un compte tiers ---
export async function disconnectConnexion(
  _prev: ConnexionState,
  formData: FormData,
): Promise<ConnexionState> {
  await requireCabinet();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Connexion introuvable." };

  const { error } = await deleteConnexion(id);
  if (error) return { error };

  revalidatePath("/parametres/connexions");
  return { message: "Compte déconnecté." };
}

// --- Création d'un jeton MCP (admin) ---
export async function createMcpToken(
  _prev: ConnexionState,
  formData: FormData,
): Promise<ConnexionState> {
  const user = await requireCabinet();
  if (user.role !== "admin")
    return { error: "Réservé aux administrateurs du cabinet." };

  const name = String(formData.get("name") ?? "").trim() || "Jeton MCP";
  // Jeton lisible mais imprévisible ; jamais restocké en clair
  const token = "lxf_" + randomBytes(24).toString("hex");
  const prefix = token.slice(0, 12) + "…";

  const supabase = await createClient();
  const { error } = await supabase.from("mcp_tokens").insert({
    name,
    token_hash: hashToken(token),
    token_prefix: prefix,
  });
  if (error) return { error: error.message };

  revalidatePath("/parametres/connexions");
  return {
    message: "Jeton créé. Copiez-le maintenant, il ne sera plus affiché.",
    newToken: token,
  };
}

// --- Révocation d'un jeton MCP (admin) ---
export async function revokeMcpToken(
  _prev: ConnexionState,
  formData: FormData,
): Promise<ConnexionState> {
  const user = await requireCabinet();
  if (user.role !== "admin")
    return { error: "Réservé aux administrateurs du cabinet." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Jeton introuvable." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("mcp_tokens")
    .update({ revoked: true })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/parametres/connexions");
  return { message: "Jeton révoqué." };
}
