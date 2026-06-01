import Link from "next/link";
import { Building2, LogIn, ShieldCheck } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

export function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="atlas-container flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-atlas-navy text-white">
            <Building2 size={22} />
          </span>
          <span>
            <span className="block text-lg font-black tracking-normal text-atlas-navy">Atlas Discount</span>
            <span className="block text-xs font-semibold uppercase text-atlas-blue">
              Marketplace • Fulfillment • Wholesale Network
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link className="btn-secondary" href="/catalog">
            Catalog
          </Link>
          <Link className="btn-secondary" href="/register/buyer">
            Buyer
          </Link>
          <Link className="btn-secondary" href="/register/supplier">
            Supplier
          </Link>
          <Link className="btn-secondary" href="/register/route-seller">
            Route Seller
          </Link>
          <Link className="btn-primary" href="/admin">
            <ShieldCheck size={16} />
            Admin
          </Link>
          <Link className="btn-secondary" href="/login">
            <LogIn size={16} />
            Login
          </Link>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
