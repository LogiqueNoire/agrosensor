'use client'

import { AnimatePresence, motion, type Variants } from 'motion/react'
import type { ComponentType } from 'react'
import { AgroProvider, useAgro, type Screen, type Transition } from './app-store'
import { BottomNav, NotificationBanner, StatusBar } from './chrome'
import { LoginScreen, RegisterScreen } from './screens/auth-screens'
import { DetailScreen } from './screens/detail-screen'
import { ExpandedHistoryScreen, HistoryScreen } from './screens/history-screen'
import { ParcelsScreen } from './screens/parcels-screen'
import { RecommendationScreen } from './screens/recommendation-screen'
import { PostponeScreen, SuccessScreen } from './screens/result-screens'
import { SplashScreen } from './screens/splash-screen'
import { AlertsScreen, SettingsScreen } from './screens/tab-screens'
import { AddParcelContactScreen, AddParcelScreen } from './screens/add-parcel-screens'

const SCREENS: Record<Screen, ComponentType> = {
  splash: SplashScreen,
  register: RegisterScreen,
  login: LoginScreen,
  parcels: ParcelsScreen,
  detail: DetailScreen,
  history: HistoryScreen,
  'history-expanded': ExpandedHistoryScreen,
  recommendation: RecommendationScreen,
  success: SuccessScreen,
  postpone: PostponeScreen,
  alerts: AlertsScreen,
  settings: SettingsScreen,
  'add-parcel-contact': AddParcelContactScreen,
  'add-parcel': AddParcelScreen,
}

const NAV_SCREENS: Screen[] = ['parcels', 'detail', 'history', 'recommendation', 'alerts', 'settings']

const EASE = [0.32, 0.72, 0, 1] as const

const variants: Variants = {
  enter: ({ direction, fade }: Transition) =>
    fade
      ? { opacity: 0, x: 0, zIndex: 2 }
      : { x: direction > 0 ? '100%' : '-28%', opacity: direction > 0 ? 1 : 0.7, zIndex: direction > 0 ? 2 : 1 },
  center: { x: 0, opacity: 1, transition: { duration: 0.32, ease: EASE } },
  exit: ({ direction, fade }: Transition) =>
    fade
      ? { opacity: 0, zIndex: 1, transition: { duration: 0.25 } }
      : {
          x: direction > 0 ? '-28%' : '100%',
          opacity: direction > 0 ? 0.7 : 1,
          zIndex: direction > 0 ? 1 : 2,
          transition: { duration: 0.32, ease: EASE },
        },
}

function PhoneContent() {
  const { screen, transition } = useAgro()
  const Current = SCREENS[screen]
  const showNav = NAV_SCREENS.includes(screen)

  return (
    <>
      <StatusBar dark={screen === 'splash'} />
      <main className="relative flex-1 overflow-hidden bg-background">
        <AnimatePresence initial={false} custom={transition}>
          <motion.div
            key={screen}
            custom={transition}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 bg-background shadow-[-8px_0_24px_-12px_rgb(0_0_0/0.25)]"
          >
            <Current />
          </motion.div>
        </AnimatePresence>
      </main>
      <AnimatePresence initial={false}>
        {showNav && (
          <motion.div
            key="nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <BottomNav />
          </motion.div>
        )}
      </AnimatePresence>
      <NotificationBanner />
    </>
  )
}

export function AgroApp() {
  return (
    <AgroProvider>
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-background sm:h-[min(844px,calc(100dvh-2rem))] sm:w-[390px] sm:rounded-[3rem] sm:border-[10px] sm:border-neutral-900 sm:shadow-2xl sm:shadow-black/30 sm:ring-1 sm:ring-neutral-700">
        <span className="pointer-events-none absolute top-2 left-1/2 z-[60] hidden h-7 w-28 -translate-x-1/2 rounded-full bg-neutral-900 sm:block" aria-hidden />
        <PhoneContent />
        <span className="pointer-events-none absolute bottom-1.5 left-1/2 z-[60] hidden h-1 w-32 -translate-x-1/2 rounded-full bg-foreground/80 sm:block" aria-hidden />
      </div>
    </AgroProvider>
  )
}
