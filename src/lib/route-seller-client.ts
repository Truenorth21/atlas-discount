"use client";

import { createClient } from "@/lib/supabase/browser";
import type { ApprovalStatus } from "@/lib/types";

export type CurrentRouteSeller = {
  userId: string;
  name: string;
  companyName: string;
  program: "Route Seller" | "Independent Seller" | "Online Seller";
  territory: string;
  assignedHub: "Miami hub" | "Orlando hub";
  productLane: string;
  status: ApprovalStatus;
  referralCode: string;
};

export function referralCodeForUser(userId: string) {
  return `ATLAS-${userId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export async function loadCurrentRouteSeller(): Promise<CurrentRouteSeller | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const [{ data: profile }, { data: route }] = await Promise.all([
    supabase.from("profiles").select("company_name,contact_name,status,role").eq("id", auth.user.id).maybeSingle(),
    supabase.from("route_seller_profiles").select("program,territory,assigned_hub,product_lane,status").eq("profile_id", auth.user.id).maybeSingle(),
  ]);
  if (!profile || profile.role !== "route_seller" || !route) return null;
  return {
    userId: auth.user.id,
    name: profile.contact_name,
    companyName: profile.company_name,
    program: route.program,
    territory: route.territory,
    assignedHub: route.assigned_hub,
    productLane: route.product_lane,
    status: route.status,
    referralCode: referralCodeForUser(auth.user.id),
  } as CurrentRouteSeller;
}
