'use client'

import { motion } from 'motion/react'
import { BellRing, House } from 'lucide-react'
import { useState } from 'react'
import { getStatus } from '@/lib/agro-data'
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

const OPTIONS = [1, 3, 6]

export function PostponeScreen() {
  const { selectedParcel: parcel, scheduleFollowUp, reset, back } = useAgro()
  const [hours, setHours] = useState(3)

  const confirm = () => {
    scheduleFollowUp(parcel.id, hours)
    reset('parcels', -1)
  }

  return (
    <div className="flex h-full flex-col items-center bg-card px-6 pt-14 pb-8 text-center">
      <motion.span
        initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: [0, -12, 10, -6, 0] }}
        transition={{ duration: 0.7 }}
        className="flex size-24 items-center justify-center rounded-full bg-warning/12 text-warning"
      >
        <BellRing className="size-11" aria-hidden />
      </motion.span>
      <h1 className="mt-6 text-2xl font-bold text-balance">Alerta de seguimiento activada</h1>
      <p className="mt-2 text-muted-foreground text-pretty">
        Te avisaremos para revisar <strong className="text-foreground">{parcel.name}</strong> en:
      </p>

      <div role="radiogroup" aria-label="Tiempo para el recordatorio" className="mt-6 grid w-full grid-cols-3 gap-3">
        {OPTIONS.map((h) => {
          const active = h === hours
          return (
            <motion.button
              key={h}
              type="button"
              role="radio"
              aria-checked={active}
              whileTap={{ scale: 0.95 }}
              onClick={() => setHours(h)}
              className={cn(
                'flex h-20 flex-col items-center justify-center rounded-2xl border-2 font-bold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40',
                active ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card text-foreground hover:bg-muted',
              )}
            >
              <span className="text-2xl">{h} h</span>
              <span className={cn('text-xs font-medium', active ? 'opacity-85' : 'text-muted-foreground')}>
                {h === 1 ? '1 hora' : `${h} horas`}
              </span>
            </motion.button>
          )
        })}
      </div>

      <button type="button" onClick={back} className="mt-5 text-sm font-semibold text-primary underline-offset-4 hover:underline">
        Volver a la recomendación
      </button>

      <div className="mt-auto flex w-full flex-col gap-3">
        <AppButton onClick={confirm}>Listo</AppButton>
        <AppButton variant="outline" onClick={confirm}>
          <House aria-hidden />
          Volver al inicio
        </AppButton>
      </div>
    </div>
  )
}
