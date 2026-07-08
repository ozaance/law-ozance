import { createHash, randomBytes } from "node:crypto";
import { getProvider, type ProviderDef } from "./registry";

// =====================================================================
// Flux OAuth 2.0 (authorization code, +PKCE optionnel) générique,
// piloté par le registre. Aucune dépendance externe : fetch natif.
// Côté serveur uniquement (lit les secrets d'environnement).
// =====================================================================

export type ProviderCreds = { clientId: string; clientSecret: string };

export function getProviderCreds(p: ProviderDef): ProviderCreds | null {
  const clientId = process.env[p.clientIdEnv];
  const clientSecret = process.env[p.clientSecretEnv];
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isProviderConfigured(id: string): boolean {
  const p = getProvider(id);
  return !!p && !!getProviderCreds(p);
}

// PKCE : verifier aléatoire + challenge S256
export function makePkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

export function buildAuthorizeUrl(opts: {
  provider: ProviderDef;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge?: string;
}): string {
  const { provider, clientId, redirectUri, state, codeChallenge } = opts;
  const sep = provider.scopeSeparator ?? " ";
  const url = new URL(provider.authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", provider.scopes.join(sep));
  url.searchParams.set("state", state);
  for (const [k, v] of Object.entries(provider.authorizeParams ?? {})) {
    url.searchParams.set(k, v);
  }
  if (provider.pkce && codeChallenge) {
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }
  return url.toString();
}

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  // Divers champs spécifiques (id_token, realmId QuickBooks…)
  [k: string]: unknown;
};

export async function exchangeCodeForToken(opts: {
  provider: ProviderDef;
  creds: ProviderCreds;
  code: string;
  redirectUri: string;
  codeVerifier?: string;
}): Promise<TokenResponse> {
  const { provider, creds, code, redirectUri, codeVerifier } = opts;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
  });
  if (provider.pkce && codeVerifier) body.set("code_verifier", codeVerifier);

  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Échec de l'échange OAuth (${res.status}) : ${text.slice(0, 300)}`,
    );
  }
  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(opts: {
  provider: ProviderDef;
  creds: ProviderCreds;
  refreshToken: string;
}): Promise<TokenResponse> {
  const { provider, creds, refreshToken } = opts;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
  });
  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Échec du rafraîchissement OAuth (${res.status}) : ${text.slice(0, 300)}`,
    );
  }
  return (await res.json()) as TokenResponse;
}

// Récupère l'identité du compte relié (email/label) après connexion.
// Best-effort : renvoie null si le fournisseur n'est pas géré ou en cas
// d'erreur (l'affichage restera générique).
export async function fetchAccountIdentity(
  provider: ProviderDef,
  accessToken: string,
): Promise<{ email?: string; label?: string; id?: string } | null> {
  try {
    if (provider.id === "google") {
      const r = await fetch(
        "https://openidconnect.googleapis.com/v1/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!r.ok) return null;
      const j = (await r.json()) as { email?: string; name?: string; sub?: string };
      return { email: j.email, label: j.name, id: j.sub };
    }
    if (provider.id === "microsoft") {
      const r = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!r.ok) return null;
      const j = (await r.json()) as {
        mail?: string;
        userPrincipalName?: string;
        displayName?: string;
        id?: string;
      };
      return {
        email: j.mail ?? j.userPrincipalName,
        label: j.displayName,
        id: j.id,
      };
    }
    if (provider.id === "dropbox") {
      const r = await fetch(
        "https://api.dropboxapi.com/2/users/get_current_account",
        { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!r.ok) return null;
      const j = (await r.json()) as {
        email?: string;
        name?: { display_name?: string };
        account_id?: string;
      };
      return {
        email: j.email,
        label: j.name?.display_name,
        id: j.account_id,
      };
    }
  } catch {
    // ignore — identité non critique
  }
  return null;
}
