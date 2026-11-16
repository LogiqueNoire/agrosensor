import assert from 'node:assert/strict'
import test from 'node:test'
import { createParcelasHandler } from '../lib/parcelas-handler.ts'

const usuario = 'roberto@gmail.com'
const parcela = {
  id_parcela: 'P-001',
  nombre: 'Parcela Norte',
  hectareas: 12.5,
  cultivo: 'Maíz',
  tipo_sensor: 'Humedad',
  antiguedad: '2 años',
  fecha_instalacion: '2024-03-15',
}
const webhookHeaders = { Accept: 'application/json', 'X-Webhook-Key': 'test-secret' }

function jsonResponse(body, status = 200) {
  return Response.json(body, { status })
}

function createHandler(options = {}) {
  return createParcelasHandler({
    webhookKeyName: 'X-Webhook-Key',
    webhookKeyValue: 'test-secret',
    ...options,
  })
}

test('lista parcelas del usuario y convierte hectáreas string a número', async () => {
  let requestedUrl = ''
  let requestOptions
  const handlers = createHandler({
    fetcher: async (url, options) => {
      requestedUrl = String(url)
      requestOptions = options
      return jsonResponse({ success: true, parcelas: [{ ...parcela, usuario, hectareas: '12.5' }] })
    },
  })

  const response = await handlers.listar(usuario)
  assert.equal(requestedUrl, 'https://agrosensor.app.n8n.cloud/webhook/roberto-parcelas-listar?usuario=roberto%40gmail.com')
  assert.deepEqual(requestOptions.headers, webhookHeaders)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { success: true, parcelas: [parcela] })
})

test('normaliza encabezados de Google Sheets con espacios y decimales locales', async () => {
  const hojaRow = {
    usuario: ` ${usuario.toUpperCase()} `,
    'id parcela': 'P-001',
    nombre: 'Parcela Norte',
    hectareas: '1,5',
    cultivo: 'Maíz',
    'tipo sensor': 'Humedad',
    antiguedad: 'Hace 3 años',
    'fecha instalacion': '2023-10-01',
  }
  const handlers = createHandler({
    fetcher: async () => jsonResponse({ success: true, parcelas: [hojaRow] }),
  })

  const response = await handlers.listar(usuario)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    success: true,
    parcelas: [{ ...parcela, hectareas: 1.5, antiguedad: 'Hace 3 años', fecha_instalacion: '2023-10-01' }],
  })
})

test('no expone parcelas devueltas para otros usuarios', async () => {
  const handlers = createHandler({
    fetcher: async () => jsonResponse({
      success: true,
      parcelas: [
        { ...parcela, usuario },
        { ...parcela, id_parcela: 'OTHER-001', usuario: 'other@example.com' },
      ],
    }),
  })

  const response = await handlers.listar(usuario)
  assert.deepEqual(await response.json(), { success: true, parcelas: [parcela] })
})

test('acepta una lista vacía', async () => {
  const handlers = createHandler({ fetcher: async () => jsonResponse({ success: true, parcelas: [] }) })
  const response = await handlers.listar(usuario)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { success: true, parcelas: [] })
})

test('rechaza una respuesta de listado con esquema inválido', async () => {
  const handlers = createHandler({
    fetcher: async () => jsonResponse({ success: true, parcelas: [{ ...parcela, usuario, nombre: '' }] }),
  })
  assert.equal((await handlers.listar(usuario)).status, 502)
})

test('inserta con el usuario de sesión y no confía en usuario enviado por el cliente', async () => {
  let requestOptions
  const handlers = createHandler({
    fetcher: async (_url, options) => {
      requestOptions = options
      return jsonResponse({ success: true, message: 'Parcela registrada', id_parcela: parcela.id_parcela }, 201)
    },
  })
  const response = await handlers.insertar(new Request('http://localhost/api/parcelas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...parcela, usuario: 'attacker@example.com' }),
  }), usuario)

  assert.equal(response.status, 201)
  assert.deepEqual(requestOptions.headers, { ...webhookHeaders, 'Content-Type': 'application/json' })
  assert.deepEqual(JSON.parse(requestOptions.body), { usuario, ...parcela })
  assert.deepEqual(await response.json(), { success: true, message: 'Parcela registrada', id_parcela: 'P-001' })
})

test('mapea el conflicto de ID del webhook a 409', async () => {
  const handlers = createHandler({ fetcher: async () => jsonResponse({ success: false, message: 'duplicate' }, 409) })
  const response = await handlers.insertar(new Request('http://localhost/api/parcelas', { method: 'POST', body: JSON.stringify(parcela) }), usuario)
  assert.equal(response.status, 409)
  assert.equal((await response.json()).message, 'Ya existe una parcela con ese ID en tu cuenta.')
})

test('maneja el rechazo 403 del webhook', async () => {
  const handlers = createHandler({ fetcher: async () => jsonResponse({ success: false }, 403) })
  const response = await handlers.listar(usuario)
  assert.equal(response.status, 403)
  assert.match((await response.json()).message, /rechazó la clave/)
})

test('agrega las cuatro parcelas simuladas que faltan al usuario autenticado', async () => {
  const inserted = []
  const handlers = createHandler({
    fetcher: async (url, options) => {
      if (String(url).includes('roberto-parcelas-listar')) return jsonResponse({ success: true, parcelas: [] })
      const body = JSON.parse(options.body)
      inserted.push(body)
      return jsonResponse({ success: true, id_parcela: body.id_parcela }, 201)
    },
  })

  const response = await handlers.sembrar(usuario)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { success: true, added: 4 })
  assert.deepEqual(inserted.map(({ id_parcela }) => id_parcela).sort(), ['este', 'norte', 'simulada', 'sur'])
  assert.ok(inserted.every((item) => item.usuario === usuario))
  assert.equal(inserted.find(({ id_parcela }) => id_parcela === 'simulada').fecha_instalacion, '2026-07-01')
})

test('no vuelve a agregar parcelas iniciales que ya existen', async () => {
  const inserted = []
  const handlers = createHandler({
    fetcher: async (url, options) => {
      if (String(url).includes('roberto-parcelas-listar')) {
        return jsonResponse({ success: true, parcelas: [{ ...parcela, id_parcela: 'norte', usuario }] })
      }
      inserted.push(JSON.parse(options.body))
      return jsonResponse({ success: true, id_parcela: 'seed' }, 201)
    },
  })

  const response = await handlers.sembrar(usuario)
  assert.deepEqual(await response.json(), { success: true, added: 3 })
  assert.equal(inserted.some(({ id_parcela }) => id_parcela === 'norte'), false)
})

test('rechaza campos ausentes, hectáreas no positivas y fechas inválidas', async (t) => {
  let fetchCount = 0
  const handlers = createHandler({ fetcher: async () => { fetchCount += 1; return jsonResponse({}, 201) } })
  const invalidParcels = [
    { ...parcela, nombre: '' },
    { ...parcela, hectareas: 0 },
    { ...parcela, fecha_instalacion: '2024-02-30' },
  ]

  for (const invalid of invalidParcels) {
    await t.test(JSON.stringify(invalid), async () => {
      const response = await handlers.insertar(new Request('http://localhost/api/parcelas', { method: 'POST', body: JSON.stringify(invalid) }), usuario)
      assert.equal(response.status, 400)
    })
  }
  assert.equal(fetchCount, 0)
})

test('no llama a n8n si falta la configuración del webhook', async () => {
  let fetchCount = 0
  const handlers = createParcelasHandler({ fetcher: async () => { fetchCount += 1; return jsonResponse({}, 200) } })
  const response = await handlers.listar(usuario)
  assert.equal(response.status, 503)
  assert.equal(fetchCount, 0)
})

test('maneja errores de red del webhook', async () => {
  const handlers = createHandler({ fetcher: async () => { throw new Error('network') } })
  const response = await handlers.insertar(new Request('http://localhost/api/parcelas', { method: 'POST', body: JSON.stringify(parcela) }), usuario)
  assert.equal(response.status, 502)
})

test('lista lecturas del usuario y parcela, normalizando unidades y decimales locales', async () => {
  let requestedUrl = ''
  const handlers = createHandler({
    fetcher: async (url) => {
      requestedUrl = String(url)
      return jsonResponse({
        success: true,
        lecturas: [
          {},
          {
            id_lectura: 'LEC-001',
            usuario: ` ${usuario.toUpperCase()} `,
            id_parcela: 'Norte',
            id_sensor: 'SEN-101',
            fecha_hora: '2026-11-16 06:30:00',
            humedad: '58,5%',
            temperatura_suelo: '18,4 °C',
            temperatura_ambiente: '20,2 °C',
            ph_suelo: '5,4',
            nitrogeno: '38',
            fosforo: '22',
            potasio: '165',
            conductividad_electrica: '1,25 dS/m',
            estado_sensor: 'Activo',
          },
          { usuario: 'otro@gmail.com', id_parcela: 'norte', id_sensor: 'SEN-1', fecha_hora: '2026-11-16 06:30:00', humedad: '40%' },
          { usuario, id_parcela: 'sur', id_sensor: 'SEN-2', fecha_hora: '2026-11-16 06:30:00', humedad: '40%' },
        ],
      })
    },
  })

  const response = await handlers.listarLecturas(usuario, 'norte')
  assert.equal(
    requestedUrl,
    'https://agrosensor.app.n8n.cloud/webhook/b9215a8a-f6fe-4934-8e26-03f82e8631d8?usuario=roberto%40gmail.com&id_parcela=norte',
  )
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.lecturas.length, 1)
  assert.deepEqual(
    {
      humedad: body.lecturas[0].humedad,
      temperatura_suelo: body.lecturas[0].temperatura_suelo,
      ph_suelo: body.lecturas[0].ph_suelo,
      conductividad_electrica: body.lecturas[0].conductividad_electrica,
      fecha_hora: body.lecturas[0].fecha_hora,
    },
    { humedad: 58.5, temperatura_suelo: 18.4, ph_suelo: 5.4, conductividad_electrica: 1.25, fecha_hora: '2026-11-16T06:30:00' },
  )
})

test('acepta lecturas vacías y rechaza respuestas inválidas', async () => {
  const empty = createHandler({ fetcher: async () => jsonResponse({ lecturas: [{}] }) })
  assert.deepEqual(await (await empty.listarLecturas(usuario, 'norte')).json(), { success: true, lecturas: [] })

  const invalid = createHandler({ fetcher: async () => jsonResponse({ success: true }) })
  assert.equal((await invalid.listarLecturas(usuario, 'norte')).status, 502)
  assert.equal((await invalid.listarLecturas(usuario, '  ')).status, 400)
})
