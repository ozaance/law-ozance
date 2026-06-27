"use client";

import { useEffect, useState, useTransition } from "react";
import { markTutorialSeen } from "@/app/tutoriel-actions";

type Step = { emoji: string; titre: string; texte: string };

const STEPS: Step[] = [
  {
    emoji: "👋",
    titre: "Bienvenue sur Ozance",
    texte:
      "Votre cabinet en un seul endroit : clients, dossiers, agenda, temps, facturation et documents. Voici un tour rapide pour démarrer.",
  },
  {
    emoji: "👤",
    titre: "Clients & Dossiers",
    texte:
      "Créez vos clients, puis ouvrez un dossier (une affaire) par client. Tout le reste — temps, documents, factures — se rattache à ces dossiers.",
  },
  {
    emoji: "📅",
    titre: "Agenda",
    texte:
      "Gardez un œil sur vos échéances, audiences et rendez-vous. Rien ne passe à travers les mailles.",
  },
  {
    emoji: "⏱️",
    titre: "Temps & rentabilité",
    texte:
      "Lancez le chronomètre (avec pause), suivez votre feuille de temps, et visualisez la rentabilité de chaque collaborateur. Réglez les taux dans Équipe.",
  },
  {
    emoji: "🧾",
    titre: "Facturation",
    texte:
      "Générez des notes d'honoraires au temps passé ou au forfait. Choisissez un dossier : l'objet et les temps se remplissent tout seuls.",
  },
  {
    emoji: "📁",
    titre: "Documents",
    texte:
      "Stockez vos fichiers par dossier, prévisualisez-les (PDF, Word…) et modifiez vos documents Word directement, mise en page conservée.",
  },
  {
    emoji: "👥",
    titre: "Équipe",
    texte:
      "Invitez vos collaborateurs (avocats, assistants) et définissez leur taux facturé et leur coût horaire. Vous êtes prêt à commencer !",
  },
];

export function Tutorial() {
  const [open, setOpen] = useState(true);
  const [i, setI] = useState(0);
  const [, startTransition] = useTransition();

  const last = i === STEPS.length - 1;
  const step = STEPS[i];

  function close() {
    setOpen(false);
    startTransition(() => {
      markTutorialSeen();
    });
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-7 shadow-2xl">
        <div className="flex items-start justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-2xl">
            {step.emoji}
          </span>
          <button
            type="button"
            onClick={close}
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Passer l&apos;intro
          </button>
        </div>

        <h2 className="mt-5 text-xl font-semibold tracking-tight">
          {step.titre}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{step.texte}</p>

        {/* Progression */}
        <div className="mt-6 flex items-center gap-1.5">
          {STEPS.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === i
                  ? "w-5 bg-accent"
                  : idx < i
                    ? "w-1.5 bg-accent/50"
                    : "w-1.5 bg-border-strong"
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setI((n) => Math.max(0, n - 1))}
            disabled={i === 0}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:invisible"
          >
            ← Précédent
          </button>
          {last ? (
            <button
              type="button"
              onClick={close}
              className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Commencer 🚀
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setI((n) => Math.min(STEPS.length - 1, n + 1))}
              className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Suivant →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
