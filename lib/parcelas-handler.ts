import type { Lectura, NuevaParcela, Parcela } from './parcelas-types'

const WEBHOOK_BASE_URL = 'https://agrosensor.app.n8n.cloud/webhook'
const LECTURAS_WEBHOOK_PATH = 'b9215a8a-f6fe-4934-8e26-03f82e8631d8'
const WEBHOOK_TIMEOUT_MS = 10_000
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const INITIAL_PARCELAS: NuevaParcela[] = [
  { id_parcela: 'norte', nombre: 'Parcela Norte', hectareas: 1.5, cultivo: 'Maíz', tipo_sensor: 'Básico', antiguedad: 'Hace 3 años', fecha_instalacion: '2023-10-01' },
  { id_parcela: 'sur', nombre: 'Parcela Sur', hectareas: 2, cultivo: 'Palta', tipo_sensor: 'Básico', antiguedad: 'Hace 2 años y medio', fecha_instalacion: '2024-05-15' },
  { id_parcela: 'este', nombre: 'Parcela Este', hectareas: 1, cultivo: 'Tomate', tipo_sensor: 'Básico', antiguedad: 'Hace 9 meses', fecha_instalacion: '2026-02-15' },
  { id_parcela: 'simulada', nombre: 'Parcela Oeste', hectareas: 1.2, cultivo: 'Tomate', tipo_sensor: 'Avanzado', antiguedad: 'Hace 4 meses', fecha_instalacion: '2026-07-01' },
]

function jsonResponse(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function normalizeUsuario(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeParcela(value: unknown, usuario: string): Parcela | null {
  if (!isRecord(value) || normalizeUsuario(value.usuario) !== normalizeUsuario(usuario)) return null

  const idParcela = value.id_parcela ?? value['id parcela']
  const tipoSensor = value.tipo_sensor ?? value['tipo sensor']
  const fechaInstalacion = value.fecha_instalacion ?? value['fecha instalacion']
  const hectareasValue = value.hectareas
  const hectareas = typeof hectareasValue === 'string'
    ? Number(hectareasValue.trim().replace(',', '.'))
    : hectareasValue

  if (
    typeof idParcela !== 'string' || !idParcela.trim() ||
    typeof value.nombre !== 'string' || !value.nombre.trim() ||
    typeof hectareas !== 'number' || !Number.isFinite(hectareas) || hectareas <= 0 ||
    typeof value.cultivo !== 'string' || !value.cultivo.trim() ||
    typeof tipoSensor !== 'string' || !tipoSensor.trim() ||
    typeof value.antiguedad !== 'string' || !value.antiguedad.trim() ||
    typeof fechaInstalacion !== 'string' || !isValidDate(fechaInstalacion)
  ) {
    return null
  }

  return {
    id_parcela: idParcela.trim(),
    nombre: value.nombre.trim(),
    hectareas,
    cultivo: value.cultivo.trim(),
    tipo_sensor: tipoSensor.trim(),
    antiguedad: value.antiguedad.trim(),
    fecha_instalacion: fechaInstalacion,
  }
}

function normalizeKey(key: string) {
  return key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function parseMetric(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const match = value.replace(/\s/g, '').match(/-?\d+(?:[.,]\d+)?/)
  if (!match) return null
  const parsed = Number(match[0].replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function parseFechaHora(value: unknown) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().replace(' ', 'T')
  return normalized && Number.isFinite(Date.parse(normalized)) ? normalized : null
}

function textValue(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

function normalizeLectura(value: unknown, usuario: string, idParcela: string): Lectura | null {
  if (!isRecord(value)) return null
  const row = Object.fromEntries(Object.entries(value).map(([key, entry]) => [normalizeKey(key), entry]))

  if (normalizeUsuario(row.usuario) !== normalizeUsuario(usuario)) return null
  if (textValue(row.id_parcela).toLowerCase() !== idParcela.trim().toLowerCase()) return null

  const idSensor = textValue(row.id_sensor)
  const fechaHora = parseFechaHora(row.fecha_hora)
  const humedad = parseMetric(row.humedad)
  if (!idSensor || !fechaHora || humedad === null) return null

  return {
    id_lectura: textValue(row.id_lectura),
    usuario: textValue(row.usuario),
    id_parcela: textValue(row.id_parcela),
    id_sensor: idSensor,
    fecha_hora: fechaHora,
    humedad,
    temperatura_suelo: parseMetric(row.temperatura_suelo),
    temperatura_ambiente: parseMetric(row.temperatura_ambiente),
    ph_suelo: parseMetric(row.ph_suelo ?? row.ph),
    nitrogeno: parseMetric(row.nitrogeno),
    fosforo: parseMetric(row.fosforo),
    potasio: parseMetric(row.potasio),
    conductividad_electrica: parseMetric(row.conductividad_electrica),
    estado_sensor: textValue(row.estado_sensor),
  }
}

function parseNuevaParcela(value: unknown): NuevaParcela | null {
  if (!isRecord(value)) return null
  const { id_parcela, nombre, hectareas, cultivo, tipo_sensor, antiguedad, fecha_instalacion } = value
  if (
    typeof id_parcela !== 'string' || !id_parcela.trim() || id_parcela.length > 100 ||
    typeof nombre !== 'string' || !nombre.trim() || nombre.length > 160 ||
    typeof hectareas !== 'number' || !Number.isFinite(hectareas) || hectareas <= 0 ||
    typeof cultivo !== 'string' || !cultivo.trim() || cultivo.length > 100 ||
    typeof tipo_sensor !== 'string' || !tipo_sensor.trim() || tipo_sensor.length > 100 ||
    typeof antiguedad !== 'string' || !antiguedad.trim() || antiguedad.length > 100 ||
    typeof fecha_instalacion !== 'string' || !isValidDate(fecha_instalacion)
  ) {
    return null
  }

  return {
    id_parcela: id_parcela.trim(),
    nombre: nombre.trim(),
    hectareas,
    cultivo: cultivo.trim(),
    tipo_sensor: tipo_sensor.trim(),
    antiguedad: antiguedad.trim(),
    fecha_instalacion,
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const HEADER_NAME_PATTERN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/

function safeMessage(value: unknown, fallback: string) {
  if (!isRecord(value) || typeof value.message !== 'string') return fallback
  const message = value.message.trim().slice(0, 240)
  return message || fallback
}

function networkErrorResponse(action: 'listar' | 'insertar' | 'lecturas', error: unknown) {
  const timedOut = error instanceof Error && error.name === 'TimeoutError'
  const message = action === 'listar'
    ? timedOut ? 'La carga de parcelas tardó demasiado. Inténtalo otra vez.' : 'No se pudieron cargar las parcelas por un error de conexión.'
    : action === 'lecturas'
      ? timedOut ? 'La carga de lecturas tardó demasiado. Inténtalo otra vez.' : 'No se pudieron cargar las lecturas por un error de conexión.'
      : timedOut ? 'El registro tardó demasiado. Inténtalo otra vez.' : 'No se pudo registrar la parcela por un error de conexión.'
  return jsonResponse({ success: false, message }, timedOut ? 504 : 502)
}

type ParcelasHandler = {
  listar: (usuario: string) => Promise<Response>
  listarLecturas: (usuario: string, idParcela: string) => Promise<Response>
  sembrar: (usuario: string) => Promise<Response>
  insertar: (request: Request, usuario: string) => Promise<Response>
}

export function createParcelasHandler({
  fetcher = fetch,
  webhookBaseUrl = WEBHOOK_BASE_URL,
  webhookKeyName = process.env.N8N_WEBHOOK_KEY_NAME ?? '',
  webhookKeyValue = process.env.N8N_WEBHOOK_KEY_VALUE ?? '',
}: {
  fetcher?: typeof fetch
  webhookBaseUrl?: string
  webhookKeyName?: string
  webhookKeyValue?: string
} = {}) {
  const getWebhookHeaders = () => {
    if (!HEADER_NAME_PATTERN.test(webhookKeyName) || !webhookKeyValue.trim()) return null
    return { Accept: 'application/json', [webhookKeyName]: webhookKeyValue }
  }

  const handlers: ParcelasHandler = {
    async listar(usuario: string) {
      const headers = getWebhookHeaders()
      if (!headers) {
        return jsonResponse({ success: false, message: 'La integración de parcelas no está configurada en el servidor.' }, 503)
      }

      const url = new URL(`${webhookBaseUrl.replace(/\/+$/, '')}/roberto-parcelas-listar`)
      url.searchParams.set('usuario', usuario)

      let upstream: Response
      try {
        upstream = await fetcher(url, {
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
        })
      } catch (error) {
        return networkErrorResponse('listar', error)
      }

      const result = await readJson(upstream)
      if (upstream.status === 400) {
        return jsonResponse({ success: false, message: safeMessage(result, 'El usuario enviado no es válido.') }, 400)
      }
      if (upstream.status === 403) {
        return jsonResponse({ success: false, message: 'n8n rechazó la clave del webhook. Revisa su configuración en el servidor.' }, 403)
      }
      if (!upstream.ok || !isRecord(result) || result.success !== true || !Array.isArray(result.parcelas)) {
        return jsonResponse({ success: false, message: 'n8n devolvió una respuesta no válida al cargar las parcelas.' }, 502)
      }

      const normalizedUsuario = normalizeUsuario(usuario)
      const ownedRows = result.parcelas.filter(
        (row) => isRecord(row) && normalizeUsuario(row.usuario) === normalizedUsuario,
      )
      const parcelas = ownedRows.map((row) => normalizeParcela(row, usuario))
      if (parcelas.some((parcela) => parcela === null)) {
        return jsonResponse({ success: false, message: 'n8n devolvió datos de parcelas no válidos.' }, 502)
      }

      return jsonResponse({ success: true, parcelas }, 200)
    },

    async listarLecturas(usuario: string, idParcela: string) {
      const parcelaId = idParcela.trim()
      if (!parcelaId || parcelaId.length > 100) {
        return jsonResponse({ success: false, message: 'La parcela indicada no es válida.' }, 400)
      }

      const headers = getWebhookHeaders()
      if (!headers) {
        return jsonResponse({ success: false, message: 'La integración de parcelas no está configurada en el servidor.' }, 503)
      }

      const url = new URL(`${webhookBaseUrl.replace(/\/+$/, '')}/${LECTURAS_WEBHOOK_PATH}`)
      url.searchParams.set('usuario', usuario)
      url.searchParams.set('id_parcela', parcelaId)

      let upstream: Response
      try {
        upstream = await fetcher(url, {
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
        })
      } catch (error) {
        return networkErrorResponse('lecturas', error)
      }

      const result = await readJson(upstream)
      if (upstream.status === 400) {
        return jsonResponse({ success: false, message: safeMessage(result, 'La consulta de lecturas no es válida.') }, 400)
      }
      if (upstream.status === 403) {
        return jsonResponse({ success: false, message: 'n8n rechazó la clave del webhook. Revisa su configuración en el servidor.' }, 403)
      }
      if (!upstream.ok || !isRecord(result) || result.success === false || !Array.isArray(result.lecturas)) {
        return jsonResponse({ success: false, message: 'n8n devolvió una respuesta no válida al cargar las lecturas.' }, 502)
      }

      const lecturas = result.lecturas
        .map((row) => normalizeLectura(row, usuario, parcelaId))
        .filter((lectura): lectura is Lectura => lectura !== null)

      return jsonResponse({ success: true, lecturas }, 200)
    },

    async sembrar(usuario: string) {
      const existingResponse = await handlers.listar(usuario)
      if (!existingResponse.ok) return existingResponse

      const existingResult = await readJson(existingResponse)
      if (!isRecord(existingResult) || existingResult.success !== true || !Array.isArray(existingResult.parcelas)) {
        return jsonResponse({ success: false, message: 'No se pudieron revisar las parcelas existentes.' }, 502)
      }

      const existingIds = new Set(
        existingResult.parcelas
          .filter((parcela): parcela is Record<string, unknown> => isRecord(parcela))
          .map((parcela) => parcela.id_parcela)
          .filter((id): id is string => typeof id === 'string'),
      )
      const missing = INITIAL_PARCELAS.filter((parcela) => !existingIds.has(parcela.id_parcela))
      const results = await Promise.all(missing.map((parcela) => handlers.insertar(
        new Request('http://localhost/api/parcelas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parcela),
        }),
        usuario,
      )))
      const failed = results.find((result) => !result.ok && result.status !== 409)
      if (failed) return jsonResponse({ success: false, message: 'No se pudieron agregar todas las parcelas iniciales.' }, failed.status)

      return jsonResponse({
        success: true,
        added: results.filter((result) => result.status === 201).length,
      }, 200)
    },

    async insertar(request: Request, usuario: string) {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return jsonResponse({ success: false, message: 'Revisa los datos de la parcela.' }, 400)
      }

      const parcela = parseNuevaParcela(body)
      if (!parcela) {
        return jsonResponse({ success: false, message: 'Revisa los datos de la parcela.' }, 400)
      }

      const headers = getWebhookHeaders()
      if (!headers) {
        return jsonResponse({ success: false, message: 'La integración de parcelas no está configurada en el servidor.' }, 503)
      }

      let upstream: Response
      try {
        upstream = await fetcher(`${webhookBaseUrl.replace(/\/+$/, '')}/roberto-parcelas-insertar`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario, ...parcela }),
          cache: 'no-store',
          signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
        })
      } catch (error) {
        return networkErrorResponse('insertar', error)
      }

      const result = await readJson(upstream)
      if (upstream.status === 400) {
        return jsonResponse({ success: false, message: safeMessage(result, 'Revisa los datos de la parcela.') }, 400)
      }
      if (upstream.status === 403) {
        return jsonResponse({ success: false, message: 'n8n rechazó la clave del webhook. Revisa su configuración en el servidor.' }, 403)
      }
      if (upstream.status === 409) {
        return jsonResponse({ success: false, message: 'Ya existe una parcela con ese ID en tu cuenta.' }, 409)
      }
      if (
        upstream.status !== 201 || !isRecord(result) || result.success !== true ||
        ('id_parcela' in result && typeof result.id_parcela !== 'string')
      ) {
        return jsonResponse({ success: false, message: 'n8n no pudo registrar la parcela.' }, 502)
      }

      const idParcela = typeof result.id_parcela === 'string' && result.id_parcela.trim()
        ? result.id_parcela.trim()
        : parcela.id_parcela
      return jsonResponse({ success: true, message: 'Parcela registrada', id_parcela: idParcela }, 201)
    },
  }

  return handlers
}
