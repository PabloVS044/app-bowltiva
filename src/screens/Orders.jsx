import { Link } from 'react-router-dom'
import { bowlById, pointById } from '../data.js'
import { orderStatus, useStore } from '../store.jsx'
import { Icon, TopBar } from '../components/ui.jsx'

const LABEL = {
  scheduled: 'Programado',
  preparing: 'Preparando',
  ready: 'Listo para retirar',
  picked: 'Retirado',
  done: 'Completado',
}

export default function Orders() {
  const { state } = useStore()
  return (
    <div className="screen">
      <TopBar title="Mis pedidos" back={false} />
      {!state.orders.length && (
        <div className="empty-state">
          <Icon name="locker" size={56} stroke={1.5} />
          <h2>Aún no tienes pedidos</h2>
          <p className="muted">Cuando reserves un bowl aparecerá aquí con tu código de retiro.</p>
          <Link to="/" className="btn primary">
            Ver menú
          </Link>
        </div>
      )}
      <div className="orders">
        {state.orders.map((o) => {
          const st = orderStatus(o)
          return (
            <Link key={o.id} to={`/pedido/${o.id}`} className="order-row">
              <div>
                <b>{o.items.map((it) => `${it.qty}× ${bowlById(it.id).name}`).join(', ')}</b>
                <small>
                  {pointById(o.pointId).name} · {new Date(o.createdAt).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })}
                </small>
              </div>
              <span className={`status ${st}`}>{LABEL[st]}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
