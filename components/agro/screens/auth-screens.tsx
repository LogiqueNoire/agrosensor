'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useAgro } from '../app-store'
import { AppButton, ScreenHeader } from '../ui'

type Field = 'usuario' | 'password' | 'confirmPassword'

function validate(values: Partial<Record<Field, string>>, fields: Field[]) {
  const errors: Partial<Record<Field, string>> = {}
  if (fields.includes('usuario')) {
    if (!values.usuario?.trim()) errors.usuario = 'Ingresa tu usuario.'
    else if (fields.includes('confirmPassword') && /\s/.test(values.usuario)) errors.usuario = 'El usuario no debe contener espacios.'
  }
  if (fields.includes('password')) {
    if (!values.password) errors.password = 'Ingresa una contraseña.'
    else if (fields.includes('confirmPassword') && values.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.'
  }
  if (fields.includes('confirmPassword')) {
    if (!values.confirmPassword) errors.confirmPassword = 'Confirma tu contraseña.'
    else if (values.confirmPassword !== values.password) errors.confirmPassword = 'Las contraseñas no coinciden.'
  }
  return errors
}

function TextField({
  label,
  icon,
  error,
  type = 'text',
  value,
  onChange,
  onBlur,
  autoComplete,
  placeholder,
  hint,
}: {
  label: string
  icon: ReactNode
  error?: string
  type?: 'text' | 'email' | 'password'
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  autoComplete?: string
  placeholder?: string
  hint?: string
}) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div
        className={cn(
          'flex h-13 items-center gap-2 rounded-xl border-2 bg-card px-3.5 transition-colors focus-within:border-primary',
          error ? 'border-danger' : 'border-input',
        )}
      >
        <span className="text-muted-foreground [&_svg]:size-5" aria-hidden>
          {icon}
        </span>
        <input
          id={id}
          type={isPassword && !visible ? 'password' : isPassword ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="-mr-1.5 flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key="error"
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm font-medium text-danger"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function useForm(fields: Field[]) {
  const [values, setValues] = useState<Record<Field, string>>({ usuario: '', password: '', confirmPassword: '' })
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const errors = validate(values, fields)
  const visibleError = (f: Field) => (submitted || touched[f] ? errors[f] : undefined)

  return {
    values,
    set: (f: Field) => (v: string) => setValues((s) => ({ ...s, [f]: v })),
    blur: (f: Field) => () => setTouched((t) => ({ ...t, [f]: true })),
    error: visibleError,
    submit: () => {
      setSubmitted(true)
      return Object.keys(errors).length === 0
    },
  }
}

function AuthHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="bg-primary px-6 pt-6 pb-10 text-primary-foreground">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-14 w-[84px] items-center justify-center overflow-hidden rounded-2xl bg-white">
          <Image
            src="/agro-sensor-icon.png"
            alt=""
            width={96}
            height={96}
            className="h-11 w-11 object-contain"
            priority
          />
        </span>
        <span className="text-2xl font-bold tracking-tight">AgroSensor</span>
      </div>
      <h1 className="mt-6 text-2xl font-bold text-balance">{title}</h1>
      <p className="mt-1 text-sm text-pretty opacity-85">{subtitle}</p>
    </div>
  )
}

export function RegisterScreen() {
  const { back, reset, setRegistrationMessage } = useAgro()
  const form = useForm(['usuario', 'password', 'confirmPassword'])
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.submit() || isSubmitting) return

    setServerError('')
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: form.values.usuario,
          password: form.values.password,
          confirmPassword: form.values.confirmPassword,
        }),
      })
      const result = (await response.json().catch(() => null)) as { success?: unknown; message?: unknown } | null

      if (response.status === 409) {
        setServerError('El usuario ya existe')
        return
      }
      if (!response.ok || response.status !== 201 || result?.success !== true) {
        setServerError('No se pudo completar el registro. Inténtalo más tarde.')
        return
      }

      setRegistrationMessage('Usuario registrado. Ya puedes iniciar sesión.')
      reset('login')
    } catch {
      setServerError('No se pudo completar el registro. Inténtalo más tarde.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <AuthHero title="Crea tu cuenta" subtitle="Regístrate para acceder a tus parcelas y sensores." />
      <form
        onSubmit={onSubmit}
        noValidate
        className="-mt-5 flex flex-1 flex-col gap-4 rounded-t-3xl bg-background px-6 pt-7 pb-6"
      >
        <TextField
          label="Usuario"
          icon={<User />}
          value={form.values.usuario}
          onChange={form.set('usuario')}
          onBlur={form.blur('usuario')}
          error={form.error('usuario')}
          autoComplete="username"
          placeholder="Elige un usuario sin espacios"
        />
        <TextField
          label="Contraseña"
          icon={<Lock />}
          type="password"
          value={form.values.password}
          onChange={form.set('password')}
          onBlur={form.blur('password')}
          error={form.error('password')}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          hint="Usa al menos 8 caracteres."
        />
        <TextField
          label="Confirmar contraseña"
          icon={<Lock />}
          type="password"
          value={form.values.confirmPassword}
          onChange={form.set('confirmPassword')}
          onBlur={form.blur('confirmPassword')}
          error={form.error('confirmPassword')}
          autoComplete="new-password"
          placeholder="Vuelve a escribir tu contraseña"
        />
        {serverError && <p role="alert" className="text-sm font-medium text-danger">{serverError}</p>}
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <AppButton type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </AppButton>
          <AppButton variant="ghost" onClick={back}>
            Ya tengo cuenta
          </AppButton>
        </div>
      </form>
    </div>
  )
}

export function LoginScreen() {
  const { setUser, reset, push, registrationMessage, setRegistrationMessage, setParcelMessage } = useAgro()
  const form = useForm(['usuario', 'password'])
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.submit() || isSubmitting) return

    setServerError('')
    setRegistrationMessage('')
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: form.values.usuario.trim(), password: form.values.password }),
      })
      const result = (await response.json().catch(() => null)) as { usuario?: unknown; message?: unknown } | null

      if (!response.ok) {
        setServerError(typeof result?.message === 'string' ? result.message : 'No se pudo iniciar sesión. Inténtalo de nuevo.')
        return
      }
      if (typeof result?.usuario !== 'string' || !result.usuario.trim()) {
        setServerError('El servicio de acceso devolvió una respuesta no válida.')
        return
      }

      try {
        const seedResponse = await fetch('/api/parcelas', { method: 'PUT' })
        const seedResult = (await seedResponse.json().catch(() => null)) as { success?: unknown; added?: unknown } | null
        if (seedResponse.status === 401) {
          setServerError('El inicio de sesión no pudo validarse. Inténtalo de nuevo.')
          return
        }
        if (seedResponse.ok && seedResult?.success === true && typeof seedResult.added === 'number' && seedResult.added > 0) {
          setParcelMessage(`Se agregaron ${seedResult.added} parcelas de inicio.`)
        } else if (!seedResponse.ok) {
          setParcelMessage('No se pudieron agregar las parcelas de inicio. Se volverá a intentar en tu próximo acceso.')
        }
      } catch {
        setParcelMessage('No se pudieron agregar las parcelas de inicio. Se volverá a intentar en tu próximo acceso.')
      }

      setUser({ name: result.usuario.trim() })
      reset('parcels')
    } catch {
      setServerError('No se pudo conectar con el servicio de acceso. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Iniciar sesión" />
      <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pt-6 pb-6 no-scrollbar">
        <div className="mb-2">
          <h2 className="text-2xl font-bold">Bienvenido de nuevo</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ingresa con tu usuario para ver tus parcelas.</p>
        </div>
        {registrationMessage && <p role="status" className="text-sm font-medium text-primary">{registrationMessage}</p>}
        <TextField
          label="Usuario"
          icon={<User />}
          value={form.values.usuario}
          onChange={form.set('usuario')}
          onBlur={form.blur('usuario')}
          error={form.error('usuario')}
          autoComplete="username"
          placeholder="Tu usuario"
        />
        <TextField
          label="Contraseña"
          icon={<Lock />}
          type="password"
          value={form.values.password}
          onChange={form.set('password')}
          onBlur={form.blur('password')}
          error={form.error('password')}
          autoComplete="current-password"
          placeholder="Tu contraseña"
        />
        {serverError && <p role="alert" className="text-sm font-medium text-danger">{serverError}</p>}
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <AppButton type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Validando acceso…' : 'Iniciar sesión'}
          </AppButton>
          <AppButton variant="ghost" onClick={() => { setRegistrationMessage(''); push('register') }}>
            Crear una cuenta
          </AppButton>
        </div>
      </form>
    </div>
  )
}
