'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import { ChevronRight, ImagePlus, MapPin, Phone, Ruler, Sprout, UserRound } from 'lucide-react'
import { CROP_PROFILES, getInstallationDate, getStatus, type Parcel } from '@/lib/agro-data'
import { useAgro } from '../app-store'
import { AppButton, Card, ScreenHeader, StatusBadge } from '../ui'

const COMPANY_PHONE = '+51 989 308 766'

export function AddParcelContactScreen() {
  const { push, back } = useAgro()
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Agregar parcela" onBack={back} />
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 no-scrollbar">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserRound className="size-8" aria-hidden /></div>
        <h2 className="mt-4 text-center text-2xl font-bold">Comencemos con un asesor</h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">Nuestro equipo te ayuda a instalar el sensor, ubicar tu parcela y dejar todo listo para monitorear la humedad.</p>
        <Card className="mt-5 border-primary/15 bg-primary/[0.04]">
          <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Phone className="size-5" aria-hidden /></span><div><p className="font-semibold">Asesor AgroSensor</p><p className="text-sm text-muted-foreground">{COMPANY_PHONE}</p></div></div>
          <a href="tel:+51989308766" className="mt-4 flex h-12 items-center justify-center rounded-xl border border-primary/25 bg-card text-sm font-semibold text-primary">Contactar asesor</a>
        </Card>
        <div className="mt-auto pt-6"><AppButton onClick={() => push('add-parcel')}><Sprout aria-hidden />Simulación: agregar parcela</AppButton><p className="mt-2 text-center text-xs text-muted-foreground">Puedes probar todo el proceso sin contactar todavía.</p></div>
      </div>
    </div>
  )
}

export function AddParcelScreen() {
  const { back, createParcel } = useAgro()
  const [name, setName] = useState('')
  const [size, setSize] = useState('')
  const [unit, setUnit] = useState<'ha' | 'm2'>('ha')
  const [crop, setCrop] = useState(CROP_PROFILES[0].label)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [image, setImage] = useState('/parcelas/norte.png')
  const [error, setError] = useState('')
  const selectedCrop = useMemo(() => CROP_PROFILES.find((item) => item.label === crop) ?? CROP_PROFILES[0], [crop])

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setImage(URL.createObjectURL(file))
  }

  const submit = () => {
    const numericSize = Number(size)
    if (!name.trim() || !numericSize || numericSize <= 0 || !latitude.trim() || !longitude.trim()) {
      setError('Completa el nombre, tamaño y coordenadas de la parcela.')
      return
    }
    const hectares = unit === 'ha' ? numericSize : numericSize / 10000
    const moisture = Math.round((selectedCrop.minMoisture + selectedCrop.maxMoisture) / 2)
    const newParcel: Omit<Parcel, 'id'> = {
      name: name.trim().startsWith('Parcela') ? name.trim() : `Parcela ${name.trim()}`,
      hectares, crop, installationAge: 'Instalación pendiente', installationDate: getInstallationDate(0), installationMonthsAgo: 0, moisture,
      soilPh: 6.2, soilTemperature: 19.0, ambientTemperature: 25.0,
      lastReadingMin: 0, image, history: [moisture, moisture, moisture, moisture, moisture, moisture, moisture],
      readings: [{ time: 'Ahora', value: moisture }],
    }
    createParcel(newParcel)
  }

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Nueva parcela" onBack={back} />
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-6 no-scrollbar">
        <p className="text-sm text-muted-foreground">Configura los datos de tu terreno para recibir recomendaciones precisas.</p>
        <label className="mt-4 block text-sm font-semibold">Nombre de la parcela<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Noroeste" className="mt-1.5 h-12 w-full rounded-xl border border-border bg-card px-3 outline-none focus:border-primary focus:ring-3 focus:ring-ring/20" /></label>
        <div className="mt-3 grid grid-cols-[1fr_112px] gap-2"><label className="text-sm font-semibold">Tamaño<input type="number" min="0" value={size} onChange={(e) => setSize(e.target.value)} placeholder="1.5" className="mt-1.5 h-12 w-full rounded-xl border border-border bg-card px-3 outline-none focus:border-primary" /></label><label className="text-sm font-semibold">Medida<select value={unit} onChange={(e) => setUnit(e.target.value as 'ha' | 'm2')} className="mt-1.5 h-12 w-full rounded-xl border border-border bg-card px-2 outline-none focus:border-primary"><option value="ha">Hectáreas</option><option value="m2">m²</option></select></label></div>
        <label className="mt-3 block text-sm font-semibold" htmlFor="parcel-crop">
          Cultivo o producto
          <input
            id="parcel-crop"
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            placeholder="Escribe el cultivo o producto"
            className="mt-1.5 h-12 w-full rounded-xl border border-border bg-card px-3 outline-none focus:border-primary focus:ring-3 focus:ring-ring/20"
          />
        </label>
        <Card className="mt-3 border-success/25 bg-success/5 p-3"><div className="flex items-center gap-2 text-sm font-semibold"><Ruler className="size-4 text-success" aria-hidden />Humedad recomendada para {crop || 'tu cultivo'}</div><p className="mt-1 text-sm text-muted-foreground">{CROP_PROFILES.some((item) => item.label.toLowerCase() === crop.trim().toLowerCase()) ? `Entre ${selectedCrop.minMoisture}% y ${selectedCrop.maxMoisture}%` : 'Usaremos un rango general y podrás ajustarlo después.'}</p></Card>
        <div className="mt-3 grid grid-cols-2 gap-2"><label className="text-sm font-semibold">Latitud<input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="-8.109" className="mt-1.5 h-12 w-full rounded-xl border border-border bg-card px-3 outline-none focus:border-primary" /></label><label className="text-sm font-semibold">Longitud<input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="-79.021" className="mt-1.5 h-12 w-full rounded-xl border border-border bg-card px-3 outline-none focus:border-primary" /></label></div>
        <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/35 bg-primary/[0.03] p-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ImagePlus className="size-5" aria-hidden /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Imagen de referencia</span><span className="block truncate text-xs text-muted-foreground">Opcional · toca para cargar una foto</span></span><input type="file" accept="image/*" onChange={handleImage} className="sr-only" /></label>
        {image.startsWith('blob:') && <img src={image} alt="Vista previa de la parcela" className="mt-2 h-24 w-full rounded-xl object-cover" />}
        {error && <p role="alert" className="mt-3 text-sm font-medium text-danger">{error}</p>}
        <AppButton className="mt-4" onClick={submit}><MapPin aria-hidden />Crear parcela</AppButton>
      </div>
    </div>
  )
}
