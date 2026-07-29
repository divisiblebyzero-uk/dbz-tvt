import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { cookies } from 'next/headers' // 🟢 Import cookies helper

export default function LoginPage() {
  async function signInWithGoogle() {
    'use server'
    const supabase = await createClient()
    const headerList = await headers()
    const host = headerList.get('host') 
    const protocol = host?.includes('localhost') || host?.includes('127.0.0.1') ? 'http' : 'https'
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${protocol}://${host}/auth/callback`,
      },
    })

    if (error) redirect('/login?error=auth-init-failed')
    if (data?.url) redirect(data.url)
  }

  // 🟢 New Developer Bypass Action
  async function developerBypassLogin() {
    'use server'
    const cookieStore = await cookies()
    // Drop a fake authentication session cookie that our proxy will recognize locally
    cookieStore.set('dev-mock-session', '00000000-0000-0000-0000-000000000001', {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24, // Valid for 1 day
      path: '/'
    })
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">🎬 Our Watchlist</h1>
          <p className="text-sm text-slate-400">Track movies and TV shows together or at your own pace.</p>
        </div>

        <div className="space-y-3">
          <form action={signInWithGoogle}>
            <button type="submit" className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 shadow-sm transition-all hover:bg-slate-700 active:scale-[0.98]">
              Continue with Google
            </button>
          </form>

          {/* 🟢 Render the Developer Bypass trigger line */}
          <div className="relative flex py-2 items-center text-xs text-slate-600">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 font-mono">LOCAL DEVELOPMENT ONLY</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form action={developerBypassLogin}>
            <button type="submit" className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all active:scale-[0.98]">
              ⚡ Bypass Auth (Login as Husband Test)
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
