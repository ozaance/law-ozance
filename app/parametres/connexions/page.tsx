import { headers } from "next/headers";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import {
  providersByCategory,
  type ConnectorCategory,
} from "@/lib/connectors/registry";
import { isProviderConfigured } from "@/lib/connectors/oauth";
import { listConnexions } from "@/lib/connectors/store";
import {
  ConnexionsClient,
  type ConnexionView,
  type McpTokenView,
  type ProviderView,
} from "./connexions-client";

const CATEGORY_ORDER: ConnectorCategory[] = [
  "productivite",
  "compta",
  "stockage",
];

// Messages de retour du flux OAuth (query string)
const ERROR_LABELS: Record<string, string> = {
  fournisseur_inconnu: "Fournisseur inconnu.",
  non_configure:
    "Ce connecteur n'est pas encore configuré (identifiants OAuth manquants).",
  consentement_refuse: "Connexion annulée : consentement refusé.",
  reponse_invalide: "Réponse invalide du fournisseur.",
  etat_expire: "La demande a expiré, réessayez.",
  etat_invalide: "Vérification de sécurité échouée, réessayez.",
  echange_echoue: "Impossible d'obtenir les jetons d'accès.",
  enregistrement_echoue: "Connexion établie mais non enregistrée.",
};

export default async function ConnexionsPage(
  props: PageProps<"/parametres/connexions">,
) {
  const user = await requireCabinet();
  const sp = await props.searchParams;

  const [connexions, mcpTokens] = await Promise.all([
    listConnexions(),
    fetchMcpTokens(user.role === "admin"),
  ]);

  // Regroupe les connexions par fournisseur
  const connexionsByProvider: Record<string, ConnexionView[]> = {};
  for (const c of connexions) {
    (connexionsByProvider[c.provider] ??= []).push({
      id: c.id,
      provider: c.provider,
      status: c.status,
      account_email: c.account_email,
      account_label: c.account_label,
      updated_at: c.updated_at,
    });
  }

  const byCat = providersByCategory();
  const categories = CATEGORY_ORDER.map((key) => ({
    key,
    providers: byCat[key].map(
      (p): ProviderView => ({
        id: p.id,
        label: p.label,
        description: p.description,
        emoji: p.emoji,
        configured: isProviderConfigured(p.id),
        setupUrl: p.setupUrl,
      }),
    ),
  }));

  // Construit l'URL publique du point d'accès MCP
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const mcpEndpoint = `${proto}://${host}/api/mcp`;

  const flash = {
    error: typeof sp.error === "string" ? ERROR_LABELS[sp.error] : undefined,
    message:
      typeof sp.connecte === "string" ? "Compte connecté avec succès." : undefined,
  };

  return (
    <AppShell user={user}>
      <h1 className="text-xl font-semibold tracking-tight">Connexions</h1>
      <p className="mb-8 mt-1 text-sm text-muted">
        Reliez vos autres applications à LexFlow et exposez vos données à un
        assistant IA.
      </p>
      <ConnexionsClient
        categories={categories}
        connexionsByProvider={connexionsByProvider}
        isAdmin={user.role === "admin"}
        mcpEndpoint={mcpEndpoint}
        mcpTokens={mcpTokens}
        flash={flash}
      />
    </AppShell>
  );
}

async function fetchMcpTokens(isAdmin: boolean): Promise<McpTokenView[]> {
  if (!isAdmin) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("mcp_tokens")
    .select("id, name, token_prefix, last_used_at, created_at")
    .eq("revoked", false)
    .order("created_at", { ascending: false });
  return (data as McpTokenView[] | null) ?? [];
}
