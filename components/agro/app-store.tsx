'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  INITIAL_ALERTS,
  INITIAL_PARCELS,
  getStatus,
  type AlertItem,
  type Parcel,
  type ParcelId,
} from '@/lib/agro-data'

export type Screen =
  | 'splash'
  | 'register'
  | 'login'
  | 'parcels'
  | 'detail'
  | 'history'
  | 'history-expanded'
  | 'recommendation'
  | 'success'
  | 'postpone'
  | 'alerts'
  | 'settings'
  | 'add-parcel-contact'
  | 'add-parcel'

const FADE_SCREENS: Screen[] = ['splash', 'success', 'postpone']

export const TAB_ORDER: Screen[] = ['parcels', 'history', 'alerts', 'settings']

export type Transition = { direction: 1 | -1; fade: boolean }

type User = { name: string; email: string }

export type NotificationInfo = {
  key: number
  parcelId: ParcelId
  kind: 'critical' | 'reminder'
  headline: string
  body: string
}

type AgroState = {
  screen: Screen
  canGoBack: boolean
  transition: Transition
  user: User | null
  parcels: Parcel[]
  selectedParcel: Parcel
  alerts: AlertItem[]
  unreadAlerts: number
  notification: NotificationInfo | null
  soundEnabled: boolean
  push: (screen: Screen) => void
  back: () => void
  reset: (screen: Screen, direction?: 1 | -1) => void
  goToTab: (tab: Screen) => void
  setUser: (user: User) => void
  logout: () => void
  openParcel: (id: ParcelId) => void
  selectParcel: (id: ParcelId) => void
  markIrrigated: (id: ParcelId) => void
  scheduleFollowUp: (id: ParcelId, seconds: number) => void
  triggerCriticalAlert: () => void
  dismissNotification: () => void
  openNotification: () => void
  markAlertsRead: () => void
  setSoundEnabled: (enabled: boolean) => void
  createParcel: (parcel: Omit<Parcel, 'id'>) => void
}

const AgroContext = createContext<AgroState | null>(null)

const IRRIGATION_INCREASES = [3, 5, 10]

function getIrrigationMoisture(currentMoisture: number) {
  const increase = IRRIGATION_INCREASES[Math.floor(Math.random() * IRRIGATION_INCREASES.length)]
  return Math.min(100, currentMoisture + increase)
}

export function AgroProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Screen[]>(['splash'])
  const [transition, setTransition] = useState<Transition>({ direction: 1, fade: true })
  const [user, setUserState] = useState<User | null>(null)
  const [parcels, setParcels] = useState<Parcel[]>(INITIAL_PARCELS)
  const [selectedId, setSelectedId] = useState<ParcelId>('norte')
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS)
  const [unreadAlerts, setUnreadAlerts] = useState(INITIAL_ALERTS.length)
  const [notification, setNotification] = useState<NotificationInfo | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const latest = useRef({ parcels, soundEnabled })
  latest.current = { parcels, soundEnabled }

  const screen = stack[stack.length - 1]

  const playNotificationSound = () => {
    if (!latest.current.soundEnabled) return
    if (!audioRef.current) {
      audioRef.current = new Audio('/audio/notificacion.mp3?v=lluvia-torrencial-1')
      audioRef.current.loop = true
    }
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now()
      const due = latest.current.parcels.filter((p) => p.followUpAt !== undefined && p.followUpAt <= now)
      if (due.length === 0) return

      const dueIds = new Set(due.map((p) => p.id))
      setParcels((list) => list.map((p) => (dueIds.has(p.id) ? { ...p, followUpAt: undefined } : p)))
      setAlerts((list) => [
        ...due.map((p) => ({
          id: `recordatorio-${p.id}-${now}`,
          parcelId: p.id,
          title: 'Recordatorio de seguimiento',
          body: `Es momento de revisar ${p.name}. Humedad actual: ${p.moisture}%.`,
          time: 'Ahora',
          status: getStatus(p.moisture),
        })),
        ...list,
      ])
      setUnreadAlerts((n) => n + due.length)
      const first = due[0]
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('AgroSensor · Recordatorio de riego', {
          body: due.length > 1 ? `Es momento de revisar ${due.length} parcelas.` : `Es momento de revisar ${first.name}.`,
          icon: '/agro-sensor-icon.png',
          tag: 'agrosensor-riego',
        })
      }
      setNotification({
        key: now,
        parcelId: first.id,
        kind: 'reminder',
        headline: 'Recordatorio de seguimiento',
        body:
          due.length > 1
            ? `AgroSensor: es momento de revisar ${due.length} parcelas`
            : `AgroSensor: es momento de revisar ${first.name} · humedad ${first.moisture}%`,
      })
      playNotificationSound()
    }, 1000)

    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setParcels((list) =>
        list.map((parcel) => ({
          ...parcel,
          soilPh: Number((Math.max(4.5, Math.min(8.5, parcel.soilPh + (Math.random() > 0.5 ? 0.1 : -0.1)))).toFixed(1)),
          soilTemperature: Number((Math.max(5, Math.min(40, parcel.soilTemperature + (Math.random() > 0.5 ? 0.1 : -0.1)))).toFixed(1)),
          ambientTemperature: Number((Math.max(5, Math.min(45, parcel.ambientTemperature + (Math.random() > 0.5 ? 0.1 : -0.1)))).toFixed(1)),
          lastReadingMin: 1,
        })),
      )
    }, 60000)

    return () => window.clearInterval(interval)
  }, [])

  const transitionTo = (next: Screen, direction: 1 | -1) => {
    setTransition({
      direction,
      fade: FADE_SCREENS.includes(next) || FADE_SCREENS.includes(screen),
    })
  }

  const push = (next: Screen) => {
    transitionTo(next, 1)
    setStack((s) => [...s, next])
  }

  const back = () => {
    if (stack.length < 2) return
    transitionTo(stack[stack.length - 2], -1)
    setStack((s) => s.slice(0, -1))
  }

  const reset = (next: Screen, direction: 1 | -1 = 1) => {
    transitionTo(next, direction)
    setStack([next])
  }

  const goToTab = (tab: Screen) => {
    if (tab === screen && stack.length === 1) return
    const from = TAB_ORDER.indexOf(stack[0])
    const to = TAB_ORDER.indexOf(tab)
    reset(tab, to >= from ? 1 : -1)
  }

  const updateParcel = (id: ParcelId, update: (p: Parcel) => Parcel) =>
    setParcels((list) => list.map((p) => (p.id === id ? update(p) : p)))

  const markIrrigated = (id: ParcelId) => {
    updateParcel(id, (p) => {
      const moisture = getIrrigationMoisture(p.moisture)
      return {
        ...p,
        moisture,
        lastReadingMin: 0,
        followUpAt: undefined,
        history: [...p.history.slice(0, -1), moisture],
        readings: [{ time: 'Ahora (tras riego)', value: moisture }, ...p.readings].slice(0, 6),
      }
    })
  }

  const scheduleFollowUp = (id: ParcelId, seconds: number) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
    updateParcel(id, (p) => ({ ...p, followUpAt: Date.now() + seconds * 1000 }))
  }

  const triggerCriticalAlert = () => {
    playNotificationSound()
    const base = INITIAL_PARCELS.find((p) => p.id === 'este')!
    updateParcel('este', () => ({ ...base }))
    setAlerts((list) => [
      {
        id: `critico-${Date.now()}`,
        parcelId: 'este',
        title: 'Alerta de humedad crítica',
        body: 'Parcela Este bajó a 12%. Se recomienda regar pronto.',
        time: 'Ahora',
        status: 'critico',
      },
      ...list,
    ])
    setUnreadAlerts((n) => n + 1)
    setNotification({
      key: Date.now(),
      parcelId: 'este',
      kind: 'critical',
      headline: 'Humedad crítica · 12%',
      body: 'AgroSensor: Alerta de humedad crítica en Parcela Este',
    })
  }

  const openParcel = (id: ParcelId) => {
    setSelectedId(id)
    push('detail')
  }

  const openNotification = () => {
    if (notification) setSelectedId(notification.parcelId)
    setNotification(null)
    setTransition({ direction: 1, fade: false })
    setStack(['parcels', 'detail'])
  }

  const createParcel = (parcel: Omit<Parcel, 'id'>) => {
    const id = `parcela-${Date.now()}`
    setParcels((list) => [...list, { ...parcel, id }])
    setSelectedId(id)
    reset('parcels')
  }

  const value: AgroState = {
    screen,
    canGoBack: stack.length > 1,
    transition,
    user,
    parcels,
    selectedParcel: parcels.find((p) => p.id === selectedId)!,
    alerts,
    unreadAlerts,
    notification,
    soundEnabled,
    push,
    back,
    reset,
    goToTab,
    setUser: setUserState,
    logout: () => {
      setUserState(null)
      setParcels(INITIAL_PARCELS)
      setNotification(null)
      reset('register', -1)
    },
    openParcel,
    selectParcel: setSelectedId,
    markIrrigated,
    scheduleFollowUp,
    triggerCriticalAlert,
    dismissNotification: () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setNotification(null)
    },
    openNotification,
    markAlertsRead: () => setUnreadAlerts(0),
    setSoundEnabled,
    createParcel,
  }

  return <AgroContext.Provider value={value}>{children}</AgroContext.Provider>
}

export function useAgro() {
  const ctx = useContext(AgroContext)
  if (!ctx) throw new Error('useAgro must be used within AgroProvider')
  return ctx
}
