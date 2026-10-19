'use client'

import Image from 'next/image'
import { motion, type HTMLMotionProps } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { STATUS_META, type MoistureStatus } from '@/lib/agro-data'

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost'

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/92',
  outline: 'border-2 border-primary/80 bg-card text-primary hover:bg-accent',
  danger: 'bg-danger text-white shadow-sm shadow-danger/20 hover:bg-danger/92',
  ghost: 'text-primary hover:bg-accent',
}

export function AppButton({
  variant = 'primary',
  className,
  children,
  ...props
}: HTMLMotionProps<'button'> & { variant?: ButtonVariant; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0',
        BUTTON_STYLES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string
  onBack?: () => void
  right?: ReactNode
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-1 bg-primary px-2 text-primary-foreground">
      {onBack ? (
        <motion.button
          type="button"
          onClick={onBack}
          whileTap={{ scale: 0.9 }}
          className="flex size-11 items-center justify-center rounded-full hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 outline-none"
          aria-label="Volver"
        >
          <ArrowLeft className="size-6" aria-hidden />
        </motion.button>
      ) : (
        <span className="w-2" />
      )}
      <h1 className="flex-1 truncate text-lg font-semibold text-balance">{title}</h1>
      {right}
    </header>
  )
}

export function StatusBadge({ status, className }: { status: MoistureStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold',
        meta.badge,
        className,
      )}
    >
      <span className={cn('size-2 rounded-full', meta.dot)} aria-hidden />
      {meta.label}
    </span>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="inline-flex h-10 w-[60px] items-center justify-center overflow-hidden rounded-xl bg-white">
        <Image
          src="/agro-sensor-icon.png"
          alt="AgroSensor"
          width={96}
          height={96}
          className="h-8 w-8 object-contain"
          priority
        />
      </span>
      <span className="text-base font-bold tracking-tight text-primary-foreground">AgroSensor</span>
    </span>
  )
}

export function Monogram({ className }: { className?: string }) {
  return (
    <span
      className={cn('font-black leading-none tracking-tighter', className)}
      style={{ letterSpacing: '-0.08em' }}
      aria-hidden
    >
      AS
    </span>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4 shadow-[0_2px_10px_-4px_rgb(19_38_30/0.12)]', className)}>
      {children}
    </div>
  )
}
