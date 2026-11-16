import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME, getSession } from '@/lib/auth-session'
import { createParcelasHandler } from '@/lib/parcelas-handler'

const parcelasHandler = createParcelasHandler()

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore.get(AUTH_COOKIE_NAME)?.value)
  if (!session) {
    return Response.json({ success: false, message: 'Inicia sesión para ver las lecturas.' }, { status: 401 })
  }

  const idParcela = new URL(request.url).searchParams.get('id_parcela') ?? ''
  return parcelasHandler.listarLecturas(session.usuario, idParcela)
}
