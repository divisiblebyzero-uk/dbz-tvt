import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // 🟢 Resolves the asynchronous cookies store for Next.js 15
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Diagnostic warnings prevent silent configuration crashes
  if (!url || !anonKey) {
    console.error('🛑 DATABASE ERROR: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from your .env.local file!')
  }

  return createServerClient(
    url || 'http://127.0.0.1:54321',
    anonKey || 'placeholder-anon-key-to-prevent-crashes',
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
            // Safe to ignore inside Server Components
          }
        },
      },
    }
  )
}
