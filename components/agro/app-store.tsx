'use client'

import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import {
  INITIAL_ALERTS,
  INITIAL_PARCELS,
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

type AgroState = {
  screen: Screen
  canGoBack: boolean
  transition: Transition
  user: User | null
  parcels: Parcel[]
  selectedParcel: Parcel
  alerts: AlertItem[]
  unreadAlerts: number
  notificationKey: number | null
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
  scheduleFollowUp: (id: ParcelId, hours: number) => void
  triggerCriticalAlert: () => void
  dismissNotification: () => void
  openNotification: () => void
  markAlertsRead: () => void
  setSoundEnabled: (enabled: boolean) => void
  createParcel: (parcel: Omit<Parcel, 'id'>) => void
}

const AgroContext = createContext<AgroState | null>(null)

const IRRIGATED_MOISTURE = 45

export function AgroProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Screen[]>(['splash'])
  const [transition, setTransition] = useState<Transition>({ direction: 1, fade: true })
  const [user, setUserState] = useState<User | null>(null)
  const [parcels, setParcels] = useState<Parcel[]>(INITIAL_PARCELS)
  const [selectedId, setSelectedId] = useState<ParcelId>('norte')
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS)
  const [unreadAlerts, setUnreadAlerts] = useState(INITIAL_ALERTS.length)
  const [notificationKey, setNotificationKey] = useState<number | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const screen = stack[stack.length - 1]

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

  const markIrrigated = (id: ParcelId) =>
    updateParcel(id, (p) => ({
      ...p,
      moisture: IRRIGATED_MOISTURE,
      lastReadingMin: 0,
      followUpHours: undefined,
      history: [...p.history.slice(0, -1), IRRIGATED_MOISTURE],
      readings: [{ time: 'Ahora (tras riego)', value: IRRIGATED_MOISTURE }, ...p.readings].slice(0, 6),
    }))

  const scheduleFollowUp = (id: ParcelId, hours: number) =>
    updateParcel(id, (p) => ({ ...p, followUpHours: hours }))

  const triggerCriticalAlert = () => {
    if (soundEnabled) {
      if (!audioRef.current) audioRef.current = new Audio('/audio/notificacion.mp3')
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
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
    setNotificationKey(Date.now())
  }

  const openParcel = (id: ParcelId) => {
    setSelectedId(id)
    push('detail')
  }

  const openNotification = () => {
    setNotificationKey(null)
    setSelectedId('este')
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
    notificationKey,
    soundEnabled,
    push,
    back,
    reset,
    goToTab,
    setUser: setUserState,
    logout: () => {
      setUserState(null)
      setParcels(INITIAL_PARCELS)
      setNotificationKey(null)
      reset('register', -1)
    },
    openParcel,
    selectParcel: setSelectedId,
    markIrrigated,
    scheduleFollowUp,
    triggerCriticalAlert,
    dismissNotification: () => setNotificationKey(null),
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
