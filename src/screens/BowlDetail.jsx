import { useNavigate, useParams } from 'react-router-dom'
import { POINTS, PRICE, bowlById, scoreBowl } from '../data.js'
import { useMirror, useStore } from '../store.jsx'
import { BowlArt, Icon, NutritionLabel, Tags, TopBar } from '../components/ui.jsx'

export default function BowlDetail() {
  const { id } = useParams()
  const bowl = bowlById(id)
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [qty, setQty] = useMirror(`detail.${id}.qty`, 1)
  if (!bowl) return <p className="empty">Bowl no encontrado.</p>

  const { why } = scoreBowl(bowl, state.profile)
  const left = state.stock[state.pointId]?.[bowl.id] ?? 0

  const add = () => {
    dispatch({ type: 'add', id: bowl.id, qty })
    nav('/carrito')
  }

  return (
    <div className="screen detail">
      <TopBar title="" />
      <div className="detail-art">
        <BowlArt bowl={bowl} size={230} />
      </div>
      <h1 className="detail-name">{bowl.name}</h1>
      <p className="muted">{bowl.desc}</p>
      <Tags bowl={bowl} max={4} />

      {why.length > 0 && (
        <div className="why">
          <Icon name="heart" size={20} />
          <div>
            <b>Por qué te lo recomendamos</b>
            <span>{why.join(' · ')}</span>
          </div>
        </div>
      )}

      <div className="macro-row">
        <div>
          <b>{bowl.n.kcal}</b>
          <span>kcal</span>
        </div>
        <div>
          <b>{bowl.n.protein} g</b>
          <span>proteína</span>
        </div>
        <div>
          <b>{bowl.n.fiber} g</b>
          <span>fibra</span>
        </div>
        <div>
          <b>{bowl.n.sodium}</b>
          <span>mg sodio</span>
        </div>
      </div>

      <NutritionLabel n={bowl.n} />

      <section className="sec">
        <h3>Ingredientes</h3>
        <ul className="ingr">
          {bowl.ingredients.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
        <p className="muted small">Sin conservantes artificiales · Empaque kraft reciclado y cubiertos compostables.</p>
      </section>

      <section className="sec">
        <h3>Disponibilidad</h3>
        {POINTS.filter((p) => !p.soon).map((p) => {
          const n = state.stock[p.id]?.[bowl.id] ?? 0
          return (
            <button key={p.id} className={`avail ${state.pointId === p.id ? 'on' : ''}`} onClick={() => dispatch({ type: 'point', pointId: p.id })}>
              <Icon name="pin" size={18} />
              <span>{p.name}</span>
              <b className={n === 0 ? 'none' : n <= 3 ? 'low' : ''}>{n ? `${n} disponibles` : 'Agotado'}</b>
            </button>
          )
        })}
      </section>

      <div className="buybar">
        <div className="stepper">
          <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos">
            <Icon name="minus" stroke={3} />
          </button>
          <b>{qty}</b>
          <button onClick={() => setQty(Math.min(Math.max(1, left), qty + 1))} aria-label="Más">
            <Icon name="plus" stroke={3} />
          </button>
        </div>
        <button className="btn primary grow" disabled={!left} onClick={add}>
          {left ? `Agregar · Q${PRICE * qty}` : 'Agotado en tu punto'}
        </button>
      </div>
    </div>
  )
}
