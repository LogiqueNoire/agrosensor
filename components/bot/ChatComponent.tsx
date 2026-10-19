'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Message = { role: 'user' | 'assistant'; text: string }

const welcome: Message = {
  role: 'assistant',
  text: 'Hola, soy el asistente de AgroSensor. Puedo ayudarte a entender las funciones de AgroSensor, como parcelas, alertas, historial y recomendaciones. No sustituyo a un asesor agronómico.',
}

export default function ChatComponent({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([welcome])
  const [loading, setLoading] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const nextMessages = [...messages, { role: 'user' as const, text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({ role: message.role, content: message.text })),
        }),
      })
      if (!response.ok || !response.body) throw new Error('No se pudo conectar con el asistente.')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let answer = ''
      setMessages((current) => [...current, { role: 'assistant', text: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        answer += decoder.decode(value, { stream: true })
        const currentAnswer = answer
        setMessages((current) => current.map((message, index) => index === current.length - 1 ? { ...message, text: currentAnswer } : message))
      }

      answer += decoder.decode()
      if (!answer.trim()) throw new Error('No se pudo conectar con el asistente.')
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', text: error instanceof Error ? error.message : 'No se pudo responder.' }])
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="absolute inset-x-3 bottom-20 z-[70] flex justify-end sm:inset-x-4">
      <section className="flex h-[min(430px,calc(100dvh-12rem))] max-h-[calc(100%-4.5rem)] w-[min(360px,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/15" aria-label="Chat de ayuda de AgroSensor">
          <header className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/15"><Bot className="size-5" aria-hidden /></span>
              <div><p className="font-semibold">Asistente</p><p className="text-xs text-primary-foreground/75">Ayuda sobre AgroSensor</p></div>
            </div>
            <Button type="button" variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" onClick={() => onOpenChange(false)} aria-label="Cerrar chat"><X className="size-4" /></Button>
          </header>
          <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><p className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.role === 'user' ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted text-foreground'}`}>{message.text || (loading ? <Loader2 className="size-4 animate-spin" aria-label="El asistente está respondiendo" /> : null)}</p></div>)}
          </div>
          <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
            <label htmlFor="assistant-message" className="sr-only">Escribe tu pregunta</label>
            <input id="assistant-message" value={input} onChange={(event) => setInput(event.target.value)} placeholder="¿Cómo veo mis alertas?" className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" disabled={loading} />
            <Button type="submit" size="icon" aria-label="Enviar pregunta" disabled={loading || !input.trim()}><Send className="size-4" /></Button>
          </form>
        </section>
    </div>
  )
}
