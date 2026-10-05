import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { I18nProvider } from "@/lib/i18n";
import { DealsLinkRouter } from "@/components/deals-link-router";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.atlasdiscount.com";
const title = "Atlas Discount — Florida Wholesale Marketplace";
const description =
  "A members-only wholesale marketplace and fulfillment network for verified Florida businesses. Case and pallet pricing, pickup or delivery, one invoice.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · Atlas Discount"
  },
  description,
  applicationName: "Atlas Discount",
  keywords: [
    "wholesale",
    "Florida wholesale",
    "wholesale marketplace",
    "distributor",
    "case pricing",
    "pallet pricing",
    "convenience store supplier",
    "Miami wholesale"
  ],
  authors: [{ name: "Atlas Discount" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Atlas Discount",
    url: siteUrl,
    title,
    description,
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title,
    description
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" }
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <DealsLinkRouter />
          {children}
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
