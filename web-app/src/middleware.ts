import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            request.cookies.set({ name, value, ...options })
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => 
            supabaseResponse.cookies.set({ name, value, ...options })
          )
        },
      },
    }
  )

  // 1. Check for active Supabase User Session
  const { data: { user } } = await supabase.auth.getUser()

  // 🟢 2. Fixed Dev Bypass Check: Read the cookie string directly from the request headers to ensure it is never missed
  const cookieHeader = request.headers.get('cookie') || ''
  const hasDevCookie = cookieHeader.includes('dev-mock-session=')
  
  const isAuthenticated = !!user || hasDevCookie

  // 3. Evaluate Route Protection Boundaries
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth')

  if (!isAuthenticated && !isLoginPage && !isAuthCallback) {
    // Force unauthorized navigation attempts back to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthenticated && isLoginPage) {
    // If authenticated, skip the login entry layout and jump straight to the board
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
