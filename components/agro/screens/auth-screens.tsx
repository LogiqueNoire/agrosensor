'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useAgro } from '../app-store'
import { AppButton, ScreenHeader } from '../ui'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Field = 'name' | 'email' | 'password'

function validate(values: Partial<Record<Field, string>>, fields: Field[]) {
  const errors: Partial<Record<Field, string>> = {}
  if (fields.includes('name') && !values.name?.trim()) errors.name = 'Ingresa tu nombre.'
  if (fields.includes('email')) {
    if (!values.email?.trim()) errors.email = 'Ingresa tu correo electrónico.'
    else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'El correo no tiene un formato válido (ej. nombre@correo.com).'
  }
  if (fields.includes('password')) {
    if (!values.password) errors.password = 'Ingresa una contraseña.'
    else if (values.password.length < 8) errors.password = 'La contraseña debe tener mínimo 8 caracteres.'
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
  const [values, setValues] = useState<Record<Field, string>>({ name: '', email: '', password: '' })
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
  const { setUser, reset, push } = useAgro()
  const form = useForm(['name', 'email', 'password'])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.submit()) return
    setUser({ name: form.values.name.trim(), email: form.values.email.trim() })
    reset('parcels')
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <AuthHero title="Crea tu cuenta" subtitle="Monitorea la humedad de tus parcelas y recibe recomendaciones de riego." />
      <form
        onSubmit={onSubmit}
        noValidate
        className="-mt-5 flex flex-1 flex-col gap-4 rounded-t-3xl bg-background px-6 pt-7 pb-6"
      >
        <TextField
          label="Nombre"
          icon={<User />}
          value={form.values.name}
          onChange={form.set('name')}
          onBlur={form.blur('name')}
          error={form.error('name')}
          autoComplete="given-name"
          placeholder="Ej. Roberto"
        />
        <TextField
          label="Correo electrónico"
          icon={<Mail />}
          type="email"
          value={form.values.email}
          onChange={form.set('email')}
          onBlur={form.blur('email')}
          error={form.error('email')}
          autoComplete="email"
          placeholder="nombre@correo.com"
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
          hint="Mínimo 8 caracteres."
        />
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <AppButton type="submit">Crear cuenta</AppButton>
          <AppButton variant="ghost" onClick={() => push('login')}>
            Ya tengo cuenta
          </AppButton>
          <p className="text-center text-xs text-muted-foreground text-pretty">
            Prototipo: tus datos no se envían a ningún servidor.
          </p>
        </div>
      </form>
    </div>
  )
}

export function LoginScreen() {
  const { user, setUser, reset, back } = useAgro()
  const form = useForm(['email', 'password'])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.submit()) return
    const email = form.values.email.trim()
    const fromEmail = email.split('@')[0].replace(/[._-]+/g, ' ')
    const name = user?.name || fromEmail.charAt(0).toUpperCase() + fromEmail.slice(1)
    setUser({ name, email })
    reset('parcels')
  }

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Iniciar sesión" onBack={back} />
      <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pt-6 pb-6 no-scrollbar">
        <div className="mb-2">
          <h2 className="text-2xl font-bold">Bienvenido de nuevo</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ingresa con tu correo para ver tus parcelas.</p>
        </div>
        <TextField
          label="Correo electrónico"
          icon={<Mail />}
          type="email"
          value={form.values.email}
          onChange={form.set('email')}
          onBlur={form.blur('email')}
          error={form.error('email')}
          autoComplete="email"
          placeholder="nombre@correo.com"
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
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <AppButton type="submit">Iniciar sesión</AppButton>
          <AppButton variant="ghost" onClick={back}>
            Crear una cuenta nueva
          </AppButton>
        </div>
      </form>
    </div>
  )
}
