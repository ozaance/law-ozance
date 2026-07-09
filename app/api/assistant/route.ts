import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest, NextResponse } from "next/server";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CABINET_TOOLS, executeCabinetTool } from "@/lib/assistant/tools";
import { debitAndLog, getWallet, resolveByokKey } from "@/lib/ai/billing";

// =====================================================================
// Assistant IA intégré (Claude Opus 4.8, SDK Anthropic officiel).
// Boucle agentique : Claude appelle les outils du cabinet (lecture +
// actions) puis répond. Réponse texte diffusée en streaming.
//
// Facturation : si le cabinet a activé sa propre clé Anthropic (BYOK),
// Anthropic le facture directement. Sinon, on utilise la clé plateforme
// et on débite le portefeuille de crédits du cabinet (bloqué à 0).
// =====================================================================

const MODEL = "claude-opus-4-8";
const MAX_TOOL_ROUNDS = 6;

type ClientMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  const user = await requireCabinet();

  const wallet = await getWallet(user.cabinetId);
  const byokKey = resolveByokKey(wallet);
  const usingByok = !!byokKey;
  const apiKey = byokKey ?? process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Assistant non configuré : aucun crédit plateforme ni clé Anthropic du cabinet.",
      },
      { status: 503 },
    );
  }

  // Sans BYOK, il faut des crédits pour utiliser l'assistant.
  if (!usingByok && wallet.balance_cents <= 0) {
    return NextResponse.json(
      {
        error:
          "Crédits IA épuisés. Rechargez le portefeuille du cabinet dans Paramètres → Crédits IA pour continuer.",
        code: "no_credits",
      },
      { status: 402 },
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
  const anthropic = new Anthropic({ apiKey });

  const today = new Date().toISOString().slice(0, 10);
  const system = [
    `Tu es l'assistant IA de LexFlow, un logiciel de gestion pour cabinets d'avocats.`,
    `Tu aides ${user.nomComplet ?? "l'utilisateur"} du cabinet « ${user.cabinetNom} ».`,
    `Date du jour : ${today}.`,
    `Réponds toujours en français, de façon concise et professionnelle.`,
    `Utilise les outils fournis pour consulter les données réelles du cabinet`,
    `(clients, dossiers, factures, agenda) avant de répondre à une question factuelle.`,
    `N'invente jamais de chiffres ou de noms : si l'information n'est pas disponible via un outil, dis-le.`,
    `Tu peux aussi créer et modifier des enregistrements (client, dossier, événement, facture, statuts) via les outils.`,
    `N'effectue une écriture que si l'utilisateur la demande clairement.`,
    `Si un détail essentiel manque ou est ambigu, demande-le avant d'agir plutôt que de deviner.`,
    `Pour créer un dossier ou une facture, retrouve d'abord le client avec search_clients.`,
    `Après une écriture, confirme en une phrase ce qui a été fait (avec numéro/référence si pertinent).`,
  ].join(" ");

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const encoder = new TextEncoder();
  let inputTokens = 0;
  let outputTokens = 0;

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

          messageStream.on("text", (delta) => {
            controller.enqueue(encoder.encode(delta));
          });

          const final = await messageStream.finalMessage();
          inputTokens += final.usage.input_tokens ?? 0;
          outputTokens += final.usage.output_tokens ?? 0;
          messages.push({ role: "assistant", content: final.content });

          if (final.stop_reason !== "tool_use") break;

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
        const msg = e instanceof Error ? e.message : "Erreur de l'assistant.";
        controller.enqueue(encoder.encode(`\n\n⚠️ ${msg}`));
      } finally {
        // Journalisation + débit des crédits (best-effort, hors chemin critique).
        try {
          await debitAndLog({
            cabinetId: user.cabinetId,
            userId: user.id,
            model: MODEL,
            inputTokens,
            outputTokens,
            byok: usingByok,
          });
        } catch {
          // ne pas casser la réponse déjà envoyée
        }
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
