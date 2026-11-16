'use client'

import { motion } from 'motion/react'
import { LoaderCircle, Plus, RefreshCw, Sprout, UserRound } from 'lucide-react'
import useSWR from 'swr'
import { listarParcelas, PARCELAS_API_KEY } from '@/lib/parcelas-service'
import { useAgro } from '../app-store'
import { ParcelRecordCard } from '../parcel-record-card'
import { AppButton, Card, Logo } from '../ui'

export function ParcelsScreen() {
  const { user, goToTab, push, openRemoteParcel } = useAgro()
  const { data: parcelas, error, isLoading, isValidating, mutate } = useSWR(PARCELAS_API_KEY, listarParcelas, {
    dedupingInterval: 0,
  })
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
        <p className="text-sm text-muted-foreground">Estas son las parcelas registradas en tu cuenta.</p>

        <Card className="mt-4 flex items-center gap-3 p-3.5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
            <Sprout className="size-6" aria-hidden />
          </span>
          <div className="flex-1">
            <p className="font-semibold">
              {error ? 'No disponibles' : isLoading ? 'Cargando…' : `${parcelas?.length ?? 0} parcelas`}
            </p>
            <p className="text-xs text-muted-foreground">Sincronizadas desde AgroSensor</p>
          </div>
          <button
            type="button"
            onClick={() => { void mutate() }}
            disabled={isValidating}
            aria-label={isValidating ? 'Actualizando parcelas' : 'Actualizar parcelas'}
            aria-busy={isValidating}
            className="flex size-10 items-center justify-center rounded-full text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${isValidating ? 'animate-spin' : ''}`} aria-hidden />
          </button>
        </Card>

        {isLoading && (
          <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
            Cargando parcelas…
          </div>
        )}

        {error && (
          <Card className="mt-4 border-danger/25 bg-danger/5 text-center">
            <p role="alert" className="text-sm text-danger">{error instanceof Error ? error.message : 'No se pudieron cargar tus parcelas.'}</p>
            <AppButton className="mt-4" variant="outline" onClick={() => mutate()}>Reintentar</AppButton>
          </Card>
        )}

        {!isLoading && !error && parcelas?.length === 0 && (
          <Card className="mt-4 py-8 text-center">
            <Sprout className="mx-auto size-8 text-primary" aria-hidden />
            <p className="mt-3 font-semibold">Aún no tienes parcelas</p>
            <p className="mt-1 text-sm text-muted-foreground">Agrega una para empezar a gestionarla.</p>
          </Card>
        )}

        {!isLoading && !error && Boolean(parcelas?.length) && (
          <ul className="mt-4 flex flex-col gap-3">
            {parcelas?.map((parcela) => (
              <li key={parcela.id_parcela}><ParcelRecordCard parcela={parcela} onOpen={() => openRemoteParcel(parcela)} /></li>
            ))}
          </ul>
        )}

        <AppButton className="mt-4" onClick={() => push('add-parcel-contact')}>
          <Plus aria-hidden />Gestionar parcelas
        </AppButton>
      </div>
    </div>
  )
}
