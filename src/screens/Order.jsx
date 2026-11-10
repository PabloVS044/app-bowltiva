import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { bowlById, pointById } from '../data.js'
import { orderStatus, useStore } from '../store.jsx'
import { Icon, QR, TopBar } from '../components/ui.jsx'

const HEAT = 180 // segundos

function useNow(ms = 500) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

export default function Order() {
  const { id } = useParams()
  const { state, dispatch } = useStore()
  const now = useNow()
  const o = state.orders.find((x) => x.id === id)
  const [heatStart, setHeatStart] = useState(null)
  const [fast, setFast] = useState(false)
  if (!o) return <p className="empty">Pedido no encontrado.</p>

  const point = pointById(o.pointId)
  const status = orderStatus(o, now)
  const patch = (p) => dispatch({ type: 'orderPatch', id: o.id, patch: p })
  const steps = [
    { k: 'paid', label: 'Pedido confirmado' },
    { k: 'preparing', label: 'Separando tu bowl' },
    { k: 'ready', label: `Listo en ${point.kind.toLowerCase()}` },
    { k: 'picked', label: 'Retirado' },
  ]
  const at = { scheduled: 0, preparing: 1, ready: 2, picked: 3, done: 4 }[status]

  // Cuenta regresiva para calentar (en demo puede ir 30× más rápido)
  const elapsed = heatStart ? ((now - heatStart) / 1000) * (fast ? 30 : 1) : 0
  const left = Math.max(0, HEAT - elapsed)
  const mm = Math.floor(left / 60)
  const ss = String(Math.floor(left % 60)).padStart(2, '0')

  return (
    <div className="screen order">
      <TopBar title={`Pedido ${o.id}`} />

      <ol className="timeline">
        {steps.map((s, i) => (
          <li key={s.k} className={i < at ? 'done' : i === at ? 'cur' : ''}>
            <i>{i < at ? <Icon name="check" size={14} stroke={3} /> : null}</i>
            <span>{s.label}</span>
          </li>
        ))}
      </ol>

      {status === 'scheduled' && (
        <div className="card center">
          <Icon name="clock" size={40} />
          <h2>Lo apartamos para las {o.slot}</h2>
          <p className="muted">Te avisamos cuando esté listo en {point.name}.</p>
          <button className="btn ghost sm" onClick={() => patch({ slot: 'Ahora', createdAt: Date.now() - 7000 })}>
            Simular que ya es la hora (demo)
          </button>
        </div>
      )}

      {status === 'preparing' && (
        <div className="card center">
          <div className="spinner" />
          <h2>Separando tu bowl…</h2>
          <p className="muted">Toma unos segundos.</p>
        </div>
      )}

      {status === 'ready' && (
        <div className="card center pickup">
          <span className="eyebrow">Tu código de retiro</span>
          <div className="code">
            {o.code.split('').map((d, i) => (
              <b key={i}>{d}</b>
            ))}
          </div>
          <QR text={`BOWLTIVA:${o.id}:${o.code}`} size={180} />
          <p>
            <b>{point.name}</b> · {point.kind} · puerta <b>#{o.door}</b>
          </p>
          <p className="muted small">Escribe el código en la pantalla o escanea el QR.</p>
          <button className="btn primary block" onClick={() => patch({ pickedAt: Date.now() })}>
            Ya lo retiré
          </button>
        </div>
      )}

      {status === 'picked' && (
        <div className="card center heat">
          {!heatStart ? (
            <>
              <Icon name="flame" size={44} />
              <h2>Calienta 3 minutos</h2>
              <p className="muted">Retira la tapa, deja los cubiertos fuera y calienta en el microondas.</p>
              <button className="btn primary block" onClick={() => setHeatStart(Date.now())}>
                Iniciar temporizador
              </button>
            </>
          ) : left > 0 ? (
            <>
              <div className="ring" style={{ '--p': `${(1 - left / HEAT) * 360}deg` }}>
                <b>
                  {mm}:{ss}
                </b>
              </div>
              <button className="btn ghost sm" onClick={() => setFast(true)} disabled={fast}>
                Adelantar (demo)
              </button>
            </>
          ) : (
            <>
              <h2>¡Buen provecho! 🥗</h2>
              <p className="muted">¿Qué tal estuvo?</p>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => patch({ rating: n })} aria-label={`${n} estrellas`}>
                    <Icon name="star" size={34} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {status === 'done' && (
        <div className="card center">
          <h2>¡Gracias!</h2>
          <div className="stars static">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={n <= o.rating ? 'on' : ''}>
                <Icon name="star" size={28} />
              </span>
            ))}
          </div>
          <p className="muted">Tu empaque es kraft reciclado: déjalo en el contenedor del punto.</p>
          <Link to="/" className="btn primary block">
            Volver al menú
          </Link>
        </div>
      )}

      <section className="sec">
        <h3>Detalle</h3>
        {o.items.map((it) => (
          <div key={it.id} className="line">
            <span>
              {it.qty} × {bowlById(it.id).name}
            </span>
          </div>
        ))}
        <div className="line total">
          <span>Total {o.pay === 'card' ? '(pagado con tarjeta)' : '(pagar en la máquina)'}</span>
          <b>Q{o.total.toFixed(2)}</b>
        </div>
      </section>
    </div>
  )
}
