import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminClient } from "./admin-client";

function userRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown>; email?: string } | null) {
  const userEmail = user?.email?.toLowerCase();
  const adminEmail = process.env.ATLAS_ADMIN_EMAIL?.toLowerCase();

  return String(
    user?.app_metadata?.role ??
      user?.user_metadata?.role ??
      (userEmail && adminEmail && userEmail === adminEmail ? "admin" : "")
  );
}

export default async function AdminPage() {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/login?next=/admin");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin =
    userRole(user) === "admin" ||
    (profile?.role === "admin" && profile.status === "approved");

  if (!isAdmin) {
    redirect("/dashboard/retailer");
  }

  return <AdminClient />;
}
