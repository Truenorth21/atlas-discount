import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { LegalDoc, LegalSection } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern use of the Atlas Discount wholesale marketplace.",
  robots: { index: true, follow: true }
};

export default function TermsPage() {
  return (
    <>
      <Nav />
      <LegalDoc title="Terms of Service" updated="[Add effective date on publish]">
        <LegalSection heading="1. Agreement to these terms">
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Atlas Discount
          marketplace, websites, and services (the &quot;Service&quot;), operated by [Atlas Discount legal
          entity name] (&quot;Atlas,&quot; &quot;we,&quot; &quot;us&quot;). By creating an account or placing an order you
          agree to these Terms. If you do not agree, do not use the Service.
        </LegalSection>
        <LegalSection heading="2. Who may use the Service">
          The Service is a wholesale marketplace for verified businesses only. You represent that you are
          at least 18 years old, are acting on behalf of a registered business, and have authority to bind
          that business. Accounts require verification (for example, a resale/exemption certificate,
          business license, or similar documentation). We may approve, decline, suspend, or revoke accounts
          at our discretion.
        </LegalSection>
        <LegalSection heading="3. Accounts and verification">
          You are responsible for the accuracy of the information you provide and for all activity under
          your account and credentials. Keep your password secure and notify us of any unauthorized use.
          Documents you submit for verification are used to confirm eligibility and may be retained as
          described in our Privacy Policy.
        </LegalSection>
        <LegalSection heading="4. Quotes, orders, and pricing">
          Prices shown to verified members are wholesale prices. Where the Service displays an estimated
          total or &quot;quote,&quot; that amount is an estimate, not a final invoice. Atlas confirms availability,
          routing, delivery/freight charges, and the final price before an order is binding. An order is
          accepted only when Atlas confirms it. We may correct pricing or availability errors and cancel or
          adjust affected orders. Minimum order quantities and values may apply per product.
        </LegalSection>
        <LegalSection heading="5. Payment, taxes, and resale">
          Payment terms are those stated at confirmation or in your account agreement. You are responsible
          for all applicable taxes, except where a valid resale or exemption certificate is on file. You
          represent that products purchased for resale are acquired for that purpose.
        </LegalSection>
        <LegalSection heading="6. Fulfillment, delivery, and risk of loss">
          Orders are fulfilled by pickup at our facility, local delivery, freight, or direct shipment from a
          supplier, as indicated at checkout or confirmation. Lead times and ship dates are estimates. Title
          and risk of loss pass to you upon pickup or delivery to the carrier, unless otherwise agreed in
          writing. Inspect orders promptly and report shortages or damage within [X] days.
        </LegalSection>
        <LegalSection heading="7. Returns">
          Return eligibility, restocking fees, and timelines are as described in our return policy or order
          confirmation. Perishable, closeout, and special-buy items may be non-returnable.
        </LegalSection>
        <LegalSection heading="8. Suppliers and sellers">
          Approved suppliers are responsible for the accuracy of their product data and for the products they
          supply. Nothing in these Terms creates a partnership, agency, or employment relationship.
        </LegalSection>
        <LegalSection heading="9. Acceptable use">
          You agree not to misuse the Service, including: providing false information; attempting to access
          other accounts or data; scraping or reverse-engineering the Service; infringing intellectual
          property; or using the Service for any unlawful purpose.
        </LegalSection>
        <LegalSection heading="10. Disclaimers and limitation of liability">
          The Service is provided &quot;as is&quot; without warranties of any kind to the fullest extent permitted by
          law. To the maximum extent permitted by law, Atlas is not liable for indirect, incidental, or
          consequential damages, and our total liability for any claim is limited to the amount you paid for
          the order giving rise to the claim.
        </LegalSection>
        <LegalSection heading="11. Governing law">
          These Terms are governed by the laws of the State of Florida, without regard to conflict-of-law
          rules. Any dispute will be resolved in the state or federal courts located in [Florida county],
          Florida, and you consent to their jurisdiction.
        </LegalSection>
        <LegalSection heading="12. Changes and contact">
          We may update these Terms; continued use after changes means you accept them. Questions? Contact us
          at [support email] or [business mailing address].
        </LegalSection>
      </LegalDoc>
    </>
  );
}
