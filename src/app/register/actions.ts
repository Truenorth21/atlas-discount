"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

function documentId(role: string, label: string) {
  return `${role}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

export async function registerUser(formData: FormData) {
  const rawRole = String(formData.get("role"));
  const role = rawRole === "supplier" || rawRole === "route_seller" ? rawRole : "buyer";

  if (!isSupabaseConfigured) {
    redirect(role === "supplier" ? "/dashboard/supplier" : role === "route_seller" ? "/dashboard/route-seller" : "/dashboard/retailer");
  }

  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const companyName = String(formData.get("companyName"));
  const contactName = String(formData.get("contactName"));
  const phone = String(formData.get("phone"));

  const { data, error } = await supabase!.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`,
      data: {
        role,
        company_name: companyName,
        contact_name: contactName
      }
    }
  });

  if (error) {
    redirect(`/register/${role}?error=${encodeURIComponent(error.message)}` as never);
  }

  const userId = data.user?.id;
  if (userId) {
    await supabase!.from("profiles").upsert({
      id: userId,
      role,
      company_name: companyName,
      contact_name: contactName,
      email,
      phone,
      status: "pending"
    });

    if (role === "supplier") {
      await supabase!.from("supplier_profiles").upsert({
        profile_id: userId,
        legal_name: companyName,
        status: "pending",
        pickup_location: {
          address: String(formData.get("warehouseAddress") || ""),
          city: String(formData.get("warehouseCity") || ""),
          state: String(formData.get("warehouseState") || ""),
          zip: String(formData.get("warehouseZip") || ""),
          contact: String(formData.get("warehouseContact") || ""),
          phone: String(formData.get("warehousePhone") || ""),
          hours: String(formData.get("warehouseHours") || "")
        }
      });
    }

    if (role === "route_seller") {
      await supabase!.from("route_seller_profiles").upsert({
        profile_id: userId,
        program: String(formData.get("routeProgram") || "Independent Seller"),
        territory: String(formData.get("routeTerritory") || "Pending Atlas assignment"),
        assigned_hub: String(formData.get("routeHub") || "Miami hub"),
        product_lane: String(formData.get("productLane") || "Pending Atlas assignment"),
        status: "pending"
      });
    }

    const documentLabels = formData.getAll("documentLabels").map((label) => String(label));
    await Promise.all(
      documentLabels.map(async (label, index) => {
        const file = formData.get(`document-${index}`);
        if (!(file instanceof File) || file.size === 0) return;

        const storagePath = `${userId}/${documentId(role, label)}-${file.name}`;
        await supabase!.storage.from("business-documents").upload(storagePath, file, {
          upsert: true
        });
        await supabase!.from("business_documents").insert({
          profile_id: userId,
          document_type: label,
          storage_path: storagePath,
          expires_at: String(formData.get(`document-expiration-${index}`) || "") || null,
          status: "pending"
        });
      })
    );
  }

  redirect(role === "supplier" ? "/dashboard/supplier" : role === "route_seller" ? "/dashboard/route-seller" : "/dashboard/retailer");
}
