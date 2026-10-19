'use client'

import 'leaflet/dist/leaflet.css'

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'

import { getStatus, STATUS_META, type Parcel } from '@/lib/agro-data'
import { cn } from '@/lib/utils'

const DEFAULT_CENTER: [number, number] = [-8.109, -79.029]
const PARCEL_OFFSETS: [number, number][] = [
  [-0.0018, -0.0024],
  [0.0014, 0.0022],
  [0.0024, -0.0012],
  [-0.0008, 0.0032],
]

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])
  return null
}

function parcelIcon(status: keyof typeof STATUS_META) {
  const color = status === 'optimo' ? '#1f7a55' : status === 'riesgo' ? '#c58a20' : '#c9574f'
  return L.divIcon({
    className: 'agro-parcel-marker',
    html: `<span style="--marker-color:${color}"><span class="agro-parcel-marker__leaf">⌂</span></span>`,
    iconSize: [42, 48],
    iconAnchor: [21, 48],
    popupAnchor: [0, -42],
  })
}

function personIcon() {
  return L.divIcon({
    className: 'agro-person-marker',
    html: '<span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="3.2" fill="currentColor"/><path d="M5.5 20c.8-4.2 2.8-6.3 6.5-6.3s5.7 2.1 6.5 6.3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></span>',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -23],
  })
}

export function ParcelMap({ parcels, onOpenParcel }: { parcels: Parcel[]; onOpenParcel: (id: string) => void }) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationState, setLocationState] = useState<'loading' | 'ready' | 'fallback'>('loading')

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationState('fallback')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation([coords.latitude, coords.longitude])
        setLocationState('ready')
      },
      () => setLocationState('fallback'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 },
    )
  }, [])

  const center = userLocation ?? DEFAULT_CENTER
  const locations = useMemo(
    () => parcels.map((parcel, index) => ({
      parcel,
      position: [center[0] + (PARCEL_OFFSETS[index % PARCEL_OFFSETS.length][0] * (userLocation ? 0.55 : 1)), center[1] + (PARCEL_OFFSETS[index % PARCEL_OFFSETS.length][1] * (userLocation ? 0.55 : 1))] as [number, number],
    })),
    [center, parcels, userLocation],
  )

  return (
    <section className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-[0_2px_10px_-4px_rgb(19_38_30/0.14)]" aria-label="Mapa de parcelas">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <h3 className="font-semibold">Mapa de parcelas</h3>
          <p className="text-xs text-muted-foreground">{locationState === 'ready' ? 'Tu ubicación y parcelas cercanas' : 'Vista de referencia de tus parcelas'}</p>
        </div>
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', locationState === 'ready' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>
          <span className="size-1.5 rounded-full bg-current" aria-hidden />
          {locationState === 'ready' ? 'Ubicación activa' : 'Ubicación aproximada'}
        </span>
      </div>
      <div className="relative h-64">
        <MapContainer center={center} zoom={14} scrollWheelZoom className="z-0 h-full w-full">
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RecenterMap center={center} />
          {userLocation && <Marker position={userLocation} icon={personIcon()}><Popup>Estás aquí</Popup></Marker>}
          {locations.map(({ parcel, position }) => {
            const status = getStatus(parcel.moisture)
            return <Marker key={parcel.id} position={position} icon={parcelIcon(status)} eventHandlers={{ click: () => onOpenParcel(parcel.id) }}><Popup><strong>{parcel.name}</strong><br />{parcel.moisture}% de humedad<br /><button type="button" onClick={() => onOpenParcel(parcel.id)} className="mt-1 font-semibold text-primary">Ver parcela</button></Popup></Marker>
          })}
        </MapContainer>
      </div>
      <div className="flex items-center gap-4 px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" />Óptimo</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-warning" />Riesgo</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-danger" />Crítico</span>
      </div>
    </section>
  )
}
