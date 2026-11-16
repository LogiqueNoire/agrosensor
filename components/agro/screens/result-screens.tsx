'use client'

import { motion } from 'motion/react'
import { CalendarDays, House } from 'lucide-react'
import { useRef, useState } from 'react'
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

const CALENDAR_DAYS: Partial<Record<FollowUpUnitId, number>> = {
  days: 1,
  weeks: 7,
  months: 30,
}

function bestUnitFor(seconds: number): { value: number; unit: FollowUpUnitId } {
  const unit = [...FOLLOW_UP_UNITS].reverse().find((u) => seconds >= u.seconds && seconds % u.seconds === 0)
  return unit ? { value: seconds / unit.seconds, unit: unit.id } : { value: seconds, unit: 'seconds' }
}

function getScheduledDate(value: number, unitId: FollowUpUnitId, timeOfDay: string) {
  const calendarDays = CALENDAR_DAYS[unitId]
  if (calendarDays === undefined) {
    const unit = FOLLOW_UP_UNITS.find((item) => item.id === unitId) ?? FOLLOW_UP_UNITS[0]
    return new Date(Date.now() + value * unit.seconds * 1000)
  }

  const [hours, minutes] = timeOfDay.split(':').map(Number)
  const scheduledDate = new Date()
  scheduledDate.setDate(scheduledDate.getDate() + value * calendarDays)
  scheduledDate.setHours(hours, minutes, 0, 0)
  return scheduledDate
}

function formatScheduledDate(date: Date) {
  const dateLabel = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date).replace(',', '')
  const timeLabel = new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

  return `Va a sonar el ${dateLabel} a las ${timeLabel}`
}

export function PostponeScreen() {
  const { selectedParcel: parcel, scheduleFollowUp, reset, back } = useAgro()
  const [rawValue, setRawValue] = useState('3')
  const [unitId, setUnitId] = useState<FollowUpUnitId>('days')
  const [timeOfDay, setTimeOfDay] = useState('08:00')
  const calendarDialogRef = useRef<HTMLDialogElement>(null)
  const calendarRequestIdRef = useRef<string | null>(null)
  const [calendarStatus, setCalendarStatus] = useState<'idle' | 'saving' | 'authorization' | 'make-error' | 'success' | 'error'>('idle')
  const [calendarError, setCalendarError] = useState('')
  const [authorizationUrl, setAuthorizationUrl] = useState('')

  const unit = FOLLOW_UP_UNITS.find((u) => u.id === unitId) ?? FOLLOW_UP_UNITS[0]
  const value = Number(rawValue)
  const totalSeconds = Math.round(value * unit.seconds)
  const hasScheduledTime = CALENDAR_DAYS[unitId] !== undefined
  const isValidTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(timeOfDay)
  const isNumber = rawValue.trim() !== '' && Number.isInteger(value)
  const error = !isNumber
    ? 'Ingresa una cantidad entera válida.'
    : hasScheduledTime && !isValidTime
      ? 'Elige una hora válida.'
      : totalSeconds < FOLLOW_UP_MIN_SECONDS
        ? 'El mínimo es 5 segundos.'
        : totalSeconds > FOLLOW_UP_MAX_SECONDS
          ? 'El máximo es 1 mes (30 días).'
          : null
  const scheduledDate = error ? null : getScheduledDate(value, unitId, timeOfDay)

  const applyPreset = (seconds: number) => {
    const next = bestUnitFor(seconds)
    setRawValue(String(next.value))
    setUnitId(next.unit)
  }

  const openCalendarPrompt = () => {
    if (!scheduledDate || !calendarDialogRef.current || calendarDialogRef.current.open) return
    setCalendarStatus('idle')
    setCalendarError('')
    setAuthorizationUrl('')
    calendarRequestIdRef.current = null
    calendarDialogRef.current.showModal()
  }

  const finishScheduling = async (calendarEventRequested: boolean) => {
    if (!scheduledDate) return

    if (!calendarEventRequested) {
      calendarDialogRef.current?.close()
      scheduleFollowUp(parcel.id, scheduledDate.getTime(), false)
      reset('parcels', -1)
      return
    }

    setCalendarStatus('saving')
    setCalendarError('')
    if (!calendarRequestIdRef.current) calendarRequestIdRef.current = crypto.randomUUID()

    try {
      const response = await fetch('/api/calendar/make/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: calendarRequestIdRef.current,
          title: `Revisar ${parcel.name}`,
          description: `Recordatorio de seguimiento para ${parcel.name}.`,
          startDateTime: scheduledDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Lima',
        }),
      })
      const result = await response.json().catch(() => ({})) as {
        message?: unknown
        authorizationRequired?: unknown
        authorizationUrl?: unknown
        success?: unknown
        makeNotified?: unknown
      }

      if (result.authorizationRequired === true && typeof result.authorizationUrl === 'string') {
        setAuthorizationUrl(result.authorizationUrl)
        setCalendarStatus('authorization')
        return
      }

      if (!response.ok || result.success !== true) {
        setCalendarError(typeof result.message === 'string' ? result.message : 'No se pudo crear el evento en Google Calendar.')
        setCalendarStatus('error')
        return
      }

      scheduleFollowUp(parcel.id, scheduledDate.getTime(), true)
      setCalendarStatus(result.makeNotified === true ? 'success' : 'make-error')
    } catch {
      setCalendarError('No se pudo conectar con AgroSensor. Inténtalo de nuevo.')
      setCalendarStatus('error')
    }
  }

  const completeScheduling = () => {
    calendarDialogRef.current?.close()
    reset('parcels', -1)
  }

  return (
    <div className="flex h-full flex-col items-center bg-card px-6 pt-14 pb-8 text-center">
      <h1 className="mt-2 text-2xl font-bold text-balance">Alerta de seguimiento activada</h1>
      <p className="mt-2 text-xs text-muted-foreground text-pretty">
        Te avisaremos para revisar <strong className="text-foreground">{parcel.name}</strong> en:
      </p>

      <div className="mt-6 w-full rounded-3xl border border-border bg-muted/35 p-4 text-left shadow-sm">
        <div>
          <label htmlFor="followup-value" className="text-sm font-bold text-foreground">¿Cuándo te avisamos?</label>
          <p className="mt-1 text-xs text-muted-foreground">Elige un tiempo entre 5 segundos y 1 mes</p>
        </div>
        <div className="mx-auto mt-4 grid w-[92%] grid-cols-[minmax(0,0.68fr)_minmax(0,1fr)] gap-2">
          <input
            id="followup-value"
            type="number"
            inputMode="numeric"
            min={unitId === 'seconds' ? FOLLOW_UP_MIN_SECONDS : 1}
            max={Math.floor(FOLLOW_UP_MAX_SECONDS / unit.seconds)}
            step="1"
            value={rawValue}
            onChange={(e) => setRawValue(e.target.value)}
            aria-invalid={error !== null}
            aria-describedby="followup-help"
            className={cn(
              'h-12 w-full rounded-2xl border-2 bg-card px-3 text-center text-xl font-bold tabular-nums outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/40',
              error ? 'border-danger' : 'border-input focus-visible:border-primary',
            )}
          />
          <select
            aria-label="Unidad de tiempo"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value as FollowUpUnitId)}
            className="h-12 min-w-0 rounded-2xl border-2 border-input bg-card px-3 text-sm font-semibold outline-none transition-shadow focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {FOLLOW_UP_UNITS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>

        {hasScheduledTime && (
          <div className="mt-3">
            <label htmlFor="followup-time" className="text-sm font-bold text-foreground">Hora y minuto del aviso</label>
            <input
              id="followup-time"
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              aria-invalid={!isValidTime}
              aria-describedby="followup-time-help"
              className={cn(
                'mt-1 h-12 w-full rounded-2xl border-2 bg-card px-3 text-base font-semibold tabular-nums outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/40',
                isValidTime ? 'border-input focus-visible:border-primary' : 'border-danger',
              )}
            />
            <p id="followup-time-help" className="mt-1 text-xs text-muted-foreground">Usaremos la hora local de este dispositivo.</p>
          </div>
        )}

        <p id="followup-help" role={error ? 'alert' : 'status'} aria-live="polite" className={cn('mt-3 flex min-h-5 items-center gap-1.5 text-xs', error ? 'font-semibold text-danger' : 'text-muted-foreground')}>
          {!error && <span className="size-1.5 shrink-0 rounded-full bg-success" aria-hidden />}
          {error ?? (scheduledDate && hasScheduledTime ? formatScheduledDate(scheduledDate) : `Sonará en ${formatFollowUpDuration(totalSeconds)}`)}
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
        <AppButton onClick={openCalendarPrompt} disabled={error !== null}>Programar recordatorio</AppButton>
        <AppButton variant="outline" onClick={() => reset('parcels', -1)}>
          <House aria-hidden />
          Volver al inicio
        </AppButton>
      </div>

      <dialog
        ref={calendarDialogRef}
        aria-labelledby="calendar-prompt-title"
        aria-describedby="calendar-prompt-description"
        onClick={(event) => {
          if (event.target === event.currentTarget) calendarDialogRef.current?.close()
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-3xl border border-border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-foreground/50"
      >
        <div className="p-6 text-left">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarDays aria-hidden />
          </div>
          <h2 id="calendar-prompt-title" className="text-xl font-bold text-balance">
            ¿Quieres programar un evento en Google Calendar?
          </h2>
          <p id="calendar-prompt-description" className="mt-2 text-sm leading-relaxed text-muted-foreground">
            El evento se creará en tu propia cuenta de Google. AgroSensor enviará a Make los datos del evento, nunca tus credenciales.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {calendarStatus === 'saving' && (
              <p role="status" className="text-sm text-muted-foreground">Creando el evento en Google y notificando a Make…</p>
            )}
            {calendarStatus === 'authorization' && (
              <>
                <p role="status" className="text-sm text-muted-foreground">
                  Conecta tu cuenta de Google. Después vuelve aquí y continúa para crear el evento.
                </p>
                <a
                  href={authorizationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  Conectar cuenta de Google
                </a>
                <AppButton variant="outline" onClick={() => void finishScheduling(true)}>
                  Ya autoricé, continuar
                </AppButton>
              </>
            )}
            {calendarStatus === 'error' && (
              <>
                <p role="alert" className="text-sm text-danger">{calendarError}</p>
                <AppButton onClick={() => void finishScheduling(true)}>Reintentar</AppButton>
              </>
            )}
            {calendarStatus === 'make-error' && (
              <>
                <p role="status" className="text-sm text-muted-foreground">
                  El evento ya está en tu Google Calendar, pero Make no recibió la notificación.
                </p>
                <AppButton onClick={() => void finishScheduling(true)}>Reintentar notificación a Make</AppButton>
                <AppButton variant="outline" onClick={completeScheduling}>Listo</AppButton>
              </>
            )}
            {calendarStatus === 'success' && (
              <>
                <p role="status" className="text-sm font-semibold text-success">
                  Evento creado en tu Google Calendar y notificado a Make.
                </p>
                <AppButton onClick={completeScheduling}>Listo</AppButton>
              </>
            )}
            {(calendarStatus === 'idle' || calendarStatus === 'saving') && (
              <>
                <AppButton autoFocus onClick={() => void finishScheduling(true)} disabled={calendarStatus === 'saving'}>
                  Sí, conectar Google y agregar
                </AppButton>
                <AppButton variant="outline" onClick={() => void finishScheduling(false)} disabled={calendarStatus === 'saving'}>
                  No, solo el recordatorio
                </AppButton>
              </>
            )}
            {calendarStatus !== 'success' && calendarStatus !== 'make-error' && (
              <button
                type="button"
                onClick={() => calendarDialogRef.current?.close()}
                disabled={calendarStatus === 'saving'}
                className="min-h-11 rounded-xl px-4 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </dialog>
    </div>
  )
}
