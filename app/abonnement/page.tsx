import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { formatDateFr } from "@/app/agenda/constants";
import {
  PLANS,
  STATUT_LABELS,
  TRIAL_DAYS,
  planFromPriceId,
  type PlanCode,
} from "@/lib/stripe";
import {
  createCheckoutSession,
  openBillingPortal,
  syncFromSession,
} from "./actions";

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await requireCabinet();
  const { session_id } = await searchParams;

  // Retour de Checkout : on synchronise l'abonnement
  if (session_id) await syncFromSession(session_id);

  const supabase = await createClient();
  const { data: cabinet } = await supabase
    .from("cabinets")
    .select("abonnement_statut, abonnement_plan, abonnement_fin")
    .eq("id", user.cabinetId)
    .single();

  const statut = cabinet?.abonnement_statut ?? "inactif";
  const actif = ["trialing", "active", "past_due"].includes(statut);
  const planActuel = planFromPriceId(cabinet?.abonnement_plan ?? undefined);

  return (
    <AppShell user={user}>
      <h1 className="text-xl font-semibold tracking-tight">Abonnement</h1>
      <p className="mb-8 mt-1 text-sm text-zinc-500">
        Votre formule LexFlow
      </p>

      {actif ? (
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                statut === "past_due"
                  ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              }`}
            >
              {STATUT_LABELS[statut] ?? statut}
            </span>
            {planActuel && (
              <span className="text-sm font-medium">
                Formule {PLANS[planActuel].nom}
              </span>
            )}
          </div>
          {cabinet?.abonnement_fin && (
            <p className="mt-3 text-sm text-zinc-500">
              {statut === "trialing" ? "Essai jusqu'au" : "Prochaine échéance le"}{" "}
              {formatDateFr(cabinet.abonnement_fin.slice(0, 10))}
            </p>
          )}
          <form action={openBillingPortal} className="mt-5">
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Gérer l&apos;abonnement
            </button>
          </form>
        </div>
      ) : (
        <>
          <p className="mb-6 rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            🎁 Essai gratuit de {TRIAL_DAYS} jours — sans engagement, annulable à
            tout moment.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(Object.entries(PLANS) as [PlanCode, (typeof PLANS)[PlanCode]][]).map(
              ([code, plan]) => (
                <div
                  key={code}
                  className="flex flex-col rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
                >
                  <h2 className="text-lg font-semibold">{plan.nom}</h2>
                  <p className="mt-1">
                    <span className="text-3xl font-bold">{plan.prix} €</span>
                    <span className="text-sm text-zinc-500"> / mois</span>
                  </p>
                  <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="text-emerald-600">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <form
                    action={createCheckoutSession.bind(null, code)}
                    className="mt-6"
                  >
                    <button
                      type="submit"
                      className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      Commencer l&apos;essai
                    </button>
                  </form>
                </div>
              ),
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
