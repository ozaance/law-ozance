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

// --- Déconnexion ---
export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
