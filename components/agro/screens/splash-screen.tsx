'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { useAgro } from '../app-store'

export function SplashScreen() {
  const { reset } = useAgro()

  useEffect(() => {
    const timer = setTimeout(() => reset('register'), 2200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-full flex-col items-center justify-center bg-primary text-primary-foreground">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center"
      >
        <Image
          src="/agro-sensor-logo.png"
          alt="Agro Sensor"
          width={230}
          height={142}
          priority
          className="rounded-2xl object-contain"
        />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-3 text-sm"
      >
        Humedad del suelo en tiempo real
      </motion.p>
      <div className="mt-12 h-1 w-28 overflow-hidden rounded-full bg-white/20" aria-hidden>
        <motion.div
          className="h-full rounded-full bg-white"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
      </div>
      <span className="sr-only">Cargando AgroSensor</span>
    </div>
  )
}
