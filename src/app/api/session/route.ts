import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (process.env.NODE_ENV === "development" && process.env.DEV_ADMIN === "1") {
    return NextResponse.json({ authenticated: true, isAdmin: true, role: "admin", companyName: "" });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ authenticated: false }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status,company_name")
    .eq("id", user.id)
    .maybeSingle();

  const configuredAdmin = process.env.ATLAS_ADMIN_EMAIL?.toLowerCase();
  const metadataRole = String(user.app_metadata?.role ?? user.user_metadata?.role ?? "");
  const isAdmin =
    metadataRole === "admin" ||
    (configuredAdmin && user.email?.toLowerCase() === configuredAdmin) ||
    (profile?.role === "admin" && profile.status === "approved");

  return NextResponse.json({
    authenticated: true,
    userId: user.id,
    isAdmin: Boolean(isAdmin),
    role: profile?.role ?? metadataRole,
    companyName: profile?.company_name ?? user.user_metadata?.company_name ?? ""
  });
}
