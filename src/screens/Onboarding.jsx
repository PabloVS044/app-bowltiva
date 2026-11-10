import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CONDITIONS, GOALS, POINTS } from '../data.js'
import { useStore } from '../store.jsx'
import { Icon } from '../components/ui.jsx'

export default function Onboarding({ edit = false }) {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const p = state.profile || {}
  const [step, setStep] = useState(edit ? 1 : 0)
  const [name, setName] = useState(p.name || '')
  const [goals, setGoals] = useState(p.goals || [])
  const [conditions, setConditions] = useState(p.conditions || [])
  const [pointId, setPointId] = useState(p.pointId || state.pointId)

  const toggle = (list, set, id) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const finish = () => {
    dispatch({ type: 'profile', profile: { name: name.trim(), goals, conditions, pointId } })
    nav('/', { replace: true })
  }

  if (step === 0) {
    return (
      <div className="onb onb-hero">
        <img className="onb-iso" src="/isotipo.png" alt="" />
        <h1>Bowltiva</h1>
        <p>
          Comida real, <b>lista en 5 minutos.</b>
        </p>
        <ul className="onb-points">
          <li>
            <Icon name="leaf" /> Bowls balanceados con etiqueta clara
          </li>
          <li>
            <Icon name="locker" /> Retíralo en máquinas y lockers
          </li>
          <li>
            <Icon name="clock" /> Calienta 3 minutos y listo
          </li>
        </ul>
        <button className="btn primary block" onClick={() => setStep(1)}>
          Empezar
        </button>
      </div>
    )
  }

  return (
    <div className="onb">
      <div className="onb-progress">
        {[1, 2, 3].map((k) => (
          <i key={k} className={k <= step ? 'on' : ''} />
        ))}
      </div>

      {step === 1 && (
        <>
          <h2>¿Cómo te llamamos?</h2>
          <input className="field" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
          <h2 className="mt">¿Qué buscas al comer?</h2>
          <p className="muted">Elige las que quieras.</p>
          <div className="choice-grid">
            {GOALS.map((g) => (
              <button key={g.id} className={`choice ${goals.includes(g.id) ? 'on' : ''}`} onClick={() => toggle(goals, setGoals, g.id)}>
                <Icon name={g.icon} size={26} />
                <span>{g.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2>¿Algo que debamos cuidar?</h2>
          <p className="muted">Lo usamos solo para recomendarte bowls. Se queda en tu teléfono.</p>
          <div className="choice-list">
            {CONDITIONS.map((c) => (
              <button key={c.id} className={`choice-row ${conditions.includes(c.id) ? 'on' : ''}`} onClick={() => toggle(conditions, setConditions, c.id)}>
                <span className="cr-check">{conditions.includes(c.id) && <Icon name="check" size={16} stroke={3} />}</span>
                <span>
                  <b>{c.label}</b>
                  <small>{c.hint}</small>
                </span>
              </button>
            ))}
          </div>
          <p className="muted small">No sustituye la consulta con un profesional de la salud.</p>
        </>
      )}

      {step === 3 && (
        <>
          <h2>¿Dónde lo recoges?</h2>
          <p className="muted">Tu punto favorito. Lo puedes cambiar cuando quieras.</p>
          <div className="choice-list">
            {POINTS.map((pt) => (
              <button
                key={pt.id}
                disabled={pt.soon}
                className={`choice-row ${pointId === pt.id ? 'on' : ''}`}
                onClick={() => setPointId(pt.id)}
              >
                <span className="cr-check round">{pointId === pt.id && <Icon name="check" size={16} stroke={3} />}</span>
                <span>
                  <b>{pt.name}</b>
                  <small>
                    {pt.kind} · {pt.where}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="onb-actions">
        {step > 1 && (
          <button className="btn ghost" onClick={() => setStep(step - 1)}>
            Atrás
          </button>
        )}
        {step < 3 ? (
          <button className="btn primary" onClick={() => setStep(step + 1)}>
            Continuar
          </button>
        ) : (
          <button className="btn primary" onClick={finish}>
            {edit ? 'Guardar' : 'Ver mi menú'}
          </button>
        )}
      </div>
    </div>
  )
}
