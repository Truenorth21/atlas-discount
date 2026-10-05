import Link from "next/link";
import { AtlasMark } from "@/components/atlas-logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-atlas-light px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-panel">
        <div className="mx-auto w-fit">
          <AtlasMark size={48} tone="navy" />
        </div>
        <p className="mt-6 text-5xl font-black text-atlas-navy">404</p>
        <h1 className="mt-2 text-xl font-black text-atlas-navy">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link className="btn-primary" href="/">
            Back to home
          </Link>
          <Link className="btn-secondary" href="/catalog">
            Shop the catalog
          </Link>
        </div>
      </div>
    </main>
  );
}
