import Link from "next/link";
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

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-lg font-semibold tracking-tight">Connexions</h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          Reliez Google, Microsoft, votre outil de compta ou de signature, et
          exposez vos données à un assistant IA (MCP).
        </p>
        <Link
          href="/parametres/connexions"
          className="inline-block rounded-md border border-border-strong px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
        >
          Gérer les connexions →
        </Link>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-lg font-semibold tracking-tight">Crédits IA</h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          Rechargez le portefeuille qui alimente l&apos;assistant IA, ou
          utilisez votre propre clé Anthropic.
        </p>
        <Link
          href="/parametres/credits"
          className="inline-block rounded-md border border-border-strong px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
        >
          Gérer les crédits IA →
        </Link>
      </section>

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
