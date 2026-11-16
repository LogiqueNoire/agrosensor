import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, getSession } from '@/lib/auth-session'

export async function GET(request: NextRequest) {
  const session = getSession(request.cookies.get(AUTH_COOKIE_NAME)?.value)
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 })
  return NextResponse.json({ authenticated: true, usuario: session.usuario })
}
