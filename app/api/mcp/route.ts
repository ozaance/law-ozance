import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/connectors/crypto";

// =====================================================================
// Serveur MCP (Model Context Protocol) — transport HTTP, JSON-RPC 2.0.
// Expose les données du cabinet EN LECTURE SEULE à un assistant IA.
// Authentification : en-tête « Authorization: Bearer <jeton MCP> ».
// Aucune dépendance externe : le protocole est implémenté à la main.
// =====================================================================

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "lexflow", version: "1.0.0" };

type JsonRpcId = string | number | null;
type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
};

function result(id: JsonRpcId, res: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result: res });
}
function rpcError(id: JsonRpcId, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } });
}

// --- Définition des outils exposés ---
const TOOLS = [
  {
    name: "search_clients",
    description:
      "Recherche les clients du cabinet par nom (ou liste tout si vide).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Texte à chercher dans le nom" },
        limit: { type: "number", description: "Nombre max de résultats (défaut 20)" },
      },
    },
  },
  {
    name: "list_dossiers",
    description: "Liste les dossiers du cabinet, filtrables par statut.",
    inputSchema: {
      type: "object",
      properties: {
        statut: {
          type: "string",
          description: "ex. ouvert, en_cours, clos",
        },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "list_factures",
    description: "Liste les factures du cabinet, filtrables par statut.",
    inputSchema: {
      type: "object",
      properties: {
        statut: {
          type: "string",
          description: "ex. brouillon, envoyee, payee",
        },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "list_evenements",
    description:
      "Liste les événements d'agenda (échéances, RDV) sur une période.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "Date min (YYYY-MM-DD)" },
        to: { type: "string", description: "Date max (YYYY-MM-DD)" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "get_stats",
    description:
      "Statistiques synthétiques du cabinet (nombre de clients, dossiers, factures).",
    inputSchema: { type: "object", properties: {} },
  },
];

// --- Authentification par jeton MCP ---
async function authenticate(
  req: NextRequest,
): Promise<{ cabinetId: string; tokenId: string } | null> {
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("mcp_tokens")
    .select("id, cabinet_id, revoked")
    .eq("token_hash", hashToken(m[1].trim()))
    .eq("revoked", false)
    .maybeSingle();
  if (!data) return null;
  // Trace d'usage (best-effort)
  void supabase
    .from("mcp_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);
  return { cabinetId: data.cabinet_id, tokenId: data.id };
}

// --- Exécution d'un outil (scopé au cabinet) ---
function toolContent(data: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

async function callTool(
  cabinetId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const supabase = createAdminClient();
  const limit = Math.min(Number(args.limit) || 20, 100);

  if (name === "search_clients") {
    let q = supabase
      .from("clients")
      .select("id, nom, type, email, telephone")
      .eq("cabinet_id", cabinetId)
      .order("nom")
      .limit(limit);
    if (typeof args.query === "string" && args.query.trim()) {
      q = q.ilike("nom", `%${args.query.trim()}%`);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return toolContent(data);
  }

  if (name === "list_dossiers") {
    let q = supabase
      .from("dossiers")
      .select(
        "id, reference, titre, type_affaire, statut, date_ouverture, client_id",
      )
      .eq("cabinet_id", cabinetId)
      .order("date_ouverture", { ascending: false })
      .limit(limit);
    if (typeof args.statut === "string" && args.statut.trim()) {
      q = q.eq("statut", args.statut.trim());
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return toolContent(data);
  }

  if (name === "list_factures") {
    let q = supabase
      .from("factures")
      .select(
        "id, numero, statut, date_emission, date_echeance, total, client_id",
      )
      .eq("cabinet_id", cabinetId)
      .order("date_emission", { ascending: false })
      .limit(limit);
    if (typeof args.statut === "string" && args.statut.trim()) {
      q = q.eq("statut", args.statut.trim());
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return toolContent(data);
  }

  if (name === "list_evenements") {
    let q = supabase
      .from("evenements")
      .select("id, type, titre, date_evenement, heure, lieu, termine, dossier_id")
      .eq("cabinet_id", cabinetId)
      .order("date_evenement")
      .limit(limit);
    if (typeof args.from === "string" && args.from.trim()) {
      q = q.gte("date_evenement", args.from.trim());
    }
    if (typeof args.to === "string" && args.to.trim()) {
      q = q.lte("date_evenement", args.to.trim());
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return toolContent(data);
  }

  if (name === "get_stats") {
    const count = async (table: string) => {
      const { count } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("cabinet_id", cabinetId);
      return count ?? 0;
    };
    const [clients, dossiers, factures, evenements] = await Promise.all([
      count("clients"),
      count("dossiers"),
      count("factures"),
      count("evenements"),
    ]);
    return toolContent({ clients, dossiers, factures, evenements });
  }

  throw new Error(`Outil inconnu : ${name}`);
}

// --- Point d'entrée JSON-RPC ---
export async function POST(request: NextRequest) {
  const session = await authenticate(request);
  if (!session) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32001, message: "Non autorisé" } },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    );
  }

  let body: JsonRpcRequest;
  try {
    body = (await request.json()) as JsonRpcRequest;
  } catch {
    return rpcError(null, -32700, "JSON invalide");
  }

  const id = body.id ?? null;
  const { method, params = {} } = body;

  switch (method) {
    case "initialize":
      return result(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });

    case "notifications/initialized":
    case "notifications/cancelled":
      // Notifications : pas de réponse attendue
      return new NextResponse(null, { status: 204 });

    case "ping":
      return result(id, {});

    case "tools/list":
      return result(id, { tools: TOOLS });

    case "tools/call": {
      const name = String((params as { name?: string }).name ?? "");
      const args =
        ((params as { arguments?: Record<string, unknown> }).arguments) ?? {};
      try {
        const res = await callTool(session.cabinetId, name, args);
        return result(id, res);
      } catch (e) {
        // Erreur d'outil : renvoyée dans le résultat (isError) selon MCP
        return result(id, {
          isError: true,
          content: [
            {
              type: "text",
              text: e instanceof Error ? e.message : "Erreur inconnue",
            },
          ],
        });
      }
    }

    default:
      return rpcError(id, -32601, `Méthode inconnue : ${method}`);
  }
}

// Découverte : un GET renvoie les infos du serveur (pratique pour tester)
export async function GET() {
  return NextResponse.json({
    server: SERVER_INFO,
    protocol: PROTOCOL_VERSION,
    transport: "http",
    auth: "Bearer <jeton MCP>",
    tools: TOOLS.map((t) => t.name),
  });
}
