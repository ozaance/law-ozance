import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ParamsForm } from "./params-form";
import { FacturationForm, type FacturationDefaults } from "./facturation-form";

export default async function ParametresPage() {
  const user = await requireCabinet();

  let facturation: FacturationDefaults | null = null;
  if (user.role === "admin") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("cabinets")
      .select(
        "barreau, telephone, site_web, logo_url, adresse, code_postal, ville, forme_juridique, siret, tva_intra, iban, bic, tva_assujetti, tva_taux, conditions_reglement, mentions_facture",
      )
      .eq("id", user.cabinetId)
      .single();
    facturation = data;
  }

  return (
    <AppShell user={user}>
      <h1 className="text-xl font-semibold tracking-tight">Paramètres</h1>
      <p className="mb-8 mt-1 text-sm text-muted">
        Votre profil et votre taux horaire
      </p>
      <ParamsForm nomComplet={user.nomComplet} tauxHoraire={user.tauxHoraire} />

      {facturation && (
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="text-lg font-semibold tracking-tight">
            Informations de facturation
          </h2>
          <p className="mb-6 mt-1 text-sm text-muted">
            Coordonnées de l&apos;émetteur et régime de TVA, repris sur toutes
            vos factures.
          </p>
          <FacturationForm defaults={facturation} />
        </section>
      )}
    </AppShell>
  );
}
