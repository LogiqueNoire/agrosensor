'use client'

import { motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { CalendarDays, ChartLine, ChevronRight, Clock, Droplet, History, LoaderCircle, MapPin, Radio, TriangleAlert } from 'lucide-react'
import Image from 'next/image'
import useSWR from 'swr'
import { cn } from '@/lib/utils'
import { lecturasKey, listarLecturas } from '@/lib/parcelas-service'
import { formatLastReading, getAverageSensorMetric, getRecentHistory, getStatus, getWorstSensorMoisture } from '@/lib/agro-data'
import { useAgro } from '../app-store'
import { LineChart } from '../line-chart'
import { MoistureGauge } from '../moisture-gauge'
import { SensorsDrawer } from '../sensors-drawer'
import { AppButton, Card, ScreenHeader, StatusBadge } from '../ui'

function SoilMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-bold tabular-nums">{value}</p>
    </div>
  )
}

function DetailStatusView({ title, onBack, children }: { title: string; onBack?: () => void; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={title} onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 no-scrollbar">{children}</div>
    </div>
  )
}

export function DetailScreen() {
  const { selectedParcel: parcel, back, canGoBack, push, applyLecturas } = useAgro()
  const [sensorsOpen, setSensorsOpen] = useState(false)
  const source = parcel.remoteSource
  const sourceId = source?.id_parcela
  const { data: lecturas, error, mutate } = useSWR(
    sourceId ? lecturasKey(sourceId) : null,
    () => listarLecturas(sourceId as string),
    { refreshInterval: 30_000 },
  )

  useEffect(() => {
    if (sourceId && lecturas) applyLecturas(sourceId, lecturas)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId, lecturas])

  if (source && !parcel.remoteLoaded) {
    return (
      <DetailStatusView title="Detalle de Parcela" onBack={canGoBack ? back : undefined}>
        {error ? (
          <Card className="border-danger/25 bg-danger/5 text-center">
            <p role="alert" className="text-sm text-danger">
              {error instanceof Error ? error.message : 'No se pudieron cargar las lecturas de la parcela.'}
            </p>
            <AppButton className="mt-4" variant="outline" onClick={() => { void mutate() }}>Reintentar</AppButton>
          </Card>
        ) : (
          <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
            Cargando lecturas de {source.nombre}…
          </div>
        )}
      </DetailStatusView>
    )
  }

  if (source && parcel.sensors.length === 0) {
    return (
      <DetailStatusView title="Detalle de Parcela" onBack={canGoBack ? back : undefined}>
        <Card className="py-8 text-center">
          <Radio className="mx-auto size-8 text-primary" aria-hidden />
          <p className="mt-3 font-semibold">{source.nombre} aún no tiene lecturas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando el sensor envíe su primera medición, aparecerá aquí automáticamente.
          </p>
        </Card>
      </DetailStatusView>
    )
  }

  const moisture = getWorstSensorMoisture(parcel.sensors, parcel.moisture)
  const status = getStatus(moisture)
  const onlineSensorCount = parcel.sensors.filter((sensor) => sensor.status === 'online').length
  const hasOfflineSensor = parcel.sensors.some((sensor) => sensor.status === 'offline')
  const sensorStatusDot = hasOfflineSensor
    ? 'bg-danger'
    : parcel.sensors.some((sensor) => sensor.status === 'low-battery')
      ? 'bg-warning'
      : 'bg-success'
  const recentHistory = getRecentHistory(parcel)

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Detalle de Parcela" onBack={canGoBack ? back : undefined} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 no-scrollbar">
        <div className="relative h-28 overflow-hidden rounded-2xl">
          <Image src={parcel.image} alt={`Vista aérea de ${parcel.name}`} fill sizes="360px" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
            <h2 className="text-xl font-bold">{parcel.name}</h2>
            <p className="flex items-center gap-1 text-sm opacity-90">
              <MapPin className="size-3.5" aria-hidden />
              {parcel.hectares.toFixed(1)} ha · {parcel.crop}
            </p>
          </div>
        </div>

        {hasOfflineSensor && (
          <div role="status" className="mt-4 flex items-center gap-2.5 rounded-xl border border-warning/25 bg-warning/10 px-3.5 py-3 text-sm text-warning">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            <p>Un sensor no está enviando datos</p>
          </div>
        )}

        <Card className={cn('flex flex-col items-center pt-5 pb-5', hasOfflineSensor ? 'mt-3' : 'mt-4')}>
          <MoistureGauge value={moisture} />
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <StatusBadge status={status} className="-mt-2 px-4 py-1.5 text-sm" />
          </motion.div>
        </Card>

        <Card className="mt-3 grid grid-cols-2 divide-x divide-border p-0">
          <div className="flex items-center gap-2.5 p-3.5">
            <Clock className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-xs text-muted-foreground">Última lectura</p>
              <p className="text-sm font-semibold">{formatLastReading(parcel.lastReadingMin)}</p>
            </div>
          </div>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={`Ver sensores de ${parcel.name}`}
            onClick={() => setSensorsOpen(true)}
            className="flex min-w-0 items-center justify-between gap-1.5 rounded-r-2xl p-3 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Radio className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 text-left">
                <p className="text-[11px] leading-tight text-muted-foreground">Estado de los sensores</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold leading-tight">
                  <span className={cn('size-2 shrink-0 rounded-full', sensorStatusDot)} aria-hidden />
                  <span className="truncate">{onlineSensorCount} de {parcel.sensors.length} en línea</span>
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </Card>

        <Card className="mt-3 grid grid-cols-2 gap-2 p-3">
          <SoilMetric label="Temp. suelo" value={`${parcel.soilTemperature.toFixed(1)} °C`} />
          <SoilMetric label="Temp. ambiente" value={`${parcel.ambientTemperature.toFixed(1)} °C`} />
        </Card>

        {parcel.sensorType === 'advanced' && (
          <Card className="mt-3 grid grid-cols-2 gap-2 p-3">
            <h3 className="col-span-full text-sm font-semibold">Análisis del suelo</h3>
            <SoilMetric label="pH del suelo" value={parcel.soilPh?.toFixed(1) ?? '—'} />
            <SoilMetric label="Nitrógeno (N)" value={`${getAverageSensorMetric(parcel.sensors, 'nitrogen')?.toFixed(0) ?? '—'} mg/kg`} />
            <SoilMetric label="Potasio (K)" value={`${getAverageSensorMetric(parcel.sensors, 'potassium')?.toFixed(0) ?? '—'} mg/kg`} />
            <SoilMetric label="Fósforo (P)" value={`${getAverageSensorMetric(parcel.sensors, 'phosphorus')?.toFixed(0) ?? '—'} mg/kg`} />
            <SoilMetric label="Conductividad eléctrica" value={`${getAverageSensorMetric(parcel.sensors, 'electricalConductivity')?.toFixed(1) ?? '—'} dS/m`} />
          </Card>
        )}

        <Card className="mt-3 flex items-center gap-3 p-3.5">
          <CalendarDays className="size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-xs text-muted-foreground">Instalación del sensor</p>
            <p className="text-sm font-semibold">{parcel.installationDate}</p>
            <p className="text-xs text-muted-foreground">{parcel.installationAge}</p>
          </div>
        </Card>

        <Card className="mt-3 p-0">
          <button
            type="button"
            onClick={() => push('history')}
            className="flex w-full items-center gap-2 rounded-t-2xl px-4 pt-3.5 pb-1 text-left outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <ChartLine className="size-5 text-primary" aria-hidden />
            <span className="flex-1 font-semibold">Historial de lecturas</span>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
          </button>
          <div className="px-2 pb-2">
            <LineChart
              values={recentHistory.values}
              labels={recentHistory.labels}
              height={120}
              label={`Humedad de ${parcel.name} en los últimos 7 días`}
            />
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <AppButton variant="outline" className="gap-1.5 px-2 text-sm whitespace-nowrap" onClick={() => push('history')}>
            <History aria-hidden />
            Ver historial
          </AppButton>
          <AppButton className="gap-1.5 px-2 text-sm whitespace-nowrap" onClick={() => push('recommendation')}>
            <Droplet aria-hidden />
            Ver recomendación
          </AppButton>
        </div>
      </div>
      <SensorsDrawer parcel={parcel} open={sensorsOpen} onOpenChange={setSensorsOpen} />
    </div>
  )
}
