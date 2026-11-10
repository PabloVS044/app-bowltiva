// Datos del prototipo. Los valores nutricionales son de referencia para la demo;
// en producción saldrían del diseño de menú con nutricionista.

export const PRICE = 45 // Q, dentro del rango validado (Q36–Q45)

// Referencias diarias (adulto, 2,000 kcal; OMS recomienda < 2,000 mg de sodio)
export const DAILY = { kcal: 2000, protein: 50, carbs: 275, fat: 70, fiber: 28, sodium: 2000, sugar: 50 }

// Colores de ingredientes para dibujar cada bowl
const C = {
  pollo: '#e8c58f',
  quinoa: '#ead9a6',
  brocoli: '#6b9a3d',
  zanahoria: '#f08a3c',
  salmon: '#f29b74',
  arroz: '#d9c48f',
  espinaca: '#3f7a2a',
  res: '#8a4b2a',
  camote: '#e9813a',
  ejote: '#7fae4a',
  huevo: '#f5d65b',
  frijol: '#4a2d22',
  aguacate: '#9cc45a',
  pavo: '#e3b98a',
  lenteja: '#a8743f',
  pimiento: '#e63b2e',
  tofu: '#f3ead2',
  edamame: '#8cc152',
  repollo: '#8e5a9e',
  tomate: '#e63b2e',
  pepino: '#a9d27a',
}

export const BOWLS = [
  {
    id: 'pollo-quinoa',
    name: 'Pollo, quinoa y brócoli',
    short: 'El clásico alto en proteína',
    desc: 'Pechuga a la plancha con quinoa, brócoli al vapor, zanahoria y aderezo de limón y hierbas.',
    ingredients: ['Pechuga de pollo a la plancha', 'Quinoa', 'Brócoli al vapor', 'Zanahoria', 'Aderezo de limón y hierbas'],
    parts: [C.pollo, C.quinoa, C.brocoli, C.zanahoria],
    n: { kcal: 520, protein: 42, carbs: 48, fat: 16, fiber: 8, sodium: 380, sugar: 5 },
    photo: '/bowl-hero.jpg',
  },
  {
    id: 'salmon-arroz',
    name: 'Salmón, arroz integral y espinaca',
    short: 'Omega‑3 para el corazón',
    desc: 'Salmón al horno sobre arroz integral, espinaca salteada, pepino y semillas de ajonjolí.',
    ingredients: ['Salmón al horno', 'Arroz integral', 'Espinaca salteada', 'Pepino', 'Ajonjolí'],
    parts: [C.salmon, C.arroz, C.espinaca, C.pepino],
    n: { kcal: 580, protein: 36, carbs: 52, fat: 22, fiber: 6, sodium: 420, sugar: 3 },
  },
  {
    id: 'res-camote',
    name: 'Res magra, camote y ejotes',
    short: 'Energía para la tarde',
    desc: 'Lomito de res en tiras, camote asado, ejotes y salsa de tomate natural sin sal añadida.',
    ingredients: ['Lomito de res', 'Camote asado', 'Ejotes', 'Salsa de tomate natural'],
    parts: [C.res, C.camote, C.ejote, C.tomate],
    n: { kcal: 560, protein: 38, carbs: 55, fat: 18, fiber: 9, sodium: 450, sugar: 8 },
  },
  {
    id: 'huevo-frijol',
    name: 'Huevo, frijol y aguacate',
    short: 'Vegetariano y lleno de fibra',
    desc: 'Huevo duro, frijol negro, aguacate, arroz integral, pico de gallo y repollo morado.',
    ingredients: ['Huevo duro', 'Frijol negro', 'Aguacate', 'Arroz integral', 'Pico de gallo', 'Repollo morado'],
    parts: [C.huevo, C.frijol, C.aguacate, C.repollo],
    n: { kcal: 490, protein: 24, carbs: 50, fat: 20, fiber: 14, sodium: 360, sugar: 4 },
    veg: true,
  },
  {
    id: 'pavo-lenteja',
    name: 'Pavo, lentejas y vegetales asados',
    short: 'Ligero y saciante',
    desc: 'Pechuga de pavo, lentejas, pimiento, zanahoria y brócoli asados con hierbas.',
    ingredients: ['Pechuga de pavo', 'Lentejas', 'Pimiento asado', 'Zanahoria', 'Brócoli'],
    parts: [C.pavo, C.lenteja, C.pimiento, C.brocoli],
    n: { kcal: 500, protein: 40, carbs: 44, fat: 14, fiber: 13, sodium: 340, sugar: 5 },
  },
  {
    id: 'tofu-edamame',
    name: 'Tofu, arroz integral y edamame',
    short: '100 % vegetal',
    desc: 'Tofu dorado, arroz integral, edamame, zanahoria y repollo con aderezo de jengibre.',
    ingredients: ['Tofu dorado', 'Arroz integral', 'Edamame', 'Zanahoria', 'Repollo', 'Aderezo de jengibre'],
    parts: [C.tofu, C.arroz, C.edamame, C.zanahoria],
    n: { kcal: 470, protein: 26, carbs: 58, fat: 14, fiber: 10, sodium: 400, sugar: 6 },
    veg: true,
    vegan: true,
  },
]

export const bowlById = (id) => BOWLS.find((b) => b.id === id)

// Etiquetas que se calculan de los valores nutricionales
export const TAGS = {
  sodio: { label: 'Bajo en sodio', test: (n) => n.sodium <= 400, color: 'red' },
  proteina: { label: 'Alta proteína', test: (n) => n.protein >= 36, color: 'green' },
  fibra: { label: 'Alta fibra', test: (n) => n.fiber >= 10, color: 'amber' },
  ligero: { label: 'Menos de 500 kcal', test: (n) => n.kcal < 500, color: 'olive' },
}

export const tagsOf = (bowl) => Object.entries(TAGS).filter(([, t]) => t.test(bowl.n)).map(([k]) => k)

// Perfil de salud → reglas de recomendación
export const GOALS = [
  { id: 'sano', label: 'Comer más balanceado', icon: 'leaf' },
  { id: 'proteina', label: 'Más proteína', icon: 'bolt' },
  { id: 'peso', label: 'Cuidar mi peso', icon: 'scale' },
  { id: 'tiempo', label: 'Ahorrar tiempo', icon: 'clock' },
]

export const CONDITIONS = [
  { id: 'hipertension', label: 'Presión alta', hint: 'Priorizamos menos sodio' },
  { id: 'diabetes', label: 'Diabetes o prediabetes', hint: 'Priorizamos fibra y menos azúcar' },
  { id: 'colesterol', label: 'Colesterol alto', hint: 'Priorizamos grasas saludables' },
  { id: 'vegetariano', label: 'Soy vegetariano/a', hint: 'Solo opciones sin carne' },
]

/** Puntaje de qué tan bien encaja un bowl con el perfil, y por qué. */
export function scoreBowl(bowl, profile) {
  const n = bowl.n
  const why = []
  let score = 0
  const c = profile?.conditions || []
  const g = profile?.goals || []
  if (c.includes('vegetariano') && !bowl.veg) return { score: -100, why: ['Tiene carne'] }
  if (c.includes('hipertension')) {
    if (n.sodium <= 400) {
      score += 3
      why.push(`Solo ${n.sodium} mg de sodio`)
    } else score -= 1
  }
  if (c.includes('diabetes')) {
    if (n.fiber >= 9 && n.sugar <= 5) {
      score += 3
      why.push(`${n.fiber} g de fibra y ${n.sugar} g de azúcar`)
    } else if (n.sugar > 6) score -= 1
  }
  if (c.includes('colesterol') && /salm|aguacate|tofu/i.test(bowl.name)) {
    score += 2
    why.push('Grasas saludables')
  }
  if (g.includes('proteina') && n.protein >= 36) {
    score += 2
    why.push(`${n.protein} g de proteína`)
  }
  if (g.includes('peso') && n.kcal <= 500) {
    score += 2
    why.push(`${n.kcal} kcal`)
  }
  if (g.includes('sano')) score += n.fiber >= 8 ? 1 : 0
  return { score, why }
}

// Puntos de retiro. x/y = posición en el mapa ilustrado (0–100).
export const POINTS = [
  {
    id: 'uvg',
    name: 'UVG · Campus Central',
    kind: 'Máquina refrigerada',
    where: 'Zona 15 · junto a la cafetería',
    hours: '6:30 – 21:00',
    x: 62,
    y: 58,
    stock: { 'pollo-quinoa': 9, 'salmon-arroz': 5, 'res-camote': 6, 'huevo-frijol': 7, 'pavo-lenteja': 4, 'tofu-edamame': 3 },
  },
  {
    id: 'cayala',
    name: 'Paseo Cayalá',
    kind: 'Locker refrigerado',
    where: 'Zona 16 · plaza principal',
    hours: '8:00 – 22:00',
    x: 80,
    y: 30,
    stock: { 'pollo-quinoa': 6, 'salmon-arroz': 4, 'res-camote': 2, 'huevo-frijol': 5, 'pavo-lenteja': 6, 'tofu-edamame': 0 },
  },
  {
    id: 'zona10',
    name: 'Oficinas · Zona 10',
    kind: 'Próximamente',
    where: 'Fase 2 · bienestar corporativo',
    hours: '—',
    x: 34,
    y: 44,
    soon: true,
    stock: {},
  },
]

export const pointById = (id) => POINTS.find((p) => p.id === id)

export const SLOTS = ['Ahora', '12:00', '12:30', '13:00', '13:30', '18:00', '18:30']
