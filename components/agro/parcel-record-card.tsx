'use client'

import { ChevronRight, Sprout } from 'lucide-react'
import type { Parcela } from '@/lib/parcelas-types'
import { Card } from './ui'

export function ParcelRecordCard({ parcela, onOpen }: { parcela: Parcela; onOpen?: () => void }) {
  const details = [
    ['Cultivo', parcela.cultivo],
    ['Tipo de sensor', parcela.tipo_sensor],
    ['Antigüedad', parcela.antiguedad],
    ['Instalación', parcela.fecha_instalacion],
  ] as const

  const content = (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sprout className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold">{parcela.nombre}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">ID: {parcela.id_parcela}</p>
        </div>
        <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
          {new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 }).format(parcela.hectareas)} ha
        </span>
        {onOpen && <ChevronRight className="mt-1.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-border pt-3">
        {details.map(([label, value]) => (
          <div className="min-w-0" key={label}>
            <dt className="text-[11px] text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 break-words text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )

  if (!onOpen) return content

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Ver detalle de ${parcela.nombre}`}
      className="block w-full rounded-2xl text-left outline-none transition-transform active:scale-[0.99] focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      {content}
    </button>
  )
}
