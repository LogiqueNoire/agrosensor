'use client'

import { motion } from 'motion/react'
import { House } from 'lucide-react'
import { useState } from 'react'
import {
  FOLLOW_UP_MAX_SECONDS,
  FOLLOW_UP_MIN_SECONDS,
  FOLLOW_UP_UNITS,
  formatFollowUpDuration,
  getStatus,
  type FollowUpUnitId,
} from '@/lib/agro-data'
import { cn } from '@/lib/utils'
import { useAgro } from '../app-store'
import { AppButton, StatusBadge } from '../ui'

function AnimatedCheck() {
  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="relative flex size-32 items-center justify-center"
    >
      <motion.span
        className="absolute inset-0 rounded-full bg-success/15"
        initial={{ scale: 0.6 }}
        animate={{ scale: [0.6, 1.15, 1] }}
        transition={{ duration: 0.7, delay: 0.1 }}
      />
      <svg viewBox="0 0 96 96" className="relative size-24" aria-hidden>
        <circle cx="48" cy="48" r="44" fill="var(--success)" />
        <motion.path
          d="M28 49 L42 63 L68 35"
          fill="none"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.35, ease: 'easeOut' }}
        />
      </svg>
    </motion.div>
  )
}

export function SuccessScreen() {
  const { selectedParcel: parcel, reset } = useAgro()

  return (
    <div className="flex h-full flex-col items-center bg-card px-6 pt-16 pb-8 text-center">
      <AnimatedCheck />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h1 className="mt-6 text-3xl font-bold">Parcela regada</h1>
        <p className="mt-2 text-muted-foreground text-pretty">
          Registramos el riego de <strong className="text-foreground">{parcel.name}</strong>. La humedad subió a{' '}
          <strong className="text-foreground">{parcel.moisture}%</strong>.
        </p>
        <StatusBadge status={getStatus(parcel.moisture)} className="mt-4 px-4 py-1.5 text-sm" />
      </motion.div>
      <div className="mt-auto w-full">
        <AppButton onClick={() => reset('parcels', -1)}>
          <House aria-hidden />
          Volver al inicio
        </AppButton>
      </div>
    </div>
  )
}

const QUICK_PRESETS = [
  { label: '5 s', seconds: 5 },
  { label: '1 min', seconds: 60 },
  { label: '1 h', seconds: 3600 },
  { label: '1 día', seconds: 86400 },
  { label: '1 semana', seconds: 7 * 86400 },
  { label: '1 mes', seconds: FOLLOW_UP_MAX_SECONDS },
]

function bestUnitFor(seconds: number): { value: number; unit: FollowUpUnitId } {
  const unit = [...FOLLOW_UP_UNITS].reverse().find((u) => seconds >= u.seconds && seconds % u.seconds === 0)
  return unit ? { value: seconds / unit.seconds, unit: unit.id } : { value: seconds, unit: 'seconds' }
}

export function PostponeScreen() {
  const { selectedParcel: parcel, scheduleFollowUp, reset, back } = useAgro()
  const [rawValue, setRawValue] = useState('3')
  const [unitId, setUnitId] = useState<FollowUpUnitId>('hours')

  const unit = FOLLOW_UP_UNITS.find((u) => u.id === unitId) ?? FOLLOW_UP_UNITS[0]
  const value = Number(rawValue)
  const totalSeconds = Math.round(value * unit.seconds)
  const isNumber = rawValue.trim() !== '' && Number.isFinite(value)
  const error = !isNumber
    ? 'Ingresa un tiempo válido.'
    : totalSeconds < FOLLOW_UP_MIN_SECONDS
      ? 'El mínimo es 5 segundos.'
      : totalSeconds > FOLLOW_UP_MAX_SECONDS
        ? 'El máximo es 1 mes (30 días).'
        : null

  const applyPreset = (seconds: number) => {
    const next = bestUnitFor(seconds)
    setRawValue(String(next.value))
    setUnitId(next.unit)
  }

  const confirm = () => {
    if (error) return
    scheduleFollowUp(parcel.id, totalSeconds)
    reset('parcels', -1)
  }

  return (
    <div className="flex h-full flex-col items-center bg-card px-6 pt-14 pb-8 text-center">
      <h1 className="mt-2 text-2xl font-bold text-balance">Alerta de seguimiento activada</h1>
      <p className="mt-2 text-xs text-muted-foreground text-pretty">
        Te avisaremos para revisar <strong className="text-foreground">{parcel.name}</strong> en:
      </p>

      <div className="mt-6 w-full rounded-3xl border border-border bg-muted/35 p-4 text-left shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <label htmlFor="followup-value" className="text-sm font-bold text-foreground">¿Cuándo te avisamos?</label>
            <p className="mt-1 text-xs text-muted-foreground">Elige un tiempo entre 5 segundos y 1 mes</p>
          </div>
        </div>
        <div className="mx-auto mt-4 grid w-[92%] grid-cols-[minmax(0,0.68fr)_minmax(0,1fr)] gap-2">
          <div className="relative">
            <input
              id="followup-value"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={rawValue}
              onChange={(e) => setRawValue(e.target.value)}
              aria-invalid={error !== null}
              aria-describedby="followup-help"
              className={cn(
                'h-12 w-full rounded-2xl border-2 bg-card px-3 text-center text-xl font-bold tabular-nums outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/40',
                error ? 'border-danger' : 'border-input focus-visible:border-primary',
              )}
            />
          </div>
          <select
            aria-label="Unidad de tiempo"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value as FollowUpUnitId)}
            className="h-12 min-w-0 rounded-2xl border-2 border-input bg-card px-3 text-sm font-semibold outline-none transition-shadow focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {FOLLOW_UP_UNITS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
        <p id="followup-help" role={error ? 'alert' : undefined} className={cn('mt-3 flex min-h-5 items-center gap-1.5 text-xs', error ? 'font-semibold text-danger' : 'text-muted-foreground')}>
          {!error && <span className="size-1.5 shrink-0 rounded-full bg-success" aria-hidden />}
          {error ?? `Sonará en ${formatFollowUpDuration(totalSeconds)}`}
        </p>
        <div role="group" aria-label="Atajos de tiempo" className="mt-2 flex flex-wrap gap-2">
          {QUICK_PRESETS.map((preset) => {
            const active = !error && totalSeconds === preset.seconds
            return <motion.button key={preset.label} type="button" aria-pressed={active} whileTap={{ scale: 0.95 }} onClick={() => applyPreset(preset.seconds)} className={cn('rounded-full border px-3 py-1.5 text-xs font-bold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary')}>{preset.label}</motion.button>
          })}
        </div>
      </div>

      <div className="mt-5 flex w-full justify-center border-t border-border/60 pt-4">
        <button type="button" onClick={back} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
          Volver a la recomendación
        </button>
      </div>

      <div className="mt-6 flex w-full flex-col gap-3">
        <AppButton onClick={confirm} disabled={error !== null}>Programar recordatorio</AppButton>
        <AppButton variant="outline" onClick={confirm} disabled={error !== null}>
          <House aria-hidden />
          Volver al inicio
        </AppButton>
      </div>
    </div>
  )
}
