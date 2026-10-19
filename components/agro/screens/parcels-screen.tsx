'use client'

import { motion } from 'motion/react'
import { BellRing, ChevronRight, Clock, Plus, Sprout, UserRound } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import { STATUS_META, formatCountdown, formatLastReading, getStatus, type Parcel } from '@/lib/agro-data'
import { cn } from '@/lib/utils'
import { useAgro } from '../app-store'
import { AppButton, Card, Logo, StatusBadge } from '../ui'

function FollowUpCountdown({ dueAt }: { dueAt: number }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-warning">
      <BellRing className="size-3.5" aria-hidden />
      Recordatorio en {formatCountdown(dueAt - now)}
    </span>
  )
}

function ParcelCard({ parcel, index, onOpen }: { parcel: Parcel; index: number; onOpen: () => void }) {
  const status = getStatus(parcel.moisture)
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.07, duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
      className="flex w-full items-stretch gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-[0_2px_10px_-4px_rgb(19_38_30/0.12)] outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      aria-label={`${parcel.name}, ${parcel.moisture}% de humedad, pH ${parcel.soilPh.toFixed(1)}, ${parcel.soilTemperature.toFixed(1)} grados de suelo y ${parcel.ambientTemperature.toFixed(1)} grados ambiente. Ver detalle`}
    >
      <div className="relative w-20 shrink-0 overflow-hidden rounded-xl">
        <Image src={parcel.image} alt="" fill sizes="80px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('size-2.5 shrink-0 rounded-full', STATUS_META[status].dot)} aria-hidden />
          <h3 className="truncate font-semibold">{parcel.name}</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {parcel.hectares.toFixed(1)} ha · {parcel.crop}
        </p>
        <div className="mt-1.5 flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl leading-none font-bold tabular-nums">{parcel.moisture}%</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Humedad del suelo</p>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 border-t border-border/70 pt-2 text-[11px]">
          <span className="rounded-lg bg-muted/60 px-2 py-1.5">
            <span className="block text-muted-foreground">pH suelo</span>
            <span className="font-semibold tabular-nums">{parcel.soilPh.toFixed(1)}</span>
          </span>
          <span className="rounded-lg bg-muted/60 px-2 py-1.5">
            <span className="block text-muted-foreground">Temp. suelo</span>
            <span className="font-semibold tabular-nums">{parcel.soilTemperature.toFixed(1)} °C</span>
          </span>
          <span className="rounded-lg bg-muted/60 px-2 py-1.5">
            <span className="block text-muted-foreground">Temp. ambiente</span>
            <span className="font-semibold tabular-nums">{parcel.ambientTemperature.toFixed(1)} °C</span>
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            Última lectura: {formatLastReading(parcel.lastReadingMin)}
          </span>
          {parcel.followUpAt !== undefined && <FollowUpCountdown dueAt={parcel.followUpAt} />}
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 self-center text-muted-foreground" aria-hidden />
    </motion.button>
  )
}

export function ParcelsScreen() {
  const { user, parcels, openParcel, goToTab, triggerCriticalAlert, push } = useAgro()
  const firstName = user?.name.split(' ')[0] ?? 'agricultor'


  return (
    <div className="relative flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between bg-primary px-4 text-primary-foreground">
        <Logo />
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => goToTab('settings')}
          className="flex size-10 items-center justify-center rounded-full bg-white/15 outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="Mi perfil y configuración"
        >
          <UserRound className="size-5" aria-hidden />
        </motion.button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-24 no-scrollbar">
        <h2 className="text-2xl font-bold text-balance">¡Hola, {firstName}!</h2>
        <p className="text-sm text-muted-foreground">Aquí tienes el estado de tus parcelas</p>

        <Card className="mt-4 flex items-center gap-3 p-3.5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
            <Sprout className="size-6" aria-hidden />
          </span>
          <div className="flex-1">
            <p className="font-semibold">{parcels.length} parcelas</p>
            <p className="text-xs text-muted-foreground">Monitoreadas en tiempo real</p>
          </div>
          <div className="flex items-center gap-1" aria-label="Resumen de estados">
            {parcels.map((p) => (
              <span key={p.id} className={cn('size-3 rounded-full', STATUS_META[getStatus(p.moisture)].dot)} />
            ))}
          </div>
        </Card>

        <ul className="mt-4 flex flex-col gap-3">
          {parcels.map((p, i) => (
            <li key={p.id}>
              <ParcelCard parcel={p} index={i} onOpen={() => openParcel(p.id)} />
            </li>
          ))}
        </ul>

        <AppButton className="mt-4" onClick={() => push('add-parcel-contact')}>
          <Plus aria-hidden />
          Agregar parcela
        </AppButton>
      </div>

      <motion.button
        type="button"
        onClick={triggerCriticalAlert}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        whileTap={{ scale: 0.94 }}
        className="absolute right-4 bottom-20 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background shadow-lg shadow-foreground/25 outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        <BellRing className="size-4 text-warning" aria-hidden />
        Simular alerta de humedad crítica
      </motion.button>
    </div>
  )
}
