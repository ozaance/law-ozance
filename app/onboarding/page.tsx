import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Déjà rattaché à un cabinet ? -> dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("cabinet_id")
    .eq("id", user.id)
    .single();
  if (profile?.cabinet_id) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-8 max-w-sm text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenue sur LexFlow
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Créez votre cabinet pour commencer.
        </p>
      </div>
      <OnboardingForm />
    </main>
  );
}
