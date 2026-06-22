import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCabinet } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ClientForm } from "../client-form";
import { updateClientAction } from "../actions";
import { DeleteClientButton } from "./delete-button";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCabinet();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, type, nom, siren, forme_juridique, email, telephone, notes")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const updateWithId = updateClientAction.bind(null, client.id);

  return (
    <AppShell user={user}>
      <div className="flex items-center justify-between">
        <Link
          href="/clients"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Clients
        </Link>
        <DeleteClientButton id={client.id} />
      </div>

      <h1 className="mb-6 mt-2 text-xl font-semibold tracking-tight">
        {client.nom}
      </h1>

      <ClientForm
        action={updateWithId}
        defaults={{
          type: client.type,
          nom: client.nom,
          siren: client.siren,
          forme_juridique: client.forme_juridique,
          email: client.email,
          telephone: client.telephone,
          notes: client.notes,
        }}
        submitLabel="Enregistrer"
        cancelHref="/clients"
      />
    </AppShell>
  );
}
