import { createClient } from "@/lib/supabase/server";
import CatalogClient from "./catalog-client";

export default async function CatalogPage() {
  const supabase = await createClient();
  let isAuthenticated = false;
  let userId: string | undefined;
  let userRole: string | undefined;
  let isApproved = false;

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);

    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role,status")
        .eq("id", user.id)
        .maybeSingle();
      userRole = profile?.role ?? undefined;
      isApproved = profile?.status === "approved";
    }
  }

  return <CatalogClient isAuthenticated={isAuthenticated} userId={userId} userRole={userRole} isApproved={isApproved} />;
}
