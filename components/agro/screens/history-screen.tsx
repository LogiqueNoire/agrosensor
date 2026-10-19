'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Droplet, History } from 'lucide-react'
import { getCurrentMonthSeries, getInstallationDays, getRecentHistory, STATUS_META, getStatus } from '@/lib/agro-data'
import { cn } from '@/lib/utils'
import { useAgro } from '../app-store'
import { LineChart } from '../line-chart'
import { AppButton, Card, ScreenHeader, StatusBadge } from '../ui'

export function HistoryScreen() {
  const { parcels, selectedParcel: parcel, selectParcel, back, canGoBack, push } = useAgro()
  const avg = Math.round(parcel.history.reduce((a, b) => a + b, 0) / parcel.history.length)
  const min = Math.min(...parcel.history)
  const stats = [
    { label: 'Actual', value: parcel.moisture },
    { label: 'Promedio', value: avg },
    { label: 'Mínimo', value: min },
  ]

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Historial de lecturas" onBack={canGoBack ? back : undefined} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 no-scrollbar">
        <div role="tablist" aria-label="Seleccionar parcela" className="flex gap-1 rounded-xl bg-muted p-1">
          {parcels.map((p) => {
            const active = p.id === parcel.id
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectParcel(p.id)}
                className={cn(
                  'relative flex-1 rounded-lg py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  active ? 'text-primary-foreground' : 'text-muted-foreground',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="history-tab"
                    className="absolute inset-0 rounded-lg bg-primary"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative">{p.name.replace('Parcela ', '')}</span>
              </button>
            )
          })}
        </div>

        <Card className="mt-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold">{parcel.name}</h2>
              <p className="text-xs text-muted-foreground">Humedad de los últimos 7 días</p>
            </div>
            <StatusBadge status={getStatus(parcel.moisture)} />
          </div>
          <div className="mt-3 -mx-1">
            <LineChart values={getRecentHistory(parcel).values} labels={getRecentHistory(parcel).labels} height={170} label={`Humedad de ${parcel.name} desde la instalación`} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-warning/30" />Zona de riesgo (20–35%)</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-danger/25" />Zona crítica ({'<'}20%)</span>
          </div>
        </Card>

        <dl className="mt-3 grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <Card key={s.label} className="p-3 text-center">
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd className={cn('text-xl font-bold tabular-nums', STATUS_META[getStatus(s.value)].text)}>{s.value}%</dd>
            </Card>
          ))}
        </dl>

        <AppButton variant="outline" className="mt-4" onClick={() => push('history-expanded')}>
          <History aria-hidden />
          Ampliar historial
        </AppButton>

        <h3 className="mt-5 mb-2 text-sm font-semibold">Lecturas recientes</h3>
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {parcel.readings.map((r, i) => {
              const st = getStatus(r.value)
              return (
                <motion.li
                  key={`${parcel.id}-${r.time}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Droplet className={cn('size-4 fill-current', STATUS_META[st].text)} aria-hidden />
                  <span className="flex-1 text-sm">{r.time}</span>
                  <span className="text-sm font-semibold tabular-nums">{r.value}%</span>
                  <span className={cn('w-16 text-right text-xs font-semibold', STATUS_META[st].text)}>{STATUS_META[st].label}</span>
                </motion.li>
              )
            })}
          </ul>
        </Card>

        <AppButton className="mt-4" onClick={() => push('recommendation')}>
          <Droplet aria-hidden />
          Ver recomendación de riego
        </AppButton>
      </div>
    </div>
  )
}

const RANGE_OPTIONS = [
  { id: 'week', label: 'Semana', subtitle: 'Últimos 7 días', values: [38, 36, 39, 44, 41, 40, 42] },
  { id: 'month', label: 'Mes', subtitle: 'Últimas 4 semanas', values: [35, 38, 33, 36, 31, 34, 29, 32, 30, 35, 28, 31] },
  { id: 'year', label: 'Este año', subtitle: 'Lecturas de este año', values: [31, 34, 29, 37, 35, 39, 33, 36, 40, 38, 42, 39] },
  { id: 'all', label: 'Desde instalación', subtitle: 'Todo el historial del sensor', values: [31, 34, 29, 37, 35, 39, 33, 36, 40, 38, 42, 39] },
] as const

export function ExpandedHistoryScreen() {
  const { parcels, selectedParcel: parcel, selectParcel, back } = useAgro()
  const availableDays = getInstallationDays(parcel.installationMonthsAgo) + 1
  const canViewWeek = availableDays >= 1
  const canViewMonth = availableDays >= 7
  const canViewAll = availableDays >= 7
  const initialRange: 'week' | 'month' | 'year' | 'all' = canViewMonth ? 'month' : 'week'
  const [range, setRange] = useState<'week' | 'month' | 'year' | 'all'>(initialRange)
  const currentMonth = getCurrentMonthSeries(parcel)
  const currentYear = new Date().getFullYear()
  const currentYearValues = Array.from({ length: 12 }, (_, index) => parcel.history[index % parcel.history.length] ?? parcel.moisture)
  const recentHistory = getRecentHistory(parcel)
  const selectedRange = range === 'month' && canViewMonth
    ? { id: 'month', label: 'Mes', subtitle: 'Días del mes actual hasta hoy', values: currentMonth.values }
    : range === 'year'
      ? { id: 'year', label: 'Este año', subtitle: `Enero–diciembre de ${currentYear}`, values: currentYearValues }
      : range === 'all' && canViewAll
        ? RANGE_OPTIONS[3]
        : { id: 'week', label: 'Semana', subtitle: availableDays === 1 ? 'Solo hay una medición disponible' : `${Math.min(availableDays, 7)} días desde la instalación`, values: recentHistory.values }
  const avg = Math.round(selectedRange.values.reduce((a, b) => a + b, 0) / selectedRange.values.length)
  const min = Math.min(...selectedRange.values)
  const installationYear = parcel.installationYear ?? currentYear - Math.max(1, Math.round(parcel.installationMonthsAgo / 12))
  const yearSpan = Math.max(1, currentYear - installationYear)
  const labels = range === 'week' || (!canViewMonth && !canViewAll)
    ? recentHistory.labels
    : range === 'month'
      ? currentMonth.labels
      : range === 'year'
        ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        : Array.from({ length: 12 }, (_, index) => {
          if (index === 0) return `${installationYear}`
          if (index === 11) return `${currentYear}`
          if (yearSpan < 3 || index % 3 !== 0) return ''
          return `${Math.round(installationYear + (yearSpan * index) / 11)}`
        })

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Historial ampliado" onBack={back} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 no-scrollbar">
        <div role="tablist" aria-label="Seleccionar parcela" className="flex gap-1 rounded-xl bg-muted p-1">
          {parcels.map((p) => <button key={p.id} type="button" role="tab" aria-selected={p.id === parcel.id} onClick={() => selectParcel(p.id)} className={cn('flex-1 rounded-lg py-2 text-sm font-semibold', p.id === parcel.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{p.name.replace('Parcela ', '')}</button>)}
        </div>
        <Card className="mt-4">
          <div className="flex items-start justify-between gap-2"><div><h2 className="font-semibold">{parcel.name}</h2><p className="text-xs text-muted-foreground">Sensor instalado {parcel.installationAge.toLowerCase()} ({parcel.installationDate})</p></div><StatusBadge status={getStatus(parcel.moisture)} /></div>
          <div className="mt-4 grid grid-cols-[0.9fr_0.7fr_1fr_1.35fr] gap-2 rounded-xl bg-muted/60 p-1">
            {RANGE_OPTIONS.map((item) => {
              const disabled = item.id === 'month' ? !canViewMonth : item.id === 'all' ? !canViewAll : !canViewWeek
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setRange(item.id)}
                  className={cn('rounded-lg px-1 py-2 text-xs font-semibold transition', range === item.id && !disabled ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground', disabled && 'cursor-not-allowed opacity-40')}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{selectedRange.subtitle}</p>
          {!canViewMonth && <p className="mt-2 rounded-lg bg-warning/10 px-3 py-2 text-xs leading-relaxed text-warning">El mes y el historial completo estarán disponibles cuando el sensor acumule al menos 7 días de mediciones.</p>}
          <div className="mt-1 -mx-1"><LineChart values={[...selectedRange.values]} labels={labels} height={180} label={`Historial ampliado de ${parcel.name}`} /></div>
        </Card>
        <dl className="mt-3 grid grid-cols-3 gap-2">{[{ label: 'Promedio', value: avg }, { label: 'Mínimo', value: min }, { label: 'Actual', value: parcel.moisture }].map((item) => <Card key={item.label} className="p-3 text-center"><dt className="text-xs text-muted-foreground">{item.label}</dt><dd className={cn('text-xl font-bold tabular-nums', STATUS_META[getStatus(item.value)].text)}>{item.value}%</dd></Card>)}</dl>
        <Card className="mt-4 border-primary/15 bg-primary/[0.04]"><p className="text-sm font-semibold">Cobertura del sensor</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Puedes cambiar entre semanas, meses y todo el período disponible desde la instalación del sensor.</p></Card>
      </div>
    </div>
  )
}
