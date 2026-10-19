'use client'

import { AnimatePresence, motion } from 'motion/react'
import { BatteryFull, Bell, ChartColumn, House, Settings, Signal, Wifi, X } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAgro, type Screen } from './app-store'
import { Monogram } from './ui'

export function StatusBar({ dark }: { dark: boolean }) {
  return (
    <div
      className={cn(
        'hidden h-11 shrink-0 items-center justify-between px-7 text-sm font-semibold transition-colors duration-300 sm:flex',
        dark ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground',
      )}
      aria-hidden
    >
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <Signal className="size-4" />
        <Wifi className="size-4" />
        <BatteryFull className="size-5" />
      </span>
    </div>
  )
}

const TABS: { id: Screen; label: string; icon: typeof House; matches: Screen[] }[] = [
  { id: 'parcels', label: 'Mis Parcelas', icon: House, matches: ['parcels', 'detail', 'recommendation'] },
  { id: 'history', label: 'Historial', icon: ChartColumn, matches: ['history'] },
  { id: 'alerts', label: 'Alertas', icon: Bell, matches: ['alerts'] },
  { id: 'settings', label: 'Configuración', icon: Settings, matches: ['settings'] },
]

export function BottomNav() {
  const { screen, goToTab, unreadAlerts } = useAgro()

  return (
    <nav aria-label="Navegación principal" className="shrink-0 border-t border-border bg-card pb-1 sm:pb-5">
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.matches.includes(screen)
          const Icon = tab.icon
          return (
            <li key={tab.id}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => goToTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold outline-none focus-visible:bg-muted',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {active && (
                  <motion.span layoutId="nav-indicator" className="absolute top-0 h-0.5 w-10 rounded-full bg-primary" />
                )}
                <span className="relative">
                  <Icon className={cn('size-6', active && 'fill-primary/15')} aria-hidden />
                  {tab.id === 'alerts' && unreadAlerts > 0 && (
                    <motion.span
                      key={unreadAlerts}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-2 flex size-4.5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white"
                    >
                      {unreadAlerts}
                      <span className="sr-only"> alertas sin leer</span>
                    </motion.span>
                  )}
                </span>
                {tab.label}
              </motion.button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function NotificationBanner() {
  const { notificationKey, dismissNotification, openNotification } = useAgro()

  useEffect(() => {
    if (notificationKey === null) return
    const t = setTimeout(dismissNotification, 7000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationKey])

  return (
    <div className="pointer-events-none absolute inset-x-0 top-2 z-50 px-2.5 sm:top-12" aria-live="assertive">
      <AnimatePresence>
        {notificationKey !== null && (
          <motion.div
            key={notificationKey}
            initial={{ y: -140, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -140, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="pointer-events-auto relative flex items-stretch overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-2xl shadow-black/25 backdrop-blur-xl"
          >
            <motion.button
              type="button"
              onClick={openNotification}
              whileTap={{ scale: 0.98 }}
              className="flex flex-1 items-start gap-3 p-3 pr-10 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Monogram className="text-base" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  AgroSensor
                  <span className="font-medium normal-case">ahora</span>
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-danger">Humedad crítica · 12%</span>
                <span className="block text-sm leading-snug text-foreground">
                  AgroSensor: Alerta de humedad crítica en Parcela Este
                </span>
                <span className="mt-1 block text-xs font-medium text-primary">Toca para ver el detalle</span>
              </span>
            </motion.button>
            <button
              type="button"
              onClick={dismissNotification}
              className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Cerrar notificación"
            >
              <X className="size-4" aria-hidden />
            </button>
            <motion.span
              className="absolute bottom-0 left-0 h-0.5 bg-danger/60"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 7, ease: 'linear' }}
              aria-hidden
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
