'use client'

import { motion } from 'motion/react'
import { BellOff, Camera, ChevronRight, Headphones, LogOut, Mail, MessageCircle, Phone, TriangleAlert, Volume2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { STATUS_META } from '@/lib/agro-data'
import { cn } from '@/lib/utils'
import { useAgro } from '../app-store'
import { AppButton, Card, ScreenHeader } from '../ui'

export function AlertsScreen() {
  const { alerts, openParcel, markAlertsRead, triggerCriticalAlert } = useAgro()

  useEffect(() => {
    markAlertsRead()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts.length])

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Alertas" />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 no-scrollbar">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
            <BellOff className="size-10" aria-hidden />
            <p className="mt-3">No tienes alertas por ahora.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {alerts.map((a, i) => (
              <motion.li key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <button
                  type="button"
                  onClick={() => openParcel(a.parcelId)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-3.5 text-left shadow-[0_2px_10px_-4px_rgb(19_38_30/0.12)] outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', STATUS_META[a.status].badge)}>
                    <TriangleAlert className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{a.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{a.time}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{a.body}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 self-center text-muted-foreground" aria-hidden />
                </button>
              </motion.li>
            ))}
          </ul>
        )}
        <AppButton variant="outline" className="mt-5" onClick={triggerCriticalAlert}>
          Simular alerta de humedad crítica
        </AppButton>
      </div>
    </div>
  )
}

export function SettingsScreen() {
  const { user, soundEnabled, setSoundEnabled, setUser, logout } = useAgro()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const initials = (user?.name ?? 'A')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Configuración" />
      <div className="flex flex-1 flex-col overflow-y-auto px-4 pt-4 pb-6 no-scrollbar">
        <Card className="flex items-center gap-3">
          <div className="relative shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="Foto de perfil" className="size-14 rounded-full object-cover" />
            ) : (
              <span className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {initials}
              </span>
            )}
            <button
              type="button"
              aria-label="Cambiar foto de perfil"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <Camera className="size-3.5" aria-hidden />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file || !user) return
                if (file.size > 5 * 1024 * 1024) return
                const reader = new FileReader()
                reader.onload = () => setUser({ ...user, avatar: String(reader.result) })
                reader.readAsDataURL(file)
                event.target.value = ''
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{user?.name ?? 'Agricultor'}</p>
            <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
              <Mail className="size-3.5 shrink-0" aria-hidden />
              {user?.email ?? 'Sin correo'}
            </p>
          </div>
        </Card>

        <Card className="mt-3 flex items-center gap-3">
          <Volume2 className="size-5 text-primary" aria-hidden />
          <div className="flex-1">
            <p id="sound-label" className="font-semibold">Sonido de alertas</p>
            <p className="text-xs text-muted-foreground">Reproducir sonido al recibir una alerta</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={soundEnabled}
            aria-labelledby="sound-label"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              'relative h-8 w-14 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
              soundEnabled ? 'bg-primary' : 'bg-input',
            )}
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 600, damping: 35 }}
              className={cn('absolute top-1 size-6 rounded-full bg-white shadow', soundEnabled ? 'right-1' : 'left-1')}
            />
          </button>
        </Card>

        <Card className="mt-3 border-primary/15 bg-primary/[0.04]">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Headphones className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">Ayuda</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Comunícate con el equipo de AgroSensor.</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href="tel:+51987654321" className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-card px-2 text-center text-sm font-semibold text-primary outline-none hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/40">
              <Phone className="size-4" aria-hidden />
              Llamar
            </a>
            <a href="https://wa.me/51987654321" target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-2 text-center text-sm font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40">
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp
            </a>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">+51 989 308 766</p>
        </Card>

        <p className="mt-4 px-1 text-xs text-muted-foreground text-pretty">
          AgroSensor · Prototipo para agricultores de La Libertad, Perú. Los datos mostrados son simulados.
        </p>

        <AppButton variant="outline" className="mt-auto border-danger/70 text-danger hover:bg-danger/8" onClick={logout}>
          <LogOut aria-hidden />
          Cerrar sesión
        </AppButton>
      </div>
    </div>
  )
}
