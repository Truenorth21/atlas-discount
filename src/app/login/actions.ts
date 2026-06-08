"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

function userRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown>; email?: string } | null) {
  const userEmail = user?.email?.toLowerCase();
  const adminEmail = process.env.ATLAS_ADMIN_EMAIL?.toLowerCase();

  return String(
    user?.app_metadata?.role ??
      user?.user_metadata?.role ??
      (userEmail && adminEmail && userEmail === adminEmail ? "admin" : "")
  );
}

export async function signIn(formData: FormData) {
  if (!isSupabaseConfigured) {
    redirect("/dashboard/retailer");
  }

  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const next = String(formData.get("next") || "");

  const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  if (next) {
    redirect(next as never);
  }

  const { data: profile } = await supabase!
    .from("profiles")
    .select("role,status")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = userRole(data.user) || profile?.role;
  if (role === "admin" || (profile?.role === "admin" && profile.status === "approved")) {
    redirect("/admin");
  }
  if (role === "supplier") {
    redirect("/dashboard/supplier");
  }
  if (role === "route_seller") {
    redirect("/dashboard/route-seller");
  }

  redirect("/dashboard/retailer");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}
