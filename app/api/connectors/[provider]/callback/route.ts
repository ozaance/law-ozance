import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProvider } from "@/lib/connectors/registry";
import {
  exchangeCodeForToken,
  fetchAccountIdentity,
  getProviderCreds,
} from "@/lib/connectors/oauth";
import { upsertConnexion } from "@/lib/connectors/store";

const STATE_COOKIE = "connector_oauth";

// Callback OAuth : vérifie l'état, échange le code contre des jetons,
// récupère l'identité du compte relié et persiste la connexion.
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/connectors/[provider]/callback">,
) {
  const { provider: providerId } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const settings = new URL("/parametres/connexions", request.url);

  const fail = (code: string) => {
    settings.searchParams.set("error", code);
    settings.searchParams.set("provider", providerId);
    const res = NextResponse.redirect(settings);
    res.cookies.delete(STATE_COOKIE);
    return res;
  };

  // Erreur renvoyée par le fournisseur (refus de consentement…)
  if (searchParams.get("error")) return fail("consentement_refuse");

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) return fail("reponse_invalide");

  const provider = getProvider(providerId);
  if (!provider) return fail("fournisseur_inconnu");

  // Vérifie l'état déposé au démarrage (anti-CSRF)
  const cookie = request.cookies.get(STATE_COOKIE)?.value;
  if (!cookie) return fail("etat_expire");
  let saved: { state?: string; provider?: string; verifier?: string };
  try {
    saved = JSON.parse(cookie);
  } catch {
    return fail("etat_invalide");
  }
  if (saved.state !== state || saved.provider !== providerId) {
    return fail("etat_invalide");
  }

  // L'utilisateur doit toujours être connecté (RLS à l'insertion)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const creds = getProviderCreds(provider);
  if (!creds) return fail("non_configure");

  const redirectUri = new URL(
    `/api/connectors/${provider.id}/callback`,
    request.url,
  ).toString();

  try {
    const token = await exchangeCodeForToken({
      provider,
      creds,
      code,
      redirectUri,
      codeVerifier: saved.verifier,
    });
    const identity = await fetchAccountIdentity(provider, token.access_token);
    const { error } = await upsertConnexion({
      provider: provider.id,
      token,
      identity,
    });
    if (error) return fail("enregistrement_echoue");
  } catch {
    return fail("echange_echoue");
  }

  settings.searchParams.set("connecte", provider.id);
  const res = NextResponse.redirect(settings);
  res.cookies.delete(STATE_COOKIE);
  return res;
}
