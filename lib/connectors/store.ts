import { createClient } from "@/lib/supabase/server";
import { decryptToken, encryptToken } from "./crypto";
import {
  getProviderCreds,
  refreshAccessToken,
  type TokenResponse,
} from "./oauth";
import { getProvider, type ProviderId } from "./registry";

// =====================================================================
// Persistance des connexions OAuth (table public.connexions).
// S'appuie sur le client Supabase à session : la RLS garantit que
// chacun n'accède qu'à ses propres connexions.
// =====================================================================

export type Connexion = {
  id: string;
  provider: ProviderId;
  status: string;
  account_email: string | null;
  account_label: string | null;
  scopes: string[];
  token_expires_at: string | null;
  error_message: string | null;
  updated_at: string;
};

// Colonnes non sensibles, sûres à renvoyer à l'UI
const PUBLIC_COLS =
  "id, provider, status, account_email, account_label, scopes, token_expires_at, error_message, updated_at";

export async function listConnexions(): Promise<Connexion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connexions")
    .select(PUBLIC_COLS)
    .order("updated_at", { ascending: false });
  return (data as Connexion[] | null) ?? [];
}

function expiresAt(token: TokenResponse): string | null {
  if (!token.expires_in) return null;
  return new Date(Date.now() + token.expires_in * 1000).toISOString();
}

// Crée ou met à jour la connexion après un échange OAuth réussi.
export async function upsertConnexion(opts: {
  provider: ProviderId;
  token: TokenResponse;
  identity: { email?: string; label?: string; id?: string } | null;
}): Promise<{ error?: string }> {
  const { provider, token, identity } = opts;
  const supabase = await createClient();

  const row = {
    provider,
    status: "connected",
    account_email: identity?.email ?? null,
    account_label: identity?.label ?? null,
    external_account_id: identity?.id ?? null,
    scopes: token.scope ? token.scope.split(/[ ,]+/).filter(Boolean) : [],
    access_token: encryptToken(token.access_token),
    refresh_token: encryptToken(token.refresh_token),
    token_expires_at: expiresAt(token),
    error_message: null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("connexions")
    .upsert(row, { onConflict: "cabinet_id,user_id,provider,account_email" });

  return { error: error?.message };
}

export async function deleteConnexion(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("connexions").delete().eq("id", id);
  return { error: error?.message };
}

// Renvoie un access_token valide pour une connexion, en le rafraîchissant
// si nécessaire (et en persistant le nouveau jeton). null si indisponible.
export async function getValidAccessToken(
  connexionId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connexions")
    .select("provider, access_token, refresh_token, token_expires_at")
    .eq("id", connexionId)
    .single();
  if (!data) return null;

  const notExpired =
    !data.token_expires_at ||
    new Date(data.token_expires_at).getTime() - 60_000 > Date.now();
  if (notExpired && data.access_token) {
    return decryptToken(data.access_token);
  }

  // Rafraîchissement
  const provider = getProvider(data.provider);
  const refresh = decryptToken(data.refresh_token);
  if (!provider || !refresh) return decryptToken(data.access_token);
  const creds = getProviderCreds(provider);
  if (!creds) return decryptToken(data.access_token);

  try {
    const token = await refreshAccessToken({
      provider,
      creds,
      refreshToken: refresh,
    });
    await supabase
      .from("connexions")
      .update({
        access_token: encryptToken(token.access_token),
        // certains fournisseurs renvoient un nouveau refresh_token
        refresh_token: token.refresh_token
          ? encryptToken(token.refresh_token)
          : data.refresh_token,
        token_expires_at: expiresAt(token),
        status: "connected",
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connexionId);
    return token.access_token;
  } catch (e) {
    await supabase
      .from("connexions")
      .update({
        status: "error",
        error_message: e instanceof Error ? e.message : "Rafraîchissement échoué",
      })
      .eq("id", connexionId);
    return null;
  }
}
