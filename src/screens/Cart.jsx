import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { POINTS, PRICE, SLOTS } from '../data.js'
import { newOrder, useStore } from '../store.jsx'
import { BowlArt, Icon, TopBar } from '../components/ui.jsx'

export default function Cart() {
  const { state, dispatch, cartItems, cartCount, cartTotal } = useStore()
  const nav = useNavigate()
  const [slot, setSlot] = useState('Ahora')
  const [pay, setPay] = useState('card')
  const [paying, setPaying] = useState(false)
  const stock = state.stock[state.pointId] || {}

  const short = cartItems.filter((it) => (stock[it.bowl.id] ?? 0) < it.qty)

  const confirm = () => {
    setPaying(true)
    // Pago simulado
    setTimeout(() => {
      const order = newOrder({ items: cartItems, pointId: state.pointId, slot, pay })
      dispatch({ type: 'order', order })
      nav(`/pedido/${order.id}`, { replace: true })
    }, 1200)
  }

  if (!cartCount) {
    return (
      <div className="screen">
        <TopBar title="Tu pedido" back={false} />
        <div className="empty-state">
          <Icon name="bag" size={56} stroke={1.5} />
          <h2>Tu carrito está vacío</h2>
          <p className="muted">Elige un bowl del menú y lo apartamos en tu punto.</p>
          <Link to="/" className="btn primary">
            Ver menú
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="screen cart">
      <TopBar title="Tu pedido" back={false} />

      <section className="sec">
        {cartItems.map(({ bowl, qty }) => (
          <div key={bowl.id} className="cart-row">
            <BowlArt bowl={bowl} size={60} />
            <div className="cr-txt">
              <b>{bowl.name}</b>
              <small>
                Q{PRICE} · {bowl.n.kcal} kcal
              </small>
            </div>
            <div className="stepper sm">
              <button onClick={() => dispatch({ type: 'qty', id: bowl.id, qty: qty - 1 })} aria-label="Menos">
                <Icon name="minus" stroke={3} size={16} />
              </button>
              <b>{qty}</b>
              <button onClick={() => dispatch({ type: 'qty', id: bowl.id, qty: qty + 1 })} aria-label="Más">
                <Icon name="plus" stroke={3} size={16} />
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="sec">
        <h3>¿Dónde lo recoges?</h3>
        {POINTS.filter((p) => !p.soon).map((p) => (
          <button key={p.id} className={`choice-row ${state.pointId === p.id ? 'on' : ''}`} onClick={() => dispatch({ type: 'point', pointId: p.id })}>
            <span className="cr-check round">{state.pointId === p.id && <Icon name="check" size={16} stroke={3} />}</span>
            <span>
              <b>{p.name}</b>
              <small>
                {p.kind} · {p.hours}
              </small>
            </span>
          </button>
        ))}
        {short.length > 0 && (
          <p className="warn">
            No alcanza el stock de {short.map((s) => s.bowl.name).join(', ')} en este punto. Cambia de punto o la cantidad.
          </p>
        )}
      </section>

      <section className="sec">
        <h3>¿Cuándo?</h3>
        <div className="chips wrap">
          {SLOTS.map((s) => (
            <button key={s} className={`chip ${slot === s ? 'on' : ''}`} onClick={() => setSlot(s)}>
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="sec">
        <h3>Pago</h3>
        <button className={`choice-row ${pay === 'card' ? 'on' : ''}`} onClick={() => setPay('card')}>
          <Icon name="card" />
          <span>
            <b>Tarjeta •••• 4242</b>
            <small>Visa · guardada</small>
          </span>
        </button>
        <button className={`choice-row ${pay === 'machine' ? 'on' : ''}`} onClick={() => setPay('machine')}>
          <Icon name="coin" />
          <span>
            <b>Pagar en la máquina</b>
            <small>Tarjeta o código QR al retirar</small>
          </span>
        </button>
      </section>

      <div className="summary">
        <div>
          <span>
            {cartCount} bowl{cartCount > 1 ? 's' : ''}
          </span>
          <b>Q{cartTotal.toFixed(2)}</b>
        </div>
        <small>Sin costo de envío: lo recoges tú en minutos.</small>
      </div>

      <div className="buybar">
        <button className="btn primary grow" disabled={paying || short.length > 0} onClick={confirm}>
          {paying ? 'Procesando…' : pay === 'card' ? `Pagar y reservar · Q${cartTotal}` : 'Reservar'}
        </button>
      </div>
    </div>
  )
}
