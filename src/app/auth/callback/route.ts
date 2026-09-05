// =============================================================================
// ConMart — Auth Callback Route Handler
// =============================================================================
// Handles the OAuth / email confirmation callback from Supabase Auth.
// When a user confirms their email or completes an OAuth flow, Supabase
// redirects them here with an auth code that we exchange for a session.
// =============================================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    // No auth code present — redirect to login with error
    return NextResponse.redirect(
      new URL("/login?error=missing_code", origin)
    );
  }

  // ---------------------------------------------------------------------------
  // Exchange the auth code for a session
  // ---------------------------------------------------------------------------
  const response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error.message);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", origin)
    );
  }

  return response;
}
