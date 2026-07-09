import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Ozance",
  description:
    "Comment Ozance collecte, utilise et protège vos données personnelles.",
};

// Page publique (référencée par l'App Store, Google Play et le RGPD).
// Mise à jour : convertir la date ci-dessous à chaque révision.
const MAJ = "9 juillet 2026";
const CONTACT = "contact@ozance.app";

function Section({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold tracking-tight">{titre}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

export default function ConfidentialitePage() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-12 sm:px-8">
      <Link href="/" className="text-sm text-accent hover:underline">
        ← Retour
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        Politique de confidentialité
      </h1>
      <p className="mt-1 text-sm text-muted">Dernière mise à jour : {MAJ}</p>

      <Section titre="1. Qui sommes-nous">
        <p>
          Ozance est un logiciel de gestion destiné aux cabinets d&apos;avocats
          (gestion des clients, dossiers, agenda, temps et facturation), assorti
          d&apos;un assistant IA. Le responsable de traitement est l&apos;éditeur
          d&apos;Ozance. Pour toute question relative à vos données, écrivez à{" "}
          <a className="text-accent hover:underline" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
          .
        </p>
      </Section>

      <Section titre="2. Données que nous traitons">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Compte</strong> : email, nom, rôle au sein du cabinet.
          </li>
          <li>
            <strong>Données professionnelles saisies par vous</strong> : clients,
            dossiers, événements d&apos;agenda, saisies de temps, factures et
            documents. Ces données peuvent contenir des informations sur des
            tiers (vos clients), dont vous êtes responsable.
          </li>
          <li>
            <strong>Paiement</strong> : gérés par Stripe. Nous ne stockons pas
            vos coordonnées bancaires.
          </li>
          <li>
            <strong>Assistant IA</strong> : le contenu de vos échanges et les
            données du cabinet interrogées sont transmis au modèle pour produire
            la réponse. Un décompte d&apos;usage (nombre de jetons) est conservé.
          </li>
          <li>
            <strong>Techniques</strong> : cookies strictement nécessaires à
            l&apos;authentification et au bon fonctionnement du service.
          </li>
        </ul>
      </Section>

      <Section titre="3. Finalités et base légale">
        <p>
          Nous traitons ces données pour fournir le service (exécution du
          contrat), assurer la sécurité, gérer la facturation et
          l&apos;abonnement, et répondre à nos obligations légales. L&apos;usage
          de l&apos;assistant IA repose sur votre demande explicite.
        </p>
      </Section>

      <Section titre="4. Hébergement et sous-traitants">
        <p>
          Vos données sont hébergées dans l&apos;Union européenne (Supabase,
          région Paris). Nous faisons appel à des sous-traitants pour des
          fonctions précises :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Supabase</strong> — base de données et authentification (UE).
          </li>
          <li>
            <strong>Vercel</strong> — hébergement de l&apos;application.
          </li>
          <li>
            <strong>Stripe</strong> — paiement et abonnement.
          </li>
          <li>
            <strong>Anthropic</strong> — modèle d&apos;IA de l&apos;assistant.
          </li>
          <li>
            <strong>Resend</strong> — envoi des emails transactionnels.
          </li>
        </ul>
      </Section>

      <Section titre="5. Durée de conservation">
        <p>
          Vos données sont conservées tant que votre compte est actif. À la
          suppression du compte (voir ci-dessous), elles sont effacées ; seules
          les données requises par la loi (par ex. factures) peuvent être
          conservées le temps légal applicable.
        </p>
      </Section>

      <Section titre="6. Vos droits">
        <p>
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
          rectification, d&apos;effacement, de portabilité, de limitation et
          d&apos;opposition. Vous pouvez exercer ces droits en nous écrivant à{" "}
          <a className="text-accent hover:underline" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>{" "}
          et vous avez le droit d&apos;introduire une réclamation auprès de la
          CNIL.
        </p>
      </Section>

      <Section titre="7. Suppression de votre compte">
        <p>
          Vous pouvez supprimer votre compte à tout moment, directement dans
          l&apos;application, depuis{" "}
          <strong>Paramètres → Supprimer mon compte</strong>. Cette action est
          définitive : votre compte est effacé, et si vous êtes le seul membre
          de votre cabinet, l&apos;ensemble des données du cabinet est également
          supprimé et l&apos;abonnement annulé. Vous pouvez aussi en faire la
          demande par email à{" "}
          <a className="text-accent hover:underline" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
          .
        </p>
      </Section>

      <Section titre="8. Modifications">
        <p>
          Nous pouvons faire évoluer cette politique. Toute modification sera
          publiée sur cette page avec une nouvelle date de mise à jour.
        </p>
      </Section>
    </main>
  );
}
