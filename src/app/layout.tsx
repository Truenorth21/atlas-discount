import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n";
import { DealsLinkRouter } from "@/components/deals-link-router";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas Discount",
  description: "Marketplace, fulfillment, and wholesale network for verified business buyers."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <DealsLinkRouter />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
