import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { DAILY, TAGS, tagsOf } from '../data.js'
import { useStore } from '../store.jsx'

// ---------- Íconos (trazo 24×24) ----------
const P = {
  home: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z"/>',
  pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>',
  bag: '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19 14 10"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  scale: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7ZM19 7l-3 7a3 3 0 0 0 6 0l-3-7Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  heart: '<path d="M12 20s-7.5-4.6-9.3-9.3C1.5 7.3 3.7 4 7 4c2 0 3.6 1.2 5 3 1.4-1.8 3-3 5-3 3.3 0 5.5 3.3 4.3 6.7C19.5 15.4 12 20 12 20Z"/>',
  locker: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 9h18M3 15h18"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-1-2-2-2-4-2 2-2 5-2 8 0 4 3 7 7 7Z"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  salt: '<path d="M8 8h8l1 13H7L8 8ZM9 8V5a3 3 0 0 1 6 0v3"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"/>',
}

export function Icon({ name, size = 22, stroke = 2, className = '' }) {
  return (
    <svg
      className={`ic ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: P[name] || '' }}
    />
  )
}

// ---------- Bowl ilustrado (vista desde arriba, kraft) ----------
export function BowlArt({ bowl, size = 120, photo = true }) {
  if (photo && bowl.photo) {
    return (
      <div className="bowl-photo" style={{ width: size, height: size }}>
        <img src={bowl.photo} alt="" />
      </div>
    )
  }
  const [a, b, c, d] = bowl.parts
  return (
    <svg className="bowl-art" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#c9a26a" />
      <circle cx="50" cy="50" r="42" fill="#f5efe2" />
      <path d="M50 50 L50 10 A40 40 0 0 1 90 50 Z" fill={a} />
      <path d="M50 50 L90 50 A40 40 0 0 1 50 90 Z" fill={b} />
      <path d="M50 50 L50 90 A40 40 0 0 1 10 50 Z" fill={c} />
      <path d="M50 50 L10 50 A40 40 0 0 1 50 10 Z" fill={d} />
      <circle cx="50" cy="50" r="9" fill="#faf9f6" opacity=".9" />
      <circle cx="50" cy="50" r="4" fill="#6b9a3d" />
      <g fill="#fff" opacity=".35">
        <circle cx="68" cy="28" r="2" />
        <circle cx="74" cy="66" r="2" />
        <circle cx="30" cy="70" r="2" />
        <circle cx="28" cy="32" r="2" />
      </g>
    </svg>
  )
}

export function Tags({ bowl, max = 3 }) {
  return (
    <div className="tags">
      {tagsOf(bowl)
        .slice(0, max)
        .map((k) => (
          <span key={k} className={`tag ${TAGS[k].color}`}>
            {TAGS[k].label}
          </span>
        ))}
      {bowl.vegan ? <span className="tag olive">Vegano</span> : bowl.veg ? <span className="tag olive">Vegetariano</span> : null}
    </div>
  )
}

// ---------- Etiqueta nutricional (formato tabla, con % del valor diario) ----------
export function NutritionLabel({ n }) {
  const row = (label, v, unit, key, strong) => (
    <div className={`nl-row ${strong ? 'strong' : ''}`}>
      <span>{label}</span>
      <b>
        {v} {unit}
      </b>
      <em>{Math.round((v / DAILY[key]) * 100)} %</em>
    </div>
  )
  const sodiumLevel = n.sodium <= 400 ? 'low' : n.sodium <= 600 ? 'mid' : 'high'
  return (
    <div className="nlabel">
      <div className="nl-head">
        <span>Información nutricional</span>
        <small>1 bowl · % valor diario*</small>
      </div>
      <div className="nl-kcal">
        <span>Calorías</span>
        <b>{n.kcal}</b>
      </div>
      {row('Proteína', n.protein, 'g', 'protein', true)}
      {row('Carbohidratos', n.carbs, 'g', 'carbs')}
      {row('Grasas', n.fat, 'g', 'fat')}
      {row('Fibra', n.fiber, 'g', 'fiber')}
      {row('Azúcares', n.sugar, 'g', 'sugar')}
      {row('Sodio', n.sodium, 'mg', 'sodium', true)}
      <div className={`nl-sodium ${sodiumLevel}`}>
        <Icon name="salt" size={18} />
        <span>
          Sodio {sodiumLevel === 'low' ? 'bajo' : sodiumLevel === 'mid' ? 'moderado' : 'alto'}: {Math.round((n.sodium / DAILY.sodium) * 100)} % de lo
          recomendado al día
        </span>
      </div>
      <p className="nl-foot">*Con base en una dieta de 2,000 kcal y menos de 2,000 mg de sodio al día (OMS). Valores de referencia del prototipo.</p>
    </div>
  )
}

// ---------- QR ----------
export function QR({ text, size = 200 }) {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    QRCode.toString(text, { type: 'svg', margin: 1, color: { dark: '#31441e', light: '#ffffff' } }).then(setSvg)
  }, [text])
  return <div className="qr" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />
}

// ---------- Barra superior ----------
export function TopBar({ title, back = true, right = null }) {
  const nav = useNavigate()
  return (
    <header className="topbar">
      {back ? (
        <button className="icon-btn" onClick={() => (history.length > 1 ? nav(-1) : nav('/'))} aria-label="Regresar">
          <Icon name="back" />
        </button>
      ) : (
        <span className="icon-btn ghost" />
      )}
      <h1>{title}</h1>
      {right || <span className="icon-btn ghost" />}
    </header>
  )
}

// ---------- Barra de pestañas ----------
export function TabBar() {
  const { cartCount, state } = useStore()
  const active = state.orders.some((o) => !o.pickedAt)
  const tab = (to, icon, label, badge) => (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => `tab ${isActive ? 'on' : ''}`}>
      <span className="tab-ic">
        <Icon name={icon} />
        {badge ? <i className="badge">{badge}</i> : null}
      </span>
      <span>{label}</span>
    </NavLink>
  )
  return (
    <nav className="tabbar">
      {tab('/', 'home', 'Inicio')}
      {tab('/puntos', 'pin', 'Puntos')}
      {tab('/carrito', 'bag', 'Carrito', cartCount || null)}
      {tab('/pedidos', 'locker', 'Pedidos', active ? '•' : null)}
      {tab('/perfil', 'user', 'Perfil')}
    </nav>
  )
}

export const q = (n) => `Q${n.toFixed(2)}`
