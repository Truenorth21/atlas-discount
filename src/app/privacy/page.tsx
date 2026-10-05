import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { LegalDoc, LegalSection } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Atlas Discount collects, uses, and protects your information.",
  robots: { index: true, follow: true }
};

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <LegalDoc title="Privacy Policy" updated="[Add effective date on publish]">
        <LegalSection heading="1. Overview">
          This Privacy Policy explains how [Atlas Discount legal entity name] (&quot;Atlas,&quot; &quot;we,&quot; &quot;us&quot;)
          collects, uses, and protects information when you use our wholesale marketplace and services (the
          &quot;Service&quot;). Atlas serves businesses; the Service is not directed to consumers or children.
        </LegalSection>
        <LegalSection heading="2. Information we collect">
          We collect information you provide, including: business and contact details (company name, contact
          name, email, phone, business address, EIN); verification documents (such as resale/exemption
          certificates, licenses, and insurance); order and account activity; payment/remittance details you
          choose to provide; and messages you send us. We also collect limited technical data (such as device
          and usage information) to operate and secure the Service.
        </LegalSection>
        <LegalSection heading="3. How we use information">
          We use information to: verify eligibility and approve accounts; process quotes, orders, and
          fulfillment; communicate about your account and orders; provide support; prevent fraud and abuse;
          and comply with legal obligations. We do not sell your personal information.
        </LegalSection>
        <LegalSection heading="4. How we share information">
          We share information only as needed to run the Service: with suppliers and carriers to fulfill
          orders; with service providers that host, process, or support the Service (for example, our database
          and email providers) under appropriate obligations; and as required by law or to protect our rights.
        </LegalSection>
        <LegalSection heading="5. Storage and security">
          Account and order data is stored with our infrastructure providers (including Supabase and our
          hosting provider) using access controls and encryption in transit. No method of storage or
          transmission is completely secure, but we take reasonable measures to protect your information.
          Sensitive financial account numbers (such as full bank or card numbers) are not collected or stored
          by the Service.
        </LegalSection>
        <LegalSection heading="6. Retention">
          We retain information for as long as your account is active and as needed for legal, tax, and
          operational purposes. You may request deletion as described below, subject to records we must keep.
        </LegalSection>
        <LegalSection heading="7. Your choices and rights">
          You may access or update your account information, opt out of non-essential marketing emails, and
          request a copy or deletion of your information by contacting us. We will respond consistent with
          applicable law.
        </LegalSection>
        <LegalSection heading="8. Cookies">
          We use essential cookies to keep you signed in and to operate the Service, and we may use limited
          analytics to understand usage. You can control cookies through your browser settings.
        </LegalSection>
        <LegalSection heading="9. Changes and contact">
          We may update this Policy; material changes will be reflected by the &quot;last updated&quot; date. Questions
          or requests? Contact us at [support email] or [business mailing address].
        </LegalSection>
      </LegalDoc>
    </>
  );
}
