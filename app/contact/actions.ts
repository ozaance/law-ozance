"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendLeadEmail } from "@/lib/email";

export type LeadState = { error?: string; ok?: boolean };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function submitLead(
  _prev: LeadState,
  formData: FormData,
): Promise<LeadState> {
  // Honeypot anti-bot : un humain ne remplit pas ce champ caché.
  if (String(formData.get("website") ?? "").trim()) return { ok: true };

  const nom = String(formData.get("nom") ?? "").trim();
  const cabinet = String(formData.get("cabinet") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim() || null;

  if (!nom) return { error: "Votre nom est requis." };
  if (!EMAIL_RE.test(email)) return { error: "Adresse email invalide." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("leads")
    .insert({ nom, cabinet, email, telephone, message, source: "landing" });
  if (error) return { error: "Une erreur est survenue. Réessayez." };

  // Notification (best-effort : ne bloque pas la confirmation si l'email échoue).
  await sendLeadEmail({ nom, cabinet, email, telephone, message });

  return { ok: true };
}
