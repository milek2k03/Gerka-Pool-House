import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
let supabaseClientPromise: Promise<SupabaseClient | null> | null = null

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !String(supabaseUrl).includes('your-project') &&
    !String(supabaseAnonKey).includes('your-anon-key'),
)

export async function getSupabaseClient() {
  if (!isSupabaseConfigured) return null

  supabaseClientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(supabaseUrl, supabaseAnonKey),
  )

  return supabaseClientPromise
}
