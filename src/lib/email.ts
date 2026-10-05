// Server-only transactional email via Resend's REST API. Dormant until
// RESEND_API_KEY is set — every call then no-ops safely and never throws, so a
// missing provider can never break a registration or order.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.ATLAS_EMAIL_FROM || "Atlas Discount <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.atlasdiscount.com";

/** Admin inbox for internal notifications (new applications, new orders). */
export const ADMIN_EMAIL = process.env.ATLAS_ADMIN_EMAIL;

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

type Recipient = string | undefined | null;
type SendArgs = { to: Recipient | Recipient[]; subject: string; html: string; replyTo?: string };

export async function sendEmail({ to, subject, html, replyTo }: SendArgs): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const recipients = (Array.isArray(to) ? to : [to]).filter((value): value is string => Boolean(value && value.includes("@")));
  if (!RESEND_API_KEY || recipients.length === 0) return { sent: false, skipped: true };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: recipients, subject, html, reply_to: replyTo })
    });
    if (!res.ok) return { sent: false, error: `${res.status} ${await res.text().catch(() => "")}` };
    return { sent: true };
  } catch (error) {
    return { sent: false, error: String(error) };
  }
}

/** Branded HTML shell for a transactional email. `bodyHtml` is the inner content. */
export function emailLayout(heading: string, bodyHtml: string, cta?: { label: string; href: string }): string {
  const button = cta
    ? `<a href="${cta.href}" style="display:inline-block;margin-top:20px;background:#0A63B0;color:#ffffff;text-decoration:none;font-weight:800;padding:12px 22px;border-radius:999px;font-size:14px">${cta.label}</a>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#F3F5F8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#10194A">
    <div style="max-width:560px;margin:0 auto;padding:28px 20px">
      <div style="font-size:22px;font-weight:900;color:#10194A">Atlas <span style="color:#0A63B0">Discount</span></div>
      <div style="margin-top:16px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px">
        <h1 style="margin:0 0 12px;font-size:20px;font-weight:900;color:#10194A">${heading}</h1>
        <div style="font-size:14px;line-height:22px;color:#475569">${bodyHtml}</div>
        ${button}
      </div>
      <p style="margin:18px 4px 0;font-size:12px;color:#94a3b8">Atlas Discount · Florida wholesale marketplace · <a href="${APP_URL}" style="color:#0A63B0">${APP_URL.replace(/^https?:\/\//, "")}</a></p>
    </div>
  </body></html>`;
}

export const esc = (value: string) =>
  value.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

export { APP_URL as appUrl };
