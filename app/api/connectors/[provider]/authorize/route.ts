import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProvider } from "@/lib/connectors/registry";
import {
  buildAuthorizeUrl,
  getProviderCreds,
  makePkce,
} from "@/lib/connectors/oauth";

const STATE_COOKIE = "connector_oauth";

// Démarre le flux OAuth : construit l'URL d'autorisation du fournisseur,
// dépose un cookie d'état (anti-CSRF + PKCE) et redirige.
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/connectors/[provider]/authorize">,
) {
  const { provider: providerId } = await ctx.params;
  const settings = new URL("/parametres/connexions", request.url);

  const provider = getProvider(providerId);
  if (!provider) {
    settings.searchParams.set("error", "fournisseur_inconnu");
    return NextResponse.redirect(settings);
  }

  // L'utilisateur doit être connecté à LexFlow
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const creds = getProviderCreds(provider);
  if (!creds) {
    settings.searchParams.set("error", "non_configure");
    settings.searchParams.set("provider", provider.id);
    return NextResponse.redirect(settings);
  }

  const redirectUri = new URL(
    `/api/connectors/${provider.id}/callback`,
    request.url,
  ).toString();

  const state = randomBytes(16).toString("hex");
  const pkce = provider.pkce ? makePkce() : null;

  const authorizeUrl = buildAuthorizeUrl({
    provider,
    clientId: creds.clientId,
    redirectUri,
    state,
    codeChallenge: pkce?.challenge,
  });

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(
    STATE_COOKIE,
    JSON.stringify({ state, provider: provider.id, verifier: pkce?.verifier }),
    {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 min
    },
  );
  return res;
}
