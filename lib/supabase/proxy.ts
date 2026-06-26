import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rafraîchit la session Supabase à chaque requête et protège les routes privées.
// Appelé depuis proxy.ts à la racine (Next.js 16 : "middleware" => "proxy").
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT : ne rien exécuter entre createServerClient et getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes publiques (pas besoin d'être connecté).
  const pathname = request.nextUrl.pathname;
  const publicPaths = [
    "/login",
    "/signup",
    "/auth",
    "/stripe/webhook",
    "/mot-de-passe-oublie",
    "/nouveau-mot-de-passe",
    "/invitation",
    // SEO / crawlers : accessibles sans authentification.
    "/robots.txt",
    "/sitemap.xml",
    "/opengraph-image",
  ];
  // "/" (landing publique) en correspondance exacte ; les autres en préfixe.
  const isPublic = pathname === "/" || publicPaths.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Gating abonnement : les routes de l'application exigent un cabinet ET un
  // abonnement actif (essai, actif ou paiement en retard). Sinon on redirige
  // vers /onboarding (pas de cabinet) ou /abonnement (pas d'abonnement actif).
  // /abonnement et /onboarding restent toujours accessibles pour sortir du sas.
  // Désactivé par défaut (phase de test) : activer avec SUBSCRIPTION_REQUIRED=true.
  const gateEnabled = process.env.SUBSCRIPTION_REQUIRED === "true";
  const APP_PREFIXES = [
    "/dashboard",
    "/clients",
    "/dossiers",
    "/agenda",
    "/temps",
    "/factures",
    "/equipe",
    "/documents",
    "/parametres",
  ];
  if (gateEnabled && user && APP_PREFIXES.some((p) => pathname.startsWith(p))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("cabinet_id, cabinet:cabinets(abonnement_statut)")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.cabinet_id) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    const cab = Array.isArray(profile.cabinet)
      ? profile.cabinet[0]
      : (profile.cabinet as { abonnement_statut: string | null } | null);
    const statut = cab?.abonnement_statut ?? "inactif";
    if (!["trialing", "active", "past_due"].includes(statut)) {
      const url = request.nextUrl.clone();
      url.pathname = "/abonnement";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
