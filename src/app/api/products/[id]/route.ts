import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { productToRow } from "@/lib/supabase/atlas-data";
import type { Product } from "@/lib/types";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await createClient();
  if (!session) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to edit this product." }, { status: 401 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) return NextResponse.json({ error: "Server-side product saving is not configured." }, { status: 503 });
  const service = createServiceClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const [{ data: profile }, { data: existing }] = await Promise.all([
    service.from("profiles").select("role,status").eq("id", user.id).maybeSingle(),
    service.from("products").select("id,supplier_profile_id").eq("id", id).maybeSingle()
  ]);
  if (!existing) return NextResponse.json({ error: "Product was not found in the shared catalog." }, { status: 404 });

  const adminEmail = process.env.ATLAS_ADMIN_EMAIL?.toLowerCase();
  const isAdmin = (profile?.role === "admin" && profile.status === "approved") || user.app_metadata?.role === "admin" || Boolean(adminEmail && user.email?.toLowerCase() === adminEmail);
  if (!isAdmin) {
    const { data: supplier } = await service.from("supplier_profiles").select("id").eq("profile_id", user.id).maybeSingle();
    if (!supplier || supplier.id !== existing.supplier_profile_id) return NextResponse.json({ error: "You can edit only products assigned to your supplier account." }, { status: 403 });
  }

  const body = await request.json() as { product?: Product };
  if (!body.product || body.product.id !== id) return NextResponse.json({ error: "Invalid product update." }, { status: 400 });
  const { id: _id, supplier_profile_id: _supplier, ...row } = productToRow(body.product, existing.supplier_profile_id) as Record<string, unknown> & { id?: string; supplier_profile_id?: string | null };
  const { error } = await service.from("products").update({ ...row, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ saved: true });
}
