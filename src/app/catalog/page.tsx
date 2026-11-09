import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import CatalogClient from "./catalog-client";

export default async function CatalogPage() {
  const supabase = await createClient();
  let isAuthenticated = false;
  let userId: string | undefined;
  let userRole: string | undefined;
  let isApproved = false;
  let pricingTierId = "retailer";

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);

    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role,status,business_details")
        .eq("id", user.id)
        .maybeSingle();
      userRole = profile?.role ?? undefined;
      isApproved = profile?.status === "approved";
      const assignedTier = String((profile?.business_details as { pricingTierId?: string } | null)?.pricingTierId ?? "retailer");
      pricingTierId = /^[a-z0-9_-]{1,40}$/i.test(assignedTier) ? assignedTier : "retailer";
    }
  }

  return <Suspense fallback={<div className="atlas-container py-12 font-bold text-atlas-navy">Loading catalog…</div>}><CatalogClient isAuthenticated={isAuthenticated} userId={userId} userRole={userRole} isApproved={isApproved} pricingTierId={pricingTierId} /></Suspense>;
}
