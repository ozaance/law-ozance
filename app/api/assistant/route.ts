import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest, NextResponse } from "next/server";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CABINET_TOOLS, executeCabinetTool } from "@/lib/assistant/tools";

// =====================================================================
// Assistant IA intégré (Claude Opus 4.8, SDK Anthropic officiel).
// Boucle agentique : Claude peut appeler les outils de lecture du
// cabinet (clients, dossiers, factures, agenda) puis répondre.
// La réponse texte est diffusée en streaming vers le widget de chat.
// Auth : session Supabase de l'utilisateur (RLS scope les données).
// =====================================================================

const MODEL = "claude-opus-4-8";
const MAX_TOOL_ROUNDS = 6;

type ClientMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  const user = await requireCabinet();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Assistant non configuré : ajoutez ANTHROPIC_API_KEY dans .env.local.",
      },
      { status: 503 },
    );
  }

  let body: { messages?: ClientMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const history = Array.isArray(body.messages) ? body.messages : [];
  if (history.length === 0) {
    return NextResponse.json({ error: "Message manquant." }, { status: 400 });
  }

  const supabase = await createClient();
  const anthropic = new Anthropic();

  const today = new Date().toISOString().slice(0, 10);
  const system = [
    `Tu es l'assistant IA de LexFlow, un logiciel de gestion pour cabinets d'avocats.`,
    `Tu aides ${user.nomComplet ?? "l'utilisateur"} du cabinet « ${user.cabinetNom} ».`,
    `Date du jour : ${today}.`,
    `Réponds toujours en français, de façon concise et professionnelle.`,
    `Utilise les outils fournis pour consulter les données réelles du cabinet`,
    `(clients, dossiers, factures, agenda) avant de répondre à une question factuelle.`,
    `N'invente jamais de chiffres ou de noms : si l'information n'est pas disponible via un outil, dis-le.`,
    `Tu peux aussi créer des enregistrements (client, dossier, événement) via les outils create_*.`,
    `N'effectue une création que si l'utilisateur la demande clairement.`,
    `Si un détail essentiel manque ou est ambigu, demande-le avant de créer plutôt que de deviner.`,
    `Pour créer un dossier, retrouve d'abord le client avec search_clients.`,
    `Après une création, confirme en une phrase ce qui a été créé.`,
  ].join(" ");

  // Historique de conversation au format API (texte simple côté client).
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const messageStream = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 2048,
            system,
            tools: CABINET_TOOLS,
            messages,
          });

          // Diffuse le texte au fur et à mesure vers le client.
          messageStream.on("text", (delta) => {
            controller.enqueue(encoder.encode(delta));
          });

          const final = await messageStream.finalMessage();
          messages.push({ role: "assistant", content: final.content });

          if (final.stop_reason !== "tool_use") break;

          // Exécute tous les outils demandés puis renvoie les résultats.
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of final.content) {
            if (block.type !== "tool_use") continue;
            try {
              const data = await executeCabinetTool(
                supabase,
                block.name,
                (block.input as Record<string, unknown>) ?? {},
              );
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify(data),
              });
            } catch (e) {
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: e instanceof Error ? e.message : "Erreur outil",
                is_error: true,
              });
            }
          }
          messages.push({ role: "user", content: toolResults });
        }
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Erreur de l'assistant.";
        controller.enqueue(encoder.encode(`\n\n⚠️ ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
