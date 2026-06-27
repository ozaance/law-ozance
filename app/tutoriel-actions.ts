"use server";

import { createClient } from "@/lib/supabase/server";

// Marque le tutoriel d'intro comme vu pour l'utilisateur courant.
export async function markTutorialSeen(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("mark_tutorial_seen");
}
