// =====================================================================
// Registre des connecteurs OAuth
// Métadonnées PURES (aucun secret, aucune API Node) : ce fichier est
// importable côté client pour l'affichage. Les identifiants client
// (client_id / client_secret) sont lus depuis l'environnement côté
// serveur uniquement, cf. lib/connectors/oauth.ts.
// =====================================================================

export type ConnectorCategory =
  | "productivite"
  | "compta"
  | "stockage";

export type ProviderId =
  | "google"
  | "microsoft"
  | "pennylane"
  | "quickbooks"
  | "dropbox"
  | "docusign";

export type ProviderDef = {
  id: ProviderId;
  label: string;
  description: string;
  category: ConnectorCategory;
  // Emoji d'illustration (évite une dépendance d'icônes)
  emoji: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  // Séparateur des scopes dans l'URL d'autorisation (espace le plus souvent)
  scopeSeparator?: string;
  // Paramètres additionnels à ajouter à l'URL d'autorisation
  authorizeParams?: Record<string, string>;
  // PKCE requis (Microsoft, Dropbox…)
  pkce?: boolean;
  // Noms des variables d'environnement portant les identifiants
  clientIdEnv: string;
  clientSecretEnv: string;
  // Documentation pour l'admin (où créer l'app OAuth)
  setupUrl: string;
};

export const CATEGORY_LABELS: Record<ConnectorCategory, string> = {
  productivite: "Productivité & messagerie",
  compta: "Comptabilité & facturation",
  stockage: "Stockage & signature",
};

export const PROVIDERS: ProviderDef[] = [
  {
    id: "google",
    label: "Google Workspace",
    description: "Gmail, Google Agenda, Drive et Contacts.",
    category: "productivite",
    emoji: "🟦",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/contacts.readonly",
    ],
    // access_type=offline + prompt=consent pour obtenir un refresh_token
    authorizeParams: { access_type: "offline", prompt: "consent" },
    clientIdEnv: "GOOGLE_CONNECTOR_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CONNECTOR_CLIENT_SECRET",
    setupUrl: "https://console.cloud.google.com/apis/credentials",
  },
  {
    id: "microsoft",
    label: "Microsoft 365",
    description: "Outlook, Calendrier, OneDrive et Contacts (Graph).",
    category: "productivite",
    emoji: "🟧",
    authorizeUrl:
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: [
      "openid",
      "email",
      "profile",
      "offline_access",
      "User.Read",
      "Mail.Read",
      "Calendars.Read",
      "Files.Read.All",
      "Contacts.Read",
    ],
    pkce: true,
    clientIdEnv: "MICROSOFT_CONNECTOR_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_CONNECTOR_CLIENT_SECRET",
    setupUrl:
      "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
  },
  {
    id: "pennylane",
    label: "Pennylane",
    description: "Synchronisation des factures et de la comptabilité.",
    category: "compta",
    emoji: "🟩",
    authorizeUrl: "https://app.pennylane.com/oauth/authorize",
    tokenUrl: "https://app.pennylane.com/oauth/token",
    scopes: ["accounting", "invoices"],
    clientIdEnv: "PENNYLANE_CONNECTOR_CLIENT_ID",
    clientSecretEnv: "PENNYLANE_CONNECTOR_CLIENT_SECRET",
    setupUrl: "https://pennylane.com/developers",
  },
  {
    id: "quickbooks",
    label: "QuickBooks",
    description: "Export des factures vers QuickBooks Online.",
    category: "compta",
    emoji: "🟢",
    authorizeUrl: "https://appcenter.intuit.com/connect/oauth2",
    tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    scopes: ["com.intuit.quickbooks.accounting", "openid", "email"],
    clientIdEnv: "QUICKBOOKS_CONNECTOR_CLIENT_ID",
    clientSecretEnv: "QUICKBOOKS_CONNECTOR_CLIENT_SECRET",
    setupUrl: "https://developer.intuit.com/app/developer/dashboard",
  },
  {
    id: "dropbox",
    label: "Dropbox",
    description: "Import et sauvegarde des documents du cabinet.",
    category: "stockage",
    emoji: "🔵",
    authorizeUrl: "https://www.dropbox.com/oauth2/authorize",
    tokenUrl: "https://api.dropboxapi.com/oauth2/token",
    scopes: ["files.metadata.read", "files.content.read", "account_info.read"],
    // token_access_type=offline pour un refresh_token durable
    authorizeParams: { token_access_type: "offline" },
    pkce: true,
    clientIdEnv: "DROPBOX_CONNECTOR_CLIENT_ID",
    clientSecretEnv: "DROPBOX_CONNECTOR_CLIENT_SECRET",
    setupUrl: "https://www.dropbox.com/developers/apps",
  },
  {
    id: "docusign",
    label: "DocuSign",
    description: "Signature électronique des actes et contrats.",
    category: "stockage",
    emoji: "🟡",
    authorizeUrl: "https://account-d.docusign.com/oauth/auth",
    tokenUrl: "https://account-d.docusign.com/oauth/token",
    scopes: ["signature", "extended"],
    authorizeParams: { response_type: "code" },
    clientIdEnv: "DOCUSIGN_CONNECTOR_CLIENT_ID",
    clientSecretEnv: "DOCUSIGN_CONNECTOR_CLIENT_SECRET",
    setupUrl: "https://developers.docusign.com/",
  },
];

export function getProvider(id: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function providersByCategory(): Record<ConnectorCategory, ProviderDef[]> {
  const out: Record<ConnectorCategory, ProviderDef[]> = {
    productivite: [],
    compta: [],
    stockage: [],
  };
  for (const p of PROVIDERS) out[p.category].push(p);
  return out;
}
