'use client'

import { animate, motion } from 'motion/react'
import { Droplet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { STATUS_META, getStatus } from '@/lib/agro-data'
import { cn } from '@/lib/utils'

const RADIUS = 72
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const ARC = CIRCUMFERENCE * 0.75
const GAUGE_MAX = 60

export function MoistureGauge({ value }: { value: number }) {
  const status = getStatus(value)
  const meta = STATUS_META[status]
  const [display, setDisplay] = useState(0)
  const progress = Math.min(value / GAUGE_MAX, 1)

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value])

  return (
    <div
      className="relative mx-auto size-48"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={`Humedad del suelo ${value}%, estado ${meta.label}`}
    >
      <svg viewBox="0 0 180 180" className="size-full" aria-hidden>
        <g transform="rotate(135 90 90)">
          <circle
            cx="90"
            cy="90"
            r={RADIUS}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
          />
          <motion.circle
            cx="90"
            cy="90"
            r={RADIUS}
            fill="none"
            stroke={meta.stroke}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
            initial={{ strokeDashoffset: ARC }}
            animate={{ strokeDashoffset: ARC * (1 - progress) }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pb-2">
        <Droplet className={cn('mb-1 size-6 fill-current', meta.text)} aria-hidden />
        <span className="text-5xl font-bold tabular-nums tracking-tight">{display}%</span>
        <span className="mt-1 text-xs font-medium text-muted-foreground">Humedad del suelo</span>
      </div>
    </div>
  )
}
