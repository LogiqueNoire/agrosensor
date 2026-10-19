import { AgroApp } from '@/components/agro/agro-app'

const FLOW = [
  'Inicio',
  'Registro',
  'Mis Parcelas',
  'Simular alerta',
  'Detalle',
  'Historial',
  'Recomendación',
  'Resultado',
]

export default function Page() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,#dcebe2,#eef3f0_55%,#e6ece8)] sm:gap-16 sm:p-4">
      <aside className="hidden max-w-xs lg:block">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">Prototipo navegable</p>
        <h1 className="mt-2 text-4xl font-bold text-balance text-foreground">AgroSensor</h1>
        <p className="mt-3 text-muted-foreground text-pretty">
          Humedad del suelo con semáforo y recomendaciones de riego para pequeños y medianos agricultores de La Libertad,
          Perú. Datos simulados.
        </p>
        <h2 className="mt-8 text-sm font-semibold text-foreground">Flujo sugerido</h2>
        <ol className="mt-3 flex flex-col gap-2">
          {FLOW.map((step, i) => (
            <li key={step} className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-6 text-xs text-muted-foreground">Activa el sonido de tu equipo para escuchar la notificación.</p>
      </aside>
      <AgroApp />
    </div>
  )
}
