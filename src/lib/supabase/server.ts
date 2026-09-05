// =============================================================================
// ConMart — Supabase Server Client
// =============================================================================
// Creates a Supabase client configured for server-side usage (Server Components,
// Server Actions, Route Handlers). Uses Next.js `cookies()` for session management.
//
// Usage: const supabase = await createSupabaseServerClient()
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads/writes auth tokens via HTTP-only cookies.
 *
 * MUST be called with `await` since `cookies()` is async in Next.js 16.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `setAll` is called from Server Components where cookies
            // can't be modified. This is safe to ignore — the proxy
            // will refresh the session on the next request.
          }
        },
      },
    }
  );
}

/**
 * Gets the currently authenticated user from the Supabase session.
 * Returns null if not authenticated.
 *
 * Always use `getUser()` (not `getSession()`) for server-side auth checks
 * as per Supabase security recommendations — `getUser()` validates the
 * JWT with Supabase Auth server, while `getSession()` only decodes locally.
 */
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
