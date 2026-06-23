"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCabinet } from "@/lib/auth";

export type EquipeState = {
  error?: string;
  message?: string;
  inviteUrl?: string;
};

const ROLES = ["avocat", "assistant"] as const;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function originBase() {
  const h = await headers();
  const host = h.get("host")!;
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

// --- Inviter un collaborateur (admin uniquement) ---
export async function inviteMember(
  _prev: EquipeState,
  formData: FormData,
): Promise<EquipeState> {
  const user = await requireCabinet();
  if (user.role !== "admin")
    return { error: "Seul un administrateur peut inviter des collaborateurs." };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const role = String(formData.get("role") ?? "avocat");

  if (!EMAIL_RE.test(email)) return { error: "Adresse email invalide." };
  if (!ROLES.includes(role as (typeof ROLES)[number]))
    return { error: "Rôle invalide." };

  const supabase = await createClient();

  // Déjà membre du cabinet ?
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("cabinet_id", user.cabinetId)
    .ilike("email", email)
    .maybeSingle();
  if (existing)
    return { error: "Cette personne fait déjà partie du cabinet." };

  const token = randomBytes(24).toString("hex");
  const { error } = await supabase.from("invitations").insert({
    cabinet_id: user.cabinetId,
    email,
    role,
    token,
    invited_by: user.id,
  });

  if (error) {
    if (error.code === "23505")
      return { error: "Une invitation est déjà en attente pour cette adresse." };
    return { error: error.message };
  }

  revalidatePath("/equipe");
  const base = await originBase();
  return {
    message: `Invitation créée pour ${email}.`,
    inviteUrl: `${base}/invitation/${token}`,
  };
}

// --- Révoquer une invitation en attente (admin uniquement) ---
export async function revokeInvitation(formData: FormData): Promise<void> {
  const user = await requireCabinet();
  if (user.role !== "admin") return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("status", "pending");

  revalidatePath("/equipe");
}
