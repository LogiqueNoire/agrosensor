import 'server-only'
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

export const AUTH_COOKIE_NAME = 'agrosensor_session'
export const AUTH_SESSION_MAX_AGE = 60 * 60 * 12
const AUTH_SECRET_MIN_BYTES = 32
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000
const USER_ATTEMPT_LIMIT = 5

type AuthStore = {
  failedAttempts: Map<string, number[]>
}

type AuthGlobal = typeof globalThis & {
  __agroSensorAuthStore?: AuthStore
}

const globalForAuth = globalThis as AuthGlobal
const store = (globalForAuth.__agroSensorAuthStore ??= {
  failedAttempts: new Map<string, number[]>(),
})

function getAuthSecret() {
  const secret = process.env.AUTH_SESSION_SECRET
  if (!secret || Buffer.byteLength(secret, 'utf8') < AUTH_SECRET_MIN_BYTES) return null
  return secret
}

export function isAuthSessionConfigured() {
  return getAuthSecret() !== null
}

export function createSession(usuario: string) {
  const secret = getAuthSecret()
  if (!secret) return null

  const payload = Buffer.from(JSON.stringify({
    usuario,
    expiresAt: Date.now() + AUTH_SESSION_MAX_AGE * 1000,
    nonce: randomUUID(),
  })).toString('base64url')
  const signature = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function getSession(token: string | undefined) {
  const secret = getAuthSecret()
  if (!token || !secret) return null

  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra !== undefined) return null

  const expected = createHmac('sha256', secret).update(payload).digest()
  let received: Buffer
  try {
    received = Buffer.from(signature, 'base64url')
  } catch {
    return null
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      usuario?: unknown
      expiresAt?: unknown
    }
    if (
      typeof session.usuario !== 'string' || !session.usuario.trim() || session.usuario.length > 150 ||
      typeof session.expiresAt !== 'number' || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()
    ) {
      return null
    }
    return { usuario: session.usuario }
  } catch {
    return null
  }
}

function activeAttempts(usuario: string) {
  const key = usuario.toLowerCase()
  const active = (store.failedAttempts.get(key) ?? []).filter((time) => time > Date.now() - ATTEMPT_WINDOW_MS)
  if (active.length) store.failedAttempts.set(key, active)
  else store.failedAttempts.delete(key)
  return { key, active }
}

export function getLoginRetryAfter(usuario: string) {
  const { active } = activeAttempts(usuario)
  if (active.length < USER_ATTEMPT_LIMIT) return 0
  return Math.max(1, Math.ceil((active[0] + ATTEMPT_WINDOW_MS - Date.now()) / 1000))
}

export function recordFailedLogin(usuario: string) {
  const { key, active } = activeAttempts(usuario)
  active.push(Date.now())
  store.failedAttempts.set(key, active)

  if (store.failedAttempts.size > 5000) {
    for (const attemptKey of store.failedAttempts.keys()) {
      activeAttempts(attemptKey)
      if (store.failedAttempts.size <= 4000) break
    }
  }
}

export function clearFailedLogins(usuario: string) {
  store.failedAttempts.delete(usuario.toLowerCase())
}
