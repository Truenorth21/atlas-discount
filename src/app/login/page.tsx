import { Nav } from "@/components/nav";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

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
      <main className="grid min-h-[calc(100vh-65px)] place-items-center bg-gradient-to-b from-atlas-light to-white px-4 py-10">
        <LoginForm error={params.error} isConfigured={isSupabaseConfigured} next={next} />
      </main>
    </>
  );
}
