import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BOWLS, PRICE, TAGS, pointById, scoreBowl, tagsOf } from '../data.js'
import { orderStatus, useMirror, useStore } from '../store.jsx'
import { BowlArt, Icon, Tags } from '../components/ui.jsx'

const FILTERS = [{ id: 'todos', label: 'Todos' }, ...Object.entries(TAGS).map(([id, t]) => ({ id, label: t.label })), { id: 'veg', label: 'Vegetariano' }]

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

export default function Home() {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = useMirror('home.filter', 'todos')
  const point = pointById(state.pointId)
  const stock = state.stock[state.pointId] || {}
  const active = state.orders.find((o) => ['new', 'preparing', 'ready', 'scheduled'].includes(orderStatus(o)))

  const ranked = useMemo(
    () =>
      BOWLS.map((b) => ({ b, ...scoreBowl(b, state.profile) }))
        .filter((x) => x.score > -100)
        .sort((x, y) => y.score - x.score),
    [state.profile],
  )
  const pick = ranked[0]
  const list = ranked.filter(({ b }) =>
    filter === 'todos' ? true : filter === 'veg' ? b.veg : tagsOf(b).includes(filter),
  )

  return (
    <div className="screen home">
      <header className="home-head">
        <div>
          <span className="muted">{greeting()}</span>
          <h1>{state.profile?.name ? `${state.profile.name} 👋` : 'Hola 👋'}</h1>
        </div>
        <img src="/isotipo.png" alt="" className="home-iso" />
      </header>

      {active && (
        <Link to={`/pedido/${active.id}`} className="active-order">
          <Icon name="locker" size={26} />
          <div>
            <b>{orderStatus(active) === 'ready' ? `¡Listo! Código ${active.code}` : 'Tu pedido está en camino'}</b>
            <small>{pointById(active.pointId).name}</small>
          </div>
          <Icon name="back" className="flip" />
        </Link>
      )}

      <Link to="/puntos" className="point-pill">
        <Icon name="pin" size={18} />
        <span>
          Recoger en <b>{point.name}</b>
        </span>
        <small>cambiar</small>
      </Link>

      {pick && state.profile && (
        <Link to={`/bowl/${pick.b.id}`} className="reco">
          <div className="reco-txt">
            <span className="eyebrow">
              <Icon name="spark" size={14} /> Recomendado para ti
            </span>
            <h2>{pick.b.name}</h2>
            <p>{pick.why.length ? pick.why.join(' · ') : pick.b.short}</p>
            <span className="reco-cta">Q{PRICE} · ver bowl</span>
          </div>
          <BowlArt bowl={pick.b} size={128} />
        </Link>
      )}

      <div className="chips">
        {FILTERS.map((f) => (
          <button key={f.id} className={`chip ${filter === f.id ? 'on' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="menu">
        {list.map(({ b, why }) => {
          const left = stock[b.id] ?? 0
          return (
            <div key={b.id} className={`menu-item ${left ? '' : 'out'}`}>
              <Link to={`/bowl/${b.id}`} className="mi-link">
                <BowlArt bowl={b} size={84} />
                <div className="mi-txt">
                  <h3>{b.name}</h3>
                  <p className="mi-macros">
                    {b.n.kcal} kcal · {b.n.protein} g proteína · {b.n.sodium} mg sodio
                  </p>
                  <Tags bowl={b} max={2} />
                  {why.length > 0 && <p className="mi-why">✓ {why[0]}</p>}
                </div>
              </Link>
              <div className="mi-foot">
                <b>Q{PRICE}</b>
                <span className={`stock ${left === 0 ? 'none' : left <= 3 ? 'low' : ''}`}>{left ? `Quedan ${left}` : 'Agotado aquí'}</span>
                <button className="add" disabled={!left} onClick={() => dispatch({ type: 'add', id: b.id })} aria-label={`Agregar ${b.name}`}>
                  <Icon name="plus" stroke={3} />
                </button>
              </div>
            </div>
          )
        })}
        {!list.length && <p className="empty">No hay bowls con ese filtro.</p>}
      </div>
    </div>
  )
}
