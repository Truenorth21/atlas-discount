"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  if (!isSupabaseConfigured) {
    redirect("/dashboard/retailer");
  }

  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const next = String(formData.get("next") || "/dashboard/retailer");

  const { error } = await supabase!.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(next as never);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}
