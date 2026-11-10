// Estado de la app guardado en el teléfono (localStorage). Sin servidor: es un prototipo.
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { BOWLS, POINTS, PRICE } from './data.js'

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
      const stock = { ...s.stock, [a.order.pointId]: { ...s.stock[a.order.pointId] } }
      for (const it of a.order.items) stock[a.order.pointId][it.id] = Math.max(0, (stock[a.order.pointId][it.id] || 0) - it.qty)
      return { ...s, cart: {}, orders: [a.order, ...s.orders], stock, stockAt: Date.now() }
    }
    case 'orderPatch':
      return { ...s, orders: s.orders.map((o) => (o.id === a.id ? { ...o, ...a.patch } : o)) }
    case 'tick': {
      // Simula que otras personas compran en las máquinas
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
    default:
      return s
  }
}

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  // Cada 25 s alguien "compra" un bowl en algún punto
  useEffect(() => {
    const t = setInterval(() => dispatch({ type: 'tick' }), 25000)
    return () => clearInterval(t)
  }, [])

  const value = useMemo(() => {
    const cartItems = Object.entries(state.cart).map(([id, qty]) => ({ bowl: BOWLS.find((b) => b.id === id), qty }))
    const cartCount = cartItems.reduce((n, it) => n + it.qty, 0)
    return { state, dispatch, cartItems, cartCount, cartTotal: cartCount * PRICE }
  }, [state])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)

export function newOrder({ items, pointId, slot, pay }) {
  const code = String(1000 + Math.floor(Math.random() * 9000))
  return {
    id: `B-${Date.now().toString(36).toUpperCase()}`,
    code,
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

/** Estado del pedido a partir del tiempo (así sobrevive a recargar la página). */
export function orderStatus(o, now = Date.now()) {
  if (o.rating) return 'done'
  if (o.pickedAt) return 'picked'
  if (o.slot !== 'Ahora') return 'scheduled'
  return now - o.createdAt > 6000 ? 'ready' : 'preparing'
}
