# Atlas Discount MVP

Production-oriented MVP for Atlas Discount, a B2B wholesale marketplace and fulfillment network.

## Stack

- Next.js App Router
- React
- Tailwind CSS
- Supabase Auth
- Supabase/Postgres
- Vercel-ready deployment

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add Supabase values to `.env.local` when ready. The UI runs with local demo data when Supabase is not configured, so the marketplace workflows can be reviewed immediately.

## Database

Run `supabase/schema.sql` in your Supabase SQL editor. It creates profiles, buyer/supplier applications, business documents, product uploads, product approvals, quotes, orders, saved lists, promotion submissions, storage buckets, and starter RLS policies.

## Auth

Supabase Auth is wired for email/password sign-up and sign-in:

- `/register/buyer` creates a pending buyer profile.
- `/register/supplier` creates a pending supplier profile.
- `/register/route-seller` creates a pending route seller profile for local sellers and territory operators.
- `/login` signs users in.
- `/auth/callback` exchanges Supabase auth codes.
- `/admin` and `/dashboard/*` are protected by middleware when Supabase env vars are configured.

Without Supabase env vars, the app remains in demo mode so the full workflow can be reviewed locally.

## Deployment

Deploy to Vercel with these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Set `NEXT_PUBLIC_APP_URL` to the Vercel production URL, then add that URL and `/auth/callback` to Supabase Auth redirect URLs.

## MVP workflows

- Buyer and supplier registration
- Route seller registration with hub, territory, seller program, and product lane dropdowns
- Buyer document upload gate before wholesale pricing
- Supplier CSV/XLSX template download and product upload
- Admin approval for users, documents, suppliers, products, orders, and quotes
- Admin pricing and fulfillment rate card for markup, hub handling, delivery, freight, commission, and quote profit review
- Admin quote builder for per-order margin overrides, fulfillment route changes, delivery/pickup/freight fees, and internal margin notes
- Admin quote walkthrough showing how each order is processed by SKU, case count, pallet configuration, pricing basis, fulfillment allocation, and line quote
- Admin marketing section for promotions, traffic sources, geography, campaigns, and product-lane demand tracking
- Catalog with category filters, UPC search, brand search, quick add, request quote
- Mixed-case quote cart with 1-case increments, minimum order progress, loose-case/full-pallet/supplier-direct pricing, and fulfillment charge allocation
- Cart creates quote/order request, not payment
- Miami and Orlando hub routing for Florida launch operations
- Route seller dashboard with territory, assigned hub, product lane, document status, route stops, and products to pitch
- Retailer order history, saved lists, buy again
- Supplier products, inventory updates, promotion submission

## Launch Logistics Model

Atlas starts with two core consolidation points:

- `Miami hub` for South Florida, import-closeout lanes, port-adjacent suppliers, and local delivery routes.
- `Orlando hub` for Central Florida consolidation, Tampa/Jacksonville reach, and statewide replenishment.

Products carry a supplier pickup/shipping location, preferred Atlas hub, and route recommendation. Quote requests summarize hub routing so Atlas can split supplier-direct, Miami hub, Orlando hub, pickup, local delivery, and freight-needed legs during admin review.

Admin pricing settings separate sales margin rules from fulfillment cost rules. Supplier direct is treated as supplier direct fulfillment, not customer ownership: Atlas owns the buyer, quote, reorder, and support while the supplier ships after approval. Supplier-direct lines earn an Atlas transaction fee or minimum fee. Atlas hub lines use loose-case markup, full-pallet markup, minimum loose-case and pallet-case margins, Miami/Orlando hub fees and costs, pickup fees, delivery fees/costs, freight coordination fees/costs, route seller commission, and freight review threshold. Quote review prices each product line from its pallet configuration, so smaller case orders carry higher per-case margin while full-pallet quantities receive lower per-case pricing. Admin sees supplier cost, buyer sell value, fulfillment charges, estimated Atlas cost, commission, and estimated profit before a quote moves forward.

For real quoting, admin can override individual order economics without changing global defaults. Quote adjustments can change fulfillment type, hub routing, loose-case markup, full-pallet markup, supplier-direct transaction fee, local delivery fee, pickup fee, freight coordination fee, and other order fees. Marketing campaigns track source, channel, city/state, product lane, spend, visits, and quote requests.

Buyer cart pricing supports supermarket-style mixed orders. Buyers can add one case of multiple products to reach either the mixed-case minimum or order-value minimum. Full-pallet quantities on a product line receive pallet pricing; remaining mixed cases receive loose-case pricing. Local delivery, pickup, hub, and freight charges are shown as fulfillment charges and allocated across cart lines by case quantity for transparency. Admin quote review now walks through each SKU line so Atlas can see which cases are loose, pallet-priced, or supplier-direct before applying discounts, free delivery, or bonus product notes.
