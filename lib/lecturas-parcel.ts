import {
  formatReadingDate,
  getWorstSensorMoisture,
  type Parcel,
  type ParcelSensor,
  type Reading,
  type SensorConnectionStatus,
} from './agro-data'
import type { Lectura, Parcela } from './parcelas-types'

const DAY_MS = 86_400_000
const HISTORY_DAYS = 7
const KNOWN_IMAGES = ['norte', 'sur', 'este']
const FALLBACK_IMAGES = ['/parcelas/norte.png', '/parcelas/sur.png', '/parcelas/este.png']

type Entry = { lectura: Lectura; date: Date }

function round1(value: number) {
  return Number(value.toFixed(1))
}

function average(values: number[]) {
  return values.length === 0 ? undefined : values.reduce((total, value) => total + value, 0) / values.length
}

function presentNumbers(values: Array<number | null>) {
  return values.filter((value): value is number => value !== null)
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function dayOffset(date: Date, now: Date) {
  return Math.max(0, Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS))
}

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function getSensorStatus(estado: string): SensorConnectionStatus {
  const text = normalizeText(estado)
  if (/inactiv|offline|desconect|sin senal|fuera de linea/.test(text)) return 'offline'
  if (/bater|bajo/.test(text)) return 'low-battery'
  if (/activ|online|conectad|en linea/.test(text)) return 'online'
  return 'offline'
}

function getParcelImage(idParcela: string) {
  const key = idParcela.trim().toLowerCase()
  if (KNOWN_IMAGES.includes(key)) return `/parcelas/${key}.png`
  const seed = Array.from(key).reduce((total, character) => total + character.charCodeAt(0), 0)
  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length]
}

function toEntries(lecturas: Lectura[]): Entry[] {
  return lecturas
    .map((lectura) => ({ lectura, date: new Date(lectura.fecha_hora) }))
    .filter((entry) => Number.isFinite(entry.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

function buildHistory(entries: Entry[], now: Date) {
  const buckets = new Map<number, number[]>()
  for (const { lectura, date } of entries) {
    const offset = dayOffset(date, now)
    if (offset < HISTORY_DAYS) buckets.set(offset, [...(buckets.get(offset) ?? []), lectura.humedad])
  }

  const history: number[] = []
  let lastKnown: number | undefined
  for (let offset = HISTORY_DAYS - 1; offset >= 0; offset--) {
    const values = buckets.get(offset)
    if (values) lastKnown = round1(average(values) ?? 0)
    if (lastKnown !== undefined) history.push(lastKnown)
  }
  return history
}

function buildReadings(entries: Entry[], now: Date): Reading[] {
  const byTimestamp = new Map<number, { date: Date; values: number[] }>()
  for (const { lectura, date } of entries) {
    const group = byTimestamp.get(date.getTime())
    if (group) group.values.push(lectura.humedad)
    else byTimestamp.set(date.getTime(), { date, values: [lectura.humedad] })
  }

  return [...byTimestamp.values()].slice(0, 6).map(({ date, values }) => ({
    time: formatReadingDate(dayOffset(date, now), date.getHours(), date.getMinutes()),
    value: round1(average(values) ?? 0),
  }))
}

export function buildParcelFromLecturas(
  parcela: Parcela,
  lecturas: Lectura[],
  previous?: Pick<Parcel, 'followUpAt' | 'calendarEventRequested'>,
  loaded = true,
  now = new Date(),
): Parcel {
  const entries = toEntries(lecturas)
  const latestBySensor = new Map<string, Entry>()
  for (const entry of entries) {
    if (!latestBySensor.has(entry.lectura.id_sensor)) latestBySensor.set(entry.lectura.id_sensor, entry)
  }
  const latest = [...latestBySensor.values()].sort((a, b) =>
    a.lectura.id_sensor.localeCompare(b.lectura.id_sensor, undefined, { numeric: true }),
  )

  const soilTemperature = average(presentNumbers(latest.map(({ lectura }) => lectura.temperatura_suelo))) ?? 0
  const ambientTemperature = average(presentNumbers(latest.map(({ lectura }) => lectura.temperatura_ambiente))) ?? 0
  const soilPh = average(presentNumbers(latest.map(({ lectura }) => lectura.ph_suelo)))

  const sensors: ParcelSensor[] = latest.map(({ lectura, date }) => ({
    id: `${parcela.id_parcela}-${lectura.id_sensor}`,
    name: lectura.id_sensor,
    status: getSensorStatus(lectura.estado_sensor),
    moisture: round1(lectura.humedad),
    soilTemperature: round1(lectura.temperatura_suelo ?? soilTemperature),
    soilPh: lectura.ph_suelo ?? undefined,
    nitrogen: lectura.nitrogeno ?? undefined,
    phosphorus: lectura.fosforo ?? undefined,
    potassium: lectura.potasio ?? undefined,
    electricalConductivity: lectura.conductividad_electrica ?? undefined,
    lastUpdatedMin: Math.max(0, Math.round((now.getTime() - date.getTime()) / 60_000)),
  }))

  const moisture = sensors.length > 0 ? round1(getWorstSensorMoisture(sensors, 100)) : 0
  const history = buildHistory(entries, now)
  if (history.length > 0) history[history.length - 1] = moisture

  const hasAdvancedData = latest.some(({ lectura }) =>
    [lectura.ph_suelo, lectura.nitrogeno, lectura.fosforo, lectura.potasio, lectura.conductividad_electrica].some(
      (value) => value !== null,
    ),
  )
  const installed = new Date(`${parcela.fecha_instalacion}T00:00:00`)

  return {
    id: parcela.id_parcela,
    name: parcela.nombre,
    hectares: parcela.hectareas,
    crop: parcela.cultivo,
    sensorType: /avanz/.test(normalizeText(parcela.tipo_sensor)) || hasAdvancedData ? 'advanced' : 'basic',
    installationAge: parcela.antiguedad,
    installationDate: installed.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }),
    installationMonthsAgo: Math.max(0, Math.ceil((now.getTime() - installed.getTime()) / (30 * DAY_MS))),
    installationYear: installed.getFullYear(),
    moisture,
    soilPh: soilPh === undefined ? undefined : round1(soilPh),
    soilTemperature: round1(soilTemperature),
    ambientTemperature: round1(ambientTemperature),
    lastReadingMin: sensors.length > 0 ? Math.min(...sensors.map((sensor) => sensor.lastUpdatedMin)) : 0,
    image: getParcelImage(parcela.id_parcela),
    history,
    readings: buildReadings(entries, now),
    sensors,
    followUpAt: previous?.followUpAt,
    calendarEventRequested: previous?.calendarEventRequested,
    remoteSource: parcela,
    remoteLoaded: loaded,
  }
}
