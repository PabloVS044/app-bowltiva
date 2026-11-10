import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { handle } from './api/_core.js'

// Sirve /api/* también en local (npm run dev / npm run preview).
function api() {
  const mw = async (req, res, next) => {
    const m = req.url.match(/^\/api\/(orders|stock|mirror)(\?.*)?$/)
    if (!m) return next()
    const url = new URL(req.url, 'http://localhost')
    let raw = ''
    for await (const c of req) raw += c
    let body = {}
    try {
      body = raw ? JSON.parse(raw) : {}
    } catch {}
    const { status, json } = await handle(m[1], { method: req.method, query: Object.fromEntries(url.searchParams), body })
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify(json))
  }
  return {
    name: 'bowltiva-api',
    configureServer(server) {
      server.middlewares.use(mw)
    },
    configurePreviewServer(server) {
      server.middlewares.use(mw)
    },
  }
}

export default defineConfig({
  plugins: [react(), api()],
  server: { port: 5190 },
  preview: { port: 4190 },
})
