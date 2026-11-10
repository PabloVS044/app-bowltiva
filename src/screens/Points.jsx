import { useEffect, useState } from 'react'
import { BOWLS, POINTS } from '../data.js'
import { useStore } from '../store.jsx'
import { BowlArt, Icon, TopBar } from '../components/ui.jsx'

function ago(t, now) {
  const s = Math.max(0, Math.round((now - t) / 1000))
  return s < 5 ? 'justo ahora' : s < 60 ? `hace ${s} s` : `hace ${Math.round(s / 60)} min`
}

export default function Points() {
  const { state, dispatch } = useStore()
  const [sel, setSel] = useState(state.pointId)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const point = POINTS.find((p) => p.id === sel)
  const stock = state.stock[sel] || {}
  const total = Object.values(stock).reduce((a, b) => a + b, 0)

  return (
    <div className="screen points">
      <TopBar title="Puntos de retiro" back={false} />

      {/* Mapa ilustrado de la ciudad (no a escala) */}
      <div className="map">
        <svg viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true">
          <rect width="100" height="70" fill="#e8eedf" />
          <path d="M0 52 C20 46 30 60 55 50 S85 38 100 42" stroke="#fff" strokeWidth="3" fill="none" />
          <path d="M18 0 C24 20 20 40 30 70" stroke="#fff" strokeWidth="2.4" fill="none" />
          <path d="M60 0 C58 18 66 30 64 70" stroke="#fff" strokeWidth="2.4" fill="none" />
          <path d="M0 22 C30 26 60 16 100 20" stroke="#fff" strokeWidth="2" fill="none" />
          <circle cx="86" cy="60" r="9" fill="#d5e3c3" />
          <circle cx="10" cy="10" r="7" fill="#d5e3c3" />
        </svg>
        {POINTS.map((p) => (
          <button
            key={p.id}
            className={`map-pin ${sel === p.id ? 'on' : ''} ${p.soon ? 'soon' : ''}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onClick={() => setSel(p.id)}
            aria-label={p.name}
          >
            <Icon name={p.soon ? 'clock' : 'locker'} size={16} />
          </button>
        ))}
        <span className="map-note">Mapa ilustrativo · Ciudad de Guatemala</span>
      </div>

      <div className="point-card">
        <div className="pc-head">
          <div>
            <h2>{point.name}</h2>
            <p className="muted">
              {point.kind} · {point.where}
            </p>
          </div>
          {!point.soon && (
            <span className="live">
              <i /> en vivo
            </span>
          )}
        </div>

        {point.soon ? (
          <p className="soon-note">
            Fase 2: bowls para empresas que quieren alimentar mejor a sus equipos. ¿Te interesa en tu oficina? Escríbenos.
          </p>
        ) : (
          <>
            <div className="pc-meta">
              <span>
                <Icon name="clock" size={16} /> {point.hours}
              </span>
              <span>
                <b>{total}</b> bowls disponibles · actualizado {ago(state.stockAt, now)}
              </span>
            </div>
            <div className="stock-list">
              {BOWLS.map((b) => {
                const n = stock[b.id] ?? 0
                return (
                  <div key={b.id} className={`stock-row ${n ? '' : 'out'}`}>
                    <BowlArt bowl={b} size={40} />
                    <span>{b.name}</span>
                    <div className="bar">
                      <i style={{ width: `${Math.min(100, n * 10)}%` }} />
                    </div>
                    <b>{n}</b>
                  </div>
                )
              })}
            </div>
            <div className="pc-actions">
              <button
                className={`btn ${state.pointId === sel ? 'ghost' : 'primary'} grow`}
                disabled={state.pointId === sel}
                onClick={() => dispatch({ type: 'point', pointId: sel })}
              >
                {state.pointId === sel ? 'Es tu punto actual' : 'Recoger aquí'}
              </button>
              <button className="icon-btn" onClick={() => dispatch({ type: 'restock' })} aria-label="Reabastecer (demo)" title="Reabastecer (demo)">
                <Icon name="refresh" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
