import { google } from '@ai-sdk/google'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'

export const runtime = 'edge'

const SYSTEM_PROMPT = `Eres el asistente virtual de AgroSensor. Respondes únicamente preguntas genéricas sobre cómo usar la app: parcelas, sensores, alertas, historial, recomendaciones y configuración. Sé breve, claro y amable. No sustituyes a un asesor agronómico externo: para diagnósticos, decisiones de cultivo o emergencias, indica que deben consultar a un profesional. Si preguntan algo fuera de AgroSensor, explica que solo puedes ayudar con la aplicación.`

export async function POST(request: Request) {
  const body = (await request.json()) as { messages?: UIMessage[] }
  const messages = Array.isArray(body.messages) ? body.messages : []

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    temperature: 0.3,
  })

  return result.toTextStreamResponse()
}
