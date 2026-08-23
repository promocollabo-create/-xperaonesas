import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Refreshes the Supabase auth session on every request and enforces
 * route-level protection server-side. Client-side checks are never
 * trusted on their own — admin routes are gated here AND re-checked
 * inside every admin server action / route handler.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAccountRoute = pathname.startsWith("/account");
  const isAdminLoginRoute = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin") && !isAdminLoginRoute;

  if (isAccountRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Admin routes have their own login page and their own "not authenticated"
  // destination — a customer session (or no session) must never be bounced
  // to the public /login form here.
  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_disabled")
      .eq("id", user.id)
      .single();

    // Authenticated but not an admin (or disabled): explicit 403, never a
    // silent fallback to /admin/login — the URL cannot be walked into by
    // simply logging in as a customer.
    if (!profile || profile.role !== "admin" || profile.is_disabled) {
      return NextResponse.redirect(new URL("/unauthorized?code=403", request.url));
    }
  }

  // Already-authenticated admins hitting /admin/login should land on the
  // dashboard instead of seeing the login form again.
  if (isAdminLoginRoute && user) {
    const { data: profile } = await supabase.from("profiles").select("role, is_disabled").eq("id", user.id).single();
    if (profile && profile.role === "admin" && !profile.is_disabled) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and image optimization files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif)$).*)"
  ]
};
