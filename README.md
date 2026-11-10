# Bowltiva — app (prototipo)

Web app móvil (PWA) de Bowltiva: elegir un bowl con información nutricional clara, reservarlo en una máquina o locker, retirarlo con un código y calentarlo en 3 minutos.

Es un **prototipo con datos simulados**. Todo se guarda en el teléfono (localStorage), el pago es simulado y el stock de las máquinas cambia solo para simular compras de otras personas. Sirve para mostrar cómo sería la app real.

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

Proyecto nuevo con **Framework Preset: Vite**, Build `npm run build`, Output `dist`. No necesita variables de entorno ni rewrites: las rutas usan `#/`.

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
- `src/store.jsx`: estado, carrito, pedidos y la simulación de stock.
- `src/screens/`: una pantalla por archivo.
- `src/styles.css`: estilos con la paleta oficial de Bowltiva.

Los valores nutricionales son de referencia para el prototipo; en la versión real saldrían del diseño de menú con nutricionista.
