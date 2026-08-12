import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  // Message clair au dev si le .env manque, plutot qu'un crash opaque.
  console.error(
    'Variables Supabase manquantes. Cree un fichier .env a partir de .env.example ' +
    '(VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY).'
  )
}

export const supabase = createClient(url ?? '', anon ?? '', {
  auth: { persistSession: true, autoRefreshToken: true },
})
