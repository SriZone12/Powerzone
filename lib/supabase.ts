import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Locally: copy .env.example to .env.local and fill it in. ' +
      'In CI: set both as GitHub Actions variables ' +
      '(Settings -> Secrets and variables -> Actions -> Variables).',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)