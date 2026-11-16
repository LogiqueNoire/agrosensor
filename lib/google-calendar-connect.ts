import 'server-only'

import { createHash } from 'node:crypto'
import { getToken, startAuthorization } from '@vercel/connect'
import { google } from 'googleapis'

const CONNECTOR_UID = 'google/agrosensor-google-calendar'
const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events']

export function getGoogleConnectUserId(usuario: string) {
  return createHash('sha256').update(usuario, 'utf8').digest('hex')
}

function getSubject(usuario: string) {
  return { type: 'user' as const, id: getGoogleConnectUserId(usuario), issuer: 'agrosensor' }
}

export async function createGoogleCalendarEvent({
  usuario,
  eventId,
  title,
  description,
  startDateTime,
  endDateTime,
  timeZone,
}: {
  usuario: string
  eventId: string
  title: string
  description: string
  startDateTime: string
  endDateTime: string
  timeZone: string
}) {
  const subject = getSubject(usuario)
  const tokenParams = { subject, scopes: CALENDAR_SCOPES }
  const accessToken = await getToken(CONNECTOR_UID, tokenParams)
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })

  const calendar = google.calendar({ version: 'v3', auth })
  try {
    const result = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        id: eventId,
        summary: title,
        description,
        start: { dateTime: startDateTime, timeZone },
        end: { dateTime: endDateTime, timeZone },
      },
    })
    return result.data
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'code' in error
      ? Number((error as { code?: unknown }).code)
      : NaN
    if (status !== 409) throw error

    const existing = await calendar.events.get({ calendarId: 'primary', eventId })
    return existing.data
  }
}

export function startGoogleCalendarAuthorization(usuario: string, callbackUrl: string) {
  return startAuthorization(
    CONNECTOR_UID,
    { subject: getSubject(usuario), scopes: CALENDAR_SCOPES },
    { callbackUrl },
  )
}
