import { Link } from 'react-router-dom'
import { CONDITIONS, DAILY, GOALS, bowlById, pointById } from '../data.js'
import { useStore } from '../store.jsx'
import { Icon, TopBar } from '../components/ui.jsx'

export default function Profile() {
  const { state, dispatch } = useStore()
  const p = state.profile || {}

  // Resumen de lo que ha comido con Bowltiva
  const items = state.orders.flatMap((o) => o.items.flatMap((it) => Array(it.qty).fill(bowlById(it.id))))
  const avg = (k) => (items.length ? Math.round(items.reduce((s, b) => s + b.n[k], 0) / items.length) : 0)
  const sodium = avg('sodium')
  const fastFoodSodium = 1400 // referencia ilustrativa de un combo de comida rápida

  return (
    <div className="screen profile">
      <TopBar title="Mi perfil" back={false} />

      <div className="me">
        <div className="avatar">{(p.name || 'B')[0].toUpperCase()}</div>
        <div>
          <h2>{p.name || 'Sin nombre'}</h2>
          <small className="muted">
            <Icon name="pin" size={14} /> {pointById(state.pointId).name}
          </small>
        </div>
      </div>

      <section className="sec">
        <h3>Mi salud</h3>
        <div className="chips wrap">
          {(p.goals || []).map((g) => (
            <span key={g} className="chip on">
              {GOALS.find((x) => x.id === g)?.label}
            </span>
          ))}
          {(p.conditions || []).map((c) => (
            <span key={c} className="chip red">
              {CONDITIONS.find((x) => x.id === c)?.label}
            </span>
          ))}
          {!p.goals?.length && !p.conditions?.length && <span className="muted">Sin preferencias todavía.</span>}
        </div>
        <Link to="/perfil/editar" className="btn ghost sm">
          Editar preferencias
        </Link>
      </section>

      <section className="sec">
        <h3>Mi resumen</h3>
        {items.length ? (
          <>
            <div className="stats">
              <div>
                <b>{items.length}</b>
                <span>bowls</span>
              </div>
              <div>
                <b>{avg('protein')} g</b>
                <span>proteína prom.</span>
              </div>
              <div>
                <b>{items.length * 25} min</b>
                <span>ahorrados*</span>
              </div>
            </div>
            <div className="compare">
              <span>Sodio promedio por comida</span>
              <div className="cmp-row">
                <small>Bowltiva</small>
                <div className="bar">
                  <i style={{ width: `${(sodium / DAILY.sodium) * 100}%` }} />
                </div>
                <b>{sodium} mg</b>
              </div>
              <div className="cmp-row bad">
                <small>Combo rápido</small>
                <div className="bar">
                  <i style={{ width: `${(fastFoodSodium / DAILY.sodium) * 100}%` }} />
                </div>
                <b>~{fastFoodSodium} mg</b>
              </div>
            </div>
            <p className="muted small">*Frente a cocinar o hacer fila: estimado de 25 min por comida. Combo rápido: referencia ilustrativa.</p>
          </>
        ) : (
          <p className="muted">Tu primer bowl llenará este resumen.</p>
        )}
      </section>

      <section className="sec">
        <h3>Nuestro impacto</h3>
        <div className="impact">
          <div>
            <Icon name="leaf" />
            <span>Empaque 100 % kraft reciclado</span>
          </div>
          <div>
            <Icon name="heart" />
            <span>Día solidario anual por la nutrición infantil</span>
          </div>
        </div>
      </section>

      <button
        className="btn ghost sm danger"
        onClick={() => {
          if (confirm('¿Borrar perfil, pedidos y carrito de este teléfono?')) dispatch({ type: 'reset' })
        }}
      >
        Reiniciar demo
      </button>
      <p className="muted small center">Prototipo de Bowltiva · datos simulados en este teléfono.</p>
    </div>
  )
}
