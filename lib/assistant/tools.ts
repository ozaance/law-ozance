import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

// =====================================================================
// Outils de l'assistant IA : lecture seule des données du cabinet.
// Mêmes requêtes que le serveur MCP (app/api/mcp), mais au format
// « tool use » de l'API Anthropic. Le client Supabase passé ici est à
// session : la RLS garantit qu'on ne lit que les données du cabinet
// de l'utilisateur connecté.
// =====================================================================

export const CABINET_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_clients",
    description:
      "Recherche les clients du cabinet par nom (ou liste les premiers si aucun terme).",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Texte à chercher dans le nom" },
        limit: { type: "number", description: "Nombre max (défaut 20)" },
      },
    },
  },
  {
    name: "list_dossiers",
    description: "Liste les dossiers du cabinet, filtrables par statut.",
    input_schema: {
      type: "object",
      properties: {
        statut: { type: "string", description: "ex. ouvert, en_cours, clos" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "list_factures",
    description: "Liste les factures du cabinet, filtrables par statut.",
    input_schema: {
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
    input_schema: {
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
      "Statistiques synthétiques du cabinet (nombre de clients, dossiers, factures, événements).",
    input_schema: { type: "object", properties: {} },
  },

  // --- Actions d'écriture (création) ---
  {
    name: "create_client",
    description:
      "Crée un nouveau client. Confirme le nom avec l'utilisateur avant de créer si c'est ambigu.",
    input_schema: {
      type: "object",
      properties: {
        nom: {
          type: "string",
          description: "Raison sociale (entreprise) ou nom complet (particulier)",
        },
        type: {
          type: "string",
          enum: ["entreprise", "particulier"],
          description: "Défaut : entreprise",
        },
        email: { type: "string" },
        telephone: { type: "string" },
        notes: { type: "string" },
      },
      required: ["nom"],
    },
  },
  {
    name: "create_dossier",
    description:
      "Crée un dossier pour un client existant. Utilise d'abord search_clients pour obtenir le client_id.",
    input_schema: {
      type: "object",
      properties: {
        client_id: { type: "string", description: "ID du client (obligatoire)" },
        titre: { type: "string" },
        type_affaire: {
          type: "string",
          enum: [
            "conseil",
            "contrat",
            "ma",
            "contentieux",
            "corporate",
            "social",
            "fiscal",
            "recouvrement",
            "autre",
          ],
          description: "Défaut : conseil",
        },
        description: { type: "string" },
      },
      required: ["client_id", "titre"],
    },
  },
  {
    name: "create_evenement",
    description:
      "Ajoute un événement à l'agenda (échéance, rendez-vous, audience ou tâche).",
    input_schema: {
      type: "object",
      properties: {
        titre: { type: "string" },
        date_evenement: {
          type: "string",
          description: "Date au format YYYY-MM-DD (obligatoire)",
        },
        type: {
          type: "string",
          enum: ["echeance", "rendez_vous", "audience", "tache"],
          description: "Défaut : echeance",
        },
        heure: { type: "string", description: "Heure HH:MM (optionnel)" },
        lieu: { type: "string" },
        dossier_id: {
          type: "string",
          description: "Rattacher à un dossier (optionnel)",
        },
        notes: { type: "string" },
      },
      required: ["titre", "date_evenement"],
    },
  },
  {
    name: "create_facture",
    description:
      "Crée une facture ou note d'honoraires (mode forfait) pour un client, avec une ou plusieurs lignes. La TVA est calculée selon le régime du cabinet, le numéro est attribué automatiquement.",
    input_schema: {
      type: "object",
      properties: {
        client_id: { type: "string", description: "ID du client (utilise search_clients)" },
        lignes: {
          type: "array",
          description: "Lignes de prestation",
          items: {
            type: "object",
            properties: {
              designation: { type: "string" },
              montant_ht: { type: "number", description: "Montant HT en euros" },
            },
            required: ["designation", "montant_ht"],
          },
        },
        objet: { type: "string", description: "Objet de la facture (optionnel)" },
        date_echeance: {
          type: "string",
          description: "Échéance YYYY-MM-DD (optionnel)",
        },
        type_document: {
          type: "string",
          enum: ["note", "facture"],
          description: "Défaut : note (note d'honoraires)",
        },
      },
      required: ["client_id", "lignes"],
    },
  },
  {
    name: "update_dossier_statut",
    description:
      "Change le statut d'un dossier (par ex. le clôturer). Pour clôturer, utilise 'clos'.",
    input_schema: {
      type: "object",
      properties: {
        dossier_id: { type: "string" },
        statut: {
          type: "string",
          enum: ["ouvert", "en_cours", "en_attente", "clos"],
        },
      },
      required: ["dossier_id", "statut"],
    },
  },
  {
    name: "update_facture_statut",
    description:
      "Change le statut d'une facture (par ex. la marquer payée avec 'payee', envoyée avec 'envoyee', ou annulée).",
    input_schema: {
      type: "object",
      properties: {
        facture_id: { type: "string" },
        statut: {
          type: "string",
          enum: ["brouillon", "envoyee", "payee", "annulee"],
        },
      },
      required: ["facture_id", "statut"],
    },
  },
];

// Outils qui modifient les données (pour distinguer lecture / écriture).
export const WRITE_TOOL_NAMES = new Set([
  "create_client",
  "create_dossier",
  "create_evenement",
  "create_facture",
  "update_dossier_statut",
  "update_facture_statut",
]);

type Args = Record<string, unknown>;

// Exécute un outil et renvoie le résultat sérialisable. La RLS du client
// à session limite déjà la portée au cabinet de l'utilisateur.
export async function executeCabinetTool(
  supabase: SupabaseClient,
  name: string,
  args: Args,
): Promise<unknown> {
  const limit = Math.min(Number(args.limit) || 20, 100);

  if (name === "search_clients") {
    let q = supabase
      .from("clients")
      .select("id, nom, type, email, telephone")
      .order("nom")
      .limit(limit);
    if (typeof args.query === "string" && args.query.trim()) {
      q = q.ilike("nom", `%${args.query.trim()}%`);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data;
  }

  if (name === "list_dossiers") {
    let q = supabase
      .from("dossiers")
      .select(
        "id, reference, titre, type_affaire, statut, date_ouverture, client_id",
      )
      .order("date_ouverture", { ascending: false })
      .limit(limit);
    if (typeof args.statut === "string" && args.statut.trim()) {
      q = q.eq("statut", args.statut.trim());
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data;
  }

  if (name === "list_factures") {
    let q = supabase
      .from("factures")
      .select("id, numero, statut, date_emission, date_echeance, total, client_id")
      .order("date_emission", { ascending: false })
      .limit(limit);
    if (typeof args.statut === "string" && args.statut.trim()) {
      q = q.eq("statut", args.statut.trim());
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data;
  }

  if (name === "list_evenements") {
    let q = supabase
      .from("evenements")
      .select("id, type, titre, date_evenement, heure, lieu, termine, dossier_id")
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
    return data;
  }

  if (name === "get_stats") {
    const count = async (table: string) => {
      const { count } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    };
    const [clients, dossiers, factures, evenements] = await Promise.all([
      count("clients"),
      count("dossiers"),
      count("factures"),
      count("evenements"),
    ]);
    return { clients, dossiers, factures, evenements };
  }

  // ------------------------------------------------------------------
  // Actions d'écriture — cabinet_id / created_by sont posés par défaut
  // côté base (auth.uid() + current_cabinet_id()) grâce au client session.
  // ------------------------------------------------------------------
  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : null;

  if (name === "create_client") {
    const nom = str(args.nom);
    if (!nom) throw new Error("Le nom du client est obligatoire.");
    const { data, error } = await supabase
      .from("clients")
      .insert({
        nom,
        type: args.type === "particulier" ? "particulier" : "entreprise",
        email: str(args.email),
        telephone: str(args.telephone),
        notes: str(args.notes),
      })
      .select("id, nom, type, email, telephone")
      .single();
    if (error) throw new Error(error.message);
    return { created: "client", ...data };
  }

  if (name === "create_dossier") {
    const clientId = str(args.client_id);
    const titre = str(args.titre);
    if (!clientId) throw new Error("client_id obligatoire (cherchez le client d'abord).");
    if (!titre) throw new Error("Le titre du dossier est obligatoire.");
    const { data, error } = await supabase
      .from("dossiers")
      .insert({
        client_id: clientId,
        titre,
        type_affaire: str(args.type_affaire) ?? "conseil",
        description: str(args.description),
      })
      .select("id, reference, titre, type_affaire, statut, client_id")
      .single();
    if (error) throw new Error(error.message);
    return { created: "dossier", ...data };
  }

  if (name === "create_evenement") {
    const titre = str(args.titre);
    const date = str(args.date_evenement);
    if (!titre) throw new Error("Le titre de l'événement est obligatoire.");
    if (!date) throw new Error("La date (YYYY-MM-DD) est obligatoire.");
    const { data, error } = await supabase
      .from("evenements")
      .insert({
        titre,
        date_evenement: date,
        type: str(args.type) ?? "echeance",
        heure: str(args.heure),
        lieu: str(args.lieu),
        dossier_id: str(args.dossier_id),
        notes: str(args.notes),
      })
      .select("id, type, titre, date_evenement, heure, lieu, dossier_id")
      .single();
    if (error) throw new Error(error.message);
    return { created: "evenement", ...data };
  }

  if (name === "create_facture") {
    const clientId = str(args.client_id);
    if (!clientId) throw new Error("client_id obligatoire (cherchez le client d'abord).");
    const rawLignes = Array.isArray(args.lignes) ? args.lignes : [];
    const lignes = rawLignes
      .map((l) => {
        const o = (l ?? {}) as Record<string, unknown>;
        return {
          designation: str(o.designation) ?? "Prestation juridique",
          montant: Number(o.montant_ht) || 0,
        };
      })
      .filter((l) => l.montant > 0 || l.designation !== "Prestation juridique");
    if (lignes.length === 0)
      throw new Error("Ajoutez au moins une ligne (désignation + montant HT).");

    // Régime TVA du cabinet (RLS ne renvoie que le cabinet de l'utilisateur).
    const { data: cab } = await supabase
      .from("cabinets")
      .select("tva_assujetti, tva_taux")
      .limit(1)
      .single();
    const tauxTva = cab?.tva_assujetti ? Number(cab.tva_taux ?? 20) : 0;
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const montantHt = round2(lignes.reduce((s, l) => s + l.montant, 0));
    const montantTva = round2(montantHt * (tauxTva / 100));

    const { data: facture, error } = await supabase
      .from("factures")
      .insert({
        client_id: clientId,
        objet: str(args.objet),
        date_echeance: str(args.date_echeance),
        type_document: args.type_document === "facture" ? "facture" : "note",
        montant_ht: montantHt,
        taux_tva: tauxTva,
        montant_tva: montantTva,
        total: round2(montantHt + montantTva),
      })
      .select("id, numero, type_document, statut, total, montant_ht, taux_tva")
      .single();
    if (error) throw new Error(error.message);

    const { error: lErr } = await supabase.from("facture_lignes").insert(
      lignes.map((l, i) => ({
        facture_id: facture.id,
        designation: l.designation,
        montant: round2(l.montant),
        ordre: i,
      })),
    );
    if (lErr) throw new Error(lErr.message);
    return { created: "facture", ...facture };
  }

  if (name === "update_dossier_statut") {
    const id = str(args.dossier_id);
    const statut = str(args.statut);
    if (!id || !statut) throw new Error("dossier_id et statut obligatoires.");
    const { data, error } = await supabase
      .from("dossiers")
      .update({ statut })
      .eq("id", id)
      .select("id, reference, titre, statut")
      .single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Dossier introuvable.");
    return { updated: "dossier", ...data };
  }

  if (name === "update_facture_statut") {
    const id = str(args.facture_id);
    const statut = str(args.statut);
    if (!id || !statut) throw new Error("facture_id et statut obligatoires.");
    // Numéro légal attribué une seule fois, à l'émission (comme dans l'app).
    if (statut === "envoyee" || statut === "payee") {
      await supabase.rpc("attribuer_numero_facture", { p_facture: id });
    }
    const { data, error } = await supabase
      .from("factures")
      .update({ statut })
      .eq("id", id)
      .select("id, numero, statut, total")
      .single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Facture introuvable.");
    return { updated: "facture", ...data };
  }

  throw new Error(`Outil inconnu : ${name}`);
}
