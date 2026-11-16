import type { Parcela } from './parcelas-types'

export type MoistureStatus = 'optimo' | 'riesgo' | 'critico'

export type ParcelId = string

export type CropProfile = {
  label: string
  minMoisture: number
  maxMoisture: number
}

export const CROP_PROFILES: CropProfile[] = [
  { label: 'Palta', minMoisture: 35, maxMoisture: 55 },
  { label: 'Tomate', minMoisture: 60, maxMoisture: 70 },
  { label: 'Papa', minMoisture: 40, maxMoisture: 60 },
  { label: 'Zanahoria', minMoisture: 35, maxMoisture: 55 },
  { label: 'Limón', minMoisture: 30, maxMoisture: 50 },
  { label: 'Arándano', minMoisture: 45, maxMoisture: 65 },
  { label: 'Espárrago', minMoisture: 60, maxMoisture: 70 },
  { label: 'Algodón', minMoisture: 30, maxMoisture: 50 },
  { label: 'Uva', minMoisture: 35, maxMoisture: 55 },
  { label: 'Maíz', minMoisture: 35, maxMoisture: 55 },
]

export type Reading = { time: string; value: number }

export type SensorConnectionStatus = 'online' | 'offline' | 'low-battery'
export type SensorType = 'basic' | 'advanced'

export type ParcelSensor = {
  id: string
  name: string
  status: SensorConnectionStatus
  moisture: number
  soilPh?: number
  soilTemperature: number
  lastUpdatedMin: number
  nitrogen?: number
  phosphorus?: number
  potassium?: number
  electricalConductivity?: number
}

export type Parcel = {
  id: ParcelId
  name: string
  hectares: number
  crop: string
  sensorType: SensorType
  installationAge: string
  installationDate: string
  installationMonthsAgo: number
  installationYear?: number
  moisture: number
  soilPh?: number
  soilTemperature: number
  ambientTemperature: number
  lastReadingMin: number
  image: string
  history: number[]
  readings: Reading[]
  sensors: ParcelSensor[]
  followUpAt?: number
  calendarEventRequested?: boolean
  remoteSource?: Parcela
  remoteLoaded?: boolean
}

export const FOLLOW_UP_MIN_SECONDS = 5
export const FOLLOW_UP_MAX_SECONDS = 30 * 24 * 60 * 60

export const FOLLOW_UP_UNITS = [
  { id: 'seconds', label: 'Segundos', short: 's', seconds: 1 },
  { id: 'minutes', label: 'Minutos', short: 'min', seconds: 60 },
  { id: 'hours', label: 'Horas', short: 'h', seconds: 3600 },
  { id: 'days', label: 'Días', short: 'd', seconds: 86400 },
  { id: 'weeks', label: 'Semanas', short: 'sem', seconds: 7 * 86400 },
  { id: 'months', label: 'Meses', short: 'mes', seconds: 30 * 86400 },
] as const

export type FollowUpUnitId = (typeof FOLLOW_UP_UNITS)[number]['id']

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (days > 0) return `${days} d ${hours} h`
  if (hours > 0) return `${hours} h ${minutes} min`
  if (minutes > 0) return `${minutes} min ${seconds} s`
  return `${seconds} s`
}

export function formatFollowUpDuration(totalSeconds: number) {
  const unit = [...FOLLOW_UP_UNITS].reverse().find((u) => totalSeconds >= u.seconds && totalSeconds % u.seconds === 0)
  if (!unit) return formatCountdown(totalSeconds * 1000)
  const value = totalSeconds / unit.seconds
  const names: Record<FollowUpUnitId, [string, string]> = {
    seconds: ['segundo', 'segundos'],
    minutes: ['minuto', 'minutos'],
    hours: ['hora', 'horas'],
    days: ['día', 'días'],
    weeks: ['semana', 'semanas'],
    months: ['mes', 'meses'],
  }
  const [singular, plural] = names[unit.id]
  return `${value} ${value === 1 ? singular : plural}`
}

export type AlertItem = {
  id: string
  parcelId: ParcelId
  title: string
  body: string
  time: string
  status: MoistureStatus
}

export function getRecentDayLabels() {
  const today = new Date()
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    return index === 6
      ? 'Hoy'
      : date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }).replace('.', '')
  })
}

export function formatReadingDate(offsetDays: number, hour: number, minute = 0) {
  const date = new Date()
  date.setDate(date.getDate() - offsetDays)
  date.setHours(hour, minute, 0, 0)
  const dayLabel = offsetDays === 0 ? 'Hoy' : offsetDays === 1 ? 'Ayer' : date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }).replace('.', '')
  return `${dayLabel}, ${date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })}`
}

export function getInstallationDate(monthsAgo: number) {
  const date = new Date()
  date.setMonth(date.getMonth() - monthsAgo)
  return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function getInstallationDays(monthsAgo: number) {
  const installed = new Date()
  installed.setMonth(installed.getMonth() - monthsAgo)
  return Math.max(0, Math.floor((Date.now() - installed.getTime()) / 86400000))
}

export function getRecentHistory(parcel: Pick<Parcel, 'moisture' | 'history' | 'installationMonthsAgo'>) {
  const availableDays = Math.max(1, getInstallationDays(parcel.installationMonthsAgo) + 1)
  const count = Math.min(7, availableDays, parcel.history.length)
  const values = parcel.history.slice(-count)
  const today = new Date()
  const labels = values.map((_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (count - 1 - index))
    return index === count - 1
      ? 'Hoy'
      : date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }).replace('.', '')
  })
  return { values, labels }
}

export function getCurrentMonthSeries(parcel: Pick<Parcel, 'moisture' | 'id'>) {
  const today = new Date()
  const dayCount = today.getDate()
  const seed = parcel.id === 'norte' ? 2 : parcel.id === 'sur' ? 5 : 8
  const values = Array.from({ length: dayCount }, (_, index) => {
    const wave = Math.sin((index + seed) * 1.37) * 3 + Math.cos((index + seed) * 0.61) * 1.5
    const trend = parcel.id === 'este' ? -index * 0.12 : parcel.id === 'sur' ? -index * 0.04 : index * 0.02
    return Math.max(4, Math.min(58, Math.round(parcel.moisture + wave + trend)))
  })
  values[values.length - 1] = parcel.moisture
  return {
    values,
    labels: values.map((_, index) => {
      const day = index + 1
      return day === 1 || day === dayCount || day % 5 === 0 ? `${day}` : ''
    }),
  }
}

export function calcularSensores(hectareas: number): number {
  const areaEnMetrosCuadrados = Number.isFinite(hectareas) && hectareas > 0 ? hectareas * 10_000 : 0
  return Math.max(2, Math.ceil(areaEnMetrosCuadrados / 5_000))
}

const INITIAL_SENSOR_STATES: Record<string, readonly SensorConnectionStatus[]> = {
  norte: ['online', 'online', 'low-battery'],
  sur: ['online', 'offline', 'online', 'online'],
  este: ['online', 'online'],
  simulada: ['online', 'online', 'online'],
}

function getSimulatedSensorStatus(parcelId: string, sensorIndex: number): SensorConnectionStatus {
  const initialStatus = INITIAL_SENSOR_STATES[parcelId]?.[sensorIndex]
  if (initialStatus) return initialStatus

  const seed = Array.from(parcelId).reduce((total, character) => total + character.charCodeAt(0), 0)
  const statusCode = (seed + sensorIndex * 7) % 19
  if (statusCode === 0) return 'offline'
  if (statusCode === 1 || statusCode === 2) return 'low-battery'
  return 'online'
}

// Sustituir este generador por lecturas reales al conectar los sensores físicos.
export function createSimulatedSensors(
  parcel: Pick<Parcel, 'id' | 'hectares' | 'moisture' | 'soilPh' | 'soilTemperature' | 'sensorType'>,
): ParcelSensor[] {
  const count = calcularSensores(parcel.hectares)
  const moistureOffsets = [-2, 1, 0, 2, -1] as const
  const phOffsets = [-0.2, 0.1, 0, -0.1, 0.2] as const
  const temperatureOffsets = [0.3, -0.2, 0, 0.2, -0.1] as const
  const moistureStatus = getStatus(parcel.moisture)
  const moistureBounds: Record<MoistureStatus, [number, number]> = {
    optimo: [35, 100],
    riesgo: [20, 34],
    critico: [0, 19],
  }
  const [minimumMoisture, maximumMoisture] = moistureBounds[moistureStatus]

  return Array.from({ length: count }, (_, sensorIndex) => {
    const sensor: ParcelSensor = {
      id: `${parcel.id}-sensor-${sensorIndex + 1}`,
      name: `Sensor ${sensorIndex + 1}`,
      status: getSimulatedSensorStatus(parcel.id, sensorIndex),
      moisture: Math.round(
        Math.max(minimumMoisture, Math.min(maximumMoisture, parcel.moisture + moistureOffsets[sensorIndex % moistureOffsets.length])),
      ),
      soilTemperature: Number(
        Math.max(5, Math.min(40, parcel.soilTemperature + temperatureOffsets[sensorIndex % temperatureOffsets.length])).toFixed(1),
      ),
      lastUpdatedMin: 1 + sensorIndex * 4,
    }

    if (parcel.sensorType === 'advanced') {
      sensor.soilPh = Number(
        Math.max(4.5, Math.min(8.5, (parcel.soilPh ?? 6.2) + phOffsets[sensorIndex % phOffsets.length])).toFixed(1),
      )
      sensor.nitrogen = 48 + (sensorIndex % 4) * 6
      sensor.phosphorus = 19 + (sensorIndex % 3) * 4
      sensor.potassium = 118 + (sensorIndex % 5) * 8
      sensor.electricalConductivity = Number((0.7 + (sensorIndex % 4) * 0.2).toFixed(1))
    }

    return sensor
  })
}

export function getWorstSensorMoisture(sensors: readonly ParcelSensor[], fallbackMoisture: number): number {
  return sensors.reduce((worstMoisture, sensor) => Math.min(worstMoisture, sensor.moisture), fallbackMoisture)
}

type AdvancedSensorMetric = 'nitrogen' | 'potassium' | 'phosphorus' | 'electricalConductivity'

export function getAverageSensorMetric(sensors: readonly ParcelSensor[], metric: AdvancedSensorMetric): number | undefined {
  const values = sensors.map((sensor) => sensor[metric]).filter((value): value is number => typeof value === 'number')
  if (values.length === 0) return undefined
  return values.reduce((total, value) => total + value, 0) / values.length
}

export function attachSimulatedSensors(parcel: Omit<Parcel, 'sensors'>): Parcel {
  const sensors = createSimulatedSensors(parcel)
  const moisture = getWorstSensorMoisture(sensors, parcel.moisture)
  const history = [...parcel.history]
  if (history.length > 0) history[history.length - 1] = moisture
  const readings = parcel.readings.map((reading, index) => (index === 0 ? { ...reading, value: moisture } : reading))

  return { ...parcel, moisture, sensors, history, readings }
}

const INITIAL_PARCELS_BASE: Omit<Parcel, 'sensors'>[] = [
  {
    id: 'norte',
    name: 'Parcela Norte',
    hectares: 1.5,
    crop: 'Maíz',
    sensorType: 'basic',
    installationAge: 'Hace 3 años',
    installationDate: '1 de octubre de 2023',
    installationMonthsAgo: 36,
    installationYear: 2023,
    moisture: 42,
    soilTemperature: 18.7,
    ambientTemperature: 24.3,
    lastReadingMin: 5,
    image: '/parcelas/norte.png',
    history: [38, 36, 39, 44, 41, 40, 42],
    readings: [
      { time: formatReadingDate(0, 9, 55), value: 42 },
      { time: formatReadingDate(0, 6), value: 41 },
      { time: formatReadingDate(1, 18), value: 40 },
      { time: formatReadingDate(1, 6), value: 43 },
      { time: formatReadingDate(3, 18), value: 41 },
    ],
  },
  {
    id: 'sur',
    name: 'Parcela Sur',
    hectares: 2.0,
    crop: 'Palta',
    sensorType: 'basic',
    installationAge: 'Hace 2 años y medio',
    installationDate: getInstallationDate(30),
    installationMonthsAgo: 30,
    moisture: 28,
    soilTemperature: 19.4,
    ambientTemperature: 26.1,
    lastReadingMin: 12,
    image: '/parcelas/sur.png',
    history: [39, 37, 35, 33, 31, 30, 28],
    readings: [
      { time: formatReadingDate(0, 9, 48), value: 28 },
      { time: formatReadingDate(0, 6), value: 29 },
      { time: formatReadingDate(1, 18), value: 30 },
      { time: formatReadingDate(1, 6), value: 31 },
      { time: formatReadingDate(3, 18), value: 32 },
    ],
  },
  {
    id: 'este',
    name: 'Parcela Este',
    hectares: 1.0,
    crop: 'Tomate',
    sensorType: 'basic',
    installationAge: 'Hace 9 meses',
    installationDate: getInstallationDate(9),
    installationMonthsAgo: 9,
    moisture: 12,
    soilTemperature: 20.2,
    ambientTemperature: 27.6,
    lastReadingMin: 20,
    image: '/parcelas/este.png',
    history: [30, 26, 23, 20, 17, 14, 12],
    readings: [
      { time: formatReadingDate(0, 9, 40), value: 12 },
      { time: formatReadingDate(0, 6), value: 13 },
      { time: formatReadingDate(1, 18), value: 14 },
      { time: formatReadingDate(1, 6), value: 16 },
      { time: formatReadingDate(3, 18), value: 17 },
    ],
  },
  {
    id: 'simulada',
    name: 'Parcela Oeste',
    hectares: 1.2,
    crop: 'Tomate',
    sensorType: 'advanced',
    installationAge: 'Hace 4 meses',
    installationDate: '1 de julio de 2026',
    installationMonthsAgo: 4,
    installationYear: 2026,
    moisture: 62,
    soilPh: 6.3,
    soilTemperature: 20.8,
    ambientTemperature: 25.6,
    lastReadingMin: 2,
    image: '/parcelas/norte.png',
    history: [58, 57, 59, 60, 61, 62, 62],
    readings: [
      { time: formatReadingDate(0, 9, 58), value: 62 },
      { time: formatReadingDate(0, 6), value: 61 },
      { time: formatReadingDate(1, 18), value: 60 },
      { time: formatReadingDate(1, 6), value: 59 },
      { time: formatReadingDate(3, 18), value: 58 },
    ],
  },
]

export const INITIAL_PARCELS: Parcel[] = INITIAL_PARCELS_BASE.map(attachSimulatedSensors)

export const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'seed-sur',
    parcelId: 'sur',
    title: 'Humedad en riesgo',
    body: 'Parcela Sur bajó a 28%. Revisa la recomendación de riego.',
    time: 'hace 12 min',
    status: 'riesgo',
  },
]

export function getStatus(moisture: number): MoistureStatus {
  if (moisture >= 35) return 'optimo'
  if (moisture >= 20) return 'riesgo'
  return 'critico'
}

export const STATUS_META: Record<
  MoistureStatus,
  { label: string; badge: string; dot: string; text: string; soft: string; stroke: string }
> = {
  optimo: {
    label: 'Óptimo',
    badge: 'bg-success/12 text-success ring-1 ring-success/25',
    dot: 'bg-success',
    text: 'text-success',
    soft: 'bg-success/10 border-success/25',
    stroke: 'var(--success)',
  },
  riesgo: {
    label: 'En riesgo',
    badge: 'bg-warning/12 text-warning ring-1 ring-warning/30',
    dot: 'bg-warning',
    text: 'text-warning',
    soft: 'bg-warning/10 border-warning/30',
    stroke: 'var(--warning)',
  },
  critico: {
    label: 'Crítico',
    badge: 'bg-danger/10 text-danger ring-1 ring-danger/25',
    dot: 'bg-danger',
    text: 'text-danger',
    soft: 'bg-danger/8 border-danger/25',
    stroke: 'var(--danger)',
  },
}

export function formatLastReading(min: number, long = false) {
  if (min === 0) return 'hace un momento'
  if (min >= 1440) {
    const days = Math.floor(min / 1440)
    return long ? `hace ${days} ${days === 1 ? 'día' : 'días'}` : `hace ${days} d`
  }
  if (min >= 60) {
    const hours = Math.floor(min / 60)
    return long ? `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}` : `hace ${hours} h`
  }
  return long ? `hace ${min} minutos` : `hace ${min} min`
}
