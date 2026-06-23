import { requireCabinet } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ParamsForm } from "./params-form";

export default async function ParametresPage() {
  const user = await requireCabinet();

  return (
    <AppShell user={user}>
      <h1 className="text-xl font-semibold tracking-tight">Paramètres</h1>
      <p className="mb-8 mt-1 text-sm text-muted">
        Votre profil et votre taux horaire
      </p>
      <ParamsForm nomComplet={user.nomComplet} tauxHoraire={user.tauxHoraire} />
    </AppShell>
  );
}
