"use server";

import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL, appUrl, emailLayout, esc, sendEmail } from "@/lib/email";

/** Emails an applicant when Atlas approves or rejects their account. Guarded to
 *  admins; no-ops if email isn't configured; never throws. */
export async function notifyApplicationDecision(args: {
  email: string;
  companyName: string;
  contactName?: string;
  approved: boolean;
}): Promise<void> {
  try {
    const supabase = await createClient();
    if (!supabase) return;
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const isAdmin = profile?.role === "admin" || (ADMIN_EMAIL && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (!isAdmin) return;

    const { email, companyName, contactName, approved } = args;
    const hi = `Hi ${esc(contactName || "there")},`;
    await sendEmail({
      to: email,
      subject: approved ? "Your Atlas Discount account is approved" : "Update on your Atlas Discount application",
      html: approved
        ? emailLayout(
            "You're approved",
            `${hi}<br/><br/>Your account for <strong>${esc(companyName)}</strong> is approved. You can now sign in to see wholesale pricing and place orders.`,
            { label: "Sign in", href: `${appUrl}/login` }
          )
        : emailLayout(
            "Application update",
            `${hi}<br/><br/>Thank you for your interest in Atlas Discount. We're unable to approve the account for <strong>${esc(companyName)}</strong> at this time. If you believe this is a mistake or want to provide more information, just reply to this email.`
          )
    });
  } catch {
    // Notification failures must not affect the admin action.
  }
}
