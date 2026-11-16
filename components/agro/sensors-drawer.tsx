'use client'

import { Radio, Clock3 } from 'lucide-react'
import type { Parcel, SensorConnectionStatus } from '@/lib/agro-data'
import { formatLastReading, getStatus } from '@/lib/agro-data'
import { cn } from '@/lib/utils'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Card, StatusBadge } from './ui'

type SensorsDrawerProps = {
  parcel: Parcel
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SENSOR_STATUS_META: Record<SensorConnectionStatus, { label: string; dot: string; text: string }> = {
  online: { label: 'En línea', dot: 'bg-success', text: 'text-success' },
  offline: { label: 'Sin conexión', dot: 'bg-danger', text: 'text-danger' },
  'low-battery': { label: 'Batería baja', dot: 'bg-warning', text: 'text-warning' },
}

function SensorConnectionStatusLabel({ status }: { status: SensorConnectionStatus }) {
  const meta = SENSOR_STATUS_META[status]

  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-1 text-[11px] font-semibold ${meta.text}`}>
      <span className={`size-2 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  )
}

function SensorCard({ sensor, sensorType }: { sensor: Parcel['sensors'][number]; sensorType: Parcel['sensorType'] }) {
  return (
    <Card className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Radio className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{sensor.name}</h3>
            <p className="text-[11px] text-muted-foreground">Sensor {sensorType === 'advanced' ? 'avanzado' : 'básico'}</p>
          </div>
        </div>
        <SensorConnectionStatusLabel status={sensor.status} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-muted/60 p-3">
        <div>
          <p className="text-xs text-muted-foreground">Humedad del suelo</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums">{sensor.moisture}%</p>
        </div>
        <StatusBadge status={getStatus(sensor.moisture)} className="px-2.5 py-1 text-[11px]" />
      </div>

      <div className={cn('mt-2 grid gap-2', sensorType === 'advanced' ? 'grid-cols-2' : 'grid-cols-1')}>
        {sensorType === 'advanced' && (
          <div className="rounded-xl bg-muted/60 p-2.5">
            <p className="text-[11px] text-muted-foreground">pH del suelo</p>
            <p className="mt-0.5 text-base font-bold tabular-nums">{sensor.soilPh?.toFixed(1) ?? '—'}</p>
          </div>
        )}
        <div className="rounded-xl bg-muted/60 p-2.5">
          <p className="text-[11px] text-muted-foreground">Temp. del suelo</p>
          <p className="mt-0.5 text-base font-bold tabular-nums">{sensor.soilTemperature.toFixed(1)} °C</p>
        </div>
      </div>

      {sensorType === 'advanced' && (
        <>
          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold">Niveles de NPK</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-muted/60 p-2.5">
                <p className="text-[11px] text-muted-foreground">Nitrógeno (N)</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums">{sensor.nitrogen?.toFixed(0) ?? '—'} <span className="text-[10px] font-medium text-muted-foreground">mg/kg</span></p>
              </div>
              <div className="rounded-xl bg-muted/60 p-2.5">
                <p className="text-[11px] text-muted-foreground">Potasio (K)</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums">{sensor.potassium?.toFixed(0) ?? '—'} <span className="text-[10px] font-medium text-muted-foreground">mg/kg</span></p>
              </div>
              <div className="rounded-xl bg-muted/60 p-2.5">
                <p className="text-[11px] text-muted-foreground">Fósforo (P)</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums">{sensor.phosphorus?.toFixed(0) ?? '—'} <span className="text-[10px] font-medium text-muted-foreground">mg/kg</span></p>
              </div>
            </div>
          </div>
          <div className="mt-2 rounded-xl bg-muted/60 p-2.5">
            <p className="text-[11px] text-muted-foreground">Conductividad eléctrica del suelo</p>
            <p className="mt-0.5 text-base font-bold tabular-nums">{sensor.electricalConductivity?.toFixed(1) ?? '—'} dS/m</p>
          </div>
        </>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock3 className="size-3.5 shrink-0" aria-hidden />
        Última actualización: {formatLastReading(sensor.lastUpdatedMin)}
      </p>
    </Card>
  )
}

export function SensorsDrawer({ parcel, open, onOpenChange }: SensorsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="mx-auto h-[82dvh] max-h-[calc(100dvh-1rem)] w-full max-w-lg bg-background text-foreground">
        <DrawerHeader className="px-5 pt-2 pb-3 text-left">
          <DrawerTitle className="text-lg font-semibold">Sensores de {parcel.name}</DrawerTitle>
          <DrawerDescription className="mt-1 text-xs">
            {parcel.remoteSource ? 'Últimas lecturas de AgroSensor' : 'Lecturas simuladas'} · Sensor {parcel.sensorType === 'advanced' ? 'avanzado' : 'básico'}.
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="flex flex-col gap-3">
            {parcel.sensors.map((sensor) => (
              <SensorCard key={sensor.id} sensor={sensor} sensorType={parcel.sensorType} />
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
