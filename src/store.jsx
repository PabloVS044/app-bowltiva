// Estado de la app. Con servidor (/api) los pedidos y el stock son compartidos
// (los ve el panel de administración); sin servidor todo se simula en el teléfono.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { BOWLS, POINTS, PRICE } from './data.js'
import { api, SEND, VIEW } from './api.js'

const KEY = 'bowltiva-app-v1'

const initialStock = () => Object.fromEntries(POINTS.map((p) => [p.id, { ...p.stock }]))

const initial = () => ({
  profile: null, // { name, goals[], conditions[], pointId }
  cart: {}, // { bowlId: qty }
  pointId: 'uvg',
  orders: [], // más reciente primero
  stock: initialStock(),
  stockAt: Date.now(),
})

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initial(), ...JSON.parse(raw) }
  } catch {}
  return initial()
}

function reducer(s, a) {
  switch (a.type) {
    case 'profile':
      return { ...s, profile: a.profile, pointId: a.profile.pointId || s.pointId }
    case 'point':
      return { ...s, pointId: a.pointId }
    case 'add': {
      const q = (s.cart[a.id] || 0) + (a.qty || 1)
      return { ...s, cart: { ...s.cart, [a.id]: Math.min(q, 5) } }
    }
    case 'qty': {
      const cart = { ...s.cart }
      if (a.qty <= 0) delete cart[a.id]
      else cart[a.id] = Math.min(a.qty, 5)
      return { ...s, cart }
    }
    case 'order': {
      // Pedido local (sin servidor): se descuenta el stock aquí
      const stock = { ...s.stock }
      if (!a.order.remote) {
        stock[a.order.pointId] = { ...stock[a.order.pointId] }
        for (const it of a.order.items) stock[a.order.pointId][it.id] = Math.max(0, (stock[a.order.pointId][it.id] || 0) - it.qty)
      }
      return { ...s, cart: {}, orders: [a.order, ...s.orders.filter((o) => o.id !== a.order.id)], stock, stockAt: Date.now() }
    }
    case 'orderPatch':
      return { ...s, orders: s.orders.map((o) => (o.id === a.id ? { ...o, ...a.patch } : o)) }
    case 'ordersSync': {
      const byId = Object.fromEntries(a.orders.map((o) => [o.id, { ...o, remote: true }]))
      return { ...s, orders: s.orders.map((o) => byId[o.id] || o) }
    }
    case 'stock':
      return { ...s, stock: { ...s.stock, ...a.stock }, stockAt: Date.now() }
    case 'tick': {
      // Sin servidor: simula que otras personas compran en las máquinas
      const p = POINTS.filter((x) => !x.soon)[Math.floor(Math.random() * 2)]
      const ids = Object.keys(s.stock[p.id]).filter((id) => s.stock[p.id][id] > 1)
      if (!ids.length) return s
      const id = ids[Math.floor(Math.random() * ids.length)]
      return { ...s, stock: { ...s.stock, [p.id]: { ...s.stock[p.id], [id]: s.stock[p.id][id] - 1 } }, stockAt: Date.now() }
    }
    case 'restock':
      return { ...s, stock: initialStock(), stockAt: Date.now() }
    case 'reset':
      return initial()
    case 'mirror':
      return { ...s, ...a.state }
    default:
      return s
  }
}

const Ctx = createContext(null)

// ---------- Espejo: estado de pantalla compartido ----------
// Las pantallas guardan su estado local (paso, filtro, cantidad…) con useMirror,
// para que el iPhone del deck muestre exactamente lo mismo que el teléfono.
const ui = {}
let sendSoon = () => {}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, VIEW ? initial : load)
  const [online, setOnline] = useState(null) // null = comprobando
  const [snap, setSnap] = useState(null) // lo último recibido (modo ver)
  const stateRef = useRef(state)
  stateRef.current = state

  // Guardar en el teléfono
  useEffect(() => {
    if (VIEW) return
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  // ¿Hay servidor? Stock compartido
  useEffect(() => {
    if (VIEW) return
    let stop = false
    const pull = async () => {
      const { status, json } = await api.stock()
      if (stop) return
      setOnline(status === 200)
      if (status === 200) dispatch({ type: 'stock', stock: json.stock })
    }
    pull()
    const t = setInterval(pull, 4000)
    return () => {
      stop = true
      clearInterval(t)
    }
  }, [])

  // Sin servidor: compras simuladas cada 25 s
  useEffect(() => {
    if (VIEW || online !== false) return
    const t = setInterval(() => dispatch({ type: 'tick' }), 25000)
    return () => clearInterval(t)
  }, [online])

  // Con servidor: refrescar mis pedidos activos (el panel los mueve)
  useEffect(() => {
    if (VIEW || !online) return
    const t = setInterval(async () => {
      const ids = stateRef.current.orders.filter((o) => o.remote && !o.rating && o.status !== 'cancelado').map((o) => o.id)
      if (!ids.length) return
      const { status, json } = await api.getOrders(ids)
      if (status === 200) dispatch({ type: 'ordersSync', orders: json.orders })
    }, 1000)
    return () => clearInterval(t)
  }, [online])

  // ---------- Transmitir (teléfono de la demo) ----------
  useEffect(() => {
    if (!SEND) return
    let timer = null
    let last = 0
    let tap = null
    const send = () => {
      timer = null
      last = Date.now()
      const s = stateRef.current
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight)
      api.mirrorPost(SEND, {
        path: location.hash.slice(1) || '/',
        scroll: scrollY / max,
        state: { profile: s.profile, cart: s.cart, pointId: s.pointId, orders: s.orders.slice(0, 5), stock: s.stock },
        ui: { ...ui },
        tap,
      })
    }
    sendSoon = () => {
      if (timer) return
      timer = setTimeout(send, Math.max(0, 120 - (Date.now() - last)))
    }
    const onTap = (e) => {
      tap = { x: e.clientX / innerWidth, y: e.clientY / innerHeight, id: Date.now() }
      sendSoon()
    }
    addEventListener('scroll', sendSoon, { passive: true })
    addEventListener('hashchange', sendSoon)
    addEventListener('pointerdown', onTap, { passive: true })
    const keepAlive = setInterval(sendSoon, 2000)
    sendSoon()
    return () => {
      removeEventListener('scroll', sendSoon)
      removeEventListener('hashchange', sendSoon)
      removeEventListener('pointerdown', onTap)
      clearInterval(keepAlive)
    }
  }, [])
  useEffect(() => {
    sendSoon()
  }, [state])

  // ---------- Ver (iPhone del deck) ----------
  useEffect(() => {
    if (!VIEW) return
    let stop = false
    let lastT = 0
    const pull = async () => {
      const { status, json } = await api.mirrorGet(VIEW)
      if (stop) return
      if (status === 200 && json.snap && json.snap.t !== lastT) {
        lastT = json.snap.t
        dispatch({ type: 'mirror', state: json.snap.state })
        setSnap(json.snap)
      }
      setTimeout(pull, 250)
    }
    pull()
    return () => {
      stop = true
    }
  }, [])

  const safeDispatch = useCallback((a) => (VIEW ? undefined : dispatch(a)), [])

  const value = useMemo(() => {
    const cartItems = Object.entries(state.cart).map(([id, qty]) => ({ bowl: BOWLS.find((b) => b.id === id), qty }))
    const cartCount = cartItems.reduce((n, it) => n + it.qty, 0)
    return { state, dispatch: safeDispatch, cartItems, cartCount, cartTotal: cartCount * PRICE, online, snap }
  }, [state, online, snap, safeDispatch])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)

/** useState que se comparte con el iPhone espejo del deck. */
export function useMirror(key, init) {
  const { snap } = useStore()
  const [v, setV] = useState(init)
  useEffect(() => {
    if (!SEND) return
    ui[key] = v
    sendSoon()
  }, [key, v])
  useEffect(
    () => () => {
      delete ui[key]
    },
    [key],
  )
  if (VIEW) return [snap?.ui?.[key] ?? init, () => {}]
  return [v, setV]
}

// ---------- Pedidos ----------
export function localOrder({ items, pointId, slot, pay, name }) {
  const code = String(1000 + Math.floor(Math.random() * 9000))
  return {
    id: `B-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    code,
    name,
    items: items.map((it) => ({ id: it.bowl.id, qty: it.qty })),
    pointId,
    slot,
    pay,
    total: items.reduce((n, it) => n + it.qty, 0) * PRICE,
    door: 1 + Math.floor(Math.random() * 12),
    createdAt: Date.now(),
    pickedAt: null,
    rating: 0,
  }
}

/**
 * Estado para la interfaz: scheduled · new · preparing · ready · picked · done · cancelled.
 * Pedidos del servidor usan su estado; los locales avanzan con el tiempo.
 */
export function orderStatus(o, now = Date.now()) {
  if (o.rating) return 'done'
  if (o.remote) {
    return { programado: 'scheduled', nuevo: 'new', preparando: 'preparing', listo: 'ready', retirado: 'picked', cancelado: 'cancelled' }[o.status] || 'new'
  }
  if (o.pickedAt) return 'picked'
  if (o.slot !== 'Ahora') return 'scheduled'
  const age = now - o.createdAt
  return age < 4000 ? 'new' : age < 10000 ? 'preparing' : 'ready'
}
