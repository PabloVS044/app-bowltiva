// Backend del prototipo: pedidos, stock de máquinas/lockers y espejo para la demo.
// En Vercel usa Upstash Redis (integración del Marketplace). En local usa memoria.
// Los archivos de /api que empiezan con "_" no se publican como funciones.
import { BOWLS, POINTS, PRICE, SLOTS } from '../src/data.js'

const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
const ADMIN_PIN = process.env.ADMIN_PIN || ''
const ON_VERCEL = !!process.env.VERCEL
const WEEK = 60 * 60 * 24 * 7

// ---------- Almacenamiento (Redis REST o memoria) ----------
const mem = new Map()

async function redis(cmd) {
  const res = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(cmd) })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.result
}

const kv = {
  async get(k) {
    if (!URL_) return mem.get(k) ?? null
    return redis(['GET', k])
  },
  async set(k, v, ttl = WEEK) {
    if (!URL_) return void mem.set(k, v)
    return redis(['SET', k, v, 'EX', String(ttl)])
  },
  async mget(keys) {
    if (!keys.length) return []
    if (!URL_) return keys.map((k) => mem.get(k) ?? null)
    return redis(['MGET', ...keys])
  },
  async lpush(k, v) {
    if (!URL_) return void mem.set(k, [v, ...(mem.get(k) || [])].slice(0, 200))
    await redis(['LPUSH', k, v])
    await redis(['LTRIM', k, '0', '199'])
  },
  async lrange(k, n) {
    if (!URL_) return (mem.get(k) || []).slice(0, n)
    return redis(['LRANGE', k, '0', String(n - 1)])
  },
  async hgetall(k) {
    if (!URL_) return { ...(mem.get(k) || {}) }
    const flat = await redis(['HGETALL', k])
    const out = {}
    for (let i = 0; i < flat.length; i += 2) out[flat[i]] = Number(flat[i + 1])
    return out
  },
  async hset(k, obj) {
    if (!URL_) return void mem.set(k, { ...(mem.get(k) || {}), ...obj })
    return redis(['HSET', k, ...Object.entries(obj).flatMap(([f, v]) => [f, String(v)])])
  },
  async hincrby(k, f, by) {
    if (!URL_) {
      const h = mem.get(k) || {}
      h[f] = (h[f] || 0) + by
      return void mem.set(k, h)
    }
    return redis(['HINCRBY', k, f, String(by)])
  },
}

// ---------- Utilidades ----------
const ok = (json) => ({ status: 200, json })
const fail = (status, error, extra = {}) => ({ status, json: { error, ...extra } })
const isAdmin = (body, query) => !ADMIN_PIN || String(body.pin || query.pin || '') === ADMIN_PIN
const bowlIds = new Set(BOWLS.map((b) => b.id))
const openPoints = POINTS.filter((p) => !p.soon)

// Estados en orden. Los pedidos «Ahora» avanzan solos con el tiempo (para que la
// app funcione sin nadie en el panel); desde el panel se pueden adelantar.
export const FLOW = ['programado', 'nuevo', 'preparando', 'listo', 'retirado']
const rank = (s) => FLOW.indexOf(s)

function effective(o, now = Date.now()) {
  if (o.status === 'cancelado') return o
  let auto = 'nuevo'
  if (o.slot !== 'Ahora') auto = 'programado'
  else {
    const age = now - o.createdAt
    auto = age < 4000 ? 'nuevo' : age < 10000 ? 'preparando' : 'listo'
  }
  const status = rank(o.status) >= rank(auto) ? o.status : auto
  return { ...o, status }
}

// ---------- Stock ----------
async function readStock() {
  const out = {}
  for (const p of openPoints) {
    let h = await kv.hgetall(`bw:stock:${p.id}`)
    if (!Object.keys(h).length) {
      await kv.hset(`bw:stock:${p.id}`, p.stock)
      h = { ...p.stock }
    }
    out[p.id] = h
  }
  return out
}

async function stock({ method, query, body }) {
  if (method === 'GET') return ok({ stock: await readStock(), now: Date.now() })
  if (method !== 'POST') return fail(405, 'método no permitido')
  if (!isAdmin(body, query)) return fail(401, 'PIN incorrecto')
  const targets = body.pointId ? openPoints.filter((p) => p.id === body.pointId) : openPoints
  for (const p of targets) await kv.hset(`bw:stock:${p.id}`, p.stock)
  return ok({ stock: await readStock() })
}

// ---------- Pedidos ----------
async function getMany(ids) {
  const raws = await kv.mget(ids.map((id) => `bw:order:${id}`))
  const now = Date.now()
  return raws.filter(Boolean).map((r) => effective(typeof r === 'string' ? JSON.parse(r) : r, now))
}

async function save(o) {
  await kv.set(`bw:order:${o.id}`, JSON.stringify(o))
}

async function orders({ method, query, body }) {
  if (method === 'GET') {
    if (query.id || query.ids) {
      const ids = String(query.ids || query.id).split(',').filter(Boolean).slice(0, 50)
      return ok({ orders: await getMany(ids), now: Date.now() })
    }
    if (!isAdmin(body, query)) return fail(401, 'PIN incorrecto')
    const ids = await kv.lrange('bw:orders', 100)
    return ok({ orders: await getMany(ids), now: Date.now() })
  }

  if (method === 'POST') {
    // Crear pedido
    const items = Array.isArray(body.items) ? body.items : []
    const point = openPoints.find((p) => p.id === body.pointId)
    if (!point) return fail(400, 'punto inválido')
    if (!items.length || items.length > 6) return fail(400, 'pedido vacío')
    for (const it of items) {
      if (!bowlIds.has(it.id) || !Number.isInteger(it.qty) || it.qty < 1 || it.qty > 5) return fail(400, 'producto inválido')
    }
    const slot = SLOTS.includes(body.slot) ? body.slot : 'Ahora'
    const pay = body.pay === 'machine' ? 'machine' : 'card'
    const current = (await readStock())[point.id]
    const short = items.filter((it) => (current[it.id] || 0) < it.qty)
    if (short.length) return fail(409, 'sin stock suficiente', { short: short.map((s) => s.id), stock: current })
    for (const it of items) await kv.hincrby(`bw:stock:${point.id}`, it.id, -it.qty)

    const now = Date.now()
    const o = {
      id: `B-${now.toString(36).toUpperCase().slice(-5)}${Math.floor(Math.random() * 36).toString(36).toUpperCase()}`,
      code: String(1000 + Math.floor(Math.random() * 9000)),
      name: String(body.name || 'Cliente').slice(0, 30),
      items: items.map(({ id, qty }) => ({ id, qty })),
      pointId: point.id,
      slot,
      pay,
      total: items.reduce((n, it) => n + it.qty, 0) * PRICE,
      door: 1 + Math.floor(Math.random() * 12),
      status: slot === 'Ahora' ? 'nuevo' : 'programado',
      createdAt: now,
      pickedAt: null,
      rating: 0,
    }
    await save(o)
    await kv.lpush('bw:orders', o.id)
    return ok({ order: effective(o) })
  }

  if (method === 'PATCH') {
    const [o] = await getMany([String(body.id || '')])
    if (!o) return fail(404, 'pedido no encontrado')
    const now = Date.now()
    const a = body.action
    // Acciones del cliente (no piden PIN)
    if (a === 'retirado') Object.assign(o, { status: 'retirado', pickedAt: now })
    else if (a === 'calificar') o.rating = Math.max(1, Math.min(5, Number(body.rating) || 5))
    else if (a === 'ahora') Object.assign(o, { slot: 'Ahora', createdAt: now - 4000, status: 'nuevo' })
    // Acciones del panel (piden PIN)
    else if (['preparando', 'listo', 'cancelado'].includes(a)) {
      if (!isAdmin(body, query)) return fail(401, 'PIN incorrecto')
      if (a === 'cancelado' && o.status !== 'retirado') for (const it of o.items) await kv.hincrby(`bw:stock:${o.pointId}`, it.id, it.qty)
      o.status = a
      if (a === 'listo') o.readyAt = now
    } else return fail(400, 'acción inválida')
    await save(o)
    return ok({ order: effective(o) })
  }

  return fail(405, 'método no permitido')
}

// ---------- Espejo (el iPhone del deck repite lo que hace el teléfono de la demo) ----------
async function mirror({ method, query, body }) {
  const sala = String(query.sala || body.sala || '').toLowerCase()
  if (!/^[a-z0-9-]{1,30}$/.test(sala)) return fail(400, 'sala inválida')
  const k = `bw:mirror:${sala}`
  if (method === 'GET') {
    const raw = await kv.get(k)
    return ok({ snap: raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null, now: Date.now() })
  }
  if (method !== 'POST') return fail(405, 'método no permitido')
  const snap = JSON.stringify({ ...body.snap, t: Date.now() })
  if (snap.length > 20000) return fail(413, 'muy grande')
  await kv.set(k, snap, 600)
  return ok({ saved: true })
}

const ROUTES = { orders, stock, mirror }

/** Lógica común a Vercel y al servidor de Vite. */
export async function handle(name, req) {
  if (ON_VERCEL && !URL_) return fail(503, 'Falta conectar Upstash Redis al proyecto (ver README).')
  const fn = ROUTES[name]
  if (!fn) return fail(404, 'no existe')
  try {
    return await fn({ method: req.method, query: req.query || {}, body: req.body || {} })
  } catch (err) {
    return fail(500, String(err?.message || err))
  }
}

/** Adaptador para funciones de Vercel (Node). */
export const vercel = (name) => async (req, res) => {
  let body = req.body || {}
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}')
    } catch {
      body = {}
    }
  }
  const { status, json } = await handle(name, { method: req.method, query: req.query, body })
  res.setHeader('Cache-Control', 'no-store')
  res.status(status).json(json)
}
