import { google } from '@ai-sdk/google'
import { streamText, type ModelMessage } from 'ai'

export const runtime = 'edge'

const SYSTEM_PROMPT = `Eres el asistente virtual de AgroSensor. Respondes únicamente preguntas genéricas sobre cómo usar la app: parcelas, sensores, alertas, historial, recomendaciones y configuración. Sé breve, claro y amable. No sustituyes a un asesor agronómico externo: para diagnósticos, decisiones de cultivo o emergencias, indica que deben consultar a un profesional. Si preguntan algo fuera de AgroSensor, explica que solo puedes ayudar con la aplicación.`

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages?: Array<{ role?: string; content?: unknown }> }
    const messages: ModelMessage[] = (Array.isArray(body.messages) ? body.messages : [])
      .filter((message): message is { role: 'user' | 'assistant' | 'system'; content: string } =>
        (message.role === 'user' || message.role === 'assistant' || message.role === 'system') && typeof message.content === 'string' && message.content.trim().length > 0,
      )
      .map(({ role, content }) => ({ role, content }))

    const result = streamText({
      model: google('gemini-3.5-flash'),
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.3,
      onError({ error }) {
        console.error('[v0] Gemini stream failed:', error)
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[v0] Chat request failed:', error)
    return Response.json({ error: 'No se pudo conectar con el asistente.' }, { status: 500 })
  }
}
