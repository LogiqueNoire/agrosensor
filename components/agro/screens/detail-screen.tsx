'use client'

import { motion } from 'motion/react'
import { CalendarDays, ChartLine, ChevronRight, Clock, Droplet, History, MapPin, Radio } from 'lucide-react'
import Image from 'next/image'
import { formatLastReading, getRecentHistory, getStatus } from '@/lib/agro-data'
import { useAgro } from '../app-store'
import { LineChart } from '../line-chart'
import { MoistureGauge } from '../moisture-gauge'
import { AppButton, Card, ScreenHeader, StatusBadge } from '../ui'

export function DetailScreen() {
  const { selectedParcel: parcel, back, canGoBack, push } = useAgro()
  const status = getStatus(parcel.moisture)
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

        <Card className="mt-4 flex flex-col items-center pt-5 pb-5">
          <MoistureGauge value={parcel.moisture} />
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
          <div className="flex items-center gap-2.5 p-3.5">
            <Radio className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-xs text-muted-foreground">Estado del sensor</p>
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
                En línea
              </p>
            </div>
          </div>
        </Card>

        <Card className="mt-3 grid grid-cols-3 gap-2 p-3">
          <div className="rounded-xl bg-muted/60 p-2">
            <p className="text-[11px] text-muted-foreground">pH del suelo</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{parcel.soilPh.toFixed(1)}</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-2">
            <p className="text-[11px] text-muted-foreground">Temp. suelo</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{parcel.soilTemperature.toFixed(1)} °C</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-2">
            <p className="text-[11px] text-muted-foreground">Temp. ambiente</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{parcel.ambientTemperature.toFixed(1)} °C</p>
          </div>
        </Card>

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
    </div>
  )
}
