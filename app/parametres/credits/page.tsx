import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { getWallet } from "@/lib/ai/billing";
import { CREDIT_PACKS } from "./actions";
import { CreditsClient, type UsageRow } from "./credits-client";

export default async function CreditsPage(
  props: PageProps<"/parametres/credits">,
) {
  const user = await requireCabinet();
  const sp = await props.searchParams;

  const wallet = await getWallet(user.cabinetId);

  const supabase = await createClient();
  const { data: usage } = await supabase
    .from("ai_usage")
    .select("id, model, input_tokens, output_tokens, cost_cents, byok, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  // Coût cumulé du mois en cours
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { data: monthRows } = await supabase
    .from("ai_usage")
    .select("cost_cents")
    .gte("created_at", monthStart.toISOString());
  const monthCostCents = (monthRows ?? []).reduce(
    (s, r) => s + (r.cost_cents ?? 0),
    0,
  );

  return (
    <AppShell user={user}>
      <h1 className="text-xl font-semibold tracking-tight">Crédits IA</h1>
      <p className="mb-8 mt-1 text-sm text-muted">
        Le portefeuille du cabinet alimente l&apos;assistant IA. Chaque échange
        consomme des crédits selon les tokens utilisés.
      </p>
      <CreditsClient
        isAdmin={user.role === "admin"}
        balanceCents={wallet.balance_cents}
        byokEnabled={wallet.byok_enabled}
        packs={[...CREDIT_PACKS]}
        usage={(usage as UsageRow[] | null) ?? []}
        monthCostCents={monthCostCents}
        flash={sp.recharge === "ok" ? "Recharge effectuée. Merci !" : undefined}
      />
    </AppShell>
  );
}
