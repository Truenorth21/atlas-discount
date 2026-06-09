import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const protectedRoutes = ["/admin", "/dashboard", "/quotes"];
const publicRoutes = ["/", "/login", "/register", "/auth/callback", "/catalog", "/sell", "/playbooks"];

function userRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown>; email?: string } | null) {
  const userEmail = user?.email?.toLowerCase();
  const adminEmail = process.env.ATLAS_ADMIN_EMAIL?.toLowerCase();

  return String(
    user?.app_metadata?.role ??
      user?.user_metadata?.role ??
      (userEmail && adminEmail && userEmail === adminEmail ? "admin" : "")
  );
}

async function adminRoleFromProfile(supabase: ReturnType<typeof createServerClient>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", userId)
    .maybeSingle();

  return data?.role === "admin" && data.status === "approved";
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // Local-dev only: skip route protection so /admin is previewable without
  // login. Gated to development — never active on Vercel (production builds).
  if (process.env.NODE_ENV === "development" && process.env.DEV_ADMIN === "1") {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isPublic = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/admin")) {
    const isAdmin =
      userRole(user) === "admin" ||
      (user ? await adminRoleFromProfile(supabase, user.id) : false);

    if (isAdmin) {
      return response;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = user ? "/dashboard/retailer" : "/login";
    redirectUrl.search = "";
    if (!user) redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isPublic && pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    const isAdmin =
      userRole(user) === "admin" ||
      (await adminRoleFromProfile(supabase, user.id));

    redirectUrl.pathname = isAdmin ? "/admin" : "/dashboard/retailer";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
