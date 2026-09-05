// =============================================================================
// ConMart — RBAC Proxy (Next.js 16 Proxy Convention)
// =============================================================================
// Replaces the deprecated middleware.ts convention.
// Handles:
// 1. Supabase Auth session refresh on every request
// 2. Route protection based on user roles (BUYER, SELLER, ADMIN)
// 3. Redirect unauthenticated users from protected routes to /login
//
// IMPORTANT: This proxy runs on EVERY matched request. Keep it lightweight.
// Do NOT import heavy modules or make database queries here.
// Role-based checks use the user metadata stored in the JWT, not the DB.
// =============================================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Route protection rules.
 * Maps path prefixes to the roles allowed to access them.
 */
const PROTECTED_ROUTES: ReadonlyArray<{
  prefix: string;
  allowedRoles: ReadonlyArray<string>;
}> = [
  { prefix: "/admin", allowedRoles: ["ADMIN"] },
  { prefix: "/seller", allowedRoles: ["SELLER", "ADMIN"] },
  { prefix: "/buyer", allowedRoles: ["BUYER", "ADMIN"] },
  { prefix: "/api/upload", allowedRoles: ["SELLER", "ADMIN"] },
];

/**
 * Routes that should redirect authenticated users away (e.g., login page).
 * If a user is already logged in, they don't need to see the login page.
 */
const AUTH_ROUTES = ["/login", "/register"];

/**
 * Next.js 16 Proxy function.
 * Runs before every matched route to handle auth session refresh and RBAC.
 */
export async function proxy(request: NextRequest) {
  // -------------------------------------------------------------------------
  // 1. Create a response that we can modify (add/update cookies)
  // -------------------------------------------------------------------------
  let supabaseResponse = NextResponse.next({ request });

  // -------------------------------------------------------------------------
  // 2. Create Supabase client with cookie bridging for session refresh
  // -------------------------------------------------------------------------
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Forward cookies to the request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // Also set cookies on the response (for the browser)
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // -------------------------------------------------------------------------
  // 3. Refresh the auth session (critical for token rotation)
  //    IMPORTANT: Always use getUser() not getSession() for security.
  //    Protected by defensive try/catch against transient auth network timeouts.
  // -------------------------------------------------------------------------
  let user: { id: string; user_metadata?: Record<string, unknown> } | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    }
  } catch (authErr) {
    console.error("Non-fatal proxy auth check exception:", authErr);
  }

  const pathname = request.nextUrl.pathname;

  // -------------------------------------------------------------------------
  // 4. Redirect authenticated users away from auth pages
  // -------------------------------------------------------------------------
  if (user && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    // User is logged in but trying to access login/register — redirect to home
    const userRole = (user.user_metadata?.role as string) ?? "BUYER";
    const redirectUrl = getDefaultRedirect(userRole);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // -------------------------------------------------------------------------
  // 5. Check protected routes
  // -------------------------------------------------------------------------
  const matchedRoute = PROTECTED_ROUTES.find((route) =>
    pathname.startsWith(route.prefix)
  );

  if (matchedRoute) {
    // Route requires authentication
    if (!user) {
      // Not authenticated — redirect to login with return URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role authorization
    const userRole = (user.user_metadata?.role as string) ?? "";
    if (!matchedRoute.allowedRoles.includes(userRole)) {
      // User doesn't have the required role — redirect to unauthorized
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // -------------------------------------------------------------------------
  // 6. Return the (possibly modified) response with refreshed cookies
  // -------------------------------------------------------------------------
  return supabaseResponse;
}

/**
 * Returns the default dashboard URL for a given user role.
 */
function getDefaultRedirect(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin/command-center";
    case "SELLER":
      return "/seller/dashboard";
    case "BUYER":
      return "/buyer";
    default:
      return "/";
  }
}

/**
 * Proxy matcher configuration.
 * Excludes static files, image optimizations, and favicon from proxy processing.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
