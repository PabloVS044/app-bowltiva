// Panel para el equipo de Bowltiva: pedidos en vivo, stock de cada punto y ventas del día.
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BOWLS, POINTS, PRICE, bowlById, pointById } from '../data.js'
import { api } from '../api.js'
import { BowlArt, Icon } from '../components/ui.jsx'

const PIN_KEY = 'bowltiva-admin-pin'
const getPin = () => {
  try {
    return localStorage.getItem(PIN_KEY) || ''
  } catch {
    return ''
  }
}
const savePin = (p) => {
  try {
    localStorage.setItem(PIN_KEY, p)
  } catch {}
}

const COLS = [
  { k: 'nuevo', label: 'Nuevos', also: ['programado'] },
  { k: 'preparando', label: 'Preparando' },
  { k: 'listo', label: 'Listos para retirar' },
  { k: 'retirado', label: 'Retirados' },
]

function ago(t, now) {
  const s = Math.max(0, Math.round((now - t) / 1000))
  return s < 60 ? `hace ${s} s` : s < 3600 ? `hace ${Math.round(s / 60)} min` : new Date(t).toLocaleTimeString('es-GT', { timeStyle: 'short' })
}

export default function Admin() {
  const [params] = useSearchParams()
  const compact = params.has('compacto')
  const urlPin = params.get('pin')
  if (urlPin) savePin(urlPin)

  const [pin, setPin] = useState(getPin())
  const [needPin, setNeedPin] = useState(false)
  const [orders, setOrders] = useState([])
  const [stock, setStock] = useState({})
  const [offline, setOffline] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState('')

  useEffect(() => {
    document.body.classList.add('admin-body')
    return () => document.body.classList.remove('admin-body')
  }, [])

  // Pedidos cada 1.5 s, stock cada 3 s
  useEffect(() => {
    let stop = false
    let n = 0
    const pull = async () => {
      const { status, json } = await api.allOrders(pin)
      if (stop) return
      if (status === 401) setNeedPin(true)
      else if (status === 200) {
        setNeedPin(false)
        setOffline(false)
        setOrders(json.orders)
      } else setOffline(true)
      if (n++ % 2 === 0) {
        const r = await api.stock()
        if (!stop && r.status === 200) setStock(r.json.stock)
      }
      setNow(Date.now())
      setTimeout(pull, 1500)
    }
    pull()
    return () => {
      stop = true
    }
  }, [pin])

  const move = async (o, action) => {
    setBusy(o.id)
    const { status, json } = await api.patchOrder(o.id, action, { pin })
    if (status === 200) setOrders((list) => list.map((x) => (x.id === o.id ? json.order : x)))
    setBusy('')
  }

  const restock = async (pointId) => {
    const { status, json } = await api.restock(pin, pointId)
    if (status === 200) setStock(json.stock)
  }

  // Ventas del día
  const kpi = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const today = orders.filter((o) => o.createdAt >= start.getTime() && o.status !== 'cancelado')
    const count = {}
    for (const o of today) for (const it of o.items) count[it.id] = (count[it.id] || 0) + it.qty
    const bowls = Object.values(count).reduce((a, b) => a + b, 0)
    const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0]
    const rated = today.filter((o) => o.rating)
    return {
      orders: today.length,
      bowls,
      sales: bowls * PRICE,
      top: top ? bowlById(top[0]).name : '—',
      rating: rated.length ? (rated.reduce((s, o) => s + o.rating, 0) / rated.length).toFixed(1) : '—',
    }
  }, [orders])

  if (needPin) {
    return (
      <form
        className="admin-pin"
        onSubmit={(e) => {
          e.preventDefault()
          const v = e.target.elements.pin.value.trim()
          savePin(v)
          setPin(v)
        }}
      >
        <img src="/isotipo.png" alt="" />
        <h1>Panel Bowltiva</h1>
        <p>PIN del equipo</p>
        <input name="pin" type="password" inputMode="numeric" autoFocus />
        <button className="btn primary">Entrar</button>
      </form>
    )
  }

  const cols = COLS

  return (
    <div className={`admin ${compact ? 'compact' : ''}`}>
      <header className="ad-head">
        <div className="ad-brand">
          <img src="/isotipo.png" alt="" />
          <div>
            <b>Bowltiva</b>
            <span>Panel de operación</span>
          </div>
        </div>
        <span className={`ad-live ${offline ? 'off' : ''}`}>
          <i /> {offline ? 'sin conexión' : 'en vivo'}
        </span>
      </header>

      <section className="ad-kpis">
        <div>
          <span>Pedidos hoy</span>
          <b>{kpi.orders}</b>
        </div>
        <div>
          <span>Bowls vendidos</span>
          <b>{kpi.bowls}</b>
        </div>
        <div>
          <span>Ventas hoy</span>
          <b>Q{kpi.sales.toLocaleString('es-GT')}</b>
        </div>
        {!compact && (
          <div>
            <span>Calificación</span>
            <b>{kpi.rating}★</b>
          </div>
        )}
        <div className="wide">
          <span>Más vendido</span>
          <b className="sm">{kpi.top}</b>
        </div>
      </section>

      <section className="ad-board" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
        {cols.map((c) => {
          const list = orders.filter((o) => o.status === c.k || c.also?.includes(o.status)).slice(0, c.k === 'retirado' ? (compact ? 2 : 6) : compact ? 3 : 8)
          return (
            <div key={c.k} className={`ad-col ${c.k}`}>
              <h3>
                {c.label} <span>{list.length}</span>
              </h3>
              {list.map((o) => (
                <article key={o.id} className={`ad-card ${now - o.createdAt < 6000 ? 'fresh' : ''}`}>
                  <div className="ad-card-top">
                    <b>{o.name}</b>
                    <small>{ago(o.createdAt, now)}</small>
                  </div>
                  <div className="ad-items">
                    {o.items.map((it) => (
                      <span key={it.id}>
                        <BowlArt bowl={bowlById(it.id)} size={22} photo={false} />
                        {it.qty}× {bowlById(it.id).name}
                      </span>
                    ))}
                  </div>
                  <div className="ad-meta">
                    <span>
                      <Icon name="pin" size={13} /> {pointById(o.pointId).name}
                    </span>
                    <span>
                      puerta #{o.door} · {o.status === 'programado' ? `para las ${o.slot}` : o.pay === 'card' ? 'pagado' : 'paga en máquina'}
                    </span>
                  </div>
                  {o.status === 'nuevo' && (
                    <button className="ad-btn" disabled={busy === o.id} onClick={() => move(o, 'preparando')}>
                      Preparar
                    </button>
                  )}
                  {o.status === 'preparando' && (
                    <button className="ad-btn go" disabled={busy === o.id} onClick={() => move(o, 'listo')}>
                      Cargado en puerta #{o.door}
                    </button>
                  )}
                  {o.status === 'listo' && <p className="ad-wait">Código {o.code} · esperando al cliente</p>}
                  {o.status === 'retirado' && <p className="ad-done">{o.rating ? `${'★'.repeat(o.rating)}` : 'Retirado ✓'}</p>}
                </article>
              ))}
              {!list.length && <p className="ad-empty">—</p>}
            </div>
          )
        })}
      </section>

      <section className="ad-stock">
        {POINTS.filter((p) => !p.soon).map((p) => {
          const s = stock[p.id] || {}
          const low = BOWLS.filter((b) => (s[b.id] ?? 0) <= 2)
          return (
            <div key={p.id} className="ad-point">
              <div className="ad-point-head">
                <b>
                  <Icon name="locker" size={16} /> {p.name}
                </b>
                {low.length > 0 && <span className="ad-alert">{low.length} por agotarse</span>}
                <button className="ad-restock" onClick={() => restock(p.id)}>
                  <Icon name="refresh" size={14} /> Reabastecer
                </button>
              </div>
              <div className="ad-stock-grid">
                {BOWLS.map((b) => {
                  const n = s[b.id] ?? 0
                  return (
                    <div key={b.id} className={`ad-s ${n === 0 ? 'zero' : n <= 2 ? 'low' : ''}`} title={b.name}>
                      <BowlArt bowl={b} size={compact ? 22 : 28} photo={false} />
                      <b>{n}</b>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
