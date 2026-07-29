import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignore in server components
          }
        },
      },
    }
  )
}

/**
 * Service role admin client — bypasses RLS completely.
 * Use for trusted server-side operations (photos, cron jobs, etc.).
 * NEVER expose this client to user input — always auth-check first.
 *
 * Uses the bare @supabase/supabase-js client (not SSR) so it has NO
 * cookie session at all. With SSR cookies, the service_role key got
 * tied to a session which somehow made RLS still apply.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}
