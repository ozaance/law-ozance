import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AcceptForm } from "./accept-form";

const ROLE_LABEL: Record<string, string> = {
  admin: "administrateur",
  avocat: "avocat",
  assistant: "assistant",
};

type InvitationDetails = {
  cabinet_nom: string;
  email: string;
  role: string;
  status: string;
  expired: boolean;
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ozance-mark-navy.png"
          alt="Ozance"
          width={44}
          className="mb-4 h-11 w-auto dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ozance-mark-gold.png"
          alt="Ozance"
          width={44}
          className="mb-4 hidden h-11 w-auto dark:block"
        />
        <h1 className="text-2xl font-semibold tracking-tight">Ozance</h1>
      </div>
      <div className="w-full max-w-sm text-center">{children}</div>
    </main>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <Link
        href="/login"
        className="mt-6 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
      >
        Aller à la connexion
      </Link>
    </>
  );
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: rows } = await supabase.rpc("get_invitation", {
    p_token: token,
  });
  const inv = (rows as InvitationDetails[] | null)?.[0];

  if (!inv) {
    return (
      <Shell>
        <Message
          title="Invitation introuvable"
          body="Ce lien d'invitation n'est pas valide. Demandez à votre cabinet de vous en renvoyer un."
        />
      </Shell>
    );
  }

  if (inv.status !== "pending") {
    return (
      <Shell>
        <Message
          title="Invitation déjà utilisée"
          body="Cette invitation a déjà été acceptée ou a été révoquée."
        />
      </Shell>
    );
  }

  if (inv.expired) {
    return (
      <Shell>
        <Message
          title="Invitation expirée"
          body="Ce lien a dépassé sa durée de validité. Demandez une nouvelle invitation à votre cabinet."
        />
      </Shell>
    );
  }

  const roleLabel = ROLE_LABEL[inv.role] ?? inv.role;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Non connecté : proposer création de compte / connexion, retour ici ensuite.
  if (!user) {
    const next = `/invitation/${token}`;
    return (
      <Shell>
        <h2 className="text-lg font-semibold">
          Rejoignez {inv.cabinet_nom}
        </h2>
        <p className="mt-2 text-sm text-muted">
          Vous êtes invité comme <strong>{roleLabel}</strong>. Connectez-vous ou
          créez votre compte avec l&apos;adresse <strong>{inv.email}</strong> pour
          rejoindre le cabinet.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="rounded-md bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Créer mon compte
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="rounded-md border border-border-strong px-3 py-2.5 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/5"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
      </Shell>
    );
  }

  // Connecté : vérifier le profil (cabinet existant / bonne adresse).
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, cabinet_id")
    .eq("id", user.id)
    .single();

  if (profile?.cabinet_id) {
    return (
      <Shell>
        <Message
          title="Vous appartenez déjà à un cabinet"
          body="Un compte ne peut être rattaché qu'à un seul cabinet. Déconnectez-vous puis rejoignez l'invitation avec un autre compte si nécessaire."
        />
      </Shell>
    );
  }

  if ((profile?.email ?? "").toLowerCase() !== inv.email.toLowerCase()) {
    return (
      <Shell>
        <Message
          title="Mauvaise adresse email"
          body={`Cette invitation est destinée à ${inv.email}. Vous êtes connecté avec ${profile?.email ?? "un autre compte"}. Déconnectez-vous et reconnectez-vous avec la bonne adresse.`}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <h2 className="text-lg font-semibold">Rejoindre {inv.cabinet_nom}</h2>
      <p className="mb-6 mt-2 text-sm text-muted">
        Vous avez été invité comme <strong>{roleLabel}</strong>. Acceptez pour
        accéder à l&apos;espace du cabinet.
      </p>
      <AcceptForm
        token={token}
        cabinetNom={inv.cabinet_nom}
        role={roleLabel}
      />
    </Shell>
  );
}
