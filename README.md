# Bowltiva — app (prototipo)

Web app móvil (PWA) de Bowltiva: elegir un bowl con información nutricional clara, reservarlo en una máquina o locker, retirarlo con un código y calentarlo en 3 minutos.

Es un **MVP funcional**:
- Con servidor, los pedidos y el stock son compartidos, y el equipo los ve y los mueve en el **panel de administración**.
- Sin servidor, la app sigue funcionando sola en el teléfono, con datos simulados.
- El pago es simulado.

## Correrla

```bash
npm install
npm run dev        # http://localhost:5190 (también por IP en la red local)
npm run build && npm run preview   # versión final en http://localhost:4190
```

En el teléfono se puede **instalar**:
- Android/Chrome: menú ⋮ → *Agregar a pantalla principal*.
- iPhone/Safari: Compartir → *Agregar a inicio*.

## Desplegar en Vercel

1. Proyecto con **Framework Preset: Vite**, Build `npm run build`, Output `dist`. Las rutas usan `#/`, así que no hacen falta rewrites.
2. **Storage → Upstash for Redis → Connect Project**. Puede ser la misma base que usa la presentación: las claves no chocan. Vercel agrega solas `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
3. **Settings → Environment Variables**: agrega `ADMIN_PIN` (el PIN del panel).
4. **Redeploy**.

Sin Redis, `/api` responde 503 y la app pasa sola a modo local.

## Panel de administración

`/#/admin` (pide `ADMIN_PIN`) muestra:
- pedidos en vivo, en columnas: Nuevos → Preparando → Listos → Retirados;
- botones **Preparar** y **Cargado en puerta #n**: al tocarlos, el teléfono del cliente muestra el código de retiro;
- stock de cada máquina o locker, con alertas y botón para reabastecer;
- ventas del día.

`/#/admin?compacto` es la versión que va incrustada en la presentación.

Si nadie toca el panel, los pedidos para «Ahora» avanzan solos: a los ~4 s pasan a preparando y a los ~10 s a listo. Así la app funciona aunque el jurado la pruebe sin nadie en el panel.

## Modo espejo (para la presentación)

- `?transmitir=pitch` en el teléfono: transmite la pantalla (ruta, scroll, toques y estado). Se recuerda; `?transmitir=0` lo apaga.
- `?ver=pitch` en el iPhone del deck: repite lo que hace ese teléfono, en solo lectura.
- `#/demo`: deja listo un perfil de ejemplo («Elena», presión alta, más proteína, UVG).

## Qué incluye

| Pantalla | Ruta | Qué hace |
|---|---|---|
| Bienvenida | `#/bienvenida` | Nombre, objetivos, condición de salud (presión alta, diabetes, colesterol, vegetariano) y punto favorito |
| Inicio | `#/` | Bowl recomendado según el perfil y por qué, filtros (bajo en sodio, alta proteína, alta fibra…), stock en tu punto |
| Bowl | `#/bowl/:id` | Etiqueta nutricional con % del valor diario, semáforo de sodio, ingredientes, disponibilidad por punto |
| Carrito | `#/carrito` | Punto de retiro, horario (ahora o programado), pago con tarjeta o en la máquina |
| Pedido | `#/pedido/:id` | Seguimiento → código de 4 dígitos + QR + número de puerta → «Ya lo retiré» → temporizador de 3 min → calificación |
| Pedidos | `#/pedidos` | Historial |
| Puntos | `#/puntos` | Mapa ilustrado (UVG, Paseo Cayalá, Zona 10 próximamente) con stock «en vivo» por bowl |
| Perfil | `#/perfil` | Preferencias de salud, resumen (bowls, proteína, sodio vs. combo de comida rápida, tiempo ahorrado), impacto, reiniciar demo |

Botones marcados «(demo)» aceleran el flujo para presentarlo: simular la hora programada, adelantar el temporizador y reabastecer una máquina.

## Dónde cambiar cosas

- `src/data.js`: menú, valores nutricionales, precio (Q45), puntos de retiro, stock inicial y reglas de recomendación (`scoreBowl`).
- `src/store.jsx`: estado, carrito, pedidos, sincronización con el servidor y espejo.
- `src/api.js`: cliente de `/api`.
- `api/_core.js`: backend (pedidos, stock, espejo) para Vercel y para `npm run dev`.
- `src/screens/Admin.jsx`: panel del equipo.
- `src/screens/`: una pantalla por archivo.
- `src/styles.css`: estilos con la paleta oficial de Bowltiva.

Los valores nutricionales son de referencia para el prototipo; en la versión real saldrían del diseño de menú con nutricionista.
