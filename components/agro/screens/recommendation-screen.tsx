'use client'

import { motion } from 'motion/react'
import { BellRing, CircleCheck, Droplet, Leaf, TriangleAlert } from 'lucide-react'
import { getStatus, type MoistureStatus } from '@/lib/agro-data'
import { cn } from '@/lib/utils'
import { useAgro } from '../app-store'
import { AppButton, Card, ScreenHeader } from '../ui'

const CONTENT: Record<
  MoistureStatus,
  { headline: string; box: string; icon: string; explain: (name: string, m: number) => string; tips: string[] }
> = {
  critico: {
    headline: 'Riego recomendado: SÍ',
    box: 'bg-danger/10 text-danger border-danger/30',
    icon: 'bg-danger/12 text-danger',
    explain: (n, m) => `El suelo de ${n} está en nivel crítico (${m}%). El cultivo puede sufrir estrés hídrico.`,
    tips: [
      'Riega pronto para recuperar la humedad del suelo.',
      'Evita regar en las horas de más calor (11:00 a 15:00).',
      'Revisa de nuevo la lectura 1 hora después del riego.',
    ],
  },
  riesgo: {
    headline: 'Riego recomendado: SÍ, en las próximas horas',
    box: 'bg-warning/10 text-warning border-warning/35',
    icon: 'bg-warning/12 text-warning',
    explain: (n, m) => `La humedad de ${n} está bajando (${m}%). Conviene regar antes de que llegue a nivel crítico.`,
    tips: [
      'Programa el riego para la tarde o temprano en la mañana.',
      'Evita las horas de más calor para no perder agua.',
      'Revisa la próxima lectura para confirmar la mejora.',
    ],
  },
  optimo: {
    headline: 'Riego recomendado: NO por ahora',
    box: 'bg-success/10 text-success border-success/30',
    icon: 'bg-success/12 text-success',
    explain: (n, m) => `El suelo de ${n} se encuentra en nivel óptimo de humedad (${m}%).`,
    tips: [
      'Mantén el monitoreo en las próximas horas.',
      'Evita el riego excesivo, ya que puede afectar el desarrollo del cultivo.',
      'Revisa la próxima lectura para confirmar el estado.',
    ],
  },
}

export function RecommendationScreen() {
  const { selectedParcel: parcel, back, canGoBack, push, markIrrigated } = useAgro()
  const status = getStatus(parcel.moisture)
  const content = CONTENT[status]
  const needsWater = status !== 'optimo'

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Recomendación de riego" onBack={canGoBack ? back : undefined} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 no-scrollbar">
        <Card className="text-center">
          <div className="flex items-center gap-3 text-left">
            <span className={cn('flex size-11 items-center justify-center rounded-xl', content.icon)}>
              {needsWater ? <TriangleAlert className="size-6" aria-hidden /> : <Droplet className="size-6 fill-current" aria-hidden />}
            </span>
            <div>
              <p className="font-semibold">Recomendación</p>
              <p className="text-xs text-muted-foreground">
                {parcel.name} · {parcel.crop} · {parcel.moisture}%
              </p>
            </div>
          </div>
          <motion.p
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
            className={cn('mt-4 rounded-xl border-2 px-3 py-4 text-xl leading-snug font-bold text-balance', content.box)}
          >
            {content.headline}
          </motion.p>
          <p className="mt-3 text-sm text-muted-foreground text-pretty">{content.explain(parcel.name, parcel.moisture)}</p>
        </Card>

        <Card className="mt-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <Leaf className="size-5 text-primary" aria-hidden />
            Consejos adicionales
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {content.tips.map((tip, i) => (
              <motion.li
                key={tip}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex gap-2.5 text-sm leading-relaxed"
              >
                <CircleCheck className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden />
                {tip}
              </motion.li>
            ))}
          </ul>
        </Card>

        <div className="mt-4 flex flex-col gap-3">
          <AppButton
            onClick={() => {
              markIrrigated(parcel.id)
              push('success')
            }}
          >
            <CircleCheck aria-hidden />
            Ya regué
          </AppButton>
          <AppButton variant="outline" onClick={() => push('postpone')}>
            <BellRing aria-hidden />
            Posponer riego
          </AppButton>
        </div>
      </div>
    </div>
  )
}
