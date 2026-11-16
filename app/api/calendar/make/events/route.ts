import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { AUTH_COOKIE_NAME, getSession } from '@/lib/auth-session'
import { UserAuthorizationRequiredError } from '@vercel/connect'
import {
  createGoogleCalendarEvent,
  getGoogleConnectUserId,
  startGoogleCalendarAuthorization,
} from '@/lib/google-calendar-connect'

const MAKE_TIMEOUT_MS = 12_000

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

function isSameOriginRequest(request: NextRequest) {
  // Los navegadores fijan Sec-Fetch-Site y el JavaScript de la página no puede modificarlo.
  // Detrás de un proxy (preview de v0) el Host no coincide con el Origin, por eso se prioriza.
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite) return fetchSite === 'same-origin'

  const originHeader = request.headers.get('origin')
  if (!originHeader) return false

  let requestOrigin: string
  try {
    const parsedOrigin = new URL(originHeader)
    if (parsedOrigin.protocol !== 'http:' && parsedOrigin.protocol !== 'https:') return false
    requestOrigin = parsedOrigin.origin
  } catch {
    return false
  }

  const allowedOrigins = new Set([request.nextUrl.origin])
  const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const forwardedProtocol = (
    request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.slice(0, -1)
  ).split(',')[0].trim().replace(/:$/, '').toLowerCase()

  if ((forwardedProtocol === 'http' || forwardedProtocol === 'https') && forwardedHost) {
    for (const host of forwardedHost.split(',')) {
      const normalizedHost = host.trim()
      if (!normalizedHost) continue
      try {
        allowedOrigins.add(new URL(`${forwardedProtocol}://${normalizedHost}`).origin)
      } catch {
        continue
      }
    }
  }

  return allowedOrigins.has(requestOrigin)
}

async function getAuthorizationCallbackUrl() {
  const runtimeUrl = process.env.NODE_ENV !== 'production' ? process.env.V0_RUNTIME_URL : undefined
  let configuredOrigin = runtimeUrl
  if (!configuredOrigin && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    configuredOrigin = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (!configuredOrigin && process.env.VERCEL_URL) configuredOrigin = `https://${process.env.VERCEL_URL}`

  if (!configuredOrigin) {
    const requestHeaders = await headers()
    const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
    if (!host) throw new Error('Missing authorization host')
    const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
    configuredOrigin = `${protocol.split(',')[0].trim()}://${host.split(',')[0].trim()}`
  }

  const origin = new URL(configuredOrigin)
  if (origin.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    throw new Error('Invalid authorization origin')
  }
  return new URL('/', origin).toString()
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: 'Origen de solicitud no válido.' }, { status: 403 })
  }

  const session = getSession(request.cookies.get(AUTH_COOKIE_NAME)?.value)
  if (!session) {
    return NextResponse.json({ message: 'Inicia sesión para programar el evento.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'La solicitud no tiene un formato válido.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Faltan los datos del evento.' }, { status: 400 })
  }

  const { title, description, startDateTime, timeZone, requestId } = body as Record<string, unknown>
  if (
    typeof title !== 'string' || !title.trim() || title.length > 200 ||
    typeof description !== 'string' || description.length > 1000 ||
    typeof startDateTime !== 'string' || startDateTime.length > 64 ||
    typeof timeZone !== 'string' || timeZone.length > 100 || !isValidTimeZone(timeZone) ||
    typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)
  ) {
    return NextResponse.json({ message: 'Los datos del evento no son válidos.' }, { status: 400 })
  }

  const startTimestamp = Date.parse(startDateTime)
  if (!Number.isFinite(startTimestamp)) {
    return NextResponse.json({ message: 'La fecha del evento no es válida.' }, { status: 400 })
  }

  const webhookUrl = process.env.MAKE_WEBHOOK_URL
  const apiKey = process.env.MAKE_API_KEY
  if (!webhookUrl || !apiKey) {
    return NextResponse.json(
      { message: 'La integración con Make no está configurada.' },
      { status: 503 },
    )
  }

  let parsedWebhookUrl: URL
  try {
    parsedWebhookUrl = new URL(webhookUrl)
  } catch {
    return NextResponse.json(
      { message: 'La integración con Make no está configurada correctamente.' },
      { status: 503 },
    )
  }

  if (parsedWebhookUrl.protocol !== 'https:' || !parsedWebhookUrl.hostname.endsWith('.make.com')) {
    return NextResponse.json(
      { message: 'La URL del webhook de Make no es válida.' },
      { status: 503 },
    )
  }

  const normalizedStart = new Date(startTimestamp).toISOString()
  const normalizedEventId = `a${requestId.replaceAll('-', '').toLowerCase()}`
  const endDateTime = new Date(startTimestamp + 30 * 60 * 1000).toISOString()

  try {
    const event = await createGoogleCalendarEvent({
      usuario: session.usuario,
      eventId: normalizedEventId,
      title: title.trim(),
      description: description.trim(),
      startDateTime: normalizedStart,
      endDateTime,
      timeZone,
    })

    const makePayload = {
      user_id: getGoogleConnectUserId(session.usuario),
      calendar_id: 'primary',
      google_event_id: event.id,
      google_event_url: event.htmlLink,
      title: title.trim(),
      description: description.trim(),
      start_datetime: normalizedStart,
      end_datetime: endDateTime,
      time_zone: timeZone,
    }

    let makeNotified = false
    try {
      const response = await fetch(parsedWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-make-apikey': apiKey,
        },
        body: JSON.stringify(makePayload),
        signal: AbortSignal.timeout(MAKE_TIMEOUT_MS),
      })
      makeNotified = response.ok
    } catch {
      makeNotified = false
    }

    return NextResponse.json({
      success: true,
      eventId: event.id,
      eventUrl: event.htmlLink,
      makeNotified,
    })
  } catch (error) {
    if (error instanceof UserAuthorizationRequiredError) {
      try {
        const { url } = await startGoogleCalendarAuthorization(
          session.usuario,
          await getAuthorizationCallbackUrl(),
        )
        return NextResponse.json({ authorizationRequired: true, authorizationUrl: url })
      } catch {
        return NextResponse.json(
          { message: 'No se pudo iniciar la conexión con Google. Inténtalo de nuevo.' },
          { status: 502 },
        )
      }
    }

    return NextResponse.json(
      { message: 'No se pudo crear el evento en tu Google Calendar. Inténtalo de nuevo.' },
      { status: 502 },
    )
  }
}
