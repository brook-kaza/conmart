// =============================================================================
// ConMart — Supabase Browser Client
// =============================================================================
// Creates a Supabase client for use in Client Components (browser-side).
// Uses browser cookies for session persistence.
//
// Usage: const supabase = createSupabaseBrowserClient()
// =============================================================================

import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in Client Components.
 * This client runs in the browser and uses cookies for auth state.
 *
 * Call this inside Client Components (files with 'use client' directive).
 * For Server Components / Server Actions, use createSupabaseServerClient() instead.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
