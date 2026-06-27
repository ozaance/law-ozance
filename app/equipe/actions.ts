"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCabinet } from "@/lib/auth";
import { sendInvitationEmail } from "@/lib/email";
import { syncSeats } from "@/lib/seats";

const ROLE_LABEL: Record<string, string> = {
  admin: "administrateur",
  avocat: "avocat",
  assistant: "assistant",
};

export type EquipeState = {
  error?: string;
  message?: string;
  inviteUrl?: string;
  emailed?: boolean;
};

const ROLES = ["avocat", "assistant"] as const;
const ALL_ROLES = ["admin", "avocat", "assistant"] as const;
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
  const inviteUrl = `${base}/invitation/${token}`;

  const { sent } = await sendInvitationEmail({
    to: email,
    cabinetNom: user.cabinetNom,
    roleLabel: ROLE_LABEL[role] ?? role,
    url: inviteUrl,
  });

  return {
    message: sent
      ? `Invitation envoyée par email à ${email}.`
      : `Invitation créée pour ${email}.`,
    inviteUrl,
    emailed: sent,
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

// --- Changer le rôle d'un membre (admin uniquement) ---
export async function updateMemberRole(
  _prev: EquipeState,
  formData: FormData,
): Promise<EquipeState> {
  const user = await requireCabinet();
  if (user.role !== "admin")
    return { error: "Action réservée aux administrateurs." };

  const memberId = String(formData.get("member_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!memberId) return { error: "Membre invalide." };
  if (!ALL_ROLES.includes(role as (typeof ALL_ROLES)[number]))
    return { error: "Rôle invalide." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_role", {
    p_member: memberId,
    p_role: role,
  });
  if (error) return { error: error.message };

  revalidatePath("/equipe");
  return { message: "Rôle mis à jour." };
}

// --- Taux horaire facturé d'un membre (admin uniquement) ---
export async function setMemberRate(
  _prev: EquipeState,
  formData: FormData,
): Promise<EquipeState> {
  const user = await requireCabinet();
  if (user.role !== "admin")
    return { error: "Action réservée aux administrateurs." };

  const memberId = String(formData.get("member_id") ?? "");
  if (!memberId) return { error: "Membre invalide." };
  const raw = String(formData.get("taux") ?? "").trim();
  const rate = raw === "" ? null : Number(raw.replace(",", "."));
  if (rate != null && (Number.isNaN(rate) || rate < 0))
    return { error: "Taux invalide." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_rate", {
    p_member: memberId,
    p_rate: rate,
  });
  if (error) return { error: error.message };

  revalidatePath("/equipe");
  revalidatePath("/temps");
  return { message: "Taux mis à jour." };
}

// --- Coût horaire interne d'un membre (admin uniquement) ---
export async function setMemberCost(
  _prev: EquipeState,
  formData: FormData,
): Promise<EquipeState> {
  const user = await requireCabinet();
  if (user.role !== "admin")
    return { error: "Action réservée aux administrateurs." };

  const memberId = String(formData.get("member_id") ?? "");
  if (!memberId) return { error: "Membre invalide." };
  const raw = String(formData.get("cout") ?? "").trim();
  const cost = raw === "" ? null : Number(raw.replace(",", "."));
  if (cost != null && (Number.isNaN(cost) || cost < 0))
    return { error: "Coût invalide." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_cost", {
    p_member: memberId,
    p_cost: cost,
  });
  if (error) return { error: error.message };

  revalidatePath("/equipe");
  revalidatePath("/temps");
  return { message: "Coût mis à jour." };
}

// --- Retirer un membre du cabinet (admin uniquement) ---
export async function removeMember(
  _prev: EquipeState,
  formData: FormData,
): Promise<EquipeState> {
  const user = await requireCabinet();
  if (user.role !== "admin")
    return { error: "Action réservée aux administrateurs." };

  const memberId = String(formData.get("member_id") ?? "");
  if (!memberId) return { error: "Membre invalide." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", { p_member: memberId });
  if (error) return { error: error.message };

  await syncSeats(user.cabinetId); // un membre en moins = un siège en moins
  revalidatePath("/equipe");
  return { message: "Membre retiré." };
}
