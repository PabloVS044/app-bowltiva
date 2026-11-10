// Cliente del backend (/api). Si el servidor no responde, la app sigue en modo local.

async function call(path, { method = 'GET', body } = {}) {
  try {
    const res = await fetch(path, {
      method,
      cache: 'no-store',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    let json = {}
    try {
      json = await res.json()
    } catch {}
    return { status: res.status, json }
  } catch {
    return { status: 0, json: {} }
  }
}

export const api = {
  stock: () => call('/api/stock'),
  restock: (pin, pointId) => call('/api/stock', { method: 'POST', body: { pin, pointId } }),
  createOrder: (order) => call('/api/orders', { method: 'POST', body: order }),
  getOrders: (ids) => call(`/api/orders?ids=${ids.map(encodeURIComponent).join(',')}`),
  allOrders: (pin) => call(`/api/orders?pin=${encodeURIComponent(pin || '')}`),
  patchOrder: (id, action, extra = {}) => call('/api/orders', { method: 'PATCH', body: { id, action, ...extra } }),
  mirrorGet: (sala) => call(`/api/mirror?sala=${encodeURIComponent(sala)}`),
  mirrorPost: (sala, snap) => call('/api/mirror', { method: 'POST', body: { sala, snap } }),
}

// ---------- Modo demo: transmitir (teléfono) o ver (iPhone del deck) ----------
function param(name) {
  const q = new URLSearchParams(location.search)
  const h = new URLSearchParams(location.hash.split('?')[1] || '')
  return q.get(name) ?? h.get(name)
}

function remembered(name) {
  const v = param(name)
  try {
    if (v === '0' || v === '') localStorage.removeItem(`bowltiva-${name}`)
    else if (v) localStorage.setItem(`bowltiva-${name}`, v.toLowerCase())
    return localStorage.getItem(`bowltiva-${name}`) || ''
  } catch {
    return v || ''
  }
}

/** Sala que transmite este teléfono (?transmitir=pitch, se recuerda; ?transmitir=0 la apaga). */
export const SEND = remembered('transmitir')
/** Sala que este iPhone del deck repite (?ver=pitch). Solo lectura. */
export const VIEW = (param('ver') || '').toLowerCase()
