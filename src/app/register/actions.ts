"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { ADMIN_EMAIL, appUrl, emailLayout, esc, sendEmail } from "@/lib/email";
import type { UserRole } from "@/lib/types";
import { SUPPLIER_AGREEMENT_VERSION } from "@/lib/supplier-agreement";

const roleLabels: Record<string, string> = {
  buyer: "buyer (Member)",
  supplier: "supplier",
  route_seller: "sales rep"
};

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
  if (role === "supplier" && formData.get("supplierAgreementAccepted") !== "on") {
    redirect(`/register/supplier?error=${encodeURIComponent("You must accept the Supplier Marketplace Agreement to apply.")}` as never);
  }
  const signerName = String(formData.get("agreementSignerName") || "").trim();
  const signerTitle = String(formData.get("agreementSignerTitle") || "").trim();
  if (role === "supplier" && (!signerName || !signerTitle)) {
    redirect(`/register/supplier?error=${encodeURIComponent("Enter the authorized signer's name and title.")}` as never);
  }
  const requestHeaders = role === "supplier" ? await headers() : null;
  const supplierAgreement = role === "supplier" ? {
    version: SUPPLIER_AGREEMENT_VERSION,
    signerName,
    signerTitle,
    acceptedAt: new Date().toISOString(),
    ipAddress: requestHeaders?.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders?.get("x-real-ip") || undefined
  } : undefined;

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
      status: "pending",
      business_details:
        role === "buyer"
          ? {
              ein: String(formData.get("businessEin") || ""),
              address: String(formData.get("businessAddress") || ""),
              city: String(formData.get("businessCity") || ""),
              state: String(formData.get("businessState") || ""),
              zip: String(formData.get("businessZip") || ""),
              referralCode: String(formData.get("referralCode") || "").trim().toUpperCase().slice(0, 32) || undefined
            }
          : role === "supplier" ? { agreementAcceptance: supplierAgreement } : null
    });

    if (role === "supplier") {
      const { data: supplierProfile } = await supabase!.from("supplier_profiles").upsert({
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
      }).select("id").single();

      // Products may have been entered by Atlas before the supplier registered.
      // Attach those records now so the supplier can edit them under normal RLS.
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supplierProfile?.id && serviceKey && supabaseUrl) {
        const service = createServiceClient(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
        await service
          .from("products")
          .update({ supplier_profile_id: supplierProfile.id })
          .is("supplier_profile_id", null)
          .ilike("supplier_name", companyName.trim());
      }
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

  // Notify the applicant and Atlas admin. No-ops safely if email isn't configured.
  const roleLabel = roleLabels[role] ?? role;
  await sendEmail({
    to: email,
    subject: "We received your Atlas Discount application",
    html: emailLayout(
      "Application received",
      `Hi ${esc(contactName) || "there"},<br/><br/>Thanks for applying to Atlas Discount as a ${esc(roleLabel)} for <strong>${esc(companyName)}</strong>. Our team is reviewing your account and documents, and we'll email you as soon as it's approved.`,
      { label: "Go to your dashboard", href: `${appUrl}/login` }
    )
  });
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New ${roleLabel} application — ${companyName}`,
    html: emailLayout(
      "New application to review",
      `<strong>${esc(companyName)}</strong> (${esc(roleLabel)})<br/>Contact: ${esc(contactName)}<br/>Email: ${esc(email)}<br/>Phone: ${esc(phone)}`,
      { label: "Review in admin", href: `${appUrl}/admin` }
    )
  });

  redirect(role === "supplier" ? "/dashboard/supplier" : role === "route_seller" ? "/dashboard/route-seller" : "/dashboard/retailer");
}

/** Post-approval supplier remit-to / payment preference. Non-sensitive only —
 *  bank/ACH account numbers are never collected or stored here. */
export async function saveSupplierPayment(formData: FormData) {
  if (!isSupabaseConfigured) return;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase!.auth.getUser();
  if (!user) redirect("/login");

  await supabase!
    .from("supplier_profiles")
    .update({
      remit_to: {
        payeeName: String(formData.get("payeeName") || ""),
        email: String(formData.get("remitEmail") || ""),
        method: String(formData.get("remitMethod") || "ACH"),
        address: String(formData.get("remitAddress") || "")
      }
    })
    .eq("profile_id", user!.id);

  redirect("/dashboard/supplier?paymentSaved=1");
}
