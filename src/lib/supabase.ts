import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { DEV_MODE } from '@/lib/constants'
import { createLocalSupabaseAdapter } from '@/lib/supabaseLocal'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const realClient = createClient<Database>(supabaseUrl, supabaseAnonKey)

// In DEV_MODE all table operations are routed to localStorage; auth and
// storage remain on the real client so login and image uploads still work.
export const supabase = DEV_MODE ? createLocalSupabaseAdapter(realClient) : realClient
