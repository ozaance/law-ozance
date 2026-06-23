import Link from "next/link";
import { requireCabinet } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ClientForm } from "../client-form";
import { createClientAction } from "../actions";

export default async function NewClientPage() {
  const user = await requireCabinet();

  return (
    <AppShell user={user}>
      <Link
        href="/clients"
        className="text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Clients
      </Link>
      <h1 className="mb-6 mt-2 text-xl font-semibold tracking-tight">
        Nouveau client
      </h1>
      <ClientForm
        action={createClientAction}
        submitLabel="Créer le client"
        cancelHref="/clients"
      />
    </AppShell>
  );
}
