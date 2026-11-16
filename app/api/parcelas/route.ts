import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME, getSession } from '@/lib/auth-session'
import { createParcelasHandler } from '@/lib/parcelas-handler'

const parcelasHandler = createParcelasHandler()

async function getAuthenticatedSession() {
  const cookieStore = await cookies()
  return getSession(cookieStore.get(AUTH_COOKIE_NAME)?.value)
}

function unauthorized() {
  return Response.json({ success: false, message: 'Inicia sesión para gestionar parcelas.' }, { status: 401 })
}

export async function GET() {
  const session = await getAuthenticatedSession()
  if (!session) return unauthorized()
  return parcelasHandler.listar(session.usuario)
}

export async function POST(request: Request) {
  const session = await getAuthenticatedSession()
  if (!session) return unauthorized()
  return parcelasHandler.insertar(request, session.usuario)
}

export async function PUT() {
  const session = await getAuthenticatedSession()
  if (!session) return unauthorized()
  return parcelasHandler.sembrar(session.usuario)
}
