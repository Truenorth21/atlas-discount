import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Nav } from "@/components/nav";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { signIn } from "./actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/dashboard/retailer";

  return (
    <>
      <Nav />
      <main className="atlas-container grid min-h-[calc(100vh-65px)] place-items-center py-10">
        <form action={signIn} className="panel w-full max-w-md p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-atlas-navy text-white">
            <LockKeyhole size={22} />
          </div>
          <h1 className="mt-5 text-3xl font-black text-atlas-navy">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">
            Access buyer, supplier, and admin workspaces for Atlas Discount.
          </p>
          {!isSupabaseConfigured && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Demo mode is active because Supabase environment variables are not configured.
            </div>
          )}
          {params.error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {params.error}
            </div>
          )}
          <input name="next" type="hidden" value={next} />
          <label className="mt-5 grid gap-2">
            <span className="label">Email</span>
            <input className="field" name="email" type="email" required />
          </label>
          <label className="mt-4 grid gap-2">
            <span className="label">Password</span>
            <input className="field" name="password" type="password" required />
          </label>
          <button className="btn-primary mt-5 w-full" type="submit">
            Sign in
          </button>
          <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm font-semibold text-atlas-blue">
            <Link href="/register/buyer">Register buyer</Link>
            <Link href="/register/supplier">Register supplier</Link>
          </div>
        </form>
      </main>
    </>
  );
}
