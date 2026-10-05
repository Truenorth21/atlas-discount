"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AtlasMark } from "@/components/atlas-logo";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the error for monitoring (replace with Sentry/console as needed).
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-atlas-light px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-panel">
        <div className="mx-auto w-fit">
          <AtlasMark size={48} tone="navy" />
        </div>
        <h1 className="mt-6 text-xl font-black text-atlas-navy">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">
          We hit an unexpected error. Try again, or head back and keep shopping.
        </p>
        {error?.digest && <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="btn-primary" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="btn-secondary" href="/">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
