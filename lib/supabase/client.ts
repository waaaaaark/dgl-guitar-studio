import { createBrowserClient } from '@supabase/ssr'

/**
 * Use this in Client Components ('use client').
 * Creates a single browser-side Supabase client.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
