import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { StoreProvider, useStore } from './store.jsx'
import { TabBar } from './components/ui.jsx'
import Onboarding from './screens/Onboarding.jsx'
import Home from './screens/Home.jsx'
import BowlDetail from './screens/BowlDetail.jsx'
import Cart from './screens/Cart.jsx'
import Order from './screens/Order.jsx'
import Orders from './screens/Orders.jsx'
import Points from './screens/Points.jsx'
import Profile from './screens/Profile.jsx'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Shell() {
  const { state } = useStore()
  const { pathname } = useLocation()
  if (!state.profile && pathname !== '/bienvenida') return <Navigate to="/bienvenida" replace />
  const noTabs = pathname === '/bienvenida' || pathname === '/perfil/editar' || pathname.startsWith('/bowl/')
  return (
    <div className={`phone ${noTabs ? '' : 'with-tabs'}`}>
      <ScrollTop />
      <Routes>
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
