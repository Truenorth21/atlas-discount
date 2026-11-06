import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { productToRow } from "@/lib/supabase/atlas-data";
import type { Product } from "@/lib/types";

export async function POST(request: Request) {
  const sessionClient = await createClient();
  if (!sessionClient) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in as an Atlas admin." }, { status: 401 });

  const { data: profile } = await sessionClient
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();
  const adminEmail = process.env.ATLAS_ADMIN_EMAIL?.toLowerCase();
  const isAdmin =
    (profile?.role === "admin" && profile?.status === "approved") ||
    user.app_metadata?.role === "admin" ||
    Boolean(adminEmail && user.email?.toLowerCase() === adminEmail);
  if (!isAdmin) return NextResponse.json({ error: "Admin access is required." }, { status: 403 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Server-side product publishing is not configured." }, { status: 503 });
  }

  const body = await request.json() as { products?: Product[] };
  if (!Array.isArray(body.products) || body.products.length === 0) {
    return NextResponse.json({ error: "No products were supplied." }, { status: 400 });
  }

  const service = createServiceClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const supplierNames = Array.from(new Set(
    body.products
      .map((product) => product.supplierName?.trim())
      .filter((name): name is string => Boolean(name) && name !== "Atlas Admin")
  ));
  const supplierIds = new Map<string, string>();

  if (supplierNames.length > 0) {
    const { data: suppliers, error: supplierError } = await service
      .from("supplier_profiles")
      .select("id, legal_name")
      .in("legal_name", supplierNames);
    if (supplierError) return NextResponse.json({ error: supplierError.message }, { status: 400 });
    for (const supplier of suppliers ?? []) supplierIds.set(supplier.legal_name, supplier.id);

    // Atlas may pre-list a supplier and enter products before that company has
    // created login credentials. Those products retain supplier_name and use a
    // null profile id until registration connects the account.
  }

  const { error } = await service.from("products").upsert(
    body.products.map((product) => productToRow(product, supplierIds.get(product.supplierName?.trim() ?? "") ?? null)),
    { onConflict: "id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ count: body.products.length });
}
