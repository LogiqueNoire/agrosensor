'use client'

import { motion } from 'motion/react'
import { useId } from 'react'

const WIDTH = 320
const PAD_LEFT = 30
const PAD_RIGHT = 10
const PAD_TOP = 10
const PAD_BOTTOM = 22
const Y_MAX = 60
const TICKS = [0, 20, 40, 60]

export function LineChart({
  values,
  labels,
  height = 140,
  label,
}: {
  values: number[]
  labels: string[]
  height?: number
  label: string
}) {
  const gradientId = useId()
  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT
  const plotH = height - PAD_TOP - PAD_BOTTOM
  const x = (i: number) => values.length === 1 ? PAD_LEFT + plotW / 2 : PAD_LEFT + (plotW * i) / (values.length - 1)
  const y = (v: number) => PAD_TOP + plotH * (1 - Math.min(v, Y_MAX) / Y_MAX)

  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ')
  const area = `${line} L${x(values.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
  const key = values.join('-')

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" role="img" aria-label={label}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x={PAD_LEFT} y={y(35)} width={plotW} height={y(20) - y(35)} fill="var(--warning)" opacity="0.07" />
      <rect x={PAD_LEFT} y={y(20)} width={plotW} height={y(0) - y(20)} fill="var(--danger)" opacity="0.06" />

      {TICKS.map((t) => (
        <g key={t}>
          <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray="3 4" />
          <text x={PAD_LEFT - 6} y={y(t) + 3.5} textAnchor="end" fontSize="9.5" fill="var(--muted-foreground)">
            {t}%
          </text>
        </g>
      ))}

      {labels.map((l, i) =>
        l ? (
          <text key={`${l}-${i}`} x={x(i)} y={height - 6} textAnchor="middle" fontSize="9.5" fill="var(--muted-foreground)">
            {l}
          </text>
        ) : null,
      )}

      <motion.path
        key={`area-${key}`}
        d={area}
        fill={`url(#${gradientId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      <motion.path
        key={`line-${key}`}
        d={line}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      {values.map((v, i) => (
        <motion.circle
          key={`${key}-${i}`}
          cx={x(i)}
          cy={y(v)}
          r={i === values.length - 1 ? 4.5 : 3}
          fill={i === values.length - 1 ? 'var(--primary)' : 'var(--card)'}
          stroke="var(--primary)"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15 + i * 0.08 }}
        />
      ))}
    </svg>
  )
}
