import { createClient } from "@/lib/supabase/server";
import { QuoteDetailClient } from "./quote-detail-client";

function userRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown>; email?: string } | null) {
  const userEmail = user?.email?.toLowerCase();
  const adminEmail = process.env.ATLAS_ADMIN_EMAIL?.toLowerCase();
  return String(
    user?.app_metadata?.role ??
      user?.user_metadata?.role ??
      (userEmail && adminEmail && userEmail === adminEmail ? "admin" : "")
  );
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Atlas economics (cost, margin, profit, commission) are admin-only. Resolve the
  // viewer's role on the server so a buyer can never see them by opening their quote.
  let isAdmin = false;
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role,status")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin =
        userRole(user) === "admin" ||
        (profile?.role === "admin" && profile.status === "approved");
    }
  } else if (process.env.NODE_ENV === "development" && process.env.DEV_ADMIN === "1") {
    // Local-dev admin preview (mirrors /admin gating); never active in production.
    isAdmin = true;
  }

  return <QuoteDetailClient id={id} isAdmin={isAdmin} />;
}
