"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string; message?: string };

function originUrl(path: string, host: string, proto: string) {
  return `${proto}://${host}${path}`;
}

// N'accepte qu'un chemin interne relatif, pour éviter les redirections ouvertes.
function safeNext(value: FormDataEntryValue | null): string {
  const n = String(value ?? "");
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

// --- Connexion email + mot de passe ---
export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Email ou mot de passe incorrect." };

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

// --- Inscription email + mot de passe ---
export async function signup(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nomComplet = String(formData.get("nom_complet") ?? "").trim();

  if (password.length < 8)
    return { error: "Le mot de passe doit faire au moins 8 caractères." };

  const h = await headers();
  const host = h.get("host")!;
  const proto = h.get("x-forwarded-proto") ?? "http";
  const next = safeNext(formData.get("next"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nom_complet: nomComplet },
      emailRedirectTo: originUrl(
        `/auth/confirm?next=${encodeURIComponent(next)}`,
        host,
        proto,
      ),
    },
  });

  if (error) return { error: error.message };

  return {
    message:
      "Compte créé. Vérifiez votre email pour confirmer votre adresse, puis connectez-vous.",
  };
}

// --- Connexion / inscription via Google (OAuth) ---
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = safeNext(formData.get("next"));
  const h = await headers();
  const host = h.get("host")!;
  const proto = h.get("x-forwarded-proto") ?? "http";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: originUrl(
        `/auth/callback?next=${encodeURIComponent(next)}`,
        host,
        proto,
      ),
    },
  });

  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

// --- Lien magique (sans mot de passe) ---
export async function magicLink(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();

  const h = await headers();
  const host = h.get("host")!;
  const proto = h.get("x-forwarded-proto") ?? "http";
  const next = safeNext(formData.get("next"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: originUrl(
        `/auth/confirm?next=${encodeURIComponent(next)}`,
        host,
        proto,
      ),
    },
  });

  if (error) return { error: error.message };

  return { message: "Lien de connexion envoyé. Consultez votre boîte mail." };
}

// --- Demande de réinitialisation du mot de passe (envoi du lien) ---
export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email requis." };

  const h = await headers();
  const host = h.get("host")!;
  const proto = h.get("x-forwarded-proto") ?? "http";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: originUrl(
      "/auth/confirm?next=/nouveau-mot-de-passe",
      host,
      proto,
    ),
  });
  // Message générique : on n'indique pas si l'adresse existe (anti-énumération).
  if (error) return { error: error.message };

  return {
    message:
      "Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé.",
  };
}

// --- Définition d'un nouveau mot de passe (après clic sur le lien) ---
export async function updatePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8)
    return { error: "Le mot de passe doit faire au moins 8 caractères." };
  if (password !== confirm)
    return { error: "Les mots de passe ne correspondent pas." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      error: "Lien expiré ou invalide. Relancez la procédure de réinitialisation.",
    };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// --- Déconnexion ---
export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
