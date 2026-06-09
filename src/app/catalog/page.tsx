import { createClient } from "@/lib/supabase/server";
import CatalogClient from "./catalog-client";

export default async function CatalogPage() {
  const supabase = await createClient();
  let isAuthenticated = false;

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
  }

  return <CatalogClient isAuthenticated={isAuthenticated} />;
}
