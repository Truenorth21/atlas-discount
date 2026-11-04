import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { LegalDoc, LegalSection } from "@/components/legal-doc";
import { SUPPLIER_AGREEMENT_VERSION } from "@/lib/supplier-agreement";

export const metadata: Metadata = {
  title: "Supplier Marketplace Agreement",
  description: "Agreement governing suppliers participating in the Atlas Discount marketplace."
};

export default function SupplierAgreementPage() {
  return <><Nav /><LegalDoc title="Supplier Marketplace Agreement" updated={`Version ${SUPPLIER_AGREEMENT_VERSION}`}>
    <LegalSection heading="Important legal notice">This agreement is an operational draft and should be reviewed by Atlas&apos;s Florida business attorney before final commercial use. By accepting it, the signer represents that they are authorized to bind the supplier.</LegalSection>
    <LegalSection heading="1. Marketplace relationship">The supplier appoints Atlas Discount as a non-exclusive marketplace and transaction facilitator for approved products. The supplier remains an independent business and is responsible for its products, product information, inventory, regulatory compliance, insurance, recalls, and fulfillment obligations.</LegalSection>
    <LegalSection heading="2. Customer prices, fees, and payment">The supplier sets approved customer-facing prices. Atlas invoices and collects from buyers, retains the applicable marketplace and service fees, and remits the supplier payout according to the supplier&apos;s approved payment terms. Atlas may withhold disputed, refunded, fraudulent, or chargeback amounts while they are resolved.</LegalSection>
    <LegalSection heading="3. Protected Atlas accounts">A protected Atlas account includes a buyer, prospect, or business contact first introduced, identified, referred, or transacting through Atlas. The supplier will not bypass Atlas to solicit, quote, invoice, or sell directly to a protected account outside Atlas during participation and for 24 months after the latest Atlas introduction or transaction, subject to applicable law and any written exception approved by Atlas.</LegalSection>
    <LegalSection heading="4. Confidentiality and limited data use">Buyer identity, contacts, destinations, pricing, purchasing history, sales-representative attribution, and order data are Atlas confidential information. The supplier may use information disclosed for a direct shipment only to fulfill that specific authorized order and may not retain, enrich, market to, or disclose it for another purpose.</LegalSection>
    <LegalSection heading="5. No solicitation or shipment inserts">The supplier will not independently contact protected buyers except as expressly authorized for fulfillment. Direct shipments may not include supplier invoices, price lists, business cards, catalogs, promotional inserts, QR codes, or other materials intended to move the buyer relationship outside Atlas.</LegalSection>
    <LegalSection heading="6. Order release and routing">An Atlas cart or request is not authority to ship. The supplier ships only after receiving an Atlas release order. The release order identifies whether goods must go to the Atlas Hialeah Gardens consolidation hub, ship directly using Atlas-approved documents, or be prepared for authorized pickup. Atlas may add future approved hubs and routing options.</LegalSection>
    <LegalSection heading="7. Hialeah Gardens consolidation">For consolidation orders, the supplier sends only the released goods to Atlas&apos;s designated Hialeah Gardens receiving location, labeled with the Atlas release number. Atlas may receive, inspect, combine, palletize, temporarily hold, and route goods to the buyer. Published receiving, consolidation, pallet-building, storage, delivery, and freight fees may apply.</LegalSection>
    <LegalSection heading="8. Fulfillment standards">The supplier must meet confirmed quantities, packaging, labeling, lead times, and shipping instructions; promptly report shortages or delays; and cooperate with claims, returns, recalls, and chargebacks. Substitutions require written Atlas approval.</LegalSection>
    <LegalSection heading="9. Enforcement">Atlas may suspend listings, hold order releases, terminate marketplace access, and pursue available contractual remedies for breach. The supplier remains responsible for documented losses, unpaid fees, or commissions caused by unauthorized circumvention, subject to applicable law.</LegalSection>
    <LegalSection heading="10. Term and changes">The agreement begins when accepted and continues until terminated. Provisions concerning confidentiality, protected accounts, payment, disputes, and obligations intended to survive remain effective after termination. Atlas may issue a revised version and require renewed acceptance before additional listings or orders.</LegalSection>
    <LegalSection heading="11. Governing terms">Florida law governs, without regard to conflict-of-law rules. Final venue, dispute procedures, formal notices, Atlas&apos;s legal entity name, and business address must be completed in the attorney-reviewed version before commercial launch.</LegalSection>
  </LegalDoc></>;
}
