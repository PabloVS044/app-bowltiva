import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useLayoutEffect, useState } from 'react'
import { StoreProvider, useStore } from './store.jsx'
import { SEND, VIEW } from './api.js'
import { TabBar } from './components/ui.jsx'
import Onboarding from './screens/Onboarding.jsx'
import Home from './screens/Home.jsx'
import BowlDetail from './screens/BowlDetail.jsx'
import Cart from './screens/Cart.jsx'
import Order from './screens/Order.jsx'
import Orders from './screens/Orders.jsx'
import Points from './screens/Points.jsx'
import Profile from './screens/Profile.jsx'
import Admin from './screens/Admin.jsx'

// Dentro de otra página (el iPhone de la presentación): se deja espacio para la Dynamic Island
const EMBED = (() => {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
})()

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (!VIEW) window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// /demo: deja un perfil de ejemplo listo para presentar
function Demo() {
  const { dispatch } = useStore()
  const nav = useNavigate()
  useEffect(() => {
    dispatch({ type: 'profile', profile: { name: 'Elena', goals: ['proteina', 'tiempo'], conditions: ['hipertension'], pointId: 'uvg' } })
    nav('/', { replace: true })
  }, [])
  return null
}

// Modo espejo: sigue la ruta, el scroll y los toques del teléfono que transmite
function Follow() {
  const { snap } = useStore()
  const nav = useNavigate()
  const { pathname, search } = useLocation()
  const [taps, setTaps] = useState([])

  useEffect(() => {
    if (snap?.path && snap.path !== pathname + search) nav(snap.path, { replace: true })
  }, [snap?.path])

  useLayoutEffect(() => {
    if (!snap) return
    const max = Math.max(0, document.documentElement.scrollHeight - innerHeight)
    window.scrollTo({ top: (snap.scroll || 0) * max, behavior: 'instant' })
  })

  useEffect(() => {
    if (!snap?.tap) return
    setTaps((t) => (t.some((x) => x.id === snap.tap.id) ? t : [...t.slice(-3), snap.tap]))
  }, [snap?.tap?.id])

  if (!snap) {
    return (
      <div className="mirror-wait">
        <img src="/isotipo.png" alt="" />
        <b>Bowltiva</b>
        <span>Esperando el teléfono de la demo…</span>
      </div>
    )
  }
  return (
    <div className="taps" aria-hidden="true">
      {taps.map((t) => (
        <i key={t.id} style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%` }} onAnimationEnd={() => setTaps((l) => l.filter((x) => x.id !== t.id))} />
      ))}
    </div>
  )
}

function Shell() {
  const { state } = useStore()
  const { pathname } = useLocation()
  if (pathname === '/admin') return <Admin />
  if (!VIEW && !state.profile && pathname !== '/bienvenida' && pathname !== '/demo') return <Navigate to="/bienvenida" replace />
  const noTabs = pathname === '/bienvenida' || pathname === '/perfil/editar' || pathname.startsWith('/bowl/')
  return (
    <div className={`phone ${noTabs ? '' : 'with-tabs'} ${VIEW ? 'viewer' : ''} ${EMBED ? 'embedded' : ''}`}>
      <ScrollTop />
      {VIEW && <Follow />}
      {SEND && <span className="sending" title={`Transmitiendo a la sala «${SEND}»`} />}
      <Routes>
        <Route path="/demo" element={<Demo />} />
        <Route path="/bienvenida" element={<Onboarding />} />
        <Route path="/" element={<Home />} />
        <Route path="/bowl/:id" element={<BowlDetail />} />
        <Route path="/carrito" element={<Cart />} />
        <Route path="/pedido/:id" element={<Order />} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/puntos" element={<Points />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/perfil/editar" element={<Onboarding edit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!noTabs && <TabBar />}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </StoreProvider>
  )
}
