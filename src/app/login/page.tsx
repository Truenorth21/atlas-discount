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
      <main className="atlas-container grid min-h-[calc(100vh-65px)] place-items-center py-10">
        <LoginForm error={params.error} isConfigured={isSupabaseConfigured} next={next} />
      </main>
    </>
  );
}
