"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string };

export async function createCabinet(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const nom = String(formData.get("nom") ?? "").trim();
  if (nom.length < 2) return { error: "Le nom du cabinet est requis." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_cabinet", { nom });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
