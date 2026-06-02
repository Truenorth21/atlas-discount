import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function userRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown>; email?: string } | null) {
  return String(
    user?.app_metadata?.role ??
      user?.user_metadata?.role ??
      (user?.email === process.env.ATLAS_ADMIN_EMAIL ? "admin" : "")
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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

  if (userRole(user) !== "admin") {
    redirect("/dashboard/retailer");
  }

  return children;
}
