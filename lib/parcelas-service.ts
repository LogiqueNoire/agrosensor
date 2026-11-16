import type { InsertarParcelaResponse, LecturasResponse, NuevaParcela, ParcelasResponse } from './parcelas-types'

export const PARCELAS_API_KEY = '/api/parcelas'

export class ParcelasApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'ParcelasApiError'
  }
}

export class DuplicateParcelaError extends ParcelasApiError {
  constructor(message = 'Ya existe una parcela con ese ID en tu cuenta.') {
    super(message, 409)
    this.name = 'DuplicateParcelaError'
  }
}

export function isUnauthenticatedError(error: unknown) {
  return error instanceof ParcelasApiError && error.status === 401
}

async function responseError(response: Response, fallback: string) {
  const result = await response.json().catch(() => null) as { message?: unknown } | null
  const message = typeof result?.message === 'string' && result.message.trim()
    ? result.message.trim()
    : response.status === 401
      ? 'Tu sesión expiró. Inicia sesión nuevamente.'
      : response.status === 403
        ? 'El servicio rechazó la autorización. Revisa la configuración de n8n.'
        : fallback
  return response.status === 409 ? new DuplicateParcelaError(message) : new ParcelasApiError(message, response.status)
}

async function fetchApi(input: RequestInfo | URL, init?: RequestInit) {
  try {
    return await fetch(input, init)
  } catch {
    throw new ParcelasApiError('No se pudo conectar con AgroSensor. Revisa tu conexión e inténtalo de nuevo.')
  }
}

export async function listarParcelas() {
  const response = await fetchApi(PARCELAS_API_KEY, { cache: 'no-store' })
  if (!response.ok) throw await responseError(response, 'No se pudieron cargar las parcelas.')

  const result = (await response.json().catch(() => null)) as ParcelasResponse | null
  if (result?.success !== true || !Array.isArray(result.parcelas)) {
    throw new ParcelasApiError('El servicio devolvió una respuesta no válida.')
  }

  return result.parcelas
}

export function lecturasKey(idParcela: string) {
  return `${PARCELAS_API_KEY}/lecturas?id_parcela=${encodeURIComponent(idParcela)}`
}

export async function listarLecturas(idParcela: string) {
  const response = await fetchApi(lecturasKey(idParcela), { cache: 'no-store' })
  if (!response.ok) throw await responseError(response, 'No se pudieron cargar las lecturas de la parcela.')

  const result = (await response.json().catch(() => null)) as LecturasResponse | null
  if (result?.success !== true || !Array.isArray(result.lecturas)) {
    throw new ParcelasApiError('El servicio devolvió una respuesta no válida.')
  }

  return result.lecturas
}

export async function insertarParcela(parcela: NuevaParcela) {
  const response = await fetchApi(PARCELAS_API_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parcela),
  })

  if (!response.ok) throw await responseError(response, 'No se pudo registrar la parcela.')
  if (response.status !== 201) throw new ParcelasApiError('El servicio devolvió una respuesta no válida.', response.status)

  const result = (await response.json().catch(() => null)) as InsertarParcelaResponse | null
  if (result?.success !== true || typeof result.id_parcela !== 'string') {
    throw new ParcelasApiError('El servicio devolvió una respuesta no válida.')
  }

  return result
}
