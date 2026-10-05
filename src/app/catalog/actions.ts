"use server";

import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL, appUrl, emailLayout, esc, sendEmail } from "@/lib/email";

/** Fire-and-forget order confirmation to the buyer + alert to Atlas admin.
 *  Server-side so it can read the authenticated buyer's email securely; no-ops
 *  if the user isn't signed in or email isn't configured, and never throws. */
export async function notifyOrderSubmitted(summary: {
  id: string;
  totalCases: number;
  estimatedValue: number;
  fulfillmentType: string;
  pickup: boolean;
}): Promise<void> {
  try {
    const supabase = await createClient();
    if (!supabase) return;
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name,contact_name")
      .eq("id", user.id)
      .maybeSingle();
    const company = profile?.company_name || "your business";
    const value = `$${Number(summary.estimatedValue || 0).toFixed(2)}`;
    const mode = summary.pickup ? "pickup order" : "quote request";

    await sendEmail({
      to: user.email,
      subject: `Order ${summary.id} received — Atlas Discount`,
      html: emailLayout(
        "We received your order",
        `Thanks${profile?.contact_name ? `, ${esc(profile.contact_name)}` : ""}! We received your ${esc(mode)} <strong>${esc(summary.id)}</strong>:<br/><br/>${summary.totalCases} cases · ${esc(summary.fulfillmentType)} · estimated ${esc(value)}<br/><br/>Atlas confirms availability and the final price before anything is charged — we'll follow up shortly.`,
        { label: "View your order", href: `${appUrl}/quotes/${summary.id}` }
      )
    });
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `New order ${summary.id} — ${company}`,
      html: emailLayout(
        "New order to confirm",
        `<strong>${esc(company)}</strong><br/>Order: ${esc(summary.id)}<br/>${summary.totalCases} cases · ${esc(summary.fulfillmentType)} · estimated ${esc(value)}`,
        { label: "Open in admin", href: `${appUrl}/admin` }
      )
    });
  } catch {
    // Never let a notification failure affect the order flow.
  }
}
