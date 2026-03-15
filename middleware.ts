// middleware.ts
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  // First, update the session
  const response = await updateSession(request)

  // Check if user must change password
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/projects') ||
      request.nextUrl.pathname.startsWith('/submissions') ||
      request.nextUrl.pathname.startsWith('/reports') ||
      request.nextUrl.pathname.startsWith('/users')) {
    
    // Skip check if already on change-password page
    if (!request.nextUrl.pathname.includes('change-password')) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('must_change_password')
          .eq('id', user.id)
          .single()

        if (profile?.must_change_password) {
          return NextResponse.redirect(new URL('/change-password', request.url))
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}